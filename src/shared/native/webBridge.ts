import type { NativeBridge } from './types'

export const webBridge: NativeBridge = {
  platform: 'web',
  isNative: false,
  async getNetworkStatus() {
    return { connected: navigator.onLine }
  },
  async onBackButton() {
    return () => undefined
  },
}
