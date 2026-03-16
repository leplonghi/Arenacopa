import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { bolaoMarketTemplates, getBolaoMarketTemplateById, getEnabledBolaoMarketTemplates } from "@/data/bolaoMarketTemplates";
import { db } from "@/integrations/firebase/client";
import { getDefaultMarketIdsForFormat } from "@/services/boloes/bolao-format.service";
import type {
    BolaoFormatSlug,
    BolaoMarket,
    BolaoMarketStatus,
    BolaoMarketTemplate,
    MarketScope,
    MarketTemplateSlug,
    PredictionValue,
} from "@/types/bolao";

type BuildBolaoMarketsInput = {
    bolaoId: string;
    formatId: BolaoFormatSlug;
    selectedMarketIds?: MarketTemplateSlug[];
    closesAt?: string | null;
    status?: BolaoMarketStatus;
    matches?: Array<{
        id: string;
        match_date: string;
        stage?: string | null;
        group_id?: string | null;
        home_team_code?: string | null;
        away_team_code?: string | null;
    }>;
};

function toMarketDocId(bolaoId: string, templateId: MarketTemplateSlug, orderIndex: number) {
    return `${bolaoId}_${templateId}_${orderIndex}`;
}

function toMatchMarketDocId(bolaoId: string, templateId: MarketTemplateSlug, matchId: string) {
    return `${bolaoId}_${templateId}_${matchId}`;
}

const phaseTitles: Partial<Record<MarketTemplateSlug, string>> = {
    qualified_teams: "Classificados da fase",
    quarterfinalists: "Quartas de final",
    semifinalists: "Semifinalistas",
    finalists: "Finalistas",
};

export function listBolaoMarketTemplates(options?: { onlyEnabled?: boolean; scope?: MarketScope }) {
    const base = options?.onlyEnabled === false ? bolaoMarketTemplates : getEnabledBolaoMarketTemplates();
    if (!options?.scope) {
        return base;
    }

    return base.filter((template) => template.scope === options.scope);
}

export function getBolaoMarketTemplate(templateId: MarketTemplateSlug | null | undefined) {
    return getBolaoMarketTemplateById(templateId);
}

export function getTemplatesForFormat(formatId: BolaoFormatSlug) {
    const marketIds = getDefaultMarketIdsForFormat(formatId);
    return marketIds
        .map((marketId) => getBolaoMarketTemplateById(marketId))
        .filter((template): template is BolaoMarketTemplate => Boolean(template));
}

export function buildBolaoMarkets(input: BuildBolaoMarketsInput) {
    const selectedMarketIds = input.selectedMarketIds?.length
        ? input.selectedMarketIds
        : getDefaultMarketIdsForFormat(input.formatId);
    const resolvedTemplates = selectedMarketIds
        .map((templateId) => getBolaoMarketTemplateById(templateId))
        .filter((template): template is BolaoMarketTemplate => Boolean(template));

    const builtMarkets: BolaoMarket[] = [];
    let orderIndex = 0;

    resolvedTemplates.forEach((template) => {
        if (template.scope === "match" && input.matches?.length) {
            input.matches.forEach((match) => {
                builtMarkets.push({
                    id: toMatchMarketDocId(input.bolaoId, template.id, match.id),
                    bolao_id: input.bolaoId,
                    template_id: template.id,
                    slug: template.id,
                    scope: template.scope,
                    title: `${template.title} · ${match.home_team_code ?? "CASA"} x ${match.away_team_code ?? "FORA"}`,
                    description: template.description,
                    help_text: template.helpText,
                    match_id: match.id,
                    phase_id: match.stage ?? null,
                    group_id: match.group_id ?? null,
                    is_required: Boolean(template.isRequiredByDefault),
                    opens_at: null,
                    closes_at: match.match_date ?? input.closesAt ?? null,
                    status: input.status ?? "open",
                    points_exact: template.defaultPointsExact,
                    points_partial: template.defaultPointsPartial,
                    multiplier: template.defaultMultiplier,
                    supports_power_play: template.supportsPowerPlay,
                    supports_confidence: template.supportsConfidence,
                    order_index: orderIndex++,
                    prediction_type: template.predictionType,
                });
            });
            return;
        }

        builtMarkets.push({
            id: toMarketDocId(input.bolaoId, template.id, orderIndex),
            bolao_id: input.bolaoId,
            template_id: template.id,
            slug: template.id,
            scope: template.scope,
            title: phaseTitles[template.id] ?? template.title,
            description: template.description,
            help_text: template.helpText,
            match_id: null,
            phase_id: null,
            group_id: null,
            is_required: Boolean(template.isRequiredByDefault),
            opens_at: null,
            closes_at: input.closesAt ?? null,
            status: input.status ?? "open",
            points_exact: template.defaultPointsExact,
            points_partial: template.defaultPointsPartial,
            multiplier: template.defaultMultiplier,
            supports_power_play: template.supportsPowerPlay,
            supports_confidence: template.supportsConfidence,
            order_index: orderIndex++,
            prediction_type: template.predictionType,
        });
    });

    return builtMarkets;
}

export function groupMarketsByScope(markets: BolaoMarket[]) {
    return markets.reduce<Record<MarketScope, BolaoMarket[]>>(
        (accumulator, market) => {
            accumulator[market.scope].push(market);
            return accumulator;
        },
        {
            match: [],
            phase: [],
            tournament: [],
            special: [],
        }
    );
}

type SaveBolaoMarketResolutionInput = {
    marketId: string;
    resolvedBy: string;
    resolutionValue: PredictionValue;
    resolutionMeta?: Record<string, unknown> | null;
    status?: BolaoMarketStatus;
};

export async function saveBolaoMarketResolution(input: SaveBolaoMarketResolutionInput) {
    const marketRef = doc(db, "bolao_markets", input.marketId);

    await setDoc(
        marketRef,
        {
            resolution_value: input.resolutionValue,
            resolution_meta: input.resolutionMeta ?? null,
            resolved_by: input.resolvedBy,
            resolved_at: serverTimestamp(),
            status: input.status ?? "resolved",
        },
        { merge: true }
    );

    const snapshot = await getDoc(marketRef);
    return {
        id: snapshot.id,
        ...snapshot.data(),
    } as BolaoMarket;
}
