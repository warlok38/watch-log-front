import { Button, SearchBar } from 'antd-mobile'
import { AppstoreOutline, CloseOutline, SearchOutline, UnorderedListOutline } from 'antd-mobile-icons'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAppStore } from '@/app/providers/useAppStore'
import { ShowCard, ShowListRow, StatusFilter } from '@/features/show-library'
import { routes } from '@/shared/config/routes'
import { db } from '@/shared/db'

export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { activeStatus, libraryQuery, libraryView, setLibraryQuery, setLibraryView } = useAppStore()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const shows = useLiveQuery(() => db.shows.orderBy('updatedAt').reverse().toArray(), [])
  const episodes = useLiveQuery(() => db.episodes.toArray(), [])
  const normalizedQuery = libraryQuery.trim().toLocaleLowerCase()

  const filteredShows = shows?.filter((show) => {
    if (activeStatus === 'archive') return show.isArchived
    if (show.isArchived) return false

    const matchesStatus = activeStatus === 'all' || show.status === activeStatus
    const matchesQuery =
      normalizedQuery.length === 0 ||
      show.title.toLocaleLowerCase().includes(normalizedQuery) ||
      show.originalTitle?.toLocaleLowerCase().includes(normalizedQuery)

    return matchesStatus && matchesQuery
  })
  const hasShows = Boolean(shows?.length)
  const isListView = libraryView === 'list'

  return (
    <section className="page home-page">
      <div className="library-toolbar">
        <div className="library-view-switch" aria-label={t('home.viewToggle')}>
          <button
            aria-label={t('home.cardsView')}
            className={libraryView === 'cards' ? 'library-view-switch__button is-active' : 'library-view-switch__button'}
            type="button"
            onClick={() => setLibraryView('cards')}
          >
            <AppstoreOutline />
          </button>
          <button
            aria-label={t('home.listView')}
            className={libraryView === 'list' ? 'library-view-switch__button is-active' : 'library-view-switch__button'}
            type="button"
            onClick={() => setLibraryView('list')}
          >
            <UnorderedListOutline />
          </button>
        </div>
        <button
          aria-label={isSearchOpen ? t('common.cancel') : t('home.librarySearch')}
          className={isSearchOpen ? 'library-search-button is-active' : 'library-search-button'}
          type="button"
          onClick={() => {
            if (isSearchOpen) {
              setLibraryQuery('')
            }
            setIsSearchOpen((value) => !value)
          }}
        >
          {isSearchOpen ? <CloseOutline /> : <SearchOutline />}
        </button>
      </div>

      {isSearchOpen && (
        <div className="library-search-panel">
          <SearchBar
            autoFocus
            placeholder={t('home.librarySearchPlaceholder')}
            value={libraryQuery}
            onChange={setLibraryQuery}
          />
        </div>
      )}

      <StatusFilter />

      {!filteredShows?.length ? (
        <div className="empty-state">
          <strong>{hasShows ? t('home.emptySearchTitle') : t('home.emptyTitle')}</strong>
          <p>{hasShows ? t('home.emptySearchDescription') : t('home.emptyDescription')}</p>
          {!hasShows && (
            <Button color="primary" size="small" onClick={() => navigate(routes.search)}>
              {t('home.firstAdd')}
            </Button>
          )}
        </div>
      ) : (
        <div className={isListView ? 'show-list show-list--rows' : 'show-list'}>
          {filteredShows.map((show) => {
            const showEpisodes = episodes?.filter((episode) => episode.showId === show.id) ?? []
            const watchedEpisodes = showEpisodes.filter((episode) => episode.watched).length

            return isListView ? (
              <ShowListRow key={show.id} show={show} />
            ) : (
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
