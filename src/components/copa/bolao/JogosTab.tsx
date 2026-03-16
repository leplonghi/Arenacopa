import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "@/integrations/firebase/client";
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    onSnapshot, 
    doc, 
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Flag } from "@/components/Flag";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { CircleHelp, Lock, Share2, Download, Copy, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShareCardGenerator } from "./ShareCardGenerator";
import { toPng } from "html-to-image";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { saveBolaoPrediction } from "@/services/boloes/bolao-prediction.service";
import type { BolaoMarket, BolaoPrediction } from "@/types/bolao";

type JogosTabMatch = {
    id: string;
    match_date: string;
    stage: string;
    status: "scheduled" | "live" | "finished";
    home_team_code: string;
    away_team_code: string;
};

type ShareData = {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
};

type EditablePalpite = {
    id?: string;
    home: string;
    away: string;
    points: number;
    is_exact: boolean;
};

type PalpiteRealtimeRow = {
    id: string;
    bolao_id: string;
    match_id: string;
    home_score: number;
    away_score: number;
    points: number;
    is_exact: boolean;
};

const derivableMarketSlugs = new Set([
    "exact_score",
    "match_winner",
    "home_goals",
    "away_goals",
    "total_goals",
    "both_score",
]);

function getMarketShortLabel(slug: BolaoMarket["slug"], fallbackTitle: string) {
    switch (slug) {
        case "exact_score":
            return "Placar";
        case "match_winner":
            return "Vencedor";
        case "home_goals":
            return "Gols casa";
        case "away_goals":
            return "Gols fora";
        case "total_goals":
            return "Total de gols";
        case "both_score":
            return "Ambos marcam";
        case "first_team_to_score":
            return "Primeiro gol";
        default:
            return fallbackTitle;
    }
}

function derivePredictionValue(slug: string, homeScore: number, awayScore: number, homeTeam: string, awayTeam: string) {
    switch (slug) {
        case "exact_score":
            return { home: homeScore, away: awayScore };
        case "match_winner":
            if (homeScore === awayScore) return "draw";
            return homeScore > awayScore ? homeTeam : awayTeam;
        case "home_goals":
            return homeScore;
        case "away_goals":
            return awayScore;
        case "total_goals":
            return homeScore + awayScore;
        case "both_score":
            return homeScore > 0 && awayScore > 0 ? "yes" : "no";
        default:
            return null;
    }
}

export function JogosTab({
    bolaoId,
    highlightedMatchId,
    markets = [],
    predictions = [],
}: {
    bolaoId: string;
    highlightedMatchId?: string;
    rules?: unknown;
    markets?: BolaoMarket[];
    predictions?: BolaoPrediction[];
}) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [matches, setMatches] = useState<JogosTabMatch[]>([]);
    const [savedPalpites, setSavedPalpites] = useState<Record<string, EditablePalpite>>({});
    const [draftPalpites, setDraftPalpites] = useState<Record<string, Partial<EditablePalpite>>>({});
    const [draftFirstScorers, setDraftFirstScorers] = useState<Record<string, string>>({});
    const [savingMatchId, setSavingMatchId] = useState<string | null>(null);

    // Share States
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState<ShareData | null>(null);
    const shareRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const matchMarkets = useMemo(
        () => markets.filter((market) => market.scope === "match" && market.match_id),
        [markets]
    );
    const exactScoreMarketByMatchId = useMemo(
        () =>
            matchMarkets.reduce<Record<string, BolaoMarket>>((accumulator, market) => {
                if (market.slug === "exact_score" && market.match_id) {
                    accumulator[market.match_id] = market;
                }
                return accumulator;
            }, {}),
        [matchMarkets]
    );
    const firstScorerMarketByMatchId = useMemo(
        () =>
            matchMarkets.reduce<Record<string, BolaoMarket>>((accumulator, market) => {
                if (market.slug === "first_team_to_score" && market.match_id) {
                    accumulator[market.match_id] = market;
                }
                return accumulator;
            }, {}),
        [matchMarkets]
    );
    const predictionsByMarketId = useMemo(
        () =>
            predictions.reduce<Record<string, BolaoPrediction>>((accumulator, prediction) => {
                accumulator[prediction.market_id] = prediction;
                return accumulator;
            }, {}),
        [predictions]
    );

    useEffect(() => {
        if (!highlightedMatchId) return;

        const scrollTarget = window.setTimeout(() => {
            document.getElementById(`match-card-${highlightedMatchId}`)?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }, 250);

        return () => window.clearTimeout(scrollTarget);
    }, [highlightedMatchId]);

    useEffect(() => {
        if (!user) return;

        // Load Matches
        const loadMatches = async () => {
            const matchesRef = collection(db, "matches");
            const q = query(matchesRef, orderBy("match_date", "asc"));
            const snapshot = await getDocs(q);
            const mData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JogosTabMatch));
            setMatches(mData);
        };
        loadMatches();

        // Listen for user's predictions in this bolao
        const palpitesRef = collection(db, "bolao_palpites");
        const qPalpites = query(
            palpitesRef, 
            where("bolao_id", "==", bolaoId),
            where("user_id", "==", user.id)
        );

        const unsubscribe = onSnapshot(qPalpites, (snapshot) => {
            const m = snapshot.docs.reduce<Record<string, EditablePalpite>>((acc, doc) => {
                const p = doc.data() as PalpiteRealtimeRow;
                return {
                    ...acc,
                    [p.match_id]: {
                        id: doc.id,
                        home: p.home_score.toString(),
                        away: p.away_score.toString(),
                        points: p.points || 0,
                        is_exact: p.is_exact || false
                    }
                };
            }, {});
            
            // Check for exact match celebration
            snapshot.docChanges().forEach((change) => {
                if (change.type === "modified") {
                    const np = change.doc.data() as PalpiteRealtimeRow;
                    if (np.is_exact) {
                        toast({ title: "Na mosca!", description: "Você cravou o placar exato!", className: "bg-primary text-black font-black" });
                        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
                    }
                }
            });

            setSavedPalpites(m);
        });

        return () => unsubscribe();
    }, [bolaoId, toast, user]);

    const getCurrentPalpite = useMemo(() => {
        return (matchId: string): EditablePalpite => {
            const saved = savedPalpites[matchId];
            const draft = draftPalpites[matchId];
            const exactScorePrediction = exactScoreMarketByMatchId[matchId]
                ? predictionsByMarketId[exactScoreMarketByMatchId[matchId].id]
                : null;
            const predictionValue = exactScorePrediction?.prediction_value;
            const newModelHome =
                predictionValue &&
                typeof predictionValue === "object" &&
                !Array.isArray(predictionValue) &&
                "home" in predictionValue &&
                typeof predictionValue.home === "number"
                    ? String(predictionValue.home)
                    : "";
            const newModelAway =
                predictionValue &&
                typeof predictionValue === "object" &&
                !Array.isArray(predictionValue) &&
                "away" in predictionValue &&
                typeof predictionValue.away === "number"
                    ? String(predictionValue.away)
                    : "";

            return {
                id: exactScorePrediction?.id ?? saved?.id,
                home: draft?.home ?? newModelHome ?? saved?.home ?? "",
                away: draft?.away ?? newModelAway ?? saved?.away ?? "",
                points: saved?.points ?? 0,
                is_exact: saved?.is_exact ?? false,
            };
        };
    }, [draftPalpites, exactScoreMarketByMatchId, predictionsByMarketId, savedPalpites]);

    const handleSave = async (matchId: string, homeTeam: string, awayTeam: string) => {
        if (!user) return;
        const palpite = getCurrentPalpite(matchId);
        const hasScoreInput = palpite.home !== "" && palpite.away !== "";
        const currentFirstScorer = draftFirstScorers[matchId] ?? getSavedFirstScorer(matchId);

        if (!palpite || (!hasScoreInput && !currentFirstScorer)) return;

        const hs = hasScoreInput ? parseInt(palpite.home) : Number.NaN;
        const as = hasScoreInput ? parseInt(palpite.away) : Number.NaN;
        if (hasScoreInput && (isNaN(hs) || isNaN(as))) return;

        try {
            setSavingMatchId(matchId);
            const tasks: Promise<unknown>[] = [];

            if (hasScoreInput) {
                const docId = `${user.id}_${matchId}_${bolaoId}`;
                tasks.push(
                    setDoc(doc(db, "bolao_palpites", docId), {
                        bolao_id: bolaoId,
                        user_id: user.id,
                        match_id: matchId,
                        home_score: hs,
                        away_score: as,
                        updated_at: serverTimestamp()
                    }, { merge: true })
                );

                const derivedMarkets = matchMarkets.filter(
                    (market) => market.match_id === matchId && derivableMarketSlugs.has(market.slug)
                );

                tasks.push(
                    ...derivedMarkets.map((market) =>
                        saveBolaoPrediction({
                            bolaoId,
                            marketId: market.id,
                            userId: user.id,
                            predictionValue: derivePredictionValue(market.slug, hs, as, homeTeam, awayTeam),
                        })
                    )
                );
            }

            const firstScorerMarket = firstScorerMarketByMatchId[matchId];
            const firstScorerValue =
                currentFirstScorer ||
                (hasScoreInput && hs === 0 && as === 0 ? "none" : "");

            if (firstScorerMarket && firstScorerValue) {
                tasks.push(
                    saveBolaoPrediction({
                        bolaoId,
                        marketId: firstScorerMarket.id,
                        userId: user.id,
                        predictionValue: firstScorerValue,
                    })
                );
            }

            await Promise.all(tasks);

            setDraftPalpites((currentDrafts) => {
                const nextDrafts = { ...currentDrafts };
                delete nextDrafts[matchId];
                return nextDrafts;
            });
            setDraftFirstScorers((currentDrafts) => {
                const nextDrafts = { ...currentDrafts };
                delete nextDrafts[matchId];
                return nextDrafts;
            });

            toast({
                title: "Palpite salvo.",
                description: hasScoreInput
                    ? `${homeTeam} ${hs} x ${as} ${awayTeam}`
                    : `Mercado de ${homeTeam} x ${awayTeam} atualizado.`,
            });
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao salvar palpite", variant: "destructive" });
        } finally {
            setSavingMatchId(null);
        }
    };

    const updateScore = (matchId: string, type: 'home' | 'away', val: string) => {
        if (isNaN(Number(val)) && val !== '') return;
        setDraftPalpites((currentDrafts) => ({
            ...currentDrafts,
            [matchId]: {
                ...currentDrafts[matchId],
                [type]: val,
            },
        }));
    };

    const getSavedFirstScorer = (matchId: string) => {
        const market = firstScorerMarketByMatchId[matchId];
        if (!market) return "";

        const prediction = predictionsByMarketId[market.id];
        return typeof prediction?.prediction_value === "string" ? prediction.prediction_value : "";
    };

    const updateFirstScorer = (matchId: string, value: string) => {
        setDraftFirstScorers((currentDrafts) => ({
            ...currentDrafts,
            [matchId]: value,
        }));
    };

    const openShareModal = (matchId: string, homeTeam: string, awayTeam: string) => {
        const palpite = getCurrentPalpite(matchId);
        if (palpite.home === "" || palpite.away === "") {
            toast({
                title: "Salve seu palpite primeiro.",
                description: "Depois você pode compartilhar a arte do resultado.",
            });
            return;
        }

        setShareData({
            homeTeam,
            awayTeam,
            homeScore: palpite.home,
            awayScore: palpite.away,
        });
        setShareModalOpen(true);
    };

    const generateImageBlob = async (): Promise<Blob | null> => {
        if (!shareRef.current) {
            toast({
                title: "Arte ainda nao esta pronta",
                description: "Tente novamente em alguns instantes.",
                variant: "destructive",
            });
            return null;
        }

        const dataUrl = await toPng(shareRef.current, { cacheBust: true, quality: 0.95 });
        return await (await fetch(dataUrl)).blob();
    };

    const handleShare = async (method: 'whatsapp' | 'copy' | 'download') => {
        try {
            setIsGenerating(true);
            const blob = await generateImageBlob();
            if (!blob) {
                return;
            }
            const file = new File([blob], `palpite.png`, { type: "image/png" });

            if (method === 'download') {
                const link = document.createElement('a');
                const objectUrl = URL.createObjectURL(blob);
                link.href = objectUrl;
                link.download = 'meu-palpite.png';
                link.click();
                window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
                toast({ title: "Imagem salva com sucesso!" });
            } else if (method === 'copy') {
                if (navigator.clipboard && navigator.clipboard.write && "ClipboardItem" in window) {
                    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                    toast({ title: "Copiado para a área de transferência!" });
                } else if (navigator.clipboard?.writeText) {
                    const draftText = `${shareData?.homeTeam} ${shareData?.homeScore} x ${shareData?.awayScore} ${shareData?.awayTeam}`;
                    await navigator.clipboard.writeText(`Meu palpite no ArenaCopa: ${draftText}`);
                    toast({ title: "Texto do palpite copiado!" });
                } else {
                    toast({ title: "Não suportado no seu navegador", variant: 'destructive' });
                }
            } else if (method === 'whatsapp') {
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: `Meu Palpite`,
                        text: `Olha meu palpite no ArenaCopa!`,
                        files: [file]
                    });
                } else {
                    toast({ title: "Download da imagem foi iniciado. Compartilhe no seu WhatsApp. " });
                    const link = document.createElement('a');
                    const objectUrl = URL.createObjectURL(blob);
                    link.href = objectUrl;
                    link.download = 'meu-palpite.png';
                    link.click();
                    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
                }
            }
        } catch (err) {
            console.error("Erro ao compartilhar palpite:", err);
            toast({ title: "Erro ao compartilhar", variant: "destructive" });
        } finally {
            setIsGenerating(false);
            setShareModalOpen(false);
        }
    };

    if (!matches.length) {
        return (
            <EmptyState
                icon="⚽"
                title="Calendário ainda indisponível"
                description="Assim que os jogos forem carregados, seus palpites aparecem aqui."
            />
        );
    }

    return (
        <div className="space-y-4">
            {matches.map(m => {
                const isStarted = m.status === 'live' || m.status === 'finished';
                const marketsForMatch = matchMarkets.filter((market) => market.match_id === m.id);
                const firstScorerMarket = firstScorerMarketByMatchId[m.id];
                const savedFirstScorer = getSavedFirstScorer(m.id);
                const currentFirstScorer = draftFirstScorers[m.id] ?? savedFirstScorer;
                const p = getCurrentPalpite(m.id);
                const savedHomeValue = savedPalpites[m.id]?.home ?? (p.id ? p.home : "");
                const savedAwayValue = savedPalpites[m.id]?.away ?? (p.id ? p.away : "");
                const scoreDirty =
                    p.home !== savedHomeValue ||
                    p.away !== savedAwayValue;
                const firstScorerDirty = currentFirstScorer !== savedFirstScorer;
                const hasScoreReady = p.home !== '' && p.away !== '';
                const hasSavedPrediction = Boolean(p.id || savedFirstScorer);
                const isDirty =
                    scoreDirty ||
                    firstScorerDirty;
                const canSave = !isStarted && ((scoreDirty && hasScoreReady) || (firstScorerDirty && currentFirstScorer !== ""));
                const isHighlighted = highlightedMatchId === m.id;

                return (
                    <div id={`match-card-${m.id}`} key={m.id} className={cn(
                        "relative p-6 bg-white/[0.03] border rounded-[32px] overflow-hidden transition-all",
                        isHighlighted ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "border-white/5"
                    )}>
                        {isStarted && <div className="absolute inset-0 bg-black/50 z-10 backdrop-blur-sm pointer-events-none flex flex-col items-center justify-center">
                            <Lock className="w-8 h-8 text-gray-500 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Palpites Encerrados</span>
                            {m.status === 'finished' && p.id && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 flex flex-col items-center">
                                    <span className="text-4xl font-black text-white">{p.points}</span>
                                    <span className="text-[10px] text-primary uppercase font-bold tracking-widest">{p.is_exact ? "Exato 🎯" : "Pts"}</span>
                                </motion.div>
                            )}
                        </div>}

                        <div className="flex justify-between items-center mb-6">
                            <div className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold uppercase tracking-widest text-gray-500">
                                {new Date(m.match_date).toLocaleDateString('pt-BR')} • {new Date(m.match_date).toLocaleTimeString('pt-BR', { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold uppercase tracking-widest text-gray-500">{m.stage}</div>
                        </div>

                        {marketsForMatch.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                                {marketsForMatch.slice(0, 4).map((market) => (
                                    <div key={market.id} className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                                        <span>{getMarketShortLabel(market.slug, market.title)}</span>
                                        <TooltipProvider delayDuration={120}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-primary/80"
                                                        aria-label={`Entender mercado ${market.title}`}
                                                    >
                                                        <CircleHelp className="h-3 w-3" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-[240px] rounded-2xl border-white/10 bg-zinc-950 px-4 py-3 text-left text-xs text-zinc-200">
                                                    <p className="mb-1 text-[11px] font-black uppercase tracking-[0.16em] text-primary">{market.title}</p>
                                                    <p>{market.help_text || market.description}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                ))}
                                {marketsForMatch.length > 4 && (
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                        +{marketsForMatch.length - 4} mercados
                                    </span>
                                )}
                            </div>
                        )}

                        {isHighlighted && (
                            <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                                Este jogo está pendente para você.
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <Flag code={m.home_team_code} size="md" />
                                <span className="text-xs font-bold text-gray-400">{m.home_team_code}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    maxLength={2}
                                    inputMode="numeric"
                                    aria-label={`Palpite de gols para ${m.home_team_code}`}
                                    value={p.home}
                                    onChange={e => updateScore(m.id, 'home', e.target.value)}
                                    className="w-14 h-16 bg-white/5 border border-white/10 rounded-2xl text-center text-3xl font-black text-white outline-none focus:border-primary/50"
                                    disabled={isStarted}
                                />
                                <span className="text-gray-600 font-bold">x</span>
                                <input
                                    type="text"
                                    maxLength={2}
                                    inputMode="numeric"
                                    aria-label={`Palpite de gols para ${m.away_team_code}`}
                                    value={p.away}
                                    onChange={e => updateScore(m.id, 'away', e.target.value)}
                                    className="w-14 h-16 bg-white/5 border border-white/10 rounded-2xl text-center text-3xl font-black text-white outline-none focus:border-primary/50"
                                    disabled={isStarted}
                                />
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <Flag code={m.away_team_code} size="md" />
                                <span className="text-xs font-bold text-gray-400">{m.away_team_code}</span>
                            </div>
                        </div>

                        {firstScorerMarket && !isStarted && (
                            <div className="mt-5 rounded-[24px] border border-white/5 bg-black/10 p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Mercado extra da partida</p>
                                        <p className="mt-1 text-sm font-bold text-white">Quem marca primeiro?</p>
                                    </div>
                                    <TooltipProvider delayDuration={120}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300"
                                                    aria-label={`Entender mercado ${firstScorerMarket.title}`}
                                                >
                                                    <CircleHelp className="h-3.5 w-3.5 text-primary" />
                                                    Como pontua
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[240px] rounded-2xl border-white/10 bg-zinc-950 px-4 py-3 text-left text-xs text-zinc-200">
                                                <p className="mb-1 text-[11px] font-black uppercase tracking-[0.16em] text-primary">{firstScorerMarket.title}</p>
                                                <p>{firstScorerMarket.help_text || firstScorerMarket.description}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>

                                <div className="grid gap-2 md:grid-cols-3">
                                    {[
                                        { value: m.home_team_code, label: m.home_team_code },
                                        { value: m.away_team_code, label: m.away_team_code },
                                        { value: "none", label: "Sem gols" },
                                    ].map((option) => {
                                        const isSelected = currentFirstScorer === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => updateFirstScorer(m.id, option.value)}
                                                className={cn(
                                                    "rounded-2xl border px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all",
                                                    isSelected
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-white/10 bg-white/5 text-zinc-300 hover:text-white"
                                                )}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {savedFirstScorer && (
                                    <p className="mt-3 text-xs text-zinc-400">
                                        Salvo: <span className="font-black text-white">{savedFirstScorer === "none" ? "Sem gols" : savedFirstScorer}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        {!isStarted && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSave(m.id, m.home_team_code, m.away_team_code)}
                                    disabled={!canSave || savingMatchId === m.id}
                                    className="flex-1 mt-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] active:scale-95 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {savingMatchId === m.id ? "Salvando..." : hasSavedPrediction && !isDirty ? "Palpite Salvo" : "Salvar Palpite"}
                                </button>
                                <button
                                    onClick={() => openShareModal(m.id, m.home_team_code, m.away_team_code)}
                                    disabled={!hasSavedPrediction}
                                    className="mt-6 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                    aria-label={`Compartilhar palpite de ${m.home_team_code} contra ${m.away_team_code}`}
                                >
                                    <Share2 className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}

            <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
                <DialogContent className="bg-[#050505] border-white/10 rounded-[40px] p-8 max-w-sm text-center shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter mx-auto uppercase">Compartilhar Palpite</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 mt-6">
                        <button disabled={isGenerating} onClick={() => handleShare('whatsapp')} className="w-full flex items-center justify-center gap-3 py-4 bg-[#25D366] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest disabled:opacity-50 hover:bg-[#1EBE5C] transition">
                            <MessageCircle className="w-5 h-5" /> Compartilhar no Zap
                        </button>
                        <button disabled={isGenerating} onClick={() => handleShare('copy')} className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white/10 transition disabled:opacity-50">
                            <Copy className="w-5 h-5" /> Copiar Imagem
                        </button>
                        <button disabled={isGenerating} onClick={() => handleShare('download')} className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white/10 transition disabled:opacity-50 border border-white/5">
                            <Download className="w-5 h-5" /> Salvar na Galeria
                        </button>
                    </div>

                    <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true" ref={shareRef}>
                        {shareData && <ShareCardGenerator type="my_palpite" format="story" data={shareData} />}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
