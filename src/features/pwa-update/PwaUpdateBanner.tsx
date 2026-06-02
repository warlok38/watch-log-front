import { Dialog } from 'antd-mobile'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { usePwaUpdate } from './usePwaUpdate'

export function PwaUpdateBanner() {
  const { t } = useTranslation()
  const { supported, needsRefresh, applyUpdate } = usePwaUpdate()
  const dialogVisibleRef = useRef(false)

  useEffect(() => {
    if (!supported || !needsRefresh || dialogVisibleRef.current) return

    dialogVisibleRef.current = true

    void Dialog.confirm({
      content: t('settings.updateAvailable'),
      confirmText: t('settings.updateNow'),
      cancelText: t('settings.updateLater'),
      onConfirm: async () => {
        dialogVisibleRef.current = false
        await applyUpdate()
      },
      onCancel: () => {
        dialogVisibleRef.current = false
      },
    })
  }, [supported, needsRefresh, applyUpdate, t])

  return null
}
