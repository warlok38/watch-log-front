import { Card } from 'antd-mobile'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/features/language-switcher'
import { nativeBridge } from '@/shared/native'
import { PageHeader } from '@/shared/ui'

export function SettingsPage() {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const syncNetworkStatus = () => {
      void nativeBridge.getNetworkStatus().then((status) => setIsOnline(status.connected))
    }

    syncNetworkStatus()
    window.addEventListener('online', syncNetworkStatus)
    window.addEventListener('offline', syncNetworkStatus)

    return () => {
      window.removeEventListener('online', syncNetworkStatus)
      window.removeEventListener('offline', syncNetworkStatus)
    }
  }, [])

  return (
    <section className="page">
      <PageHeader title={t('settings.title')} />
      <Card title={t('settings.language')}>
        <LanguageSwitcher />
      </Card>
      <Card title={nativeBridge.platform.toUpperCase()}>
        <p>{isOnline ? t('app.online') : t('app.offline')}</p>
        <p>{t('settings.storage')}</p>
      </Card>
    </section>
  )
}
