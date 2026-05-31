import { AddOutline, AppOutline, SetOutline } from 'antd-mobile-icons'
import { SafeArea, TabBar } from 'antd-mobile'
import type { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { routes } from '@/shared/config/routes'

const tabs = [
  { key: routes.home, icon: <AppOutline />, labelKey: 'nav.library' },
  { key: routes.search, icon: <AddOutline />, labelKey: 'nav.add' },
  { key: routes.settings, icon: <SetOutline />, labelKey: 'nav.settings' },
] as const

export function AppShell({ children }: PropsWithChildren) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const activeKey = location.pathname

  return (
    <div className="app-shell">
      <main className="app-shell__content">{children}</main>
      <footer className="app-shell__tabs">
        <TabBar activeKey={activeKey} onChange={(key) => navigate(key)}>
          {tabs.map((tab) => (
            <TabBar.Item key={tab.key} icon={tab.icon} title={t(tab.labelKey)} />
          ))}
        </TabBar>
        <SafeArea position="bottom" />
      </footer>
    </div>
  )
}
