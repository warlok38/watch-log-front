import type { ShowDraft } from '@/entities/show'

import type { ShowSearchProvider, ShowSearchResult } from './types'
import { jikanProvider } from './providers/jikan/jikanProvider'
import { tvmazeProvider } from './providers/tvmaze/tvmazeProvider'

export const searchProviders: ShowSearchProvider[] = [tvmazeProvider, jikanProvider]

export async function searchShows(query: string) {
  const trimmed = query.trim()

  if (!trimmed) return []

  const results = await Promise.all(searchProviders.map((provider) => provider.search(trimmed)))

  return results.flat()
}

export async function getShowDetails(result: ShowSearchResult): Promise<ShowDraft> {
  const provider = searchProviders.find((searchProvider) => searchProvider.provider === result.provider)

  return provider?.getDetails ? provider.getDetails(result) : result
}
