
import { useTranslation } from 'react-i18next';
import { normalizeLanguage } from './language';

export function useLocalePath() {
    const { i18n } = useTranslation();

    const localePath = (path: string) => {
        // Remove leading slash to avoid //
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        const lang = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

        // If path is empty (home), just return /lang
        if (!cleanPath) return `/${lang}`;

        return `/${lang}/${cleanPath}`;
    };

    return { localePath };
}
