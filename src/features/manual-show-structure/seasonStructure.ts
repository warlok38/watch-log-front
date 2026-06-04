import type { Episode } from '@/entities/episode'
import type { ShowEpisodeDraft } from '@/entities/show'

import type { SeasonStructureItem, SeasonStructureValidationError } from './types'

const DEFAULT_EPISODE_COUNT = 12

export function normalizeSeasonNumbers(structure: SeasonStructureItem[]): SeasonStructureItem[] {
  return structure.map((season, index) => ({
    ...season,
    seasonNumber: index + 1,
  }))
}

export function createDefaultStructure(): SeasonStructureItem[] {
  return [{ seasonNumber: 1, episodeCount: DEFAULT_EPISODE_COUNT }]
}

export function seasonStructureFromEpisodes(episodes: Episode[]): SeasonStructureItem[] {
  const bySeason = new Map<number, number>()

  episodes.forEach((episode) => {
    const currentMax = bySeason.get(episode.seasonNumber) ?? 0
    bySeason.set(episode.seasonNumber, Math.max(currentMax, episode.episodeNumber))
  })

  return [...bySeason.entries()]
    .toSorted(([leftSeason], [rightSeason]) => leftSeason - rightSeason)
    .map(([seasonNumber, episodeCount]) => ({
      seasonNumber,
      episodeCount,
      sourceSeasonNumber: seasonNumber,
    }))
}

export function getStructureTotals(structure: SeasonStructureItem[]): {
  seasons: number
  episodes: number
} {
  return {
    seasons: structure.length,
    episodes: structure.reduce((total, season) => total + season.episodeCount, 0),
  }
}

export function getWatchedCountsBySeason(episodes: Episode[]): Map<number, number> {
  const watchedBySeason = new Map<number, number>()

  episodes.forEach((episode) => {
    if (!episode.watched) return

    watchedBySeason.set(
      episode.seasonNumber,
      (watchedBySeason.get(episode.seasonNumber) ?? 0) + 1,
    )
  })

  return watchedBySeason
}

export function getUnwatchedRemovalCount(
  currentCount: number,
  newCount: number,
  watchedCount: number,
): number {
  if (newCount >= currentCount) return 0

  const removable = currentCount - Math.max(newCount, watchedCount)
  return Math.max(removable, 0)
}

export function getMaxWatchedEpisodeNumber(episodes: Episode[], seasonNumber: number): number {
  return episodes
    .filter((episode) => episode.seasonNumber === seasonNumber && episode.watched)
    .reduce((max, episode) => Math.max(max, episode.episodeNumber), 0)
}

export function getSourceSeasonNumber(season: SeasonStructureItem): number {
  return season.sourceSeasonNumber ?? season.seasonNumber
}

export function getWatchedBySeasonForStructure(
  structure: SeasonStructureItem[],
  watchedBySeason: Map<number, number>,
): Map<number, number> {
  const result = new Map<number, number>()

  structure.forEach((season) => {
    result.set(season.seasonNumber, watchedBySeason.get(getSourceSeasonNumber(season)) ?? 0)
  })

  return result
}

export function validateSeasonStructure(
  structure: SeasonStructureItem[],
  watchedBySeason?: Map<number, number>,
): SeasonStructureValidationError[] {
  const errors: SeasonStructureValidationError[] = []

  if (structure.length === 0) {
    errors.push('minOneSeason')
  }

  structure.forEach((season) => {
    if (season.episodeCount < 1) {
      errors.push('minOneEpisode')
    }

    const watchedCount = watchedBySeason?.get(season.seasonNumber) ?? 0
    if (season.episodeCount < watchedCount) {
      errors.push('cannotReduceBelowWatched')
    }
  })

  return [...new Set(errors)]
}

export function structureToEpisodeDrafts(structure: SeasonStructureItem[]): ShowEpisodeDraft[] {
  return structure.flatMap((season) =>
    Array.from({ length: season.episodeCount }, (_, index) => ({
      seasonNumber: season.seasonNumber,
      episodeNumber: index + 1,
    })),
  )
}

export function addSeason(structure: SeasonStructureItem[]): SeasonStructureItem[] {
  return normalizeSeasonNumbers([
    ...structure,
    { seasonNumber: structure.length + 1, episodeCount: DEFAULT_EPISODE_COUNT },
  ])
}

export function removeSeason(
  structure: SeasonStructureItem[],
  seasonNumber: number,
): SeasonStructureItem[] {
  return normalizeSeasonNumbers(structure.filter((season) => season.seasonNumber !== seasonNumber))
}

export function updateSeasonEpisodeCount(
  structure: SeasonStructureItem[],
  seasonNumber: number,
  episodeCount: number,
): SeasonStructureItem[] {
  return structure.map((season) =>
    season.seasonNumber === seasonNumber ? { ...season, episodeCount } : season,
  )
}

export function clampEpisodeCount(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function parsePositiveIntegerInput(text: string, fallback: number): number {
  const digitsOnly = text.replace(/\D/g, '')

  if (digitsOnly === '') {
    return fallback
  }

  const parsed = Number.parseInt(digitsOnly, 10)

  if (Number.isNaN(parsed)) {
    return fallback
  }

  return parsed
}

export function getStructureAggregates(structure: SeasonStructureItem[]): {
  seasonsCount: number
  episodesPerSeason: number
} {
  return {
    seasonsCount: structure.length,
    episodesPerSeason: Math.max(...structure.map((season) => season.episodeCount), 1),
  }
}
