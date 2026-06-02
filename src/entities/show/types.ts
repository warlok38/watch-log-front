export type ShowKind = 'series' | 'anime'

export type WatchStatus = 'watching' | 'planned' | 'waiting' | 'completed'

export type ExternalShowStatus = 'running' | 'ended' | 'to_be_determined' | 'in_development' | 'unknown'

export type ExternalProvider = 'tvmaze' | 'jikan' | 'manual'

export type ProviderSnapshot = {
  title: string
  posterUrl?: string
  summary?: string
}

export type ShowMetadataField = 'title' | 'posterUrl' | 'summary'

export type ShowMetadataPatch = {
  title?: string
  summary?: string
  posterUrl?: string
  posterBlob?: Blob | null
  clearPoster?: boolean
  externalStatus?: ExternalShowStatus
}

export type Show = {
  id: string
  title: string
  originalTitle?: string
  kind: ShowKind
  status: WatchStatus
  externalStatus: ExternalShowStatus
  isArchived: boolean
  posterUrl?: string
  posterBlob?: Blob
  summary?: string
  providerSnapshot?: ProviderSnapshot
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
  posterBlob?: Blob
  summary?: string
  externalProvider: ExternalProvider
  externalId?: string
  seasonsCount: number
  episodesPerSeason: number
  episodes?: ShowEpisodeDraft[]
}
