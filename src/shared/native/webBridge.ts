import type { NativeBridge } from './types'

export const webBridge: NativeBridge = {
  platform: 'web',
  isNative: false,
  async getNetworkStatus() {
    return { connected: navigator.onLine }
  },
  async onNetworkStatusChange(callback) {
    const syncNetworkStatus = () => {
      callback({ connected: navigator.onLine })
    }

    window.addEventListener('online', syncNetworkStatus)
    window.addEventListener('offline', syncNetworkStatus)

    return () => {
      window.removeEventListener('online', syncNetworkStatus)
      window.removeEventListener('offline', syncNetworkStatus)
    }
  },
  async onBackButton() {
    return () => undefined
  },
}
