import { Card, ProgressBar, Tag } from 'antd-mobile'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { Episode } from '@/entities/episode'
import type { Show } from '@/entities/show'
import { routes } from '@/shared/config/routes'
import { ShowPoster } from '@/shared/ui'

import { ShowQuickActionButton } from './ShowQuickActionButton'
import styles from './ShowCard.module.css'

type ShowCardProps = {
  show: Show
  episodes: Episode[]
  watchedEpisodes: number
  totalEpisodes: number
}

export function ShowCard({ show, episodes, watchedEpisodes, totalEpisodes }: ShowCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const progress = totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0

  return (
    <Card className={styles.card} onClick={() => navigate(routes.showDetails(show.id))}>
      <div className={styles.layout}>
        <ShowPoster cacheKey={show.id} posterBlob={show.posterBlob} src={show.posterUrl} title={show.title} />
        <div className={styles.body}>
          <div className={styles.titleRow}>
            <h3>{show.title}</h3>
          </div>
          <div className={styles.tags}>
            <Tag color="success">{t(`status.${show.status}`)}</Tag>
            <Tag>{t(`externalStatus.${show.externalStatus}`)}</Tag>
          </div>
          <p>{t('home.progress', { season: show.currentSeason, episode: show.currentEpisode })}</p>
          <ProgressBar percent={progress} />
          <ShowQuickActionButton show={show} episodes={episodes} />
        </div>
      </div>
    </Card>
  )
}
