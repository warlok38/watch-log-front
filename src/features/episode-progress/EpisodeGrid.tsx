import { Button, Grid, Toast } from 'antd-mobile'
import { useTranslation } from 'react-i18next'

import type { Episode } from '@/entities/episode'
import { markRange, markSeason, toggleEpisodeWatched } from '@/shared/db'

type EpisodeGridProps = {
  showId: string
  seasonNumber: number
  episodes: Episode[]
  showHeader?: boolean
}

export function EpisodeGrid({ showId, seasonNumber, episodes, showHeader = true }: EpisodeGridProps) {
  const { i18n, t } = useTranslation()

  const formatAirDate = (airDate: string) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      day: 'numeric',
      month: 'short',
    }).format(new Date(airDate))

  const showFutureEpisodeDate = (episode: Episode) => {
    if (!episode.airDate) return

    Toast.show({
      content: t('details.episodeAirDate', { date: formatAirDate(episode.airDate) }),
    })
  }

  return (
    <section className="season-block">
      {showHeader ? (
        <div className="season-block__header">
          <h2>{t('details.season', { season: seasonNumber })}</h2>
          <Button size="mini" onClick={() => void markSeason(showId, seasonNumber)}>
            {t('details.markSeason')}
          </Button>
        </div>
      ) : (
        <div className="season-block__actions">
          <Button size="mini" onClick={() => void markSeason(showId, seasonNumber)}>
            {t('details.markSeason')}
          </Button>
        </div>
      )}
      <Grid columns={4} gap={8}>
        {episodes.map((episode) => {
          const isFutureEpisode = isFutureAirDate(episode.airDate)

          return (
            <Grid.Item key={episode.id}>
              <div className="episode-cell">
                <Button
                  block
                  className={isFutureEpisode ? 'episode-button--future' : undefined}
                  size="small"
                  color={episode.watched ? 'primary' : 'default'}
                  fill={episode.watched ? 'solid' : 'outline'}
                  aria-disabled={isFutureEpisode}
                  onClick={() => {
                    if (isFutureEpisode) {
                      showFutureEpisodeDate(episode)
                      return
                    }

                    void toggleEpisodeWatched(showId, seasonNumber, episode.episodeNumber)
                  }}
                >
                  E{episode.episodeNumber}
                </Button>
                {isFutureEpisode && episode.airDate && (
                  <span className="episode-air-date">{formatAirDate(episode.airDate)}</span>
                )}
                <Button
                  block
                  size="mini"
                  fill="none"
                  onClick={() => {
                    if (isFutureEpisode) {
                      showFutureEpisodeDate(episode)
                      return
                    }

                    void markRange(showId, seasonNumber, episode.episodeNumber)
                  }}
                >
                  {t('details.markUpTo')}
                </Button>
              </div>
            </Grid.Item>
          )
        })}
      </Grid>
      <p className="hint">{t('details.markRange')}</p>
    </section>
  )
}

function isFutureAirDate(airDate?: string): boolean {
  if (!airDate) return false

  const airTime = new Date(airDate).getTime()

  return !Number.isNaN(airTime) && airTime > Date.now()
}
