import { Button, SearchBar } from 'antd-mobile'
import {
  AppstoreOutline,
  CloseOutline,
  SearchOutline,
  UnorderedListOutline,
} from 'antd-mobile-icons'
import classNames from 'classnames'
import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useAppStore } from '@/app/providers/useAppStore'
import type { Episode } from '@/entities/episode'
import { ShowCard, ShowListRow, StatusFilter } from '@/features/show-library'
import { routes } from '@/shared/config/routes'
import { db } from '@/shared/db'
import { sortLibraryShows, sortShowsAlphabetically } from '@/shared/lib/episodeProgress'

import styles from './HomePage.module.css'

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
  const episodesByShowId = useMemo(() => {
    const map = new Map<string, Episode[]>()

    for (const episode of episodes ?? []) {
      const showEpisodes = map.get(episode.showId) ?? []
      showEpisodes.push(episode)
      map.set(episode.showId, showEpisodes)
    }

    return map
  }, [episodes])
  const sortedShows = useMemo(() => {
    if (!filteredShows) return filteredShows

    if (activeStatus === 'archive') {
      return sortShowsAlphabetically(filteredShows)
    }

    return sortLibraryShows(filteredShows, episodesByShowId)
  }, [activeStatus, episodesByShowId, filteredShows])
  const hasShows = Boolean(shows?.length)
  const isListView = libraryView === 'list'

  const closeSearch = useCallback(() => {
    setLibraryQuery('')
    setIsSearchOpen(false)
  }, [setLibraryQuery])

  const toggleSearch = useCallback(() => {
    if (isSearchOpen) {
      closeSearch()
      return
    }
    setIsSearchOpen(true)
  }, [closeSearch, isSearchOpen])

  useEffect(() => {
    if (!isSearchOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSearch()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeSearch, isSearchOpen])

  return (
    <section className={styles.page}>
      <div className={styles.toolbar}>
        {!isSearchOpen && (
          <div className={styles.viewSwitch} aria-label={t('home.viewToggle')}>
            <button
              aria-label={t('home.cardsView')}
              className={classNames(styles.viewButton, {
                [styles.active]: libraryView === 'cards',
              })}
              type="button"
              onClick={() => setLibraryView('cards')}
            >
              <AppstoreOutline />
            </button>
            <button
              aria-label={t('home.listView')}
              className={classNames(styles.viewButton, { [styles.active]: libraryView === 'list' })}
              type="button"
              onClick={() => setLibraryView('list')}
            >
              <UnorderedListOutline />
            </button>
          </div>
        )}

        {isSearchOpen && (
          <div className={styles.searchInline} role="search">
            <SearchBar
              autoFocus
              placeholder={t('home.librarySearchPlaceholder')}
              searchIcon={null}
              showCancelButton={false}
              value={libraryQuery}
              onChange={setLibraryQuery}
            />
          </div>
        )}

        <button
          aria-expanded={isSearchOpen}
          aria-label={isSearchOpen ? t('common.cancel') : t('home.librarySearch')}
          className={styles.searchButton}
          type="button"
          onClick={toggleSearch}
        >
          {isSearchOpen ? <CloseOutline /> : <SearchOutline />}
        </button>
      </div>

      <StatusFilter />

      {!sortedShows?.length ? (
        <div className={styles.emptyState}>
          <strong>{hasShows ? t('home.emptySearchTitle') : t('home.emptyTitle')}</strong>
          <p>{hasShows ? t('home.emptySearchDescription') : t('home.emptyDescription')}</p>
          {!hasShows && (
            <Button color="primary" size="small" onClick={() => navigate(routes.search)}>
              {t('home.firstAdd')}
            </Button>
          )}
        </div>
      ) : (
        <div className={classNames(styles.showList, { [styles.rowList]: isListView })}>
          {sortedShows.map((show) => {
            const showEpisodes = episodesByShowId.get(show.id) ?? []
            const watchedEpisodes = showEpisodes.filter((episode) => episode.watched).length

            return isListView ? (
              <ShowListRow key={show.id} show={show} episodes={showEpisodes} />
            ) : (
              <ShowCard
                key={show.id}
                show={show}
                episodes={showEpisodes}
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
