import type { Episode } from '@/entities/episode'
import type { ShowEpisodeDraft } from '@/entities/show'

export function buildEpisodes(showId: string, seasonsCount: number, episodesPerSeason: number): Episode[] {
  return Array.from({ length: seasonsCount }).flatMap((_, seasonIndex) =>
    Array.from({ length: episodesPerSeason }).map((__, episodeIndex) => ({
      id: `${showId}_s${seasonIndex + 1}_e${episodeIndex + 1}`,
      showId,
      seasonNumber: seasonIndex + 1,
      episodeNumber: episodeIndex + 1,
      watched: false,
    })),
  )
}

export function buildEpisodesFromDraft(showId: string, episodeDrafts: ShowEpisodeDraft[]): Episode[] {
  return episodeDrafts.map((episode) => ({
    id: `${showId}_s${episode.seasonNumber}_e${episode.episodeNumber}`,
    showId,
    seasonNumber: episode.seasonNumber,
    episodeNumber: episode.episodeNumber,
    title: episode.title,
    watched: false,
  }))
}
