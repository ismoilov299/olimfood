import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import uz  from './locales/uz.json'
import uzl from './locales/uzl.json'
import ru  from './locales/ru.json'

// Read ?lang= from URL (e.g. from Telegram bot link)
const urlLang = new URLSearchParams(window.location.search).get('lang')
if (urlLang && ['uz', 'uzl', 'ru'].includes(urlLang)) {
  localStorage.setItem('olimfood_lang', urlLang)
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz:  { translation: uz },
      uzl: { translation: uzl },
      ru:  { translation: ru },
    },
    fallbackLng: 'uz',
    supportedLngs: ['uz', 'uzl', 'ru'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'olimfood_lang',
    },
    interpolation: { escapeValue: false },
  })

export default i18n
