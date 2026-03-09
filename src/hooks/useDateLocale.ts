import { useTranslation } from "react-i18next";
import { ptBR, enUS, es } from "date-fns/locale";

export function useDateLocale() {
    const { i18n } = useTranslation();

    switch (i18n.language) {
        case 'en':
            return enUS;
        case 'es':
            return es;
        case 'pt-BR':
        default:
            return ptBR;
    }
}
