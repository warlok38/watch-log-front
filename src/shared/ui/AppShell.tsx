import { AddOutline, AppOutline, SetOutline } from 'antd-mobile-icons'
import { TabBar } from 'antd-mobile'
import type { PropsWithChildren } from 'react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'

import { routes } from '@/shared/config/routes'

import styles from './AppShell.module.css'

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
  const tabsRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const tabsEl = tabsRef.current
    if (!tabsEl) return

    const blockSelection = (event: Event) => event.preventDefault()
    tabsEl.addEventListener('selectstart', blockSelection)
    return () => tabsEl.removeEventListener('selectstart', blockSelection)
  }, [])

  return (
    <div className={styles.shell}>
      <main className={styles.content}>{children}</main>
      <footer
        ref={tabsRef}
        className={styles.tabs}
        onContextMenu={(event) => event.preventDefault()}
      >
        <TabBar activeKey={activeKey} onChange={(key) => navigate(key)}>
          {tabs.map((tab) => (
            <TabBar.Item key={tab.key} icon={tab.icon} title={t(tab.labelKey)} />
          ))}
        </TabBar>
      </footer>
    </div>
  )
}
