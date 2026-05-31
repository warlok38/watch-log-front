import { Button, Card, ProgressBar, Tag } from 'antd-mobile'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { Show } from '@/entities/show'
import { routes } from '@/shared/config/routes'
import { markEpisode } from '@/shared/db'
import { ShowPoster } from '@/shared/ui'

type ShowCardProps = {
  show: Show
  watchedEpisodes: number
  totalEpisodes: number
}

export function ShowCard({ show, watchedEpisodes, totalEpisodes }: ShowCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const progress = totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0

  const nextEpisode = Math.min(show.currentEpisode + 1, show.episodesPerSeason)

  const handleQuickMark = async () => {
    await markEpisode(show.id, show.currentSeason, nextEpisode)
  }

  return (
    <Card className="show-card" onClick={() => navigate(routes.showDetails(show.id))}>
      <div className="show-card__layout">
        <ShowPoster src={show.posterUrl} title={show.title} />
        <div className="show-card__body">
          <div className="show-card__title-row">
            <h3>{show.title}</h3>
            <Tag color={show.kind === 'anime' ? 'purple' : 'primary'}>{t(`kind.${show.kind}`)}</Tag>
          </div>
          <div className="show-card__tags">
            <Tag color="success">{t(`status.${show.status}`)}</Tag>
            <Tag>{t(`externalStatus.${show.externalStatus}`)}</Tag>
          </div>
          <p>{t('home.progress', { season: show.currentSeason, episode: show.currentEpisode })}</p>
          <ProgressBar percent={progress} />
          <Button
            className="quick-mark-button"
            size="small"
            color="primary"
            fill="solid"
            onClick={(event) => {
              event.stopPropagation()
              void handleQuickMark()
            }}
          >
            {t('home.quickMark', { season: show.currentSeason, episode: nextEpisode })}
          </Button>
        </div>
      </div>
    </Card>
  )
}
