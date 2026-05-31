import type { ExternalShowStatus } from '@/entities/show'
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
    status?: string
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

function mapJikanStatus(status?: string): ExternalShowStatus {
  switch (status?.toLowerCase()) {
    case 'finished airing':
      return 'ended'
    case 'currently airing':
      return 'running'
    case 'not yet aired':
      return 'in_development'
    default:
      return 'unknown'
  }
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
      externalStatus: mapJikanStatus(anime.status),
      seasonsCount: 1,
      episodesPerSeason: anime.episodes ?? 12,
      year: anime.year,
      score: anime.score,
    }))
  },
}
