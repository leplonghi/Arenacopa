import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'pt-BR',
        supportedLngs: ['pt-BR', 'en', 'es'],
        debug: import.meta.env.DEV, // Enable debug only in development

        interpolation: {
            escapeValue: false, // React already safes from xss
        },

        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },

        detection: {
            order: ['path', 'localStorage', 'navigator'],
            lookupFromPathIndex: 0,
            caches: ['localStorage'], // Cache user language preference
        },

        // Namespaces configuration
        ns: ['common', 'auth', 'copa', 'bolao', 'guia', 'ranking', 'profile', 'errors'],
        defaultNS: 'common',

        react: {
            useSuspense: true, // Enable suspense for loading translations
        }
    });

export default i18n;
