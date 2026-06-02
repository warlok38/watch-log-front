import { useCallback, useEffect, useState } from 'react'

import {
  applyPwaUpdate,
  checkForPwaUpdate,
  getNeedsRefresh,
  isPwaSupported,
  subscribePwaUpdates,
} from '@/shared/pwa'
import type { PwaUpdateStatus } from '@/shared/pwa'

export function usePwaUpdate() {
  const [needsRefresh, setNeedsRefresh] = useState(() => getNeedsRefresh())
  const supported = isPwaSupported()

  useEffect(() => {
    return subscribePwaUpdates(() => setNeedsRefresh(getNeedsRefresh()))
  }, [])

  const applyUpdate = useCallback(async () => {
    await applyPwaUpdate()
  }, [])

  const checkForUpdate = useCallback(async (): Promise<PwaUpdateStatus> => {
    const status = await checkForPwaUpdate()
    setNeedsRefresh(getNeedsRefresh())
    return status
  }, [])

  return {
    supported,
    needsRefresh,
    applyUpdate,
    checkForUpdate,
  }
}
