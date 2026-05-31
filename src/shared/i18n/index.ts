import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { resources } from './resources'

export const DEFAULT_LANGUAGE = 'ru'

void i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('watchlog:language') ?? DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: {
    escapeValue: false,
  },
})

export { i18n }
