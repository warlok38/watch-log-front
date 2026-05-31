import { Button } from 'antd-mobile'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import type { Show } from '@/entities/show'
import { routes } from '@/shared/config/routes'
import { markEpisode } from '@/shared/db'

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
      className="show-list-row"
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
      <span className="show-list-row__content">
        <strong>{show.title}</strong>
        <span className="show-list-row__progress">
          <span aria-hidden="true" />
          {t('home.progress', { season: show.currentSeason, episode: show.currentEpisode })}
        </span>
      </span>
      <Button
        className="quick-mark-button show-list-row__button"
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
