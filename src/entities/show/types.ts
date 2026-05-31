export type ShowKind = 'series' | 'anime'

export type WatchStatus = 'watching' | 'planned' | 'waiting' | 'completed' | 'dropped'

export type ExternalProvider = 'tvmaze' | 'jikan' | 'manual'

export type Show = {
  id: string
  title: string
  originalTitle?: string
  kind: ShowKind
  status: WatchStatus
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

export type ShowDraft = {
  title: string
  originalTitle?: string
  kind: ShowKind
  posterUrl?: string
  summary?: string
  externalProvider: ExternalProvider
  externalId?: string
  seasonsCount: number
  episodesPerSeason: number
}
