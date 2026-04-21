import { useTranslation } from "react-i18next";
import { ptBR, enUS, es } from "date-fns/locale";
import { normalizeLanguage } from "@/i18n/language";

export function useDateLocale() {
    const { i18n } = useTranslation();
    const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

    switch (language) {
        case 'en':
            return enUS;
        case 'es':
            return es;
        case 'pt-BR':
        default:
            return ptBR;
    }
}
