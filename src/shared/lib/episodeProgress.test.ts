/// <reference types="vitest/globals" />

import type { Episode } from '@/entities/episode'
import type { Show } from '@/entities/show'

import {
  getAutomaticWatchStatus,
  getLibrarySortGroup,
  getNextEpisodeAction,
  shouldShowAllCaughtUpBanner,
  shouldShowNextEpisodeCard,
  sortEpisodes,
  sortLibraryShows,
} from './episodeProgress'

function createShow(overrides: Partial<Show> = {}): Show {
  return {
    id: 'show_1',
    title: 'Test Show',
    kind: 'series',
    status: 'watching',
    externalStatus: 'running',
    isArchived: false,
    externalProvider: 'manual',
    seasonsCount: 1,
    episodesPerSeason: 8,
    currentSeason: 1,
    currentEpisode: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function createEpisode(overrides: Partial<Episode> & Pick<Episode, 'seasonNumber' | 'episodeNumber'>): Episode {
  const showId = overrides.showId ?? 'show_1'

  return {
    id: `${showId}_s${overrides.seasonNumber}_e${overrides.episodeNumber}`,
    showId,
    watched: false,
    ...overrides,
  }
}

function buildEpisodesByShowId(episodes: Episode[]): Map<string, Episode[]> {
  const episodesByShowId = new Map<string, Episode[]>()

  for (const episode of episodes) {
    const showEpisodes = episodesByShowId.get(episode.showId) ?? []
    showEpisodes.push(episode)
    episodesByShowId.set(episode.showId, showEpisodes)
  }

  return episodesByShowId
}

const futureAirDate = '2099-06-07T00:00:00.000Z'
const pastAirDate = '2020-01-01T00:00:00.000Z'

describe('getNextEpisodeAction', () => {
  it('returns mark for the first released unwatched episode', () => {
    const show = createShow({ status: 'planned', currentSeason: 1, currentEpisode: 0 })
    const episodes = [createEpisode({ seasonNumber: 1, episodeNumber: 1 })]

    expect(getNextEpisodeAction(show, episodes)).toEqual({
      kind: 'mark',
      season: 1,
      episode: 1,
    })
  })

  it('returns mark for the next season after finishing the previous one', () => {
    const show = createShow({ currentSeason: 1, currentEpisode: 8 })
    const episodes = [
      createEpisode({ seasonNumber: 1, episodeNumber: 8, watched: true }),
      createEpisode({ seasonNumber: 2, episodeNumber: 1 }),
    ]

    expect(getNextEpisodeAction(show, episodes)).toEqual({
      kind: 'mark',
      season: 2,
      episode: 1,
    })
  })

  it('returns wait for a future episode with air date', () => {
    const show = createShow()
    const episodes = [
      createEpisode({ seasonNumber: 4, episodeNumber: 6, watched: true }),
      createEpisode({ seasonNumber: 4, episodeNumber: 7, airDate: futureAirDate }),
    ]

    expect(getNextEpisodeAction(show, episodes)).toEqual({
      kind: 'wait',
      season: 4,
      episode: 7,
      airDate: futureAirDate,
    })
  })

  it('returns wait without air date when the episode date is in the future', () => {
    const show = createShow()
    const episodes = [createEpisode({ seasonNumber: 4, episodeNumber: 7, airDate: futureAirDate })]

    const action = getNextEpisodeAction(show, episodes)

    expect(action.kind).toBe('wait')
    if (action.kind === 'wait') {
      expect(action.airDate).toBe(futureAirDate)
    }
  })

  it('returns archive for completed shows that are not archived yet', () => {
    const show = createShow({ status: 'completed', externalStatus: 'ended', currentSeason: 5, currentEpisode: 8 })
    const episodes = Array.from({ length: 8 }, (_, index) =>
      createEpisode({ seasonNumber: 5, episodeNumber: index + 1, watched: true }),
    )

    expect(getNextEpisodeAction(show, episodes)).toEqual({ kind: 'archive' })
  })

  it('returns none for waiting shows with everything watched', () => {
    const show = createShow({ status: 'waiting', currentSeason: 2, currentEpisode: 10 })
    const episodes = Array.from({ length: 10 }, (_, index) =>
      createEpisode({ seasonNumber: 2, episodeNumber: index + 1, watched: true }),
    )

    expect(getNextEpisodeAction(show, episodes)).toEqual({ kind: 'none' })
  })

  it('returns none for completed archived shows', () => {
    const show = createShow({ status: 'completed', externalStatus: 'ended', isArchived: true })
    const episodes = [createEpisode({ seasonNumber: 1, episodeNumber: 1, watched: true })]

    expect(getNextEpisodeAction(show, episodes)).toEqual({ kind: 'none' })
  })
})

describe('shouldShowAllCaughtUpBanner', () => {
  it('is true only for waiting status with no action', () => {
    const show = createShow({ status: 'waiting' })

    expect(shouldShowAllCaughtUpBanner(show, { kind: 'none' })).toBe(true)
    expect(shouldShowAllCaughtUpBanner(show, { kind: 'archive' })).toBe(false)
  })

  it('is false for completed ended shows', () => {
    const show = createShow({ status: 'completed', externalStatus: 'ended' })

    expect(shouldShowAllCaughtUpBanner(show, { kind: 'none' })).toBe(false)
  })
})

describe('shouldShowNextEpisodeCard', () => {
  it('hides the card for completed ended shows', () => {
    const show = createShow({ status: 'completed', externalStatus: 'ended', isArchived: true })

    expect(shouldShowNextEpisodeCard(show, { kind: 'none' })).toBe(false)
  })

  it('shows the card for waiting shows', () => {
    const show = createShow({ status: 'waiting' })

    expect(shouldShowNextEpisodeCard(show, { kind: 'none' })).toBe(true)
  })

  it('shows the card for archive action', () => {
    const show = createShow({ status: 'completed', externalStatus: 'ended' })

    expect(shouldShowNextEpisodeCard(show, { kind: 'archive' })).toBe(true)
  })
})

describe('sortEpisodes', () => {
  it('sorts episodes by season and episode number', () => {
    const episodes = [
      createEpisode({ seasonNumber: 2, episodeNumber: 1 }),
      createEpisode({ seasonNumber: 1, episodeNumber: 2 }),
      createEpisode({ seasonNumber: 1, episodeNumber: 1 }),
    ]

    expect(sortEpisodes(episodes).map((episode) => `${episode.seasonNumber}-${episode.episodeNumber}`)).toEqual([
      '1-1',
      '1-2',
      '2-1',
    ])
  })
})

describe('released episode priority', () => {
  it('prefers mark over wait when a released episode is available first', () => {
    const show = createShow()
    const episodes = [
      createEpisode({ seasonNumber: 1, episodeNumber: 1, watched: true, airDate: pastAirDate }),
      createEpisode({ seasonNumber: 1, episodeNumber: 2, airDate: pastAirDate }),
      createEpisode({ seasonNumber: 1, episodeNumber: 3, airDate: futureAirDate }),
    ]

    expect(getNextEpisodeAction(show, episodes)).toEqual({
      kind: 'mark',
      season: 1,
      episode: 2,
    })
  })
})

describe('sortLibraryShows', () => {
  it('sorts shows by group priority and then alphabetically by title', () => {
    const euphoria = createShow({ id: 'show_euphoria', title: 'Euphoria', status: 'watching' })
    const from = createShow({ id: 'show_from', title: 'FROM', status: 'watching' })
    const testShow = createShow({ id: 'show_test', title: 'Тест', status: 'watching' })
    const severance = createShow({ id: 'show_severance', title: 'Severance', status: 'waiting' })
    const theBoys = createShow({
      id: 'show_the_boys',
      title: 'The Boys',
      status: 'completed',
      externalStatus: 'ended',
    })

    const episodes = [
      createEpisode({ showId: 'show_euphoria', seasonNumber: 1, episodeNumber: 1, watched: true }),
      createEpisode({ showId: 'show_euphoria', seasonNumber: 1, episodeNumber: 2 }),
      createEpisode({ showId: 'show_test', seasonNumber: 1, episodeNumber: 1, watched: true }),
      createEpisode({ showId: 'show_test', seasonNumber: 1, episodeNumber: 2 }),
      createEpisode({ showId: 'show_from', seasonNumber: 4, episodeNumber: 6, watched: true }),
      createEpisode({ showId: 'show_from', seasonNumber: 4, episodeNumber: 7, airDate: futureAirDate }),
      ...Array.from({ length: 10 }, (_, index) =>
        createEpisode({
          showId: 'show_severance',
          seasonNumber: 2,
          episodeNumber: index + 1,
          watched: true,
        }),
      ),
      ...Array.from({ length: 8 }, (_, index) =>
        createEpisode({
          showId: 'show_the_boys',
          seasonNumber: 5,
          episodeNumber: index + 1,
          watched: true,
        }),
      ),
    ]

    const sortedTitles = sortLibraryShows(
      [theBoys, severance, from, testShow, euphoria],
      buildEpisodesByShowId(episodes),
    ).map((show) => show.title)

    const watchingGroupTitles = ['Euphoria', 'FROM', 'Тест'].toSorted((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: 'base' }),
    )

    expect(sortedTitles).toEqual([...watchingGroupTitles, 'Severance', 'The Boys'])
  })

  it('places planned shows in the watching group', () => {
    const plannedShow = createShow({ id: 'show_planned', title: 'Planned Show', status: 'planned' })
    const waitingShow = createShow({ id: 'show_waiting', title: 'Waiting Show', status: 'waiting' })

    expect(getLibrarySortGroup(plannedShow, [])).toBe(0)

    const sortedTitles = sortLibraryShows(
      [waitingShow, plannedShow],
      buildEpisodesByShowId([
        ...Array.from({ length: 10 }, (_, index) =>
          createEpisode({
            showId: 'show_waiting',
            seasonNumber: 1,
            episodeNumber: index + 1,
            watched: true,
          }),
        ),
      ]),
    ).map((show) => show.title)

    expect(sortedTitles).toEqual(['Planned Show', 'Waiting Show'])
  })

  it('sorts alphabetically within the same group regardless of action kind', () => {
    const alpha = createShow({ id: 'show_alpha', title: 'Alpha', status: 'watching' })
    const beta = createShow({ id: 'show_beta', title: 'Beta', status: 'watching' })

    const episodes = [
      createEpisode({ showId: 'show_alpha', seasonNumber: 1, episodeNumber: 1, airDate: futureAirDate }),
      createEpisode({ showId: 'show_beta', seasonNumber: 1, episodeNumber: 1 }),
    ]

    const sortedTitles = sortLibraryShows(
      [beta, alpha],
      buildEpisodesByShowId(episodes),
    ).map((show) => show.title)

    expect(sortedTitles).toEqual(['Alpha', 'Beta'])
  })
})

describe('getAutomaticWatchStatus', () => {
  it('returns completed for unknown and to_be_determined when all episodes are watched', () => {
    const unknownShow = createShow({ externalStatus: 'unknown' })
    const tbdShow = createShow({ externalStatus: 'to_be_determined' })

    expect(getAutomaticWatchStatus(unknownShow, 8, 8, 8)).toBe('completed')
    expect(getAutomaticWatchStatus(tbdShow, 8, 8, 8)).toBe('completed')
  })

  it('returns waiting for running and in_development when all episodes are watched', () => {
    const runningShow = createShow({ externalStatus: 'running' })
    const inDevelopmentShow = createShow({ externalStatus: 'in_development' })

    expect(getAutomaticWatchStatus(runningShow, 8, 8, 8)).toBe('waiting')
    expect(getAutomaticWatchStatus(inDevelopmentShow, 8, 8, 8)).toBe('waiting')
  })

  it('returns completed for ended shows when all episodes are watched', () => {
    const endedShow = createShow({ externalStatus: 'ended' })

    expect(getAutomaticWatchStatus(endedShow, 8, 8, 8)).toBe('completed')
  })
})
