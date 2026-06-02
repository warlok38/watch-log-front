import { registerSW } from 'virtual:pwa-register'

export type PwaUpdateStatus = 'updated' | 'available' | 'current' | 'unsupported'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined
let needRefresh = false
let initialized = false
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

function waitForInstallingWorker(
  registration: ServiceWorkerRegistration,
): Promise<PwaUpdateStatus> {
  const installingWorker = registration.installing
  if (!installingWorker) {
    return Promise.resolve(registration.waiting ? 'available' : 'current')
  }

  return new Promise((resolve) => {
    installingWorker.addEventListener('statechange', () => {
      if (registration.waiting) {
        needRefresh = true
        notifyListeners()
        resolve('available')
        return
      }

      if (installingWorker.state === 'activated' && !registration.waiting) {
        resolve('current')
      }
    })
  })
}

export function isPwaSupported(): boolean {
  return 'serviceWorker' in navigator
}

export function getNeedsRefresh(): boolean {
  return needRefresh
}

export function subscribePwaUpdates(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function initPwaUpdates() {
  if (initialized || !isPwaSupported()) return

  initialized = true

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (needRefresh) {
      window.location.reload()
    }
  })

  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      needRefresh = true
      notifyListeners()
    },
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      if (!registration) return
      setInterval(() => {
        void registration.update()
      }, UPDATE_CHECK_INTERVAL_MS)
    },
  })
}

export async function applyPwaUpdate() {
  needRefresh = true
  await updateSW?.(true)
}

export async function checkForPwaUpdate(): Promise<PwaUpdateStatus> {
  if (!isPwaSupported()) return 'unsupported'

  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return 'unsupported'

  await registration.update()

  if (registration.waiting) {
    needRefresh = true
    notifyListeners()
    return 'available'
  }

  if (registration.installing) {
    return waitForInstallingWorker(registration)
  }

  if (needRefresh) return 'available'

  return 'current'
}
