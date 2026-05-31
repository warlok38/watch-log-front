import { Button, Empty } from 'antd-mobile'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAppStore } from '@/app/providers/useAppStore'
import { ShowCard, StatusFilter } from '@/features/show-library'
import { routes } from '@/shared/config/routes'
import { db } from '@/shared/db'
import { PageHeader } from '@/shared/ui'

export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeStatus = useAppStore((state) => state.activeStatus)
  const shows = useLiveQuery(() => db.shows.orderBy('updatedAt').reverse().toArray(), [])
  const episodes = useLiveQuery(() => db.episodes.toArray(), [])

  const filteredShows =
    activeStatus === 'all' ? shows : shows?.filter((show) => show.status === activeStatus)

  return (
    <section className="page">
      <PageHeader
        title={t('app.title')}
        subtitle={t('app.subtitle')}
        action={
          <Button color="primary" size="small" onClick={() => navigate(routes.search)}>
            {t('home.quickAdd')}
          </Button>
        }
      />

      <StatusFilter />

      {!filteredShows?.length ? (
        <Empty
          className="empty-state"
          description={
            <div>
              <strong>{t('home.emptyTitle')}</strong>
              <p>{t('home.emptyDescription')}</p>
            </div>
          }
        />
      ) : (
        <div className="show-list">
          {filteredShows.map((show) => {
            const showEpisodes = episodes?.filter((episode) => episode.showId === show.id) ?? []
            const watchedEpisodes = showEpisodes.filter((episode) => episode.watched).length

            return (
              <ShowCard
                key={show.id}
                show={show}
                watchedEpisodes={watchedEpisodes}
                totalEpisodes={showEpisodes.length}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
