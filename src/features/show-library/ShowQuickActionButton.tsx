import { Button } from 'antd-mobile'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'

import type { Episode } from '@/entities/episode'
import type { Show } from '@/entities/show'
import { markEpisode, updateShowArchived } from '@/shared/db'
import {
  formatEpisodeAirDate,
  getNextEpisodeAction,
  type NextEpisodeAction,
} from '@/shared/lib/episodeProgress'

import styles from './ShowCard.module.css'

type ShowQuickActionButtonProps = {
  show: Show
  episodes: Episode[]
  className?: string
}

export function ShowQuickActionButton({ show, episodes, className }: ShowQuickActionButtonProps) {
  const { i18n, t } = useTranslation()
  const action = getNextEpisodeAction(show, episodes)

  if (action.kind === 'none') {
    return null
  }

  return (
    <QuickActionButtonContent
      action={action}
      className={className}
      locale={i18n.resolvedLanguage}
      show={show}
      t={t}
    />
  )
}

type QuickActionButtonContentProps = {
  show: Show
  action: Exclude<NextEpisodeAction, { kind: 'none' }>
  className?: string
  locale?: string
  t: ReturnType<typeof useTranslation>['t']
}

function QuickActionButtonContent({
  show,
  action,
  className,
  locale,
  t,
}: QuickActionButtonContentProps) {
  if (action.kind === 'mark') {
    return (
      <Button
        className={classNames(styles.quickMarkButton, className)}
        size="small"
        color="primary"
        fill="solid"
        onClick={(event) => {
          event.stopPropagation()
          void markEpisode(show.id, action.season, action.episode)
        }}
      >
        {t('home.quickMark', { season: action.season, episode: action.episode })}
      </Button>
    )
  }

  if (action.kind === 'wait') {
    const label = action.airDate
      ? t('home.quickMarkWithDate', {
          season: action.season,
          episode: action.episode,
          date: formatEpisodeAirDate(action.airDate, locale, 'short'),
        })
      : t('home.quickMark', { season: action.season, episode: action.episode })

    return (
      <Button
        className={classNames(styles.quickMarkButton, styles.waitButton, className)}
        size="small"
        fill="outline"
        aria-disabled
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        {label}
      </Button>
    )
  }

  return (
    <Button
      className={classNames(styles.quickMarkButton, styles.archiveButton, className)}
      size="small"
      fill="outline"
      onClick={(event) => {
        event.stopPropagation()
        void updateShowArchived(show.id, true)
      }}
    >
      {t('details.moveToArchive')}
    </Button>
  )
}
