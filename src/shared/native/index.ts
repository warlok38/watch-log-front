import { capacitorBridge, setupNativeUi } from './capacitorBridge'
import type { NativeBridge } from './types'
import { webBridge } from './webBridge'

export const nativeBridge: NativeBridge = capacitorBridge.isNative ? capacitorBridge : webBridge

export { setupNativeUi }
export type { BackButtonUnsubscribe, NativeBridge, NativePlatform, NativeUnsubscribe, NetworkStatus } from './types'
