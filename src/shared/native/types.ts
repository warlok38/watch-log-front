export type NativePlatform = 'web' | 'ios' | 'android'

export type NetworkStatus = {
  connected: boolean
}

export type BackButtonUnsubscribe = () => void

export type NativeBridge = {
  platform: NativePlatform
  isNative: boolean
  getNetworkStatus: () => Promise<NetworkStatus>
  onBackButton: (callback: () => void) => Promise<BackButtonUnsubscribe>
}
