import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProviders } from '@/app/providers/AppProviders'
import { applyDocumentLanguage } from '@/shared/i18n'
import { initPwaUpdates } from '@/shared/pwa'
import { applyThemeMode, getStoredThemeMode } from '@/shared/theme'

applyDocumentLanguage()
applyThemeMode(getStoredThemeMode())
initPwaUpdates()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
