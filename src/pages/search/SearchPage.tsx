import { useQuery } from '@tanstack/react-query'
import { Collapse, Empty, ErrorBlock, SearchBar, SpinLoading } from 'antd-mobile'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ManualShowForm } from '@/features/manual-show-create'
import { SearchResultCard } from '@/features/show-search'
import { searchShows } from '@/shared/api'
import { PageHeader } from '@/shared/ui'

export function SearchPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim()
  const { data, isFetching, isError } = useQuery({
    queryKey: ['show-search', normalizedQuery],
    queryFn: () => searchShows(normalizedQuery),
    enabled: normalizedQuery.length > 1,
  })

  return (
    <section className="page">
      <PageHeader title={t('search.title')} />
      <SearchBar
        placeholder={t('search.placeholder')}
        value={query}
        onChange={setQuery}
        showCancelButton
      />

      <Collapse className="manual-collapse">
        <Collapse.Panel key="manual" title={t('search.addManual')}>
          <ManualShowForm />
        </Collapse.Panel>
      </Collapse>

      {isFetching && <SpinLoading className="center-loader" />}
      {isError && <ErrorBlock status="default" />}
      {normalizedQuery.length > 1 && !isFetching && !data?.length && (
        <Empty className="empty-state" description={t('search.nothing')} />
      )}
      <div className="show-list">
        {data?.map((result) => (
          <SearchResultCard
            key={`${result.externalProvider}-${result.externalId}-${result.title}`}
            result={result}
          />
        ))}
      </div>
    </section>
  )
}
