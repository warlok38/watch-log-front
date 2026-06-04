import type { Show, ShowDraft, ShowMetadataField, ShowMetadataPatch, WatchStatus } from '@/entities/show'
import type { WatchEvent, WatchEventType } from '@/entities/watch-progress'
import Dexie from 'dexie'

import type { SeasonStructureItem } from '@/features/manual-show-structure/types'
import {
  getSourceSeasonNumber,
  getStructureAggregates,
  getWatchedBySeasonForStructure,
  getWatchedCountsBySeason,
  normalizeSeasonNumbers,
  validateSeasonStructure,
} from '@/features/manual-show-structure/seasonStructure'
import { getAutomaticWatchStatus, isEpisodeReleased } from '@/shared/lib/episodeProgress'
import { revokePosterBlobUrl } from '@/shared/lib/posterBlobUrlCache'
import { isShowFieldModified } from '@/shared/lib/showMetadata'

import { buildEpisodes, buildEpisodesFromDraft, buildEpisodesFromStructure } from './episodes'
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
    providerSnapshot:
      draft.externalProvider !== 'manual'
        ? {
            title: draft.title,
            posterUrl: draft.posterUrl,
            summary: draft.summary,
          }
        : undefined,
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

export async function updateShowMetadata(showId: string, patch: ShowMetadataPatch): Promise<void> {
  const show = await db.shows.get(showId)
  if (!show) return

  if (patch.externalStatus !== undefined && show.externalProvider !== 'manual') {
    return
  }

  const updatedAt = nowIso()

  const posterChanged =
    patch.posterBlob !== undefined || patch.posterUrl !== undefined || patch.clearPoster

  await db.shows.where('id').equals(showId).modify((record) => {
    record.updatedAt = updatedAt

    if (patch.title !== undefined) record.title = patch.title
    if (patch.summary !== undefined) record.summary = patch.summary || undefined
    if (patch.externalStatus !== undefined) record.externalStatus = patch.externalStatus

    if (patch.clearPoster) {
      delete record.posterBlob
      delete record.posterUrl
    }

    if (patch.posterBlob !== undefined) {
      if (patch.posterBlob === null) {
        delete record.posterBlob
      } else {
        record.posterBlob = patch.posterBlob
        delete record.posterUrl
      }
    }

    if (patch.posterUrl !== undefined) {
      record.posterUrl = patch.posterUrl || undefined
      delete record.posterBlob
    }
  })

  if (posterChanged) {
    revokePosterBlobUrl(showId)
  }

  if (patch.externalStatus !== undefined && show.externalProvider === 'manual') {
    await refreshShowProgress(showId)
  }
}

export async function updateShowStructure(
  showId: string,
  structure: SeasonStructureItem[],
): Promise<void> {
  const show = await db.shows.get(showId)
  if (!show || show.externalProvider !== 'manual') return

  const normalizedStructure = normalizeSeasonNumbers(structure)
  const currentEpisodes = await db.episodes.where('showId').equals(showId).toArray()
  const watchedBySeason = getWatchedCountsBySeason(currentEpisodes)
  const validationWatchedBySeason = getWatchedBySeasonForStructure(
    normalizedStructure,
    watchedBySeason,
  )
  const validationErrors = validateSeasonStructure(normalizedStructure, validationWatchedBySeason)

  if (validationErrors.length > 0) {
    throw new Error(validationErrors[0])
  }

  const keptSourceSeasons = new Set(
    normalizedStructure.map((season) => getSourceSeasonNumber(season)),
  )
  const removedEpisodes = currentEpisodes.filter(
    (episode) => !keptSourceSeasons.has(episode.seasonNumber),
  )

  const updatedAt = nowIso()
  const aggregates = getStructureAggregates(normalizedStructure)

  await db.transaction('rw', db.shows, db.episodes, async () => {
    if (removedEpisodes.length > 0) {
      await db.episodes.bulkDelete(removedEpisodes.map((episode) => episode.id))
    }

    for (const seasonItem of normalizedStructure) {
      const sourceSeasonNumber = getSourceSeasonNumber(seasonItem)
      const targetSeasonNumber = seasonItem.seasonNumber
      const sourceEpisodes = currentEpisodes.filter(
        (episode) => episode.seasonNumber === sourceSeasonNumber,
      )
      const seasonEpisodes = sourceEpisodes.filter(
        (episode) => !removedEpisodes.some((removedEpisode) => removedEpisode.id === episode.id),
      )

      if (sourceSeasonNumber !== targetSeasonNumber) {
        for (const episode of seasonEpisodes) {
          const nextEpisode = {
            ...episode,
            id: `${showId}_s${targetSeasonNumber}_e${episode.episodeNumber}`,
            seasonNumber: targetSeasonNumber,
          }

          await db.episodes.delete(episode.id)
          await db.episodes.add(nextEpisode)
          episode.id = nextEpisode.id
          episode.seasonNumber = nextEpisode.seasonNumber
        }
      }

      const currentCount =
        seasonEpisodes.length > 0
          ? Math.max(...seasonEpisodes.map((episode) => episode.episodeNumber))
          : 0
      const newCount = seasonItem.episodeCount

      if (currentCount === 0) {
        await db.episodes.bulkAdd(buildEpisodesFromStructure(showId, [seasonItem]))
        continue
      }

      if (newCount > currentCount) {
        const episodesToAdd = Array.from({ length: newCount - currentCount }, (_, index) => ({
          id: `${showId}_s${targetSeasonNumber}_e${currentCount + index + 1}`,
          showId,
          seasonNumber: targetSeasonNumber,
          episodeNumber: currentCount + index + 1,
          watched: false,
        }))

        await db.episodes.bulkAdd(episodesToAdd)
        continue
      }

      if (newCount < currentCount) {
        const episodesToDelete = seasonEpisodes.filter(
          (episode) => episode.episodeNumber > newCount && !episode.watched,
        )

        if (episodesToDelete.length > 0) {
          await db.episodes.bulkDelete(episodesToDelete.map((episode) => episode.id))
        }
      }
    }

    await db.shows.update(showId, {
      seasonsCount: aggregates.seasonsCount,
      episodesPerSeason: aggregates.episodesPerSeason,
      updatedAt,
    })
  })

  await refreshShowProgress(showId)
}

export async function resetShowField(showId: string, field: ShowMetadataField): Promise<void> {
  const show = await db.shows.get(showId)
  if (!show?.providerSnapshot || !isShowFieldModified(show, field)) return

  const snapshot = show.providerSnapshot
  const updatedAt = nowIso()

  switch (field) {
    case 'title':
      await db.shows.update(showId, { title: snapshot.title, updatedAt })
      break
    case 'summary':
      await db.shows.update(showId, { summary: snapshot.summary, updatedAt })
      break
    case 'posterUrl':
      await db.shows.where('id').equals(showId).modify((record) => {
        record.posterUrl = snapshot.posterUrl
        delete record.posterBlob
        record.updatedAt = updatedAt
      })
      revokePosterBlobUrl(showId)
      break
  }
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

export async function refreshShowProgress(showId: string): Promise<void> {
  await updateShowProgress(showId, nowIso())
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
  const episode = await db.episodes
    .where('[showId+seasonNumber+episodeNumber]')
    .equals([showId, seasonNumber, episodeNumber])
    .first()

  if (!episode || !isEpisodeReleased(episode.airDate)) return

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
  if (!isEpisodeReleased(episode.airDate) && !episode.watched) return

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
  const releasedEpisodes = episodes.filter((episode) => isEpisodeReleased(episode.airDate))
  const lastEpisode = Math.max(...releasedEpisodes.map((episode) => episode.episodeNumber), 0)

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
      if (!isEpisodeReleased(episode.airDate)) return false
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

  const releasedEpisodes = episodes.filter((episode) => isEpisodeReleased(episode.airDate))
  const watchedReleasedEpisodes = releasedEpisodes.filter((episode) => episode.watched)
  const lastWatchedEpisode = watchedReleasedEpisodes.toSorted((left, right) => {
    if (left.seasonNumber !== right.seasonNumber) {
      return right.seasonNumber - left.seasonNumber
    }

    return right.episodeNumber - left.episodeNumber
  })[0]

  const nextStatus = getAutomaticWatchStatus(
    show,
    watchedReleasedEpisodes.length,
    releasedEpisodes.length,
    episodes.length,
  )
  const nextSeason = lastWatchedEpisode?.seasonNumber ?? 1
  const nextEpisode = lastWatchedEpisode?.episodeNumber ?? 0

  if (
    show.currentSeason === nextSeason &&
    show.currentEpisode === nextEpisode &&
    show.status === nextStatus
  ) {
    return
  }

  await db.shows.update(showId, {
    currentSeason: nextSeason,
    currentEpisode: nextEpisode,
    status: nextStatus,
    updatedAt,
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
