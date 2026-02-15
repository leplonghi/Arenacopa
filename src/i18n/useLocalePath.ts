
import { useTranslation } from 'react-i18next';

export function useLocalePath() {
    const { i18n } = useTranslation();

    const localePath = (path: string) => {
        // Remove leading slash to avoid //
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        const lang = i18n.language || 'pt-BR';

        // If path is empty (home), just return /lang
        if (!cleanPath) return `/${lang}`;

        return `/${lang}/${cleanPath}`;
    };

    return { localePath };
}
