export type SeasonStructureItem = {
  seasonNumber: number
  episodeCount: number
  sourceSeasonNumber?: number
}

export type SeasonStructureValidationError =
  | 'minOneSeason'
  | 'minOneEpisode'
  | 'cannotReduceBelowWatched'
