import { Card } from 'antd-mobile'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/features/language-switcher'
import { ThemeSwitcher } from '@/features/theme-switcher'
import { nativeBridge } from '@/shared/native'
import type { NativeUnsubscribe } from '@/shared/native'
import { PageHeader } from '@/shared/ui'

export function SettingsPage() {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

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

  return (
    <section className="page">
      <PageHeader title={t('settings.title')} />
      <Card title={t('settings.language')}>
        <LanguageSwitcher />
      </Card>
      <Card title={t('settings.theme')}>
        <ThemeSwitcher />
      </Card>
      <Card title={nativeBridge.platform.toUpperCase()}>
        <p>{isOnline ? t('app.online') : t('app.offline')}</p>
        <p>{t('settings.storage')}</p>
      </Card>
    </section>
  )
}
