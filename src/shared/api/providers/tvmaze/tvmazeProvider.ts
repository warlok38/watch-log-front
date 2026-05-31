import type { ShowSearchProvider, ShowSearchResult } from '@/shared/api/types'

type TvMazeSearchItem = {
  score: number
  show: {
    id: number
    name: string
    language?: string
    premiered?: string
    summary?: string
    image?: {
      medium?: string
      original?: string
    }
  }
}

function stripHtml(value?: string): string | undefined {
  return value?.replace(/<[^>]*>/g, '').trim()
}

export const tvmazeProvider: ShowSearchProvider = {
  provider: 'tvmaze',
  label: 'TVMaze',
  async search(query: string): Promise<ShowSearchResult[]> {
    const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`)

    if (!response.ok) {
      throw new Error('TVMaze search failed')
    }

    const data = (await response.json()) as TvMazeSearchItem[]

    return data.slice(0, 10).map(({ show, score }) => ({
      provider: 'tvmaze',
      providerLabel: 'TVMaze',
      externalProvider: 'tvmaze',
      externalId: String(show.id),
      title: show.name,
      originalTitle: show.name,
      kind: 'series',
      posterUrl: show.image?.medium ?? show.image?.original,
      summary: stripHtml(show.summary),
      seasonsCount: 1,
      episodesPerSeason: 12,
      year: show.premiered ? new Date(show.premiered).getFullYear() : undefined,
      score,
    }))
  },
}
