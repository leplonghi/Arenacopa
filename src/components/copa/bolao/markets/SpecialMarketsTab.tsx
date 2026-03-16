import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Save, Sparkles, Target } from "lucide-react";
import { motion } from "framer-motion";
import { teams } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { saveBolaoMarketResolution } from "@/services/boloes/bolao-market.service";
import { saveBolaoPrediction } from "@/services/boloes/bolao-prediction.service";
import { staggerContainer, staggerItem } from "../../animations";
import { BracketPickCard } from "./BracketPickCard";
import { MarketTooltip } from "./MarketTooltip";
import type { BolaoMarket, BolaoPrediction } from "@/types/bolao";

function getSpecialStatusLabel(market: BolaoMarket, prediction?: BolaoPrediction) {
    if (market.status === "resolved") return "Pontuado";
    if (market.status === "closed") return "Encerrado";
    if (prediction) return "Salvo";
    return "Aberto";
}

function getPredictionLabel(prediction?: BolaoPrediction) {
    if (!prediction) return "";
    const value = prediction.prediction_value;
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.join(", ");
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const maybeFinalists = Array.isArray(value.finalists)
            ? value.finalists.filter((item): item is string => typeof item === "string")
            : [];
        const maybeChampion = typeof value.champion === "string" ? value.champion : "";
        if (maybeFinalists.length > 0 || maybeChampion) {
            const finalistsLabel = maybeFinalists.length > 0 ? maybeFinalists.join(" x ") : "Final indefinida";
            return `${finalistsLabel}${maybeChampion ? ` | Campeão: ${maybeChampion}` : ""}`;
        }
    }
    return "";
}

export function SpecialMarketsTab({
    bolaoId,
    userId,
    markets,
    predictions,
    phaseMarkets = [],
    canManage = false,
}: {
    bolaoId: string;
    userId: string;
    markets: BolaoMarket[];
    predictions: BolaoPrediction[];
    phaseMarkets?: BolaoMarket[];
    canManage?: boolean;
}) {
    const { toast } = useToast();
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [resolutionDrafts, setResolutionDrafts] = useState<Record<string, string>>({});
    const [savingMarketId, setSavingMarketId] = useState<string | null>(null);
    const [resolvingMarketId, setResolvingMarketId] = useState<string | null>(null);

    const semifinalistsMarket = useMemo(
        () => phaseMarkets.find((market) => market.slug === "semifinalists") ?? null,
        [phaseMarkets]
    );

    const predictionByMarketId = useMemo(() => {
        return predictions.reduce<Record<string, BolaoPrediction>>((accumulator, prediction) => {
            accumulator[prediction.market_id] = prediction;
            return accumulator;
        }, {});
    }, [predictions]);

    const saveMarket = async (market: BolaoMarket, value: string) => {
        if (!value.trim()) return;

        try {
            setSavingMarketId(market.id);
            const predictionValue =
                market.slug === "confidence_pick" ? Number(value) :
                market.slug === "power_play" ? value === "enabled" :
                value;

            await saveBolaoPrediction({
                bolaoId,
                marketId: market.id,
                userId,
                predictionValue,
            });

            setDrafts((current) => {
                const next = { ...current };
                delete next[market.id];
                return next;
            });

            toast({
                title: "Mercado especial salvo.",
                description: `${market.title} atualizado com sucesso.`,
                className: "bg-emerald-500 border-emerald-600 text-white font-black",
            });
        } catch (error) {
            console.error("Erro ao salvar mercado especial:", error);
            toast({
                title: "Não consegui salvar esse mercado agora.",
                variant: "destructive",
            });
        } finally {
            setSavingMarketId(null);
        }
    };

    const saveResolution = async (market: BolaoMarket, value: string) => {
        if (!value.trim()) return;

        try {
            setResolvingMarketId(market.id);
            const resolutionValue =
                market.slug === "confidence_pick" ? Number(value) :
                market.slug === "power_play" ? value === "enabled" :
                value;

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
                title: "Resultado oficial salvo.",
                description: `${market.title} foi resolvido para o ranking da liga.`,
                className: "bg-emerald-500 border-emerald-600 text-white font-black",
            });
        } catch (error) {
            console.error("Erro ao resolver mercado especial:", error);
            toast({
                title: "Não consegui salvar o resultado oficial agora.",
                variant: "destructive",
            });
        } finally {
            setResolvingMarketId(null);
        }
    };

    if (markets.length === 0) {
        return (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Sem mercados especiais</p>
                <p className="mt-3 text-sm text-zinc-400">
                    Power play, confidence, survivor e outros formatos especiais aparecem aqui quando forem ativados.
                </p>
            </div>
        );
    }

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
            <motion.div variants={staggerItem} className="surface-card-soft rounded-[28px] p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white">Mercados especiais</h3>
                        <p className="text-sm text-zinc-400">
                            Estes formatos deixam a liga mais estratégica, com decisões que vão além do placar tradicional.
                        </p>
                    </div>
                </div>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-2">
                {markets.map((market) => {
                    const prediction = predictionByMarketId[market.id];
                    const semifinalistsPrediction = semifinalistsMarket ? predictionByMarketId[semifinalistsMarket.id] : undefined;
                    const savedValue = getPredictionLabel(prediction);
                    const draftValue = drafts[market.id] ?? savedValue;
                    const resolvedValue =
                        typeof market.resolution_value === "boolean"
                            ? (market.resolution_value ? "enabled" : "disabled")
                            : getPredictionLabel({ prediction_value: market.resolution_value } as BolaoPrediction);
                    const resolutionDraftValue = resolutionDrafts[market.id] ?? resolvedValue;
                    const isBracket = market.slug === "bracket_pick";

                    return (
                        <motion.div
                            key={market.id}
                            variants={staggerItem}
                            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-lg font-black text-white">{market.title}</h4>
                                        <MarketTooltip title={market.title} description={market.help_text || market.description} />
                                    </div>
                                    <p className="mt-2 text-sm text-zinc-400">{market.description}</p>
                                </div>
                                <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                                    {getSpecialStatusLabel(market, prediction)}
                                </div>
                            </div>

                            {isBracket ? (
                                <div className="mt-5">
                                    <BracketPickCard
                                        semifinalists={
                                            semifinalistsPrediction &&
                                            Array.isArray(semifinalistsPrediction.prediction_value)
                                                ? semifinalistsPrediction.prediction_value.filter((item): item is string => typeof item === "string")
                                                : []
                                        }
                                        savedValue={prediction?.prediction_value}
                                        resolvedValue={market.resolution_value}
                                        canManage={canManage}
                                        saving={savingMarketId === market.id}
                                        resolving={resolvingMarketId === market.id}
                                        onSave={async (predictionValue) => {
                                            try {
                                                setSavingMarketId(market.id);
                                                await saveBolaoPrediction({
                                                    bolaoId,
                                                    marketId: market.id,
                                                    userId,
                                                    predictionValue,
                                                });
                                                toast({
                                                    title: "Bracket salvo.",
                                                    description: `${market.title} atualizado com sucesso.`,
                                                    className: "bg-emerald-500 border-emerald-600 text-white font-black",
                                                });
                                            } catch (error) {
                                                console.error("Erro ao salvar bracket:", error);
                                                toast({
                                                    title: "Não consegui salvar esse bracket agora.",
                                                    variant: "destructive",
                                                });
                                            } finally {
                                                setSavingMarketId(null);
                                            }
                                        }}
                                        onResolve={async (resolutionValue) => {
                                            try {
                                                setResolvingMarketId(market.id);
                                                await saveBolaoMarketResolution({
                                                    marketId: market.id,
                                                    resolvedBy: userId,
                                                    resolutionValue,
                                                });
                                                toast({
                                                    title: "Bracket oficial salvo.",
                                                    description: `${market.title} foi resolvido para o ranking da liga.`,
                                                    className: "bg-emerald-500 border-emerald-600 text-white font-black",
                                                });
                                            } catch (error) {
                                                console.error("Erro ao resolver bracket:", error);
                                                toast({
                                                    title: "Não consegui salvar o bracket oficial agora.",
                                                    variant: "destructive",
                                                });
                                            } finally {
                                                setResolvingMarketId(null);
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="mt-5 space-y-4">
                                    {market.slug === "survivor_pick" && (
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {teams.map((team) => {
                                                const isSelected = draftValue === team.code;
                                                return (
                                                    <button
                                                        key={team.code}
                                                        type="button"
                                                        onClick={() => setDrafts((current) => ({ ...current, [market.id]: team.code }))}
                                                        disabled={market.status !== "open"}
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
                                    )}

                                    {market.slug === "confidence_pick" && (
                                        <div className="rounded-[22px] border border-white/5 bg-black/10 p-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                                Peso de confiança
                                            </label>
                                            <div className="mt-3 flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min={1}
                                                    max={10}
                                                    step={1}
                                                    value={draftValue || "5"}
                                                    onChange={(event) => setDrafts((current) => ({ ...current, [market.id]: event.target.value }))}
                                                    className="flex-1"
                                                    disabled={market.status !== "open"}
                                                />
                                                <div className="min-w-[56px] rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-center text-lg font-black text-primary">
                                                    {draftValue || "5"}
                                                </div>
                                            </div>
                                            <p className="mt-3 text-xs text-zinc-400">
                                                Quanto maior o peso, maior o impacto desse palpite no ranking quando a regra da liga considerar confidence.
                                            </p>
                                        </div>
                                    )}

                                    {market.slug === "power_play" && (
                                        <div className="grid gap-2">
                                            {[
                                                { value: "enabled", label: "Ativar para a próxima rodada" },
                                                { value: "disabled", label: "Guardar para depois" },
                                            ].map((option) => {
                                                const isSelected = draftValue === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => setDrafts((current) => ({ ...current, [market.id]: option.value }))}
                                                        disabled={market.status !== "open"}
                                                        className={cn(
                                                            "rounded-[20px] border px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] transition-all disabled:cursor-not-allowed disabled:opacity-50",
                                                            isSelected
                                                                ? "border-primary bg-primary/10 text-white"
                                                                : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                                                        )}
                                                    >
                                                        {option.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {savedValue && (
                                        <div className="rounded-2xl border border-white/5 bg-black/10 p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Salvo no momento</p>
                                            <p className="mt-2 text-sm font-black text-white">{savedValue}</p>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => void saveMarket(market, draftValue || (market.slug === "confidence_pick" ? "5" : ""))}
                                        disabled={!draftValue || draftValue === savedValue || market.status !== "open" || savingMarketId === market.id}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                                    >
                                        {savingMarketId === market.id ? <Loader2 className="h-4 w-4 animate-spin" /> : savedValue ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                                        {savingMarketId === market.id ? "Salvando..." : "Salvar mercado"}
                                    </button>
                                </div>
                            )}

                            {market.status === "resolved" && !isBracket && (
                                <div className="mt-5 rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Mercado resolvido</p>
                                    <p className="mt-2 text-sm text-zinc-300">
                                        Resultado oficial: <span className="font-black text-white">{resolvedValue || "Sem resultado oficial"}</span>
                                    </p>
                                    <p className="mt-2 text-sm text-zinc-300">
                                        Sua pontuação: <span className="font-black text-white">{prediction?.points_awarded ?? 0} pts</span>
                                    </p>
                                </div>
                            )}

                            {canManage && !isBracket && (
                                <div className="mt-5 rounded-[24px] border border-amber-500/20 bg-amber-500/5 p-4">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">Resultado oficial</p>
                                            <p className="mt-1 text-sm text-zinc-400">
                                                Use este bloco para definir o resultado válido desse mercado especial.
                                            </p>
                                        </div>
                                        <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">
                                            {market.status === "resolved" ? "Resolvido" : "Pendente"}
                                        </div>
                                    </div>

                                    {market.slug === "survivor_pick" && (
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {teams.map((team) => {
                                                const isSelected = resolutionDraftValue === team.code;
                                                return (
                                                    <button
                                                        key={`${market.id}_${team.code}_resolution`}
                                                        type="button"
                                                        onClick={() => setResolutionDrafts((current) => ({ ...current, [market.id]: team.code }))}
                                                        className={cn(
                                                            "flex items-center gap-3 rounded-[20px] border px-4 py-3 text-left transition-all",
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
                                    )}

                                    {market.slug === "confidence_pick" && (
                                        <div className="rounded-[22px] border border-white/5 bg-black/10 p-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                                Faixa oficial
                                            </label>
                                            <div className="mt-3 flex items-center gap-3">
                                                <input
                                                    type="range"
                                                    min={1}
                                                    max={10}
                                                    step={1}
                                                    value={resolutionDraftValue || "5"}
                                                    onChange={(event) => setResolutionDrafts((current) => ({ ...current, [market.id]: event.target.value }))}
                                                    className="flex-1"
                                                />
                                                <div className="min-w-[56px] rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-center text-lg font-black text-amber-200">
                                                    {resolutionDraftValue || "5"}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {market.slug === "power_play" && (
                                        <div className="grid gap-2">
                                            {[
                                                { value: "enabled", label: "Ativado oficialmente" },
                                                { value: "disabled", label: "Não ativado" },
                                            ].map((option) => {
                                                const isSelected = resolutionDraftValue === option.value;
                                                return (
                                                    <button
                                                        key={`${market.id}_${option.value}_resolution`}
                                                        type="button"
                                                        onClick={() => setResolutionDrafts((current) => ({ ...current, [market.id]: option.value }))}
                                                        className={cn(
                                                            "rounded-[20px] border px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] transition-all",
                                                            isSelected
                                                                ? "border-amber-400 bg-amber-500/10 text-white"
                                                                : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                                                        )}
                                                    >
                                                        {option.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {resolvedValue && (
                                        <p className="mt-3 text-xs text-zinc-400">
                                            Resultado atual: <span className="font-black text-white">{resolvedValue}</span>
                                        </p>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => void saveResolution(market, resolutionDraftValue || (market.slug === "confidence_pick" ? "5" : ""))}
                                        disabled={!resolutionDraftValue || resolvingMarketId === market.id}
                                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400 px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                                    >
                                        {resolvingMarketId === market.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                                        {resolvingMarketId === market.id ? "Resolvendo..." : market.status === "resolved" ? "Atualizar resultado oficial" : "Confirmar resultado oficial"}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
