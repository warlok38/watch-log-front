import type { ExternalShowStatus, ShowDraft, ShowEpisodeDraft } from '@/entities/show'
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
    status?: string
  }
}

type TvMazeEpisode = {
  id: number
  name?: string
  season: number
  number?: number
}

function stripHtml(value?: string): string | undefined {
  return value?.replace(/<[^>]*>/g, '').trim()
}

function mapTvMazeStatus(status?: string): ExternalShowStatus {
  switch (status?.toLowerCase()) {
    case 'ended':
      return 'ended'
    case 'running':
      return 'running'
    case 'to be determined':
      return 'to_be_determined'
    case 'in development':
      return 'in_development'
    default:
      return 'unknown'
  }
}

function getEpisodeStats(episodes: ShowEpisodeDraft[]) {
  const seasons = new Map<number, number>()

  episodes.forEach((episode) => {
    seasons.set(episode.seasonNumber, (seasons.get(episode.seasonNumber) ?? 0) + 1)
  })

  return {
    seasonsCount: seasons.size || 1,
    episodesPerSeason: Math.max(...seasons.values(), 1),
  }
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
      externalStatus: mapTvMazeStatus(show.status),
      seasonsCount: 1,
      episodesPerSeason: 12,
      year: show.premiered ? new Date(show.premiered).getFullYear() : undefined,
      score,
    }))
  },
  async getDetails(result: ShowSearchResult): Promise<ShowDraft> {
    if (!result.externalId) {
      return result
    }

    const response = await fetch(`https://api.tvmaze.com/shows/${result.externalId}/episodes`)

    if (!response.ok) {
      throw new Error('TVMaze episodes loading failed')
    }

    const data = (await response.json()) as TvMazeEpisode[]
    const episodes = data
      .filter((episode) => episode.number)
      .map((episode) => ({
        seasonNumber: episode.season,
        episodeNumber: episode.number ?? 1,
        title: episode.name,
      }))

    if (!episodes.length) {
      return result
    }

    const stats = getEpisodeStats(episodes)

    return {
      ...result,
      ...stats,
      episodes,
    }
  },
}
