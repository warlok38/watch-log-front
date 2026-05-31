import type { Show, ShowDraft, WatchStatus } from '@/entities/show'
import type { WatchEvent, WatchEventType } from '@/entities/watch-progress'
import Dexie from 'dexie'

import { buildEpisodes, buildEpisodesFromDraft } from './episodes'
import { createId } from './ids'
import { db } from './schema'

export { buildEpisodes } from './episodes'

const DEFAULT_STATUS: WatchStatus = 'planned'

function nowIso(): string {
  return new Date().toISOString()
}

export async function addShow(draft: ShowDraft): Promise<string> {
  const createdAt = nowIso()
  const existingShow =
    draft.externalId &&
    (await db.shows
      .where('[externalProvider+externalId]')
      .equals([draft.externalProvider, draft.externalId])
      .first())

  if (existingShow) {
    return existingShow.id
  }

  const show: Show = {
    id: createId('show'),
    status: DEFAULT_STATUS,
    externalStatus: draft.externalStatus ?? 'unknown',
    isArchived: false,
    currentSeason: 1,
    currentEpisode: 0,
    createdAt,
    updatedAt: createdAt,
    ...draft,
  }

  await db.transaction('rw', db.shows, db.episodes, async () => {
    await db.shows.add(show)
    const episodes = draft.episodes?.length
      ? buildEpisodesFromDraft(show.id, draft.episodes)
      : buildEpisodes(show.id, draft.seasonsCount, draft.episodesPerSeason)

    await db.episodes.bulkAdd(episodes)
  })

  return show.id
}

export async function updateShowStatus(showId: string, status: WatchStatus): Promise<void> {
  await db.transaction('rw', db.shows, db.watchEvents, async () => {
    await db.shows.update(showId, { status, updatedAt: nowIso() })
    await addWatchEvent(showId, 'status-changed')
  })
}

export async function updateShowArchived(showId: string, isArchived: boolean): Promise<void> {
  await db.transaction('rw', db.shows, db.watchEvents, async () => {
    await db.shows.update(showId, { isArchived, updatedAt: nowIso() })
    await addWatchEvent(showId, 'archive-changed')
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
    await updateShowProgress(showId, watchedAt)
    await addWatchEvent(showId, 'episode-marked', seasonNumber, episodeNumber)
  })
}

export async function toggleEpisodeWatched(
  showId: string,
  seasonNumber: number,
  episodeNumber: number,
): Promise<void> {
  const episode = await db.episodes
    .where('[showId+seasonNumber+episodeNumber]')
    .equals([showId, seasonNumber, episodeNumber])
    .first()

  if (!episode) return

  const watched = !episode.watched
  const changedAt = nowIso()

  await db.transaction('rw', db.episodes, db.shows, db.watchEvents, async () => {
    await db.episodes.update(episode.id, {
      watched,
      watchedAt: watched ? changedAt : undefined,
    })
    await updateShowProgress(showId, changedAt)
    await addWatchEvent(
      showId,
      watched ? 'episode-marked' : 'episode-unmarked',
      seasonNumber,
      episodeNumber,
    )
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
    await updateShowProgress(showId, watchedAt)
    await addWatchEvent(showId, eventType, toSeasonNumber, toEpisodeNumber)
  })
}

async function updateShowProgress(showId: string, updatedAt: string): Promise<void> {
  const [show, episodes] = await Promise.all([
    db.shows.get(showId),
    db.episodes.where('showId').equals(showId).toArray(),
  ])

  if (!show) return

  const watchedEpisodes = episodes.filter((episode) => episode.watched)
  const lastWatchedEpisode = watchedEpisodes.toSorted((left, right) => {
    if (left.seasonNumber !== right.seasonNumber) {
      return right.seasonNumber - left.seasonNumber
    }

    return right.episodeNumber - left.episodeNumber
  })[0]

  await db.shows.update(showId, {
    currentSeason: lastWatchedEpisode?.seasonNumber ?? 1,
    currentEpisode: lastWatchedEpisode?.episodeNumber ?? 0,
    status: getAutomaticStatus(show, watchedEpisodes.length, episodes.length),
    updatedAt,
  })
}

function getAutomaticStatus(show: Show, watchedEpisodes: number, totalEpisodes: number): WatchStatus {
  if (watchedEpisodes === 0 || totalEpisodes === 0) {
    return 'planned'
  }

  if (watchedEpisodes < totalEpisodes) {
    return 'watching'
  }

  return show.externalStatus === 'ended' ? 'completed' : 'waiting'
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
