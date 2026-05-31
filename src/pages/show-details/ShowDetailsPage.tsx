import { Button, Dialog, ErrorBlock, Selector } from 'antd-mobile'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import type { Episode } from '@/entities/episode'
import type { WatchStatus } from '@/entities/show'
import { EpisodeGrid } from '@/features/episode-progress'
import { routes } from '@/shared/config/routes'
import { WATCH_STATUSES } from '@/shared/config/watchStatuses'
import { db, deleteShow, updateShowStatus } from '@/shared/db'
import { PageHeader, ShowPoster } from '@/shared/ui'

export function ShowDetailsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
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
  episodes?.forEach((episode) => {
    const season = episodesBySeason.get(episode.seasonNumber) ?? []
    season.push(episode)
    episodesBySeason.set(episode.seasonNumber, season)
  })

  const handleDelete = async () => {
    const confirmed = await Dialog.confirm({
      content: `${t('details.delete')} "${show.title}"?`,
    })

    if (confirmed) {
      await deleteShow(show.id)
      navigate(routes.home)
    }
  }

  return (
    <section className="page">
      <PageHeader
        title={show.title}
        subtitle={t('home.progress', {
          season: show.currentSeason,
          episode: show.currentEpisode,
        })}
      />

      <div className="details-hero">
        <ShowPoster src={show.posterUrl} title={show.title} />
        <div>
          <Selector
            value={[show.status]}
            options={WATCH_STATUSES.map((status) => ({
              label: t(`status.${status}`),
              value: status,
            }))}
            onChange={(value) => void updateShowStatus(show.id, value[0] as WatchStatus)}
          />
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

      <Button block color="danger" fill="outline" onClick={() => void handleDelete()}>
        {t('details.delete')}
      </Button>
    </section>
  )
}
