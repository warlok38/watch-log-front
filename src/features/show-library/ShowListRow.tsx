import { Button } from 'antd-mobile'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { Show } from '@/entities/show'
import { routes } from '@/shared/config/routes'
import { markEpisode } from '@/shared/db'

import cardStyles from './ShowCard.module.css'
import styles from './ShowListRow.module.css'

type ShowListRowProps = {
  show: Show
}

export function ShowListRow({ show }: ShowListRowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const nextEpisode = Math.min(show.currentEpisode + 1, show.episodesPerSeason)

  const handleQuickMark = async () => {
    await markEpisode(show.id, show.currentSeason, nextEpisode)
  }

  return (
    <div
      className={styles.row}
      role="button"
      tabIndex={0}
      onClick={() => navigate(routes.showDetails(show.id))}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          navigate(routes.showDetails(show.id))
        }
      }}
    >
      <span className={styles.content}>
        <strong>{show.title}</strong>
        <span className={styles.progress}>
          <span aria-hidden="true" />
          {t('home.progress', { season: show.currentSeason, episode: show.currentEpisode })}
        </span>
      </span>
      <Button
        className={classNames(cardStyles.quickMarkButton, styles.button)}
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
  )
}
