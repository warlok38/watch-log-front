import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { resources } from './resources'

export const DEFAULT_LANGUAGE = 'ru'
export const LANGUAGE_STORAGE_KEY = 'watchlog:language'

const appLanguages = new Set<string>(['ru', 'en'])

export function isAppLanguage(value: unknown): value is 'ru' | 'en' {
  return typeof value === 'string' && appLanguages.has(value)
}

export function getStoredLanguage(): 'ru' | 'en' {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)

  return isAppLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE
}

export function applyDocumentLanguage(language: string = getStoredLanguage()): void {
  if (typeof document === 'undefined') return

  document.documentElement.lang = isAppLanguage(language) ? language : DEFAULT_LANGUAGE
}

void i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
})

export { i18n }
