import { Selector } from 'antd-mobile'
import { useTranslation } from 'react-i18next'

const LANGUAGE_OPTIONS = [
  { label: 'Русский', value: 'ru' },
  { label: 'English', value: 'en' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const handleChange = async (value: string[]) => {
    const nextLanguage = value[0] ?? 'ru'
    localStorage.setItem('watchlog:language', nextLanguage)
    await i18n.changeLanguage(nextLanguage)
  }

  return (
    <Selector
      value={[i18n.language]}
      options={LANGUAGE_OPTIONS}
      onChange={(value) => void handleChange(value as string[])}
    />
  )
}
