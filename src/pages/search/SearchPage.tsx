import { useQuery } from '@tanstack/react-query'
import { Empty, ErrorBlock, SearchBar, SpinLoading } from 'antd-mobile'
import { AddOutline } from 'antd-mobile-icons'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { SearchResultCard } from '@/features/show-search'
import { searchShows } from '@/shared/api'
import { routes } from '@/shared/config/routes'
import { PageHeader } from '@/shared/ui'

import styles from './SearchPage.module.css'

const SEARCH_DEBOUNCE_MS = 500

export function SearchPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim()
  const debouncedQuery = useDebouncedValue(normalizedQuery, SEARCH_DEBOUNCE_MS)
  const { data, isFetching, isError } = useQuery({
    queryKey: ['show-search', debouncedQuery],
    queryFn: () => searchShows(debouncedQuery),
    enabled: debouncedQuery.length > 1,
  })
  const isWaitingForDebounce = normalizedQuery.length > 1 && normalizedQuery !== debouncedQuery
  const canShowSearchState = normalizedQuery === debouncedQuery && debouncedQuery.length > 1

  return (
    <section className={styles.page}>
      <PageHeader title={t('search.title')} subtitle={t('search.subtitle')} />
      <div className={styles.searchPanel}>
        <SearchBar placeholder={t('search.placeholder')} value={query} onChange={setQuery} />
      </div>

      <Link className={styles.manualLink} to={routes.showCreate}>
        <span>{t('search.addManual')}</span>
        <AddOutline />
      </Link>

      {(isWaitingForDebounce || isFetching) && <SpinLoading className={styles.centerLoader} />}
      {isError && <ErrorBlock status="default" />}
      {canShowSearchState && !isFetching && !data?.length && (
        <Empty className={styles.emptyState} description={t('search.nothing')} />
      )}
      <div className={styles.showList}>
        {canShowSearchState &&
          data?.map((result) => (
            <SearchResultCard
              key={`${result.externalProvider}-${result.externalId}-${result.title}`}
              result={result}
            />
          ))}
      </div>
    </section>
  )
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => window.clearTimeout(timeoutId)
  }, [delay, value])

  return debouncedValue
}
