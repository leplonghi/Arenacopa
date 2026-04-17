import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { CircleHelp, Lock, Share2, Download, Copy, MessageCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShareCardGenerator } from "./ShareCardGenerator";
import { toPng } from "html-to-image";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { saveBolaoPrediction } from "@/services/boloes/bolao-prediction.service";
import type { BolaoData, BolaoMarket, BolaoPrediction } from "@/types/bolao";

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
    bolao,
}: {
    bolaoId: string;
    highlightedMatchId?: string;
    rules?: unknown;
    markets?: BolaoMarket[];
    predictions?: BolaoPrediction[];
    bolao?: Pick<BolaoData, "scoring_mode"> | null;
}) {
    const { t } = useTranslation('bolao');
    const { user } = useAuth();
    const { toast } = useToast();
    const [matches, setMatches] = useState<JogosTabMatch[]>([]);
    const [savedPalpites, setSavedPalpites] = useState<Record<string, EditablePalpite>>({});
    const [draftPalpites, setDraftPalpites] = useState<Record<string, Partial<EditablePalpite>>>({});
    const [draftFirstScorers, setDraftFirstScorers] = useState<Record<string, string>>({});
    const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
    const [savedFlashMatchIds, setSavedFlashMatchIds] = useState<Set<string>>(new Set());
    const [allPalpites, setAllPalpites] = useState<Record<string, { home: number; away: number; userId: string }[]>>({});
    
    // Filters
    const [filterTeam, setFilterTeam] = useState<string>("all");
    const [filterStage, setFilterStage] = useState<string>("all");

    // Share States
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState<ShareData | null>(null);
    const shareRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const matchMarkets = useMemo(
        () => markets.filter((market) => market.scope === "match" && market.match_id),
        [markets]
    );
    const matchMarketsByMatchId = useMemo(
        () =>
            matchMarkets.reduce<Record<string, BolaoMarket[]>>((accumulator, market) => {
                if (!market.match_id) return accumulator;
                if (!accumulator[market.match_id]) {
                    accumulator[market.match_id] = [];
                }
                accumulator[market.match_id].push(market);
                return accumulator;
            }, {}),
        [matchMarkets]
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
                        toast({ title: t('palpites.exact_score'), description: t('palpites.exact_score_desc'), className: "bg-primary text-black font-black" });
                        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
                    }
                }
            });

            setSavedPalpites(m);
        });

        // If exclusive mode, fetch ALL palpites to know occupied seats
        let unsubscribeAll = () => {};
        if (bolao?.scoring_mode === "exclusive") {
            const qAll = query(palpitesRef, where("bolao_id", "==", bolaoId));
            unsubscribeAll = onSnapshot(qAll, (snapshot) => {
                const map: Record<string, { home: number; away: number; userId: string }[]> = {};
                snapshot.forEach(doc => {
                    const p = doc.data() as PalpiteRealtimeRow & { user_id: string };
                    if (!map[p.match_id]) map[p.match_id] = [];
                    map[p.match_id].push({ home: p.home_score, away: p.away_score, userId: p.user_id });
                });
                setAllPalpites(map);
            });
        }

        return () => {
             unsubscribe();
             unsubscribeAll();
        };
    }, [bolaoId, bolao?.scoring_mode, t, toast, user]);

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

            setSavedFlashMatchIds(prev => new Set([...prev, matchId]));
            window.setTimeout(() => setSavedFlashMatchIds(prev => { const next = new Set(prev); next.delete(matchId); return next; }), 1500);

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
                title: t('palpites.saved'),
                description: hasScoreInput
                    ? `${homeTeam} ${hs} x ${as} ${awayTeam}`
                    : `Mercado de ${homeTeam} x ${awayTeam} atualizado.`,
            });
        } catch (error) {
            console.error(error);
            toast({ title: t('palpites.error_save'), variant: 'destructive' });
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

    const setDraftScoreBoth = (matchId: string, hs: string, as: string) => {
        setDraftPalpites((currentDrafts) => ({
            ...currentDrafts,
            [matchId]: {
                home: hs,
                away: as,
            },
        }));
    };

    const getSavedFirstScorer = useCallback((matchId: string) => {
        const market = firstScorerMarketByMatchId[matchId];
        if (!market) return "";

        const prediction = predictionsByMarketId[market.id];
        return typeof prediction?.prediction_value === "string" ? prediction.prediction_value : "";
    }, [firstScorerMarketByMatchId, predictionsByMarketId]);

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
                title: t('palpites.save_first'),
                description: t('palpites.save_first_desc'),
            });
            return;
        }

        setShareData({
            homeTeam,
            awayTeam,
            homeScore: parseInt(palpite.home, 10),
            awayScore: parseInt(palpite.away, 10),
        });
        setShareModalOpen(true);
    };

    const generateImageBlob = async (): Promise<Blob | null> => {
        if (!shareRef.current) {
            toast({
                title: t('palpites.card_not_ready'),
                description: t('palpites.card_not_ready_desc'),
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
                toast({ title: t('palpites.image_saved') });
            } else if (method === 'copy') {
                if (navigator.clipboard && navigator.clipboard.write && "ClipboardItem" in window) {
                    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                    toast({ title: t('palpites.copied') });
                } else if (navigator.clipboard?.writeText) {
                    const draftText = `${shareData?.homeTeam} ${shareData?.homeScore} x ${shareData?.awayScore} ${shareData?.awayTeam}`;
                    await navigator.clipboard.writeText(`${t('palpites.share_text')} ${draftText}`);
                    toast({ title: t('palpites.text_copied') });
                } else {
                    toast({ title: t('palpites.not_supported'), variant: 'destructive' });
                }
            } else if (method === 'whatsapp') {
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: `Meu Palpite`,
                        text: `Olha meu palpite no Arena CUP!`,
                        files: [file]
                    });
                } else {
                    toast({ title: t('palpites.download_started') });
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
            toast({ title: t('palpites.error_share'), variant: 'destructive' });
        } finally {
            setIsGenerating(false);
            setShareModalOpen(false);
        }
    };

    const uniqueTeams = Array.from(new Set(matches.flatMap(m => [m.home_team_code, m.away_team_code]))).filter(Boolean).sort();
    const uniqueStages = Array.from(new Set(matches.map(m => m.stage))).filter(Boolean);

    const filteredMatches = matches.filter(m => {
        if (filterTeam !== "all" && m.home_team_code !== filterTeam && m.away_team_code !== filterTeam) return false;
        if (filterStage !== "all" && m.stage !== filterStage && new Date(m.match_date).toLocaleDateString("pt-BR") !== filterStage) return false;
        return true;
    });
    const enrichedMatches = useMemo(() => {
        return filteredMatches
            .map((match) => {
                const isStarted = match.status === 'live' || match.status === 'finished';
                const marketsForMatch = matchMarketsByMatchId[match.id] ?? [];
                const firstScorerMarket = firstScorerMarketByMatchId[match.id];
                const savedFirstScorer = getSavedFirstScorer(match.id);
                const currentFirstScorer = draftFirstScorers[match.id] ?? savedFirstScorer;
                const p = getCurrentPalpite(match.id);
                const savedHomeValue = savedPalpites[match.id]?.home ?? (p.id ? p.home : "");
                const savedAwayValue = savedPalpites[match.id]?.away ?? (p.id ? p.away : "");
                const scoreDirty = p.home !== savedHomeValue || p.away !== savedAwayValue;
                const firstScorerDirty = currentFirstScorer !== savedFirstScorer;
                const hasScoreReady = p.home !== '' && p.away !== '';
                const hasSavedPrediction = Boolean(p.id || savedFirstScorer);
                const isDirty = scoreDirty || firstScorerDirty;
                const canSave = !isStarted && ((scoreDirty && hasScoreReady) || (firstScorerDirty && currentFirstScorer !== ""));
                const isHighlighted = highlightedMatchId === match.id;
                const hasExactScoreSaved = Boolean(
                    (p.home !== "" && p.away !== "") ||
                    savedPalpites[match.id]?.id
                );
                const hasAllOpenMatchMarketsSaved =
                    marketsForMatch.length === 0
                        ? hasExactScoreSaved
                        : marketsForMatch.every((market) =>
                              market.slug === "exact_score"
                                  ? hasExactScoreSaved
                                  : Boolean(predictionsByMarketId[market.id])
                          );
                const isPending = !isStarted && (isHighlighted || !hasAllOpenMatchMarketsSaved || isDirty);
                const sortPriority = isHighlighted ? 0 : isPending ? 1 : isStarted ? 3 : 2;

                return {
                    match,
                    isStarted,
                    marketsForMatch,
                    firstScorerMarket,
                    savedFirstScorer,
                    currentFirstScorer,
                    p,
                    hasSavedPrediction,
                    isDirty,
                    canSave,
                    isHighlighted,
                    isPending,
                    sortPriority,
                };
            })
            .sort((left, right) => {
                if (left.sortPriority !== right.sortPriority) {
                    return left.sortPriority - right.sortPriority;
                }

                return new Date(left.match.match_date).getTime() - new Date(right.match.match_date).getTime();
            });
    }, [
        draftFirstScorers,
        filteredMatches,
        firstScorerMarketByMatchId,
        getCurrentPalpite,
        getSavedFirstScorer,
        highlightedMatchId,
        matchMarketsByMatchId,
        predictionsByMarketId,
        savedPalpites,
    ]);
    const pendingMatchesCount = enrichedMatches.filter((item) => item.isPending).length;
    const lockedMatchesCount = enrichedMatches.filter((item) => item.isStarted).length;
    const completedMatchesCount = enrichedMatches.filter((item) => !item.isStarted && !item.isPending).length;

    if (!matches.length) {
        return (
            <EmptyState
                icon="⚽"
                title={t('palpites.calendar_unavailable')}
                description={t('palpites.calendar_unavailable_desc')}
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,198,0,0.12),transparent_35%),rgba(255,255,255,0.03)] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                            {t('palpites.header_kicker', { defaultValue: 'Sua rodada agora' })}
                        </p>
                        <h3 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
                            {pendingMatchesCount > 0
                                ? t('palpites.pending_title', {
                                      defaultValue: 'Faltam {{count}} jogos para fechar',
                                      count: pendingMatchesCount,
                                  })
                                : t('palpites.pending_title_done', { defaultValue: 'Tudo salvo nesta lista' })}
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                            {pendingMatchesCount > 0
                                ? t('palpites.pending_desc', { defaultValue: 'Comece pelos jogos destacados. Os abertos e pendentes aparecem primeiro para você resolver rápido.' })
                                : t('palpites.pending_desc_done', { defaultValue: 'Agora você pode revisar palpites salvos, compartilhar seus bilhetes e acompanhar os jogos fechados.' })}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:min-w-[300px]">
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                {t('palpites.stats_pending', { defaultValue: 'Pendentes' })}
                            </p>
                            <p className="mt-1 text-2xl font-black text-white">{pendingMatchesCount}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                {t('palpites.stats_saved', { defaultValue: 'Salvos' })}
                            </p>
                            <p className="mt-1 text-2xl font-black text-white">{completedMatchesCount}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                {t('palpites.stats_closed', { defaultValue: 'Fechados' })}
                            </p>
                            <p className="mt-1 text-2xl font-black text-white">{lockedMatchesCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <select 
                    value={filterTeam} 
                    onChange={e => setFilterTeam(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs font-bold text-white outline-none focus:border-primary/50"
                >
                    <option value="all" className="bg-zinc-900">{t('palpites.filter_all_teams', { defaultValue: 'Todas as seleções' })}</option>
                    {uniqueTeams.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                </select>
                <select 
                    value={filterStage} 
                    onChange={e => setFilterStage(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs font-bold text-white outline-none focus:border-primary/50"
                >
                    <option value="all" className="bg-zinc-900">{t('palpites.filter_all_stages', { defaultValue: 'Cronograma (Todos)' })}</option>
                    {uniqueStages.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                </select>
            </div>

            {enrichedMatches.map(({ match: m, isStarted, marketsForMatch, firstScorerMarket, savedFirstScorer, currentFirstScorer, p, hasSavedPrediction, isDirty, canSave, isHighlighted, isPending }) => {
                return (
                    <div id={`match-card-${m.id}`} key={m.id} className={cn(
                        "relative p-6 bg-white/[0.03] border rounded-[32px] overflow-hidden transition-all",
                        isHighlighted ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "border-white/5"
                    )}>
                        {isStarted && <div className="absolute inset-0 bg-black/50 z-10 backdrop-blur-sm pointer-events-none flex flex-col items-center justify-center">
                            <Lock className="w-8 h-8 text-gray-500 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {t('palpites.closed_label', { defaultValue: 'Palpites encerrados' })}
                            </span>
                            {m.status === 'finished' && p.id && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 flex flex-col items-center">
                                    <span className="text-4xl font-black text-white">{p.points}</span>
                                    <span className="text-[10px] text-primary uppercase font-bold tracking-widest">{p.is_exact ? "Exato 🎯" : "Pts"}</span>
                                </motion.div>
                            )}
                        </div>}

                        <AnimatePresence>
                            {savedFlashMatchIds.has(m.id) && (
                                <motion.div
                                    key="save-flash"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none rounded-[32px]"
                                >
                                    <CheckCircle2 className="w-14 h-14 text-primary mb-3" />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-primary">{t('palpites.saved')}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

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

                        {isPending && (
                            <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                                {isHighlighted
                                    ? t('palpites.highlighted_pending', { defaultValue: 'Este jogo está pendente para você.' })
                                    : t('palpites.queue_pending', { defaultValue: 'Resolva este jogo antes do próximo prazo.' })}
                            </div>
                        )}

                            {bolao?.scoring_mode === 'exclusive' ? (
                                <div className="mt-4 mb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">🎟️ Assentos de Cinema</p>
                                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider">Escolha um placar livre</p>
                                    </div>
                                    <div className="grid grid-cols-5 gap-1.5 p-3 rounded-2xl bg-black/20 border border-white/5">
                                        {[0,1,2,3,4].flatMap(homeG => [0,1,2,3,4].map(awayG => {
                                            const oc = (allPalpites[m.id] || []).find(ap => ap.home === homeG && ap.away === awayG);
                                            const isMine = oc?.userId === user?.id;
                                            const isTaken = oc && !isMine;
                                            const isSelected = p.home === homeG.toString() && p.away === awayG.toString();
                                            return (
                                                <button
                                                    key={`${homeG}x${awayG}`}
                                                    onClick={() => !isTaken && !isStarted && setDraftScoreBoth(m.id, homeG.toString(), awayG.toString())}
                                                    disabled={isTaken || isStarted}
                                                    className={cn(
                                                        "h-8 flex justify-center items-center text-[10px] font-black rounded-lg transition-all",
                                                        isSelected ? "bg-primary text-black scale-105 shadow-[0_0_10px_rgba(255,255,255,0.4)]" :
                                                        isTaken ? "bg-white/5 text-zinc-600 cursor-not-allowed grayscale" :
                                                        "bg-white/10 text-white hover:bg-white/20 active:scale-95"
                                                    )}
                                                >
                                                    {homeG}x{awayG}
                                                </button>
                                            );
                                        }))}
                                    </div>
                                </div>
                            ) : (
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
                            )}

                        {firstScorerMarket && !isStarted && (
                            <div className="mt-5 rounded-[24px] border border-white/5 bg-black/10 p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Mercado extra da partida</p>
                                        <p className="mt-1 text-sm font-bold text-white">{t('palpites.first_scorer_title', { defaultValue: 'Quem marca primeiro?' })}</p>
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
                                                    {t('palpites.how_it_scores', { defaultValue: 'Como pontua' })}
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
                                        { value: "none", label: t('palpites.no_goals', { defaultValue: 'Sem gols' }) },
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
                                        {t('palpites.saved_label', { defaultValue: 'Salvo:' })} <span className="font-black text-white">{savedFirstScorer === "none" ? t('palpites.no_goals', { defaultValue: 'Sem gols' }) : savedFirstScorer}</span>
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
                                    {savingMatchId === m.id
                                        ? t('palpites.saving_cta', { defaultValue: 'Salvando...' })
                                        : hasSavedPrediction && !isDirty
                                            ? t('palpites.saved_cta', { defaultValue: 'Palpite salvo' })
                                            : t('palpites.save_cta', { defaultValue: 'Salvar palpite' })}
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
