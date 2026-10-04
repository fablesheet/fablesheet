import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import de from './locales/de.json'
import en from './locales/en.json'

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

const STORAGE_KEY = 'fablesheet-language'

function initialLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && LANGUAGES.some(l => l.code === stored)) return stored as LanguageCode
  } catch {
    // storage unavailable — fall back to the system language
  }
  return navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en'
}

export function setLanguage(code: LanguageCode) {
  void i18n.changeLanguage(code)
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // ignore — the choice just won't be remembered
  }
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
})

i18n.on('languageChanged', lng => {
  document.documentElement.lang = lng
})
document.documentElement.lang = i18n.language

export default i18n
