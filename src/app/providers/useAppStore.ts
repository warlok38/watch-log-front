import { create } from 'zustand'

import type { WatchStatus } from '@/entities/show'

type AppState = {
  activeStatus: WatchStatus | 'all'
  setActiveStatus: (status: WatchStatus | 'all') => void
}

export const useAppStore = create<AppState>((set) => ({
  activeStatus: 'all',
  setActiveStatus: (activeStatus) => set({ activeStatus }),
}))
