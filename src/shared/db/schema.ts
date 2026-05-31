import Dexie, { type EntityTable } from 'dexie'

import type { Episode } from '@/entities/episode'
import type { Show } from '@/entities/show'
import type { WatchEvent } from '@/entities/watch-progress'

export type UserSetting = {
  key: string
  value: string
}

export class WatchLogDatabase extends Dexie {
  shows!: EntityTable<Show, 'id'>
  episodes!: EntityTable<Episode, 'id'>
  watchEvents!: EntityTable<WatchEvent, 'id'>
  settings!: EntityTable<UserSetting, 'key'>

  constructor() {
    super('watchlog')

    this.version(1).stores({
      shows: 'id, status, kind, title, updatedAt, [externalProvider+externalId]',
      episodes: 'id, showId, [showId+seasonNumber+episodeNumber], watched',
      watchEvents: 'id, showId, createdAt',
      settings: 'key',
    })
  }
}

export const db = new WatchLogDatabase()
