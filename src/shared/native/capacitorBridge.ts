import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Network } from '@capacitor/network'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

import type { NativeBridge, NativePlatform } from './types'

function getPlatform(): NativePlatform {
  const platform = Capacitor.getPlatform()

  if (platform === 'ios' || platform === 'android') return platform

  return 'web'
}

export async function setupNativeUi(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  await StatusBar.setStyle({ style: Style.Light })
  await SplashScreen.hide()
}

export const capacitorBridge: NativeBridge = {
  platform: getPlatform(),
  isNative: Capacitor.isNativePlatform(),
  async getNetworkStatus() {
    const status = await Network.getStatus()
    return { connected: status.connected }
  },
  async onNetworkStatusChange(callback) {
    const listener = await Network.addListener('networkStatusChange', (status) => {
      callback({ connected: status.connected })
    })

    return () => {
      void listener.remove()
    }
  },
  async onBackButton(callback) {
    const listener = await App.addListener('backButton', callback)
    return () => {
      void listener.remove()
    }
  },
}
