import { Button, Card, Toast } from 'antd-mobile'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { usePwaUpdate } from '@/features/pwa-update'
import { LanguageSwitcher } from '@/features/language-switcher'
import { ThemeSwitcher } from '@/features/theme-switcher'
import { nativeBridge } from '@/shared/native'
import type { NativeUnsubscribe } from '@/shared/native'
import { PageHeader } from '@/shared/ui'

import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const { supported: isPwaUpdateSupported, applyUpdate, checkForUpdate } = usePwaUpdate()

  useEffect(() => {
    let unsubscribe: NativeUnsubscribe | undefined

    void nativeBridge.getNetworkStatus().then((status) => setIsOnline(status.connected))
    void nativeBridge
      .onNetworkStatusChange((status) => setIsOnline(status.connected))
      .then((cleanup) => {
        unsubscribe = cleanup
      })

    return () => {
      unsubscribe?.()
    }
  }, [])

  const handleCheckUpdate = async () => {
    if (import.meta.env.DEV) {
      Toast.show({ content: t('settings.updateUnavailableDev') })
      return
    }

    setIsCheckingUpdate(true)
    Toast.show({ content: t('settings.updateChecking'), duration: 0, icon: 'loading' })

    try {
      const status = await checkForUpdate()

      if (status === 'available') {
        Toast.clear()
        await applyUpdate()
        return
      }

      Toast.show({
        content: status === 'current' ? t('settings.upToDate') : t('settings.updateAvailable'),
      })
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  return (
    <section className={styles.page}>
      <PageHeader title={t('settings.title')} />
      <Card title={t('settings.language')}>
        <LanguageSwitcher />
      </Card>
      <Card title={t('settings.theme')}>
        <ThemeSwitcher />
      </Card>
      {isPwaUpdateSupported ? (
        <Card title={t('settings.app')}>
          <Button
            block
            color="primary"
            disabled={!isOnline || isCheckingUpdate}
            loading={isCheckingUpdate}
            onClick={() => void handleCheckUpdate()}
          >
            {t('settings.checkUpdate')}
          </Button>
        </Card>
      ) : null}
      <Card title={nativeBridge.platform.toUpperCase()}>
        <p>{isOnline ? t('app.online') : t('app.offline')}</p>
        <p>{t('settings.storage')}</p>
      </Card>
    </section>
  )
}
