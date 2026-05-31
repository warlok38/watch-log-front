import { Selector } from 'antd-mobile'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getStoredThemeMode, saveThemeMode, type ThemeMode } from '@/shared/theme'

export function ThemeSwitcher() {
  const { t } = useTranslation()
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredThemeMode())

  const handleChange = (value: string[]) => {
    const nextThemeMode = (value[0] ?? 'system') as ThemeMode

    setThemeMode(nextThemeMode)
    saveThemeMode(nextThemeMode)
  }

  return (
    <Selector
      value={[themeMode]}
      options={[
        { label: t('theme.system'), value: 'system' },
        { label: t('theme.light'), value: 'light' },
        { label: t('theme.dark'), value: 'dark' },
      ]}
      onChange={(value) => handleChange(value as string[])}
    />
  )
}
