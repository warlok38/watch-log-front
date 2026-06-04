import type { Episode } from '@/entities/episode'
import type { ShowEpisodeDraft } from '@/entities/show'
import type { SeasonStructureItem } from '@/features/manual-show-structure/types'

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
    airDate: episode.airDate,
    watched: false,
  }))
}

export function buildEpisodesFromStructure(
  showId: string,
  structure: SeasonStructureItem[],
): Episode[] {
  return structure.flatMap((season) =>
    Array.from({ length: season.episodeCount }, (_, episodeIndex) => ({
      id: `${showId}_s${season.seasonNumber}_e${episodeIndex + 1}`,
      showId,
      seasonNumber: season.seasonNumber,
      episodeNumber: episodeIndex + 1,
      watched: false,
    })),
  )
}
