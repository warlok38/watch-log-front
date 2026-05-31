export type Episode = {
  id: string
  showId: string
  seasonNumber: number
  episodeNumber: number
  watched: boolean
  watchedAt?: string
  title?: string
  airDate?: string
}
