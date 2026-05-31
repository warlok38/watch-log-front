export type WatchProgress = {
  showId: string
  currentSeason: number
  currentEpisode: number
  watchedEpisodes: number
  totalEpisodes: number
}

export type WatchEventType =
  | 'episode-marked'
  | 'episode-unmarked'
  | 'range-marked'
  | 'season-marked'
  | 'status-changed'
  | 'archive-changed'

export type WatchEvent = {
  id: string
  showId: string
  type: WatchEventType
  seasonNumber?: number
  episodeNumber?: number
  toSeasonNumber?: number
  toEpisodeNumber?: number
  createdAt: string
}
