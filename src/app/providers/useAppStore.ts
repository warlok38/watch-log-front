import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { WatchStatus } from '@/entities/show'

export type LibraryFilter = WatchStatus | 'all' | 'archive'
export type LibraryView = 'cards' | 'list'

type AppState = {
  activeStatus: LibraryFilter
  libraryView: LibraryView
  libraryQuery: string
  setActiveStatus: (status: LibraryFilter) => void
  setLibraryView: (view: LibraryView) => void
  setLibraryQuery: (query: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeStatus: 'all',
      libraryView: 'cards',
      libraryQuery: '',
      setActiveStatus: (activeStatus) => set({ activeStatus }),
      setLibraryView: (libraryView) => set({ libraryView }),
      setLibraryQuery: (libraryQuery) => set({ libraryQuery }),
    }),
    {
      name: 'watchlog-ui',
      partialize: ({ activeStatus, libraryView }) => ({ activeStatus, libraryView }),
    },
  ),
)
