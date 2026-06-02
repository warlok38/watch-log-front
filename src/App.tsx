import { Suspense, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppRouter } from '@/app/router/AppRouter'
import { PwaUpdateBanner } from '@/features/pwa-update'
import { getRouterBasename } from '@/shared/config/basePath'
import { routes } from '@/shared/config/routes'
import { nativeBridge, setupNativeUi } from '@/shared/native'
import type { NativeUnsubscribe } from '@/shared/native'
import { subscribeToResolvedThemeChange } from '@/shared/theme'
import { AppShell } from '@/shared/ui'

import styles from './App.module.css'

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    let unsubscribeBackButton: NativeUnsubscribe | undefined
    const unsubscribeTheme = subscribeToResolvedThemeChange((themeMode) => {
      void setupNativeUi(themeMode)
    })
    void nativeBridge
      .onBackButton(() => {
        const basename = getRouterBasename()
        const pathname = window.location.pathname
        const relativePath =
          basename && pathname.startsWith(basename)
            ? pathname.slice(basename.length) || routes.home
            : pathname

        if (relativePath === routes.home) return
        navigate(-1)
      })
      .then((cleanup) => {
        unsubscribeBackButton = cleanup
      })

    return () => {
      unsubscribeTheme()
      unsubscribeBackButton?.()
    }
  }, [navigate])

  return (
    <AppShell>
      <PwaUpdateBanner />
      <Suspense fallback={<section className={styles.fallbackPage} />}>
        <AppRouter />
      </Suspense>
    </AppShell>
  )
}

export default App
