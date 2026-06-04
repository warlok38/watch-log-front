/// <reference types="vitest/globals" />

import type { Show } from '@/entities/show'

import { buildEpisodes } from './episodes'
import { addShow, updateShowStructure } from './libraryRepository'
import { db } from './schema'

const manualShow: Show = {
  id: 'show_manual',
  title: 'Manual show',
  kind: 'series',
  status: 'planned',
  externalStatus: 'unknown',
  isArchived: false,
  externalProvider: 'manual',
  seasonsCount: 1,
  episodesPerSeason: 3,
  currentSeason: 1,
  currentEpisode: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

beforeEach(async () => {
  await db.transaction('rw', db.shows, db.episodes, db.watchEvents, async () => {
    await db.watchEvents.clear()
    await db.episodes.clear()
    await db.shows.clear()
  })

  await db.shows.add(manualShow)
  await db.episodes.bulkAdd(buildEpisodes(manualShow.id, 1, 3))
})

it('adds episodes to an existing season', async () => {
  await updateShowStructure(manualShow.id, [{ seasonNumber: 1, episodeCount: 5 }])

  const episodes = await db.episodes.where('showId').equals(manualShow.id).sortBy('episodeNumber')
  const show = await db.shows.get(manualShow.id)

  expect(episodes).toHaveLength(5)
  expect(episodes[4]).toMatchObject({ seasonNumber: 1, episodeNumber: 5, watched: false })
  expect(show).toMatchObject({ seasonsCount: 1, episodesPerSeason: 5 })
})

it('removes only unwatched episodes when reducing season size', async () => {
  await db.episodes.update('show_manual_s1_e1', { watched: true, watchedAt: '2026-01-02T00:00:00.000Z' })
  await db.episodes.update('show_manual_s1_e2', { watched: true, watchedAt: '2026-01-02T00:00:00.000Z' })

  await updateShowStructure(manualShow.id, [{ seasonNumber: 1, episodeCount: 2 }])

  const episodes = await db.episodes.where('showId').equals(manualShow.id).toArray()

  expect(episodes).toHaveLength(2)
  expect(episodes.every((episode) => episode.watched)).toBe(true)
})

it('adds a new season and updates aggregates', async () => {
  await updateShowStructure(manualShow.id, [
    { seasonNumber: 1, episodeCount: 3 },
    { seasonNumber: 2, episodeCount: 4 },
  ])

  const episodes = await db.episodes.where('showId').equals(manualShow.id).toArray()
  const show = await db.shows.get(manualShow.id)

  expect(episodes).toHaveLength(7)
  expect(show).toMatchObject({ seasonsCount: 2, episodesPerSeason: 4 })
})

it('removes deleted seasons from the database', async () => {
  await db.episodes.bulkAdd([
    {
      id: 'show_manual_s2_e1',
      showId: manualShow.id,
      seasonNumber: 2,
      episodeNumber: 1,
      watched: false,
    },
    {
      id: 'show_manual_s2_e2',
      showId: manualShow.id,
      seasonNumber: 2,
      episodeNumber: 2,
      watched: false,
    },
  ])

  await updateShowStructure(manualShow.id, [{ seasonNumber: 1, episodeCount: 3 }])

  const episodes = await db.episodes.where('showId').equals(manualShow.id).toArray()

  expect(episodes.every((episode) => episode.seasonNumber === 1)).toBe(true)
  expect(episodes).toHaveLength(3)
})

it('creates episodes when adding a manual show from structure drafts', async () => {
  await db.transaction('rw', db.shows, db.episodes, db.watchEvents, async () => {
    await db.watchEvents.clear()
    await db.episodes.clear()
    await db.shows.clear()
  })

  const showId = await addShow({
    title: 'Created manually',
    kind: 'series',
    externalProvider: 'manual',
    seasonsCount: 2,
    episodesPerSeason: 2,
    episodes: [
      { seasonNumber: 1, episodeNumber: 1 },
      { seasonNumber: 1, episodeNumber: 2 },
      { seasonNumber: 2, episodeNumber: 1 },
    ],
  })

  const episodes = await db.episodes.where('showId').equals(showId).toArray()
  const show = await db.shows.get(showId)

  expect(episodes).toHaveLength(3)
  expect(show).toMatchObject({ seasonsCount: 2, episodesPerSeason: 2 })
})

it('rejects reducing below watched episodes', async () => {
  await db.episodes.update('show_manual_s1_e1', { watched: true, watchedAt: '2026-01-02T00:00:00.000Z' })
  await db.episodes.update('show_manual_s1_e2', { watched: true, watchedAt: '2026-01-02T00:00:00.000Z' })

  await expect(
    updateShowStructure(manualShow.id, [{ seasonNumber: 1, episodeCount: 1 }]),
  ).rejects.toThrow('cannotReduceBelowWatched')
})

it('renumbers remaining season after deleting the first one', async () => {
  await db.episodes.bulkAdd([
    {
      id: 'show_manual_s2_e1',
      showId: manualShow.id,
      seasonNumber: 2,
      episodeNumber: 1,
      watched: false,
    },
    {
      id: 'show_manual_s2_e2',
      showId: manualShow.id,
      seasonNumber: 2,
      episodeNumber: 2,
      watched: false,
    },
  ])

  await updateShowStructure(manualShow.id, [
    { seasonNumber: 1, episodeCount: 2, sourceSeasonNumber: 2 },
  ])

  const episodes = await db.episodes.where('showId').equals(manualShow.id).toArray()

  expect(episodes).toHaveLength(2)
  expect(episodes.every((episode) => episode.seasonNumber === 1)).toBe(true)
  expect(episodes.map((episode) => episode.id)).toEqual([
    'show_manual_s1_e1',
    'show_manual_s1_e2',
  ])
})
