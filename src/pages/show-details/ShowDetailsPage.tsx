import { Button, Dialog, ErrorBlock, Tag } from 'antd-mobile'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import type { Episode } from '@/entities/episode'
import { EpisodeGrid } from '@/features/episode-progress'
import { routes } from '@/shared/config/routes'
import { db, deleteShow, updateShowArchived } from '@/shared/db'
import { PageHeader, ShowPoster } from '@/shared/ui'

export function ShowDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { showId } = useParams<{ showId: string }>()
  const show = useLiveQuery(() => (showId ? db.shows.get(showId) : undefined), [showId])
  const episodes = useLiveQuery(
    () => (showId ? db.episodes.where('showId').equals(showId).sortBy('episodeNumber') : []),
    [showId],
  )

  if (!showId || show === null) {
    return <ErrorBlock status="empty" />
  }

  if (!show) {
    return <section className="page" />
  }

  const episodesBySeason = new Map<number, Episode[]>()
  episodes
    ?.toSorted((left, right) => {
      if (left.seasonNumber !== right.seasonNumber) {
        return left.seasonNumber - right.seasonNumber
      }

      return left.episodeNumber - right.episodeNumber
    })
    .forEach((episode) => {
    const season = episodesBySeason.get(episode.seasonNumber) ?? []
    season.push(episode)
    episodesBySeason.set(episode.seasonNumber, season)
  })

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

  const locationState = location.state as { fromAdd?: boolean } | null

  return (
    <section className="page">
      <PageHeader
        title={show.title}
        subtitle={t('home.progress', {
          season: show.currentSeason,
          episode: show.currentEpisode,
        })}
      />

      {locationState?.fromAdd && <p className="hint">{t('details.afterAddHint')}</p>}

      <div className="details-hero">
        <ShowPoster src={show.posterUrl} title={show.title} />
        <div className="details-hero__body">
          <div className="show-card__tags">
            <Tag color="success">{t(`status.${show.status}`)}</Tag>
            <Tag>{t(`externalStatus.${show.externalStatus}`)}</Tag>
          </div>
          {show.summary && <p>{show.summary}</p>}
        </div>
      </div>

      {[...episodesBySeason.entries()].map(([seasonNumber, seasonEpisodes]) => (
        <EpisodeGrid
          key={seasonNumber}
          showId={show.id}
          seasonNumber={seasonNumber}
          episodes={seasonEpisodes}
        />
      ))}

      <div className="details-actions">
        <Button block color="primary" fill="outline" onClick={() => navigate(routes.home)}>
          {t('details.toLibrary')}
        </Button>
        <Button
          block
          fill="outline"
          onClick={() => void updateShowArchived(show.id, !show.isArchived)}
        >
          {show.isArchived ? t('details.restoreFromArchive') : t('details.moveToArchive')}
        </Button>
      </div>

      <Button block color="danger" fill="outline" onClick={() => void handleDelete()}>
        {t('details.delete')}
      </Button>
    </section>
  )
}
