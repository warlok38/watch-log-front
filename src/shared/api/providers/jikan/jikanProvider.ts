import type { ShowSearchProvider, ShowSearchResult } from '@/shared/api/types'

type JikanSearchResponse = {
  data: Array<{
    mal_id: number
    title: string
    title_english?: string
    synopsis?: string
    year?: number
    score?: number
    episodes?: number
    images?: {
      jpg?: {
        image_url?: string
      }
      webp?: {
        image_url?: string
      }
    }
  }>
}

export const jikanProvider: ShowSearchProvider = {
  provider: 'jikan',
  label: 'Jikan',
  async search(query: string): Promise<ShowSearchResult[]> {
    const response = await fetch(
      `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=10`,
    )

    if (!response.ok) {
      throw new Error('Jikan search failed')
    }

    const data = (await response.json()) as JikanSearchResponse

    return data.data.map((anime) => ({
      provider: 'jikan',
      providerLabel: 'Jikan',
      externalProvider: 'jikan',
      externalId: String(anime.mal_id),
      title: anime.title_english || anime.title,
      originalTitle: anime.title,
      kind: 'anime',
      posterUrl: anime.images?.webp?.image_url ?? anime.images?.jpg?.image_url,
      summary: anime.synopsis,
      seasonsCount: 1,
      episodesPerSeason: anime.episodes ?? 12,
      year: anime.year,
      score: anime.score,
    }))
  },
}
