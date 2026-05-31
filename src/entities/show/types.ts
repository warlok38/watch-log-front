export type ShowKind = 'series' | 'anime'

export type WatchStatus = 'watching' | 'planned' | 'waiting' | 'completed'

export type ExternalShowStatus = 'running' | 'ended' | 'to_be_determined' | 'in_development' | 'unknown'

export type ExternalProvider = 'tvmaze' | 'jikan' | 'manual'

export type Show = {
  id: string
  title: string
  originalTitle?: string
  kind: ShowKind
  status: WatchStatus
  externalStatus: ExternalShowStatus
  isArchived: boolean
  posterUrl?: string
  summary?: string
  externalProvider: ExternalProvider
  externalId?: string
  seasonsCount: number
  episodesPerSeason: number
  currentSeason: number
  currentEpisode: number
  createdAt: string
  updatedAt: string
}

export type ShowEpisodeDraft = {
  seasonNumber: number
  episodeNumber: number
  title?: string
  airDate?: string
}

export type ShowDraft = {
  title: string
  originalTitle?: string
  kind: ShowKind
  externalStatus?: ExternalShowStatus
  posterUrl?: string
  summary?: string
  externalProvider: ExternalProvider
  externalId?: string
  seasonsCount: number
  episodesPerSeason: number
  episodes?: ShowEpisodeDraft[]
}
