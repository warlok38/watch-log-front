import { ActionSheet, Button, Collapse, Dialog, ErrorBlock, Tag } from 'antd-mobile'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import type { Episode } from '@/entities/episode'
import { EpisodeGrid } from '@/features/episode-progress'
import { routes } from '@/shared/config/routes'
import { db, deleteShow, markEpisode, refreshShowProgress, updateShowArchived } from '@/shared/db'
import { DetailHeader, ShowPoster } from '@/shared/ui'

import styles from './ShowDetailsPage.module.css'

const HEADER_SCROLL_THRESHOLD = 14
const HEADER_TOP_OFFSET = 24

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

  const sortedEpisodes =
    episodes?.toSorted((left, right) => {
      if (left.seasonNumber !== right.seasonNumber) {
        return left.seasonNumber - right.seasonNumber
      }

      return left.episodeNumber - right.episodeNumber
    }) ?? []
  const episodesBySeason = new Map<number, Episode[]>()
  sortedEpisodes.forEach((episode) => {
    const season = episodesBySeason.get(episode.seasonNumber) ?? []
    season.push(episode)
    episodesBySeason.set(episode.seasonNumber, season)
  })
  const nextAvailableEpisode = sortedEpisodes.find(
    (episode) => !episode.watched && !isFutureAirDate(episode.airDate),
  )
  const nextFutureEpisode = sortedEpisodes.find(
    (episode) => !episode.watched && isFutureAirDate(episode.airDate),
  )
  const seasonEntries = [...episodesBySeason.entries()]
  const activeSeasonNumber =
    nextAvailableEpisode?.seasonNumber ??
    nextFutureEpisode?.seasonNumber ??
    show.currentSeason ??
    seasonEntries[0]?.[0] ??
    1
  const formatAirDate = (airDate: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      day: 'numeric',
      month: 'long',
    }).format(new Date(airDate))

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
    if (location.key !== 'default' && window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(routes.home)
  }

  const handleMenuClick = () => {
    ActionSheet.show({
      actions: [
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
        <ShowPoster className={styles.heroPoster} src={show.posterUrl} title={show.title} />
        <div className={styles.heroBody}>
          <div className={styles.tags}>
            <Tag color="success">{t(`status.${show.status}`)}</Tag>
            <Tag>{t(`externalStatus.${show.externalStatus}`)}</Tag>
          </div>
          {show.summary && <p>{show.summary}</p>}
        </div>
      </div>

      <section className={styles.nextEpisodeCard}>
        {nextAvailableEpisode ? (
          <>
            <div>
              <h2>{t('details.nextEpisode')}</h2>
              <p>
                {t('details.episodeCode', {
                  season: nextAvailableEpisode.seasonNumber,
                  episode: nextAvailableEpisode.episodeNumber,
                })}
                {nextAvailableEpisode.title ? ` · ${nextAvailableEpisode.title}` : ''}
              </p>
            </div>
            <Button
              color="primary"
              onClick={() =>
                void markEpisode(
                  show.id,
                  nextAvailableEpisode.seasonNumber,
                  nextAvailableEpisode.episodeNumber,
                )
              }
            >
              {t('details.markWatched')}
            </Button>
          </>
        ) : nextFutureEpisode?.airDate ? (
          <>
            <div>
              <h2>{t('details.nextEpisode')}</h2>
              <p>
                {t('details.nextEpisodeAirDate', {
                  date: formatAirDate(nextFutureEpisode.airDate),
                })}
              </p>
            </div>
            <Button fill="outline" aria-disabled>
              {t('details.waitingForRelease')}
            </Button>
          </>
        ) : (
          <div>
            <h2>{t('details.allCaughtUp')}</h2>
            <p>{t('details.allCaughtUpDescription')}</p>
          </div>
        )}
      </section>

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

function isFutureAirDate(airDate?: string): boolean {
  if (!airDate) return false

  const airTime = new Date(airDate).getTime()

  return !Number.isNaN(airTime) && airTime > Date.now()
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

function useDetailHeaderVisibility(): boolean {
  const [isHidden, setIsHidden] = useState(false)
  const previousScrollYRef = useRef(0)

  useEffect(() => {
    previousScrollYRef.current = window.scrollY

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - previousScrollYRef.current

      if (currentScrollY <= HEADER_TOP_OFFSET) {
        setIsHidden(false)
        previousScrollYRef.current = currentScrollY
        return
      }

      if (Math.abs(delta) < HEADER_SCROLL_THRESHOLD) {
        return
      }

      setIsHidden(delta < 0)
      previousScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return isHidden
}
