/**
 * i18n/config.ts
 * --------------------------------------------------------------
 * react-i18next 부트스트랩.
 *  - 디바이스 언어 자동 감지 (browser-languagedetector)
 *  - 한국어/영어 fallback
 *  - 키 누락 시 dev 콘솔 경고
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './en.json';
import ko from './ko.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ko'],
    interpolation: { escapeValue: false }, // React 가 이미 escape
    detection: {
      order: ['navigator'],
      caches: [],
    },
  });

export default i18n;
