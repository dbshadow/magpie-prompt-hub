import { createI18n } from 'vue-i18n'
import enUS from './locales/en-US.json'
import zhTW from './locales/zh-TW.json'

type MessageSchema = typeof enUS

export const i18n = createI18n<[MessageSchema], 'en-US' | 'zh-TW'>({
  legacy: false,
  locale: 'zh-TW', // Default locale
  fallbackLocale: 'en-US',
  messages: {
    'en-US': enUS,
    'zh-TW': zhTW
  }
})
