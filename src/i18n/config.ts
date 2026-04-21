import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import {
    applyDocumentLanguage,
    DEFAULT_LANGUAGE,
    getSystemLanguage,
    normalizeLanguage,
    SUPPORTED_LANGUAGES,
} from './language';

const I18N_VERSION = '20260419-2';

i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
        lng: getSystemLanguage(),
        fallbackLng: DEFAULT_LANGUAGE,
        supportedLngs: [...SUPPORTED_LANGUAGES],
        load: 'currentOnly',
        debug: import.meta.env.DEV, // Enable debug only in development

        interpolation: {
            escapeValue: false, // React already safes from xss
        },

        backend: {
            loadPath: `/locales/{{lng}}/{{ns}}.json?v=${I18N_VERSION}`,
        },

        // Namespaces configuration
        ns: ['common', 'auth', 'copa', 'bolao', 'guia', 'ranking', 'profile', 'errors', 'sedes', 'home', 'premium', 'championships'],
        defaultNS: 'common',

        react: {
            useSuspense: true, // Enable suspense for loading translations
        }
    });

i18n.on('languageChanged', (language) => {
    applyDocumentLanguage(normalizeLanguage(language));
});

const initialLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language || getSystemLanguage());
applyDocumentLanguage(initialLanguage);
void i18n.changeLanguage(initialLanguage);

export default i18n;
