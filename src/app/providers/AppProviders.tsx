import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, setDefaultConfig } from 'antd-mobile'
import enUS from 'antd-mobile/es/locales/en-US'
import ruRU from 'antd-mobile/es/locales/ru-RU'
import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'

import { getRouterBasename } from '@/shared/config/basePath'
import '@/shared/i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export function AppProviders({ children }: PropsWithChildren) {
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage === 'en' ? enUS : ruRU

  useEffect(() => {
    setDefaultConfig({ locale })
  }, [locale])

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={locale}>
        <BrowserRouter basename={getRouterBasename()}>{children}</BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  )
}
