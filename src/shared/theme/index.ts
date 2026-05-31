export type ThemeMode = 'system' | 'light' | 'dark'

export const DEFAULT_THEME_MODE: ThemeMode = 'system'
export const THEME_STORAGE_KEY = 'watchlog:theme'

const themeModes = new Set<ThemeMode>(['system', 'light', 'dark'])

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && themeModes.has(value as ThemeMode)
}

export function getStoredThemeMode(): ThemeMode {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)

  return isThemeMode(storedTheme) ? storedTheme : DEFAULT_THEME_MODE
}

export function applyThemeMode(themeMode: ThemeMode): void {
  const root = document.documentElement

  if (themeMode === 'system') {
    delete root.dataset.theme
    return
  }

  root.dataset.theme = themeMode
}

export function saveThemeMode(themeMode: ThemeMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  applyThemeMode(themeMode)
}
