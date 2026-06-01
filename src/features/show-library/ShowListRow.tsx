import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { Episode } from '@/entities/episode'
import type { Show } from '@/entities/show'
import { routes } from '@/shared/config/routes'

import { ShowQuickActionButton } from './ShowQuickActionButton'
import cardStyles from './ShowCard.module.css'
import styles from './ShowListRow.module.css'

type ShowListRowProps = {
  show: Show
  episodes: Episode[]
}

export function ShowListRow({ show, episodes }: ShowListRowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

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
      <ShowQuickActionButton
        show={show}
        episodes={episodes}
        className={classNames(cardStyles.quickMarkButton, styles.button)}
      />
    </div>
  )
}
