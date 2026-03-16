import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

const normalizeLanguage = (language?: string | null) => {
    const normalized = language?.toLowerCase().trim() || '';

    if (normalized.startsWith('pt')) return 'pt-BR';
    if (normalized.startsWith('es')) return 'es';
    if (normalized.startsWith('en')) return 'en';

    return 'en';
};

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        supportedLngs: ['pt-BR', 'en', 'es'],
        load: 'currentOnly',
        debug: import.meta.env.DEV, // Enable debug only in development

        interpolation: {
            escapeValue: false, // React already safes from xss
        },

        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },

        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'], // Cache user language preference
            convertDetectedLanguage: (lng: string) => normalizeLanguage(lng),
        },

        // Namespaces configuration
        ns: ['common', 'auth', 'copa', 'bolao', 'guia', 'ranking', 'profile', 'errors', 'sedes', 'home'],
        defaultNS: 'common',

        react: {
            useSuspense: true, // Enable suspense for loading translations
        }
    });

void i18n.changeLanguage(normalizeLanguage(i18n.resolvedLanguage || i18n.language));

export default i18n;
