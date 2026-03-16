import { bolaoFormats, getBolaoFormatById, getEnabledBolaoFormats } from "@/data/bolaoFormats";
import type { BolaoFormatDefinition, BolaoFormatSlug } from "@/types/bolao";

export function listBolaoFormats(options?: { onlyEnabled?: boolean }) {
    if (options?.onlyEnabled === false) {
        return bolaoFormats;
    }

    return getEnabledBolaoFormats();
}

export function getBolaoFormat(formatId: BolaoFormatSlug | null | undefined) {
    return getBolaoFormatById(formatId);
}

export function isBolaoFormatEnabled(formatId: BolaoFormatSlug | null | undefined) {
    const format = getBolaoFormatById(formatId);
    return Boolean(format?.isEnabled);
}

export function getDefaultMarketIdsForFormat(formatId: BolaoFormatSlug | null | undefined) {
    return getBolaoFormatById(formatId)?.defaultMarketIds ?? [];
}

export function getDefaultTiebreakersForFormat(formatId: BolaoFormatSlug | null | undefined) {
    return getBolaoFormatById(formatId)?.defaultTiebreakers ?? [];
}

export function getRecommendedBolaoFormats() {
    return listBolaoFormats().sort((a, b) => a.defaultMarketIds.length - b.defaultMarketIds.length);
}

export type { BolaoFormatDefinition };
