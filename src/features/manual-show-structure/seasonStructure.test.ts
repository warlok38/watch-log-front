/// <reference types="vitest/globals" />

import type { Episode } from '@/entities/episode'

import {
  addSeason,
  clampEpisodeCount,
  createDefaultStructure,
  getStructureTotals,
  getUnwatchedRemovalCount,
  getWatchedCountsBySeason,
  parsePositiveIntegerInput,
  removeSeason,
  seasonStructureFromEpisodes,
  structureToEpisodeDrafts,
  validateSeasonStructure,
} from './seasonStructure'

const episodes: Episode[] = [
  {
    id: 'show_1_s1_e1',
    showId: 'show_1',
    seasonNumber: 1,
    episodeNumber: 1,
    watched: true,
  },
  {
    id: 'show_1_s1_e2',
    showId: 'show_1',
    seasonNumber: 1,
    episodeNumber: 2,
    watched: true,
  },
  {
    id: 'show_1_s1_e3',
    showId: 'show_1',
    seasonNumber: 1,
    episodeNumber: 3,
    watched: false,
  },
  {
    id: 'show_1_s2_e1',
    showId: 'show_1',
    seasonNumber: 2,
    episodeNumber: 1,
    watched: false,
  },
]

it('creates default structure with one season', () => {
  expect(createDefaultStructure()).toEqual([{ seasonNumber: 1, episodeCount: 12 }])
})

it('groups episodes into season structure', () => {
  expect(seasonStructureFromEpisodes(episodes)).toEqual([
    { seasonNumber: 1, episodeCount: 3, sourceSeasonNumber: 1 },
    { seasonNumber: 2, episodeCount: 1, sourceSeasonNumber: 2 },
  ])
})

it('calculates totals and watched counts', () => {
  const structure = seasonStructureFromEpisodes(episodes)

  expect(getStructureTotals(structure)).toEqual({ seasons: 2, episodes: 4 })
  expect(getWatchedCountsBySeason(episodes).get(1)).toBe(2)
})

it('calculates unwatched removal count', () => {
  expect(getUnwatchedRemovalCount(12, 10, 8)).toBe(2)
  expect(getUnwatchedRemovalCount(12, 8, 8)).toBe(4)
})

it('validates structure against watched episodes', () => {
  const structure = [{ seasonNumber: 1, episodeCount: 1 }]
  const watchedBySeason = getWatchedCountsBySeason(episodes)

  expect(validateSeasonStructure(structure, watchedBySeason)).toEqual(['cannotReduceBelowWatched'])
  expect(validateSeasonStructure([{ seasonNumber: 1, episodeCount: 3 }], watchedBySeason)).toEqual([])
})

it('converts structure to episode drafts', () => {
  expect(
    structureToEpisodeDrafts([
      { seasonNumber: 1, episodeCount: 2 },
      { seasonNumber: 2, episodeCount: 1 },
    ]),
  ).toEqual([
    { seasonNumber: 1, episodeNumber: 1 },
    { seasonNumber: 1, episodeNumber: 2 },
    { seasonNumber: 2, episodeNumber: 1 },
  ])
})

it('renumbers seasons after removal', () => {
  const structure = [
    { seasonNumber: 1, episodeCount: 10 },
    { seasonNumber: 2, episodeCount: 8, sourceSeasonNumber: 2 },
  ]

  expect(removeSeason(structure, 1)).toEqual([
    { seasonNumber: 1, episodeCount: 8, sourceSeasonNumber: 2 },
  ])
})

it('adds the next sequential season number', () => {
  const structure = removeSeason(
    [
      { seasonNumber: 1, episodeCount: 10 },
      { seasonNumber: 2, episodeCount: 8, sourceSeasonNumber: 2 },
    ],
    1,
  )

  expect(addSeason(structure)).toEqual([
    { seasonNumber: 1, episodeCount: 8, sourceSeasonNumber: 2 },
    { seasonNumber: 2, episodeCount: 12 },
  ])
})

it('parses only positive integer digits from input', () => {
  expect(parsePositiveIntegerInput('12abc', 5)).toBe(12)
  expect(parsePositiveIntegerInput('abc', 5)).toBe(5)
  expect(parsePositiveIntegerInput('', 5)).toBe(5)
})

it('clamps episode count within bounds', () => {
  expect(clampEpisodeCount(0, 1, 200)).toBe(1)
  expect(clampEpisodeCount(250, 1, 200)).toBe(200)
})
