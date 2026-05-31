export type NativePlatform = 'web' | 'ios' | 'android'

export type NetworkStatus = {
  connected: boolean
}

export type NativeUnsubscribe = () => void
export type BackButtonUnsubscribe = NativeUnsubscribe

export type NativeBridge = {
  platform: NativePlatform
  isNative: boolean
  getNetworkStatus: () => Promise<NetworkStatus>
  onNetworkStatusChange: (callback: (status: NetworkStatus) => void) => Promise<NativeUnsubscribe>
  onBackButton: (callback: () => void) => Promise<BackButtonUnsubscribe>
}
