import { Suspense, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppRouter } from '@/app/router/AppRouter'
import { nativeBridge, setupNativeUi } from '@/shared/native'
import { AppShell } from '@/shared/ui'

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    void setupNativeUi()
    void nativeBridge.onBackButton(() => {
      if (window.location.pathname === '/') return
      navigate(-1)
    })
  }, [navigate])

  return (
    <AppShell>
      <Suspense fallback={<section className="page" />}>
        <AppRouter />
      </Suspense>
    </AppShell>
  )
}

export default App
