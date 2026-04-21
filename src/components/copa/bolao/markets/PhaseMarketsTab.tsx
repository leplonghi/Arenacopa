import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { CheckCircle2, Layers3, Loader2, Lock, Save, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { teams } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { saveBolaoMarketResolution } from "@/services/boloes/bolao-market.service";
import { saveBolaoPrediction } from "@/services/boloes/bolao-prediction.service";
import { staggerContainer, staggerItem } from "../../animations";
import { MarketTooltip } from "./MarketTooltip";
import type { BolaoMarket, BolaoPrediction, PredictionValue } from "@/types/bolao";

function formatDeadline(value?: string | null, locale = "pt-BR", fallback = "") {
    if (!value) return fallback;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;

    return date.toLocaleString(locale, {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function phaseLabel(value: string | null | undefined, t: (key: string) => string) {
    if (!value) return t("markets.phase_tournament");

    const normalized = value.toLowerCase();
    if (normalized.includes("group")) return t("markets.phase_group_stage");
    if (normalized.includes("16")) return t("markets.phase_round16");
    if (normalized.includes("quarter")) return t("markets.phase_quarters");
    if (normalized.includes("semi")) return t("markets.phase_semi");
    if (normalized.includes("final")) return t("markets.phase_final");
    return value;
}

function getSelectionLimit(market: BolaoMarket) {
    switch (market.slug) {
        case "quarterfinalists":
            return 8;
        case "semifinalists":
            return 4;
        case "finalists":
            return 2;
        case "qualified_teams":
            return 16;
        default:
            return 1;
    }
}

function normalizeSelectionValue(value?: PredictionValue) {
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
    if (value && typeof value === "object" && "teams" in value && Array.isArray(value.teams)) {
        return value.teams.filter((item): item is string => typeof item === "string");
    }

    return [];
}

function normalizePrediction(prediction?: BolaoPrediction) {
    return normalizeSelectionValue(prediction?.prediction_value);
}

function buildPredictionValue(market: BolaoMarket, selectedTeams: string[]) {
    if (market.prediction_type === "multi_choice") {
        return selectedTeams;
    }

    return selectedTeams[0] ?? "";
}

const teamsByGroup = Object.entries(
    teams.reduce<Record<string, typeof teams>>((accumulator, team) => {
        accumulator[team.group] = accumulator[team.group] || [];
        accumulator[team.group].push(team);
        return accumulator;
    }, {})
).sort(([groupA], [groupB]) => groupA.localeCompare(groupB));

export function PhaseMarketsTab({
    bolaoId,
    userId,
    markets,
    predictions,
}: {
    bolaoId: string;
    userId: string;
    markets: BolaoMarket[];
    predictions: BolaoPrediction[];
    canManage?: boolean;
}) {
    const { t, i18n } = useTranslation("bolao");
    const { toast } = useToast();
    const [drafts, setDrafts] = useState<Record<string, string[]>>({});
    const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string[]>>({});
    const [savingMarketId, setSavingMarketId] = useState<string | null>(null);
    const [resolvingMarketId, setResolvingMarketId] = useState<string | null>(null);

    const predictionByMarketId = useMemo(() => {
        return predictions.reduce<Record<string, BolaoPrediction>>((accumulator, prediction) => {
            accumulator[prediction.market_id] = prediction;
            return accumulator;
        }, {});
    }, [predictions]);

    const getCurrentSelection = (market: BolaoMarket) => drafts[market.id] ?? normalizePrediction(predictionByMarketId[market.id]);
    const getCurrentResolution = (market: BolaoMarket) => resolutionDrafts[market.id] ?? normalizeSelectionValue(market.resolution_value);

    const toggleSelection = (
        market: BolaoMarket,
        teamCode: string,
        getSelection: (market: BolaoMarket) => string[],
        setSelection: Dispatch<SetStateAction<Record<string, string[]>>>
    ) => {
        const limit = getSelectionLimit(market);
        const currentSelection = getSelection(market);
        const exists = currentSelection.includes(teamCode);

        if (limit === 1) {
            setSelection((current) => ({ ...current, [market.id]: exists ? [] : [teamCode] }));
            return;
        }

        const nextSelection = exists
            ? currentSelection.filter((value) => value !== teamCode)
            : currentSelection.length >= limit
                ? currentSelection
                : [...currentSelection, teamCode];

        setSelection((current) => ({ ...current, [market.id]: nextSelection }));
    };

    const toggleTeam = (market: BolaoMarket, teamCode: string) => {
        toggleSelection(market, teamCode, getCurrentSelection, setDrafts);
    };

    const toggleResolutionTeam = (market: BolaoMarket, teamCode: string) => {
        toggleSelection(market, teamCode, getCurrentResolution, setResolutionDrafts);
    };

    const saveMarket = async (market: BolaoMarket) => {
        const selectedTeams = getCurrentSelection(market);
        if (!selectedTeams.length) return;

        try {
            setSavingMarketId(market.id);
            await saveBolaoPrediction({
                bolaoId,
                marketId: market.id,
                userId,
                predictionValue: buildPredictionValue(market, selectedTeams),
            });

            setDrafts((current) => {
                const next = { ...current };
                delete next[market.id];
                return next;
            });

            toast({
                title: t("markets.phase_saved_title"),
                description: t("markets.market_saved_desc", { title: market.title }),
                className: "bg-emerald-500 border-emerald-600 text-white font-black",
            });
        } catch (error) {
            console.error("Erro ao salvar mercado de fase:", error);
            toast({
                title: t("markets.save_market_error"),
                variant: "destructive",
            });
        } finally {
            setSavingMarketId(null);
        }
    };

    const resolveMarket = async (market: BolaoMarket) => {
        const selectedTeams = getCurrentResolution(market);
        if (!selectedTeams.length) return;

        try {
            setResolvingMarketId(market.id);
            await saveBolaoMarketResolution({
                marketId: market.id,
                resolvedBy: userId,
                resolutionValue: buildPredictionValue(market, selectedTeams),
            });

            setResolutionDrafts((current) => {
                const next = { ...current };
                delete next[market.id];
                return next;
            });

            toast({
                title: t("markets.official_saved_title"),
                description: t("markets.official_saved_desc", { title: market.title }),
                className: "bg-emerald-500 border-emerald-600 text-white font-black",
            });
        } catch (error) {
            console.error("Erro ao resolver mercado de fase:", error);
            toast({
                title: t("markets.resolve_market_error"),
                variant: "destructive",
            });
        } finally {
            setResolvingMarketId(null);
        }
    };

    if (markets.length === 0) {
        return (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{t("markets.no_phase_title")}</p>
                <p className="mt-3 text-sm text-zinc-400">
                    {t("markets.no_phase_desc")}
                </p>
            </div>
        );
    }

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
            <motion.div variants={staggerItem} className="surface-card-soft rounded-[28px] p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                        <Layers3 className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">{t("markets.phase_title")}</h3>
                        <p className="text-sm text-zinc-400">
                            {t("markets.phase_desc")}
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="grid gap-4">
                {markets.map((market) => {
                    const selectedTeams = getCurrentSelection(market);
                    const savedTeams = normalizePrediction(predictionByMarketId[market.id]);
                    const prediction = predictionByMarketId[market.id];
                    const resolvedTeams = normalizeSelectionValue(market.resolution_value);
                    const adminSelection = getCurrentResolution(market);
                    const selectionLimit = getSelectionLimit(market);
                    const isDirty = JSON.stringify(selectedTeams) !== JSON.stringify(savedTeams);
                    const isResolutionDirty = JSON.stringify(adminSelection) !== JSON.stringify(resolvedTeams);

                    return (
                        <motion.div
                            key={market.id}
                            variants={staggerItem}
                            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="max-w-3xl">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-lg font-black text-white">{market.title}</h4>
                                        <MarketTooltip title={market.title} description={market.help_text || market.description} />
                                    </div>
                                    <p className="mt-2 text-sm text-zinc-400">{market.description}</p>
                                </div>

                                <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                                    {phaseLabel(market.phase_id, t)}
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-3">
                                <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{t("markets.score_label")}</p>
                                    <p className="mt-2 text-lg font-black text-white">{market.points_exact} pts</p>
                                    <p className="text-xs text-zinc-400">
                                        {market.points_partial > 0 ? t("markets.partial_points", { count: market.points_partial }) : t("markets.no_partial_points")}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{t("markets.deadline_label")}</p>
                                    <p className="mt-2 text-sm font-black text-white">{formatDeadline(market.closes_at, i18n.language, t("markets.deadline_none"))}</p>
                                    <p className="text-xs text-zinc-400">{t("markets.market_closes_desc")}</p>
                                </div>
                                <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{t("markets.status_label")}</p>
                                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300">
                                        {market.status === "open" ? <Trophy className="h-3.5 w-3.5 text-primary" /> : <Lock className="h-3.5 w-3.5 text-zinc-500" />}
                                        {market.status === "open" ? t("markets.open_for_predictions") : market.status === "closed" ? t("markets.closed") : t("markets.resolved_status")}
                                    </div>
                                    <p className="mt-2 text-xs text-zinc-400">
                                        {selectionLimit === 1 ? t("markets.select_one_team") : t("markets.select_up_to", { count: selectionLimit })}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 rounded-[24px] border border-white/5 bg-black/10 p-4">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{t("markets.your_selection")}</p>
                                        <p className="mt-1 text-sm text-zinc-400">
                                            {selectionLimit === 1 ? t("markets.select_single_desc") : t("markets.select_multi_desc", { count: selectionLimit })}
                                        </p>
                                    </div>
                                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300">
                                        {selectedTeams.length}/{selectionLimit === 1 ? 1 : selectionLimit}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {teamsByGroup.map(([groupCode, groupedTeams]) => (
                                        <div key={groupCode}>
                                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{t("markets.group_label", { group: groupCode })}</p>
                                            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                                {groupedTeams.map((team) => {
                                                    const isSelected = selectedTeams.includes(team.code);
                                                    const isDisabled = !isSelected && selectionLimit > 1 && selectedTeams.length >= selectionLimit;
                                                    return (
                                                        <button
                                                            key={team.code}
                                                            type="button"
                                                            onClick={() => toggleTeam(market, team.code)}
                                                            disabled={isDisabled || market.status !== "open"}
                                                            className={cn(
                                                                "flex items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
                                                                isSelected
                                                                    ? "border-primary bg-primary/10 text-white"
                                                                    : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                                                            )}
                                                        >
                                                            <Flag code={team.code} size="sm" />
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-black">{team.name}</p>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{team.code}</p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <p className="text-xs text-zinc-400">
                                            {savedTeams.length > 0
                                            ? t("markets.saved_now", { teams: savedTeams.join(", ") })
                                            : t("markets.nothing_saved_yet")}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => void saveMarket(market)}
                                        disabled={!selectedTeams.length || !isDirty || market.status !== "open" || savingMarketId === market.id}
                                        className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                                    >
                                        {savingMarketId === market.id ? <Loader2 className="h-4 w-4 animate-spin" /> : market.status === "resolved" ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                                        {savingMarketId === market.id ? t("markets.saving") : t("markets.save_market")}
                                    </button>
                                </div>
                            </div>

                            {market.status === "resolved" && (
                                <div className="mt-5 rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">{t("markets.resolved")}</p>
                                    <p className="mt-2 text-sm text-zinc-300">
                                        {t("markets.official_result")}: <span className="font-black text-white">{resolvedTeams.join(", ") || t("markets.no_official_result")}</span>
                                    </p>
                                    <p className="mt-2 text-sm text-zinc-300">
                                        {t("markets.your_points")}: <span className="font-black text-white">{prediction?.points_awarded ?? 0} pts</span>
                                    </p>
                                </div>
                            )}

                            {canManage && (
                                <div className="mt-5 rounded-[24px] border border-amber-500/20 bg-amber-500/5 p-4">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">{t("markets.official_result")}</p>
                                            <p className="mt-1 text-sm text-zinc-400">
                                                {t("markets.manage_result_desc")}
                                            </p>
                                        </div>
                                        <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">
                                            {market.status === "resolved" ? t("markets.resolved_status") : t("markets.resolved_pending")}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {teamsByGroup.map(([groupCode, groupedTeams]) => (
                                            <div key={`${market.id}_${groupCode}_resolution`}>
                                                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{t("markets.group_label", { group: groupCode })}</p>
                                                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                                    {groupedTeams.map((team) => {
                                                        const isSelected = adminSelection.includes(team.code);
                                                        const isDisabled = !isSelected && selectionLimit > 1 && adminSelection.length >= selectionLimit;
                                                        return (
                                                            <button
                                                                key={`${market.id}_${team.code}_resolution`}
                                                                type="button"
                                                                onClick={() => toggleResolutionTeam(market, team.code)}
                                                                disabled={isDisabled}
                                                                className={cn(
                                                                    "flex items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
                                                                    isSelected
                                                                        ? "border-amber-400 bg-amber-500/10 text-white"
                                                                        : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                                                                )}
                                                            >
                                                                <Flag code={team.code} size="sm" />
                                                                <div className="min-w-0">
                                                                    <p className="truncate text-sm font-black">{team.name}</p>
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{team.code}</p>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <p className="text-xs text-zinc-400">
                                            {resolvedTeams.length > 0
                                                ? t("markets.current_result_with_value", { value: resolvedTeams.join(", ") })
                                                : t("markets.no_official_result")}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => void resolveMarket(market)}
                                            disabled={!adminSelection.length || !isResolutionDirty || resolvingMarketId === market.id}
                                            className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400 px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                                        >
                                            {resolvingMarketId === market.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                                            {resolvingMarketId === market.id ? t("markets.resolving") : market.status === "resolved" ? t("markets.update_official_result") : t("markets.confirm_official_result")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
