import type { Episode } from '@/entities/episode'
import type { Show, ShowDraft, WatchStatus } from '@/entities/show'
import type { WatchEvent, WatchEventType } from '@/entities/watch-progress'
import Dexie from 'dexie'

import { createId } from './ids'
import { db } from './schema'

const DEFAULT_STATUS: WatchStatus = 'planned'

function nowIso(): string {
  return new Date().toISOString()
}

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

export async function addShow(draft: ShowDraft): Promise<string> {
  const createdAt = nowIso()
  const show: Show = {
    id: createId('show'),
    status: DEFAULT_STATUS,
    currentSeason: 1,
    currentEpisode: 0,
    createdAt,
    updatedAt: createdAt,
    ...draft,
  }

  await db.transaction('rw', db.shows, db.episodes, async () => {
    await db.shows.add(show)
    await db.episodes.bulkAdd(buildEpisodes(show.id, draft.seasonsCount, draft.episodesPerSeason))
  })

  return show.id
}

export async function updateShowStatus(showId: string, status: WatchStatus): Promise<void> {
  await db.transaction('rw', db.shows, db.watchEvents, async () => {
    await db.shows.update(showId, { status, updatedAt: nowIso() })
    await addWatchEvent(showId, 'status-changed')
  })
}

export async function deleteShow(showId: string): Promise<void> {
  await db.transaction('rw', db.shows, db.episodes, db.watchEvents, async () => {
    await db.shows.delete(showId)
    await db.episodes.where('showId').equals(showId).delete()
    await db.watchEvents.where('showId').equals(showId).delete()
  })
}

export async function markEpisode(showId: string, seasonNumber: number, episodeNumber: number): Promise<void> {
  const watchedAt = nowIso()

  await db.transaction('rw', db.episodes, db.shows, db.watchEvents, async () => {
    await db.episodes
      .where('[showId+seasonNumber+episodeNumber]')
      .equals([showId, seasonNumber, episodeNumber])
      .modify({ watched: true, watchedAt })
    await db.shows.update(showId, {
      currentSeason: seasonNumber,
      currentEpisode: episodeNumber,
      status: 'watching',
      updatedAt: watchedAt,
    })
    await addWatchEvent(showId, 'episode-marked', seasonNumber, episodeNumber)
  })
}

export async function markSeason(showId: string, seasonNumber: number): Promise<void> {
  const episodes = await db.episodes
    .where('[showId+seasonNumber+episodeNumber]')
    .between([showId, seasonNumber, Dexie.minKey], [showId, seasonNumber, Dexie.maxKey])
    .toArray()
  const lastEpisode = Math.max(...episodes.map((episode) => episode.episodeNumber), 0)

  if (lastEpisode > 0) {
    await markRange(showId, seasonNumber, lastEpisode, 'season-marked')
  }
}

export async function markRange(
  showId: string,
  toSeasonNumber: number,
  toEpisodeNumber: number,
  eventType: WatchEventType = 'range-marked',
): Promise<void> {
  const watchedAt = nowIso()
  const episodes = await db.episodes.where('showId').equals(showId).toArray()
  const updates = episodes
    .filter((episode) => {
      if (episode.seasonNumber < toSeasonNumber) return true
      return episode.seasonNumber === toSeasonNumber && episode.episodeNumber <= toEpisodeNumber
    })
    .map((episode) => ({
      key: episode.id,
      changes: {
        watched: true,
        watchedAt,
      },
    }))

  await db.transaction('rw', db.episodes, db.shows, db.watchEvents, async () => {
    await Promise.all(updates.map((update) => db.episodes.update(update.key, update.changes)))
    await db.shows.update(showId, {
      currentSeason: toSeasonNumber,
      currentEpisode: toEpisodeNumber,
      status: 'watching',
      updatedAt: watchedAt,
    })
    await addWatchEvent(showId, eventType, toSeasonNumber, toEpisodeNumber)
  })
}

async function addWatchEvent(
  showId: string,
  type: WatchEventType,
  seasonNumber?: number,
  episodeNumber?: number,
): Promise<void> {
  const event: WatchEvent = {
    id: createId('event'),
    showId,
    type,
    seasonNumber,
    episodeNumber,
    toSeasonNumber: seasonNumber,
    toEpisodeNumber: episodeNumber,
    createdAt: nowIso(),
  }

  await db.watchEvents.add(event)
}
