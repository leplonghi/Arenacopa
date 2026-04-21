import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppLanguage } from './language';
import { applyDocumentLanguage, getSystemLanguage, normalizeLanguage } from './language';

export type Language = AppLanguage;

export function useLanguage() {
    const { i18n } = useTranslation();
    const [systemLanguage, setSystemLanguage] = useState<Language>(() => getSystemLanguage());

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const syncLanguageWithSystem = async () => {
            const nextSystemLanguage = getSystemLanguage();
            setSystemLanguage((current) => current === nextSystemLanguage ? current : nextSystemLanguage);

            const currentLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
            if (currentLanguage === nextSystemLanguage) {
                return;
            }

            try {
                await i18n.changeLanguage(nextSystemLanguage);
            } catch (error) {
                console.error('Error syncing language with system settings:', error);
            }
        };

        void syncLanguageWithSystem();

        const handleLanguageChange = () => {
            void syncLanguageWithSystem();
        };

        window.addEventListener('languagechange', handleLanguageChange);
        return () => window.removeEventListener('languagechange', handleLanguageChange);
    }, [i18n]);

    const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language || systemLanguage);

    useEffect(() => {
        applyDocumentLanguage(language);
    }, [language]);

    return {
        language,
        systemLanguage,
        isSystemLanguage: language === systemLanguage,
        isLoading: false
    };
}
