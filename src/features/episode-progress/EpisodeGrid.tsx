import { Button, Grid } from 'antd-mobile'
import { useTranslation } from 'react-i18next'

import type { Episode } from '@/entities/episode'
import { markEpisode, markRange, markSeason } from '@/shared/db'

type EpisodeGridProps = {
  showId: string
  seasonNumber: number
  episodes: Episode[]
}

export function EpisodeGrid({ showId, seasonNumber, episodes }: EpisodeGridProps) {
  const { t } = useTranslation()

  return (
    <section className="season-block">
      <div className="season-block__header">
        <h2>{t('details.season', { season: seasonNumber })}</h2>
        <Button size="mini" onClick={() => void markSeason(showId, seasonNumber)}>
          {t('details.markSeason')}
        </Button>
      </div>
      <Grid columns={4} gap={8}>
        {episodes.map((episode) => (
          <Grid.Item key={episode.id}>
            <div className="episode-cell">
              <Button
                block
                size="small"
                color={episode.watched ? 'primary' : 'default'}
                fill={episode.watched ? 'solid' : 'outline'}
                onClick={() => void markEpisode(showId, seasonNumber, episode.episodeNumber)}
              >
                E{episode.episodeNumber}
              </Button>
              <Button
                block
                size="mini"
                fill="none"
                onClick={() => void markRange(showId, seasonNumber, episode.episodeNumber)}
              >
                до
              </Button>
            </div>
          </Grid.Item>
        ))}
      </Grid>
      <p className="hint">{t('details.markRange')}</p>
    </section>
  )
}
