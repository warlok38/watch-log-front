import { create } from 'zustand'

import type { WatchStatus } from '@/entities/show'

export type LibraryFilter = WatchStatus | 'all' | 'archive'

type AppState = {
  activeStatus: LibraryFilter
  setActiveStatus: (status: LibraryFilter) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeStatus: 'all',
  setActiveStatus: (activeStatus) => set({ activeStatus }),
}))
