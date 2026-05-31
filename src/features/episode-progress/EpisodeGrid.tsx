import { Button, Grid, Toast } from 'antd-mobile'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

import type { Episode } from '@/entities/episode'
import { markRange, markSeason, toggleEpisodeWatched } from '@/shared/db'

import styles from './EpisodeGrid.module.css'

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
    <section className={styles.seasonBlock}>
      {showHeader ? (
        <div className={styles.header}>
          <h2>{t('details.season', { season: seasonNumber })}</h2>
          <Button size="mini" onClick={() => void markSeason(showId, seasonNumber)}>
            {t('details.markSeason')}
          </Button>
        </div>
      ) : (
        <div className={styles.actions}>
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
              <div className={styles.episodeCell}>
                <Button
                  block
                  className={classNames({ [styles.futureButton]: isFutureEpisode })}
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
                  <span className={styles.airDate}>{formatAirDate(episode.airDate)}</span>
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
      <p className={styles.hint}>{t('details.markRange')}</p>
    </section>
  )
}

function isFutureAirDate(airDate?: string): boolean {
  if (!airDate) return false

  const airTime = new Date(airDate).getTime()

  return !Number.isNaN(airTime) && airTime > Date.now()
}
