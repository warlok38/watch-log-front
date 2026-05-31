export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedThemeMode = Exclude<ThemeMode, 'system'>

export const DEFAULT_THEME_MODE: ThemeMode = 'system'
export const THEME_STORAGE_KEY = 'watchlog:theme'
export const THEME_COLOR_BY_MODE: Record<ResolvedThemeMode, string> = {
  light: '#f5f8fc',
  dark: '#0d1422',
}

const themeModes = new Set<ThemeMode>(['system', 'light', 'dark'])
const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'
const THEME_COLOR_META_SELECTOR = 'meta[name="theme-color"]'
const resolvedThemeSubscribers = new Set<(themeMode: ResolvedThemeMode) => void>()

let isSystemThemeListenerReady = false

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && themeModes.has(value as ThemeMode)
}

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_THEME_MODE

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  return isThemeMode(storedTheme) ? storedTheme : DEFAULT_THEME_MODE
}

export function getResolvedThemeMode(themeMode: ThemeMode = getStoredThemeMode()): ResolvedThemeMode {
  if (themeMode !== 'system') return themeMode

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light'

  return window.matchMedia(THEME_MEDIA_QUERY).matches ? 'dark' : 'light'
}

export function applyThemeMode(themeMode: ThemeMode): ResolvedThemeMode {
  const resolvedThemeMode = getResolvedThemeMode(themeMode)
  const root = document.documentElement

  root.dataset.theme = resolvedThemeMode
  updateThemeColor(resolvedThemeMode)
  setupSystemThemeListener()
  notifyResolvedThemeSubscribers(resolvedThemeMode)

  return resolvedThemeMode
}

export function saveThemeMode(themeMode: ThemeMode): void {
  window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  applyThemeMode(themeMode)
}

export function subscribeToResolvedThemeChange(callback: (themeMode: ResolvedThemeMode) => void): () => void {
  resolvedThemeSubscribers.add(callback)
  callback(getResolvedThemeMode())
  setupSystemThemeListener()

  return () => {
    resolvedThemeSubscribers.delete(callback)
  }
}

function setupSystemThemeListener(): void {
  if (isSystemThemeListenerReady || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

  const mediaQueryList = window.matchMedia(THEME_MEDIA_QUERY)
  const handleChange = () => {
    if (getStoredThemeMode() === 'system') {
      applyThemeMode('system')
    }
  }

  mediaQueryList.addEventListener('change', handleChange)
  isSystemThemeListenerReady = true
}

function updateThemeColor(themeMode: ResolvedThemeMode): void {
  let metaThemeColor = document.querySelector<HTMLMetaElement>(THEME_COLOR_META_SELECTOR)

  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta')
    metaThemeColor.name = 'theme-color'
    document.head.append(metaThemeColor)
  }

  metaThemeColor.content = THEME_COLOR_BY_MODE[themeMode]
}

function notifyResolvedThemeSubscribers(themeMode: ResolvedThemeMode): void {
  resolvedThemeSubscribers.forEach((callback) => callback(themeMode))
}
