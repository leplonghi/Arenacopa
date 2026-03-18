import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { CheckCircle2, Loader2, Save, Sparkles, Star, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { db } from "@/integrations/firebase/client";
import { useToast } from "@/hooks/use-toast";
import { teams } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { saveBolaoMarketResolution } from "@/services/boloes/bolao-market.service";
import { saveBolaoPrediction } from "@/services/boloes/bolao-prediction.service";
import { staggerContainer, staggerItem } from "../animations";
import { MarketTooltip } from "./markets/MarketTooltip";
import type { BolaoMarket, BolaoPrediction, ExtraBet, PredictionValue } from "@/types/bolao";

interface ExtrasTabProps {
    bolaoId: string;
    userId: string;
    markets: BolaoMarket[];
    predictions: BolaoPrediction[];
    canManage?: boolean;
}

const editableTournamentMarkets = new Set([
    "champion",
    "runner_up",
    "surprise_team",
    "best_attack",
    "best_defense",
    "top_scorer",
    "tournament_total_goals",
]);

function getPredictionDisplayValue(value: PredictionValue) {
    if (typeof value === "string" || typeof value === "number") return value;
    if (Array.isArray(value)) return value.join(", ");
    if (value && typeof value === "object") {
        if ("winner" in value && value.winner) return value.winner;
        if ("teams" in value && Array.isArray(value.teams)) return value.teams.join(", ");
    }
    return "";
}

function getTeamVisual(teamValue: string) {
    const normalized = teamValue.trim().toUpperCase();
    const byCode = teams.find((team) => team.code === normalized);
    if (byCode) return byCode;

    return teams.find((team) => team.name.toUpperCase() === normalized) ?? null;
}

export function ExtrasTab({ bolaoId, userId, markets, predictions, canManage = false }: ExtrasTabProps) {
    const { t } = useTranslation("bolao");
    const { toast } = useToast();
    const [legacyExtras, setLegacyExtras] = useState<ExtraBet[]>([]);
    const [loadingLegacy, setLoadingLegacy] = useState(true);
    const [savingMarketId, setSavingMarketId] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});
    const [resolvingMarketId, setResolvingMarketId] = useState<string | null>(null);

    useEffect(() => {
        const loadLegacyExtras = async () => {
            try {
                const extrasRef = collection(db, "bolao_extra_bets");
                const extrasQuery = query(extrasRef, where("bolao_id", "==", bolaoId), where("user_id", "==", userId));
                const snapshot = await getDocs(extrasQuery);
                const rows = snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() })) as ExtraBet[];
                setLegacyExtras(rows);
            } catch (error) {
                console.error("Erro ao carregar extras legados:", error);
            } finally {
                setLoadingLegacy(false);
            }
        };

        loadLegacyExtras();
    }, [bolaoId, userId]);

    const extraMarkets = useMemo(
        () => markets.filter((market) => market.scope === "tournament"),
        [markets]
    );

    const predictionByMarketId = useMemo(() => {
        return predictions.reduce<Record<string, BolaoPrediction>>((accumulator, prediction) => {
            accumulator[prediction.market_id] = prediction;
            return accumulator;
        }, {});
    }, [predictions]);

    const getSavedValueForMarket = (market: BolaoMarket) => {
        const newPrediction = predictionByMarketId[market.id];
        if (newPrediction) {
            return getPredictionDisplayValue(newPrediction.prediction_value);
        }

        if (market.slug === "champion" || market.slug === "top_scorer") {
            return legacyExtras.find((extra) => extra.category === market.slug)?.value ?? "";
        }

        return "";
    };

    const updateDraft = (marketId: string, value: string) => {
        setDrafts((current) => ({ ...current, [marketId]: value }));
    };

    const updateResolutionDraft = (marketId: string, value: string) => {
        setResolutionDrafts((current) => ({ ...current, [marketId]: value }));
    };

    const saveLegacyMirrorIfNeeded = async (market: BolaoMarket, value: string) => {
        if (market.slug !== "champion" && market.slug !== "top_scorer") {
            return;
        }

        const legacyId = `${userId}_${bolaoId}_${market.slug}`;
        await setDoc(
            doc(db, "bolao_extra_bets", legacyId),
            {
                id: legacyId,
                bolao_id: bolaoId,
                user_id: userId,
                category: market.slug,
                value,
                updated_at: serverTimestamp(),
            },
            { merge: true }
        );
    };

    const saveMarket = async (market: BolaoMarket, rawValue: string) => {
        const value = rawValue.trim();
        if (!value) return;

        try {
            setSavingMarketId(market.id);
            await saveBolaoPrediction({
                bolaoId,
                marketId: market.id,
                userId,
                predictionValue: value,
            });
            await saveLegacyMirrorIfNeeded(market, value);
            setDrafts((current) => {
                const next = { ...current };
                delete next[market.id];
                return next;
            });
            toast({
                title: t("markets.special_saved_title"),
                description: t("markets.market_saved_desc", { title: market.title }),
                className: "bg-emerald-500 border-emerald-600 text-white font-black",
            });
        } catch (error) {
            console.error("Erro ao salvar mercado extra:", error);
            toast({
                title: t("markets.save_market_error"),
                variant: "destructive",
            });
        } finally {
            setSavingMarketId(null);
        }
    };

    const saveResolution = async (market: BolaoMarket, rawValue: string) => {
        const value = rawValue.trim();
        if (!value) return;

        try {
            setResolvingMarketId(market.id);
            const resolutionValue = market.prediction_type === "number" ? Number(value) : value;
            await saveBolaoMarketResolution({
                marketId: market.id,
                resolvedBy: userId,
                resolutionValue,
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
            console.error("Erro ao salvar resolução do mercado:", error);
            toast({
                title: t("markets.save_official_error"),
                variant: "destructive",
            });
        } finally {
            setResolvingMarketId(null);
        }
    };

    if (loadingLegacy && markets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t("markets.loading_extras")}</span>
            </div>
        );
    }

    if (extraMarkets.length === 0 && legacyExtras.length === 0) {
        return (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{t("markets.no_extras_title")}</p>
                <p className="mt-3 text-sm text-zinc-400">
                    {t("markets.no_extras_desc")}
                </p>
            </div>
        );
    }

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={staggerItem} className="surface-card-soft rounded-[28px] p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">{t("markets.extras_title")}</h3>
                        <p className="text-sm text-zinc-400">
                            {t("markets.extras_desc")}
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="grid gap-4">
                {extraMarkets.map((market) => {
                    const prediction = predictionByMarketId[market.id];
                    const savedValue = String(getSavedValueForMarket(market) ?? "");
                    const draftValue = drafts[market.id] ?? savedValue;
                    const resolvedValue = String(getPredictionDisplayValue(market.resolution_value ?? null) ?? "");
                    const resolutionDraftValue = resolutionDrafts[market.id] ?? resolvedValue;
                    const isEditable = editableTournamentMarkets.has(market.slug);
                    const isTeamSelector =
                        market.prediction_type === "team" &&
                        ["champion", "runner_up", "surprise_team", "best_attack", "best_defense"].includes(market.slug);

                    return (
                        <motion.div
                            key={market.id}
                            variants={staggerItem}
                            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-lg font-black text-white">{market.title}</h4>
                                        <MarketTooltip title={market.title} description={market.help_text || market.description} />
                                        <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                                            {t("markets.championship_badge")}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-zinc-400">{market.description}</p>
                                    <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                                        até {market.points_exact} pts
                                    </p>
                                </div>

                                {savedValue && (
                                    <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400">
                                        {t("markets.saved_badge")}
                                    </div>
                                )}
                            </div>

                            {isEditable ? (
                                <div className="mt-5 space-y-4">
                                    {isTeamSelector ? (
                                        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                                            {teams.map((team) => {
                                                const isSelected = draftValue.toUpperCase() === team.code || draftValue.toUpperCase() === team.name.toUpperCase();
                                                return (
                                                    <button
                                                        key={team.code}
                                                        type="button"
                                                        onClick={() => updateDraft(market.id, team.code)}
                                                        className={cn(
                                                            "rounded-[22px] border p-3 transition-all",
                                                            isSelected ? "border-primary bg-primary/10" : "bg-white/5 border-white/5"
                                                        )}
                                                    >
                                                        <div className="mb-2 flex justify-center text-2xl">{team.flag}</div>
                                                        <div className="text-center text-xs font-black">{team.code}</div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3 md:flex-row">
                                            <input
                                                value={draftValue}
                                                onChange={(event) => updateDraft(market.id, event.target.value)}
                                                placeholder={market.slug === "top_scorer" ? "Ex: Harry Kane" : ""}
                                                className="surface-input flex-1 rounded-2xl px-4 py-4 text-sm font-bold"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => void saveMarket(market, draftValue)}
                                                disabled={!draftValue.trim() || savingMarketId === market.id}
                                                className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                                            >
                                                {savingMarketId === market.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Save className="h-4 w-4" />
                                                )}
                                                {savingMarketId === market.id ? t("markets.saving") : t("markets.save_market")}
                                            </button>
                                        </div>
                                    )}

                                    {isTeamSelector && (
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => void saveMarket(market, draftValue)}
                                                disabled={!draftValue.trim() || savingMarketId === market.id}
                                                className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                                            >
                                                {savingMarketId === market.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                )}
                                                {savingMarketId === market.id ? t("markets.saving") : t("markets.confirm")}
                                            </button>
                                        </div>
                                    )}

                                    {savedValue && (
                                        <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{t("markets.current_result")}</p>
                                            <div className="mt-3 flex items-center gap-3">
                                                {isTeamSelector && getTeamVisual(savedValue) ? (
                                                    <>
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                                                            {getTeamVisual(savedValue)?.flag}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-white">{getTeamVisual(savedValue)?.name}</p>
                                                            <p className="text-xs text-zinc-400">{getTeamVisual(savedValue)?.code}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="font-black text-white">{savedValue}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-5 rounded-2xl border border-white/5 bg-black/10 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <Trophy className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white">{t("markets.active_market_title")}</p>
                                            <p className="text-xs text-zinc-400">
                                                {t("markets.active_market_desc")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {market.status === "resolved" && (
                                <div className="mt-5 rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">{t("markets.resolved")}</p>
                                    <p className="mt-2 text-sm text-zinc-300">
                                        {t("markets.official_result")}: <span className="font-black text-white">{resolvedValue || t("markets.no_official_result")}</span>
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
                                                {t("markets.official_result_desc")}
                                            </p>
                                        </div>
                                        <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">
                                            {market.status === "resolved" ? t("markets.resolved") : t("markets.waiting_result")}
                                        </div>
                                    </div>

                                    {isTeamSelector ? (
                                        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                                            {teams.map((team) => {
                                                const isSelected = resolutionDraftValue.toUpperCase() === team.code || resolutionDraftValue.toUpperCase() === team.name.toUpperCase();
                                                return (
                                                    <button
                                                        key={`${market.id}_${team.code}_resolution`}
                                                        type="button"
                                                        onClick={() => updateResolutionDraft(market.id, team.code)}
                                                        className={cn(
                                                            "rounded-[22px] border p-3 transition-all",
                                                            isSelected ? "border-amber-400 bg-amber-500/10" : "bg-white/5 border-white/5"
                                                        )}
                                                    >
                                                        <div className="mb-2 flex justify-center text-2xl">{team.flag}</div>
                                                        <div className="text-center text-xs font-black">{team.code}</div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3 md:flex-row">
                                            <input
                                                value={resolutionDraftValue}
                                                onChange={(event) => updateResolutionDraft(market.id, event.target.value)}
                                                placeholder=""
                                                className="surface-input flex-1 rounded-2xl px-4 py-4 text-sm font-bold"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => void saveResolution(market, resolutionDraftValue)}
                                                disabled={!resolutionDraftValue.trim() || resolvingMarketId === market.id}
                                                className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400 px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                                            >
                                                {resolvingMarketId === market.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                                                {resolvingMarketId === market.id ? t("markets.resolving") : market.status === "resolved" ? t("markets.update_official_result") : t("markets.confirm_official_result")}
                                            </button>
                                        </div>
                                    )}

                                    {isTeamSelector && (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => void saveResolution(market, resolutionDraftValue)}
                                                disabled={!resolutionDraftValue.trim() || resolvingMarketId === market.id}
                                                className="inline-flex min-w-[190px] items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400 px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                                            >
                                                {resolvingMarketId === market.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                                                {resolvingMarketId === market.id ? t("markets.resolving") : market.status === "resolved" ? t("markets.update_official_result") : t("markets.confirm_official_result")}
                                            </button>
                                        </div>
                                    )}

                                    {resolvedValue && (
                                        <p className="mt-3 text-xs text-zinc-400">
                                            {t("markets.current_result")}: <span className="font-black text-white">{resolvedValue}</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {legacyExtras.length > 0 && (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary" />
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{t("markets.legacy_title")}</p>
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">
                        {t("markets.legacy_desc")}
                    </p>
                </div>
            )}
        </motion.div>
    );
}
