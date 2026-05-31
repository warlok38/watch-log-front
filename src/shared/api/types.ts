import type { ExternalProvider, ShowDraft, ShowKind } from '@/entities/show'

export type ShowSearchResult = ShowDraft & {
  provider: ExternalProvider
  providerLabel: string
  kind: ShowKind
  year?: number
  score?: number
}

export type ShowSearchProvider = {
  provider: ExternalProvider
  label: string
  search(query: string): Promise<ShowSearchResult[]>
  getDetails?(result: ShowSearchResult): Promise<ShowDraft>
}
