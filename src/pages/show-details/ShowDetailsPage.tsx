import { ActionSheet, Button, Collapse, Dialog, ErrorBlock, Tag } from 'antd-mobile'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import type { Episode } from '@/entities/episode'
import { EpisodeGrid } from '@/features/episode-progress'
import { routes } from '@/shared/config/routes'
import { db, deleteShow, markEpisode, refreshShowProgress, updateShowArchived } from '@/shared/db'
import {
  formatEpisodeAirDate,
  getActiveSeasonNumber,
  getNextEpisodeAction,
  shouldShowNextEpisodeCard,
  sortEpisodes,
} from '@/shared/lib/episodeProgress'
import { useDetailHeaderVisibility } from '@/shared/lib/useDetailHeaderVisibility'
import { DetailHeader, ExpandableText, ShowPoster } from '@/shared/ui'

import styles from './ShowDetailsPage.module.css'

export function ShowDetailsPage() {
  const { i18n, t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const isHeaderHidden = useDetailHeaderVisibility()
  const { showId } = useParams<{ showId: string }>()
  const show = useLiveQuery(() => (showId ? db.shows.get(showId) : undefined), [showId])
  const episodes = useLiveQuery(
    () => (showId ? db.episodes.where('showId').equals(showId).sortBy('episodeNumber') : []),
    [showId],
  )

  useEffect(() => {
    if (!showId || !episodes?.length) return

    void refreshShowProgress(showId)
  }, [episodes?.length, showId])

  if (!showId || show === null) {
    return <ErrorBlock status="empty" />
  }

  if (!show) {
    return <section className={styles.page} />
  }

  const sortedEpisodes = sortEpisodes(episodes ?? [])
  const episodesBySeason = new Map<number, Episode[]>()
  sortedEpisodes.forEach((episode) => {
    const season = episodesBySeason.get(episode.seasonNumber) ?? []
    season.push(episode)
    episodesBySeason.set(episode.seasonNumber, season)
  })
  const nextEpisodeAction = getNextEpisodeAction(show, sortedEpisodes)
  const seasonEntries = [...episodesBySeason.entries()]
  const activeSeasonNumber = getActiveSeasonNumber(show, sortedEpisodes, nextEpisodeAction)
  const formatAirDate = (airDate: string) =>
    formatEpisodeAirDate(airDate, i18n.resolvedLanguage, 'long')
  const nextAvailableEpisode =
    nextEpisodeAction.kind === 'mark'
      ? sortedEpisodes.find(
          (episode) =>
            episode.seasonNumber === nextEpisodeAction.season &&
            episode.episodeNumber === nextEpisodeAction.episode,
        )
      : undefined

  const handleDelete = async () => {
    const confirmed = await Dialog.confirm({
      cancelText: t('common.cancel'),
      confirmText: t('common.confirm'),
      content: t('details.confirmDelete', { title: show.title }),
    })

    if (confirmed) {
      await deleteShow(show.id)
      navigate(routes.home)
    }
  }

  const handleBack = () => {
    navigate(routes.home)
  }

  const handleMenuClick = () => {
    ActionSheet.show({
      actions: [
        {
          key: 'edit',
          text: t('details.edit'),
          onClick: () => navigate(routes.showEdit(show.id)),
        },
        {
          key: 'archive',
          text: show.isArchived ? t('details.restoreFromArchive') : t('details.moveToArchive'),
          onClick: () => void updateShowArchived(show.id, !show.isArchived),
        },
        {
          key: 'delete',
          text: t('details.delete'),
          danger: true,
          onClick: () => void handleDelete(),
        },
      ],
      cancelText: t('common.cancel'),
      closeOnAction: true,
    })
  }

  const locationState = location.state as { fromAdd?: boolean } | null

  return (
    <section className={styles.page}>
      <DetailHeader
        title={show.title}
        subtitle={t('home.progress', {
          season: show.currentSeason,
          episode: show.currentEpisode,
        })}
        backLabel={t('common.back')}
        menuLabel={t('details.actions')}
        hidden={isHeaderHidden}
        onBack={handleBack}
        onMenuClick={handleMenuClick}
      />

      {locationState?.fromAdd && <p className={styles.hint}>{t('details.afterAddHint')}</p>}

      <div className={styles.hero}>
        <ShowPoster
          className={styles.heroPoster}
          cacheKey={show.id}
          posterBlob={show.posterBlob}
          src={show.posterUrl}
          title={show.title}
        />
        <div className={styles.heroBody}>
          <div className={styles.tags}>
            <Tag color="success">{t(`status.${show.status}`)}</Tag>
            <Tag>{t(`externalStatus.${show.externalStatus}`)}</Tag>
          </div>
          {show.summary && <ExpandableText text={show.summary} />}
        </div>
      </div>

      {shouldShowNextEpisodeCard(show, nextEpisodeAction) && (
        <section className={styles.nextEpisodeCard}>
          {nextEpisodeAction.kind === 'mark' && (
            <>
              <div>
                <h2>{t('details.nextEpisode')}</h2>
                <p>
                  {t('details.episodeCode', {
                    season: nextEpisodeAction.season,
                    episode: nextEpisodeAction.episode,
                  })}
                  {nextAvailableEpisode?.title ? ` · ${nextAvailableEpisode.title}` : ''}
                </p>
              </div>
              <Button
                color="primary"
                onClick={() =>
                  void markEpisode(show.id, nextEpisodeAction.season, nextEpisodeAction.episode)
                }
              >
                {t('details.markWatched')}
              </Button>
            </>
          )}
          {nextEpisodeAction.kind === 'wait' && (
            <>
              <div>
                <h2>{t('details.nextEpisode')}</h2>
                <p>
                  {t('details.episodeCode', {
                    season: nextEpisodeAction.season,
                    episode: nextEpisodeAction.episode,
                  })}
                  {nextEpisodeAction.airDate
                    ? ` · ${t('details.nextEpisodeAirDate', {
                        date: formatAirDate(nextEpisodeAction.airDate),
                      })}`
                    : ''}
                </p>
              </div>
              <Button fill="outline" aria-disabled>
                {t('details.waitingForRelease')}
              </Button>
            </>
          )}
          {nextEpisodeAction.kind === 'archive' && (
            <Button
              className={styles.archiveButton}
              fill="outline"
              onClick={() => void updateShowArchived(show.id, true)}
            >
              {t('details.moveToArchive')}
            </Button>
          )}
          {nextEpisodeAction.kind === 'none' && (
            <div>
              <h2>{t('details.allCaughtUp')}</h2>
              <p>{t('details.allCaughtUpDescription')}</p>
            </div>
          )}
        </section>
      )}

      {seasonEntries.length > 1 ? (
        <Collapse
          key={`${show.id}-${activeSeasonNumber}`}
          className={styles.seasonCollapse}
          accordion
          defaultActiveKey={String(activeSeasonNumber)}
        >
          {seasonEntries.map(([seasonNumber, seasonEpisodes]) => (
            <Collapse.Panel
              key={String(seasonNumber)}
              title={
                <SeasonPanelTitle
                  episodes={seasonEpisodes}
                  label={t('details.season', { season: seasonNumber })}
                />
              }
            >
              <EpisodeGrid
                showId={show.id}
                seasonNumber={seasonNumber}
                episodes={seasonEpisodes}
                showHeader={false}
              />
            </Collapse.Panel>
          ))}
        </Collapse>
      ) : (
        seasonEntries.map(([seasonNumber, seasonEpisodes]) => (
          <EpisodeGrid
            key={seasonNumber}
            showId={show.id}
            seasonNumber={seasonNumber}
            episodes={seasonEpisodes}
          />
        ))
      )}

    </section>
  )
}

function SeasonPanelTitle({
  episodes,
  label,
}: {
  episodes: Episode[]
  label: string
}) {
  const watchedEpisodes = episodes.filter((episode) => episode.watched).length

  return (
    <div className={styles.seasonPanelTitle}>
      <span>{label}</span>
      <span className={styles.seasonPanelProgress}>
        {watchedEpisodes}/{episodes.length}
      </span>
    </div>
  )
}
