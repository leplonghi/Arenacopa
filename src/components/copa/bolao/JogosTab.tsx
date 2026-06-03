import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { db } from "@/integrations/firebase/client";
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    onSnapshot, 
    documentId,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Flag } from "@/components/Flag";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { CircleHelp, Lock, Share2, Download, Copy, MessageCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShareCardGenerator } from "./ShareCardGenerator";
import { toPng } from "html-to-image";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { saveBolaoPalpite, saveExclusiveBolaoPalpite } from "@/services/boloes/bolao.service";
import { MatchPublicPalpitesDialog } from "./MatchPublicPalpitesDialog";
import { Users } from "lucide-react";
import {
    normalizePredictionCutoffMinutes,
    getPredictionCloseMs,
    isMatchPredictionClosed,
} from "@/services/boloes/bolao-prediction-deadline";
import {
    subscribeBolaoExclusiveScoreLocks,
    type ExclusiveScoreSeat,
} from "@/services/boloes/bolao-exclusive-locks.service";
import { saveBolaoPrediction } from "@/services/boloes/bolao-prediction.service";
import { normalizeMatchFeedStatus } from "@/lib/match-feed";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
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

function getMarketShortLabel(
    slug: BolaoMarket["slug"],
    fallbackTitle: string,
    t: (key: string) => string
) {
    switch (slug) {
        case "exact_score":
            return t("palpites.market_short.exact_score");
        case "match_winner":
            return t("palpites.market_short.match_winner");
        case "home_goals":
            return t("palpites.market_short.home_goals");
        case "away_goals":
            return t("palpites.market_short.away_goals");
        case "total_goals":
            return t("palpites.market_short.total_goals");
        case "both_score":
            return t("palpites.market_short.both_score");
        case "first_team_to_score":
            return t("palpites.market_short.first_team_to_score");
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

// Deterministic pseudo-random form generator for pedagogical stats
const getForm = (teamCode: string) => {
    const seed = teamCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const outcomes = ['W', 'W', 'W', 'D', 'L', 'D'];
    return [
        outcomes[(seed + 1) % 6],
        outcomes[(seed + 2) % 6],
        outcomes[(seed + 3) % 6],
        outcomes[(seed + 4) % 6],
        outcomes[(seed + 5) % 6],
    ];
};


export function JogosTab({
    bolaoId,
    highlightedMatchId,
    markets = [],
    predictions = [],
    matchPredictionCounts = {},
    bolao,
}: {
    bolaoId: string;
    highlightedMatchId?: string;
    rules?: unknown;
    markets?: BolaoMarket[];
    predictions?: BolaoPrediction[];
    matchPredictionCounts?: Record<string, number>;
    bolao?: Pick<BolaoData, "scoring_mode" | "allowed_match_ids" | "championship_id" | "prediction_cutoff_minutes"> | null;
}) {
    const { t, i18n } = useTranslation('bolao');
    const { user } = useAuth();
    const { toast } = useToast();
    const currentLanguage = i18n.resolvedLanguage || i18n.language;
    const [matches, setMatches] = useState<JogosTabMatch[]>([]);
    const [savedPalpites, setSavedPalpites] = useState<Record<string, EditablePalpite>>({});
    const [draftPalpites, setDraftPalpites] = useState<Record<string, Partial<EditablePalpite>>>({});
    const [draftFirstScorers, setDraftFirstScorers] = useState<Record<string, string>>({});
    const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
    const [savedFlashMatchIds, setSavedFlashMatchIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [exclusiveSeats, setExclusiveSeats] = useState<Record<string, ExclusiveScoreSeat[]>>({});
    const [nowMs, setNowMs] = useState(() => Date.now());
    
    // Filters
    const [filterTeam, setFilterTeam] = useState<string>("all");
    const [filterStage, setFilterStage] = useState<string>("all");

    // Share States
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState<ShareData | null>(null);
    const shareRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [publicPicksMatchId, setPublicPicksMatchId] = useState<string | null>(null);
    const [publicPicksDialogOpen, setPublicPicksDialogOpen] = useState(false);
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

    // allowedMatches must be defined BEFORE effectiveExactScoreMarketByMatchId which depends on it
    const allowedMatches = useMemo(() => {
        const matchesWithMarkets = new Set(matchMarkets.map(m => m.match_id).filter(Boolean) as string[]);
        const matchesWithSavedPalpites = new Set(Object.keys(savedPalpites));
        const allowedMatchIds = bolao?.allowed_match_ids;

        // 1. Se houver uma lista explícita de IDs (Array), respeitamos estritamente.
        if (Array.isArray(allowedMatchIds)) {
            return matches.filter(m => allowedMatchIds.includes(m.id));
        }

        // 2. Se for "all", mostramos jogos que têm mercados ativos para este bolão.
        if (allowedMatchIds === 'all') {
            const hasAnyMarkets = matchesWithMarkets.size > 0;
            if (!hasAnyMarkets && matchesWithSavedPalpites.size === 0) {
                return matches.filter(m => new Date(m.match_date).getTime() > Date.now());
            }
            return matches.filter(m => matchesWithMarkets.has(m.id) || matchesWithSavedPalpites.has(m.id));
        }

        // 3. Caso não esteja definido (fallback de segurança)
        return [];
    }, [matches, bolao?.allowed_match_ids, matchMarkets, savedPalpites]);

    // If no exact_score market exists for an allowed match, we synthesize a virtual one
    // to ensure the user can still place predictions for the primary outcome.
    const effectiveExactScoreMarketByMatchId = useMemo(() => {
        const result: Record<string, BolaoMarket | { slug: "exact_score"; match_id: string; id: string }> = {};
        
        // First fill with real markets
        matchMarkets.forEach(market => {
            if (market.slug === "exact_score" && market.match_id) {
                result[market.match_id] = market;
            }
        });

        // Then fill gaps for allowed matches
        allowedMatches.forEach(match => {
            if (!result[match.id]) {
                result[match.id] = {
                    id: `virtual_${bolaoId}_${match.id}`,
                    slug: "exact_score",
                    match_id: match.id,
                };
            }
        });

        return result;
    }, [matchMarkets, allowedMatches, bolaoId]);
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
        const interval = window.setInterval(() => setNowMs(Date.now()), 30_000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!user) return;

        // Listen for Matches
        const matchesRef = collection(db, "matches");
        const allowedIds = bolao?.allowed_match_ids;

        setIsLoading(true);

        let unsubscribeMatches = () => {};

        if (Array.isArray(allowedIds) && allowedIds.length > 0) {
            if (allowedIds.length <= 30) {
                // Fast path: single 'in' query (Firestore limit is 30)
                const qMatches = query(matchesRef, where(documentId(), "in", allowedIds));
                unsubscribeMatches = onSnapshot(qMatches, (snapshot) => {
                    const mData = snapshot.docs.map(d => {
                        const data = d.data();
                        return {
                            id: d.id,
                            ...data,
                            status: normalizeMatchFeedStatus({
                                status: data.status,
                                matchDate: data.match_date,
                                homeScore: data.home_score,
                                awayScore: data.away_score,
                            }),
                        } as JogosTabMatch;
                    });
                    setMatches(mData.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()));
                    setIsLoading(false);
                }, (error) => {
                    console.error("Error fetching matches:", error);
                    setIsLoading(false);
                });
            } else {
                // [BUG-009 FIX] Batch into chunks of 30 to stay within Firestore limits.
                // We use one-time getDocs per chunk instead of onSnapshot to keep it simple.
                const CHUNK_SIZE = 30;
                const chunks: string[][] = [];
                for (let i = 0; i < allowedIds.length; i += CHUNK_SIZE) {
                    chunks.push(allowedIds.slice(i, i + CHUNK_SIZE));
                }
                Promise.all(
                    chunks.map((chunk) =>
                        getDocs(query(matchesRef, where(documentId(), "in", chunk)))
                    )
                ).then((snapshots) => {
                    const allDocs = snapshots.flatMap((snap) =>
                        snap.docs.map((d) => {
                            const data = d.data();
                            return {
                                id: d.id,
                                ...data,
                                status: normalizeMatchFeedStatus({
                                    status: data.status,
                                    matchDate: data.match_date,
                                    homeScore: data.home_score,
                                    awayScore: data.away_score,
                                }),
                            } as JogosTabMatch;
                        })
                    );
                    setMatches(allDocs.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()));
                    setIsLoading(false);
                }).catch((error) => {
                    console.error("Error fetching batched matches:", error);
                    setIsLoading(false);
                });
            }
        } else if (bolao?.championship_id) {
            // Fallback: entire championship
            const qMatches = query(matchesRef, where("championship_id", "==", bolao.championship_id), orderBy("match_date", "asc"));
            unsubscribeMatches = onSnapshot(qMatches, (snapshot) => {
                const mData = snapshot.docs.map(d => {
                    const data = d.data();
                    return {
                        id: d.id,
                        ...data,
                        status: normalizeMatchFeedStatus({
                            status: data.status,
                            matchDate: data.match_date,
                            homeScore: data.home_score,
                            awayScore: data.away_score,
                        }),
                    } as JogosTabMatch;
                });
                setMatches(mData);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching matches:", error);
                setIsLoading(false);
            });
        } else {
            // Safety fallback: no criteria → empty result, stop loading
            setMatches([]);
            setIsLoading(false);
        }


        // Listen for user's predictions in this bolao
        const palpitesRef = collection(db, "bolao_palpites");
        const qPalpites = query(
            palpitesRef, 
            where("bolao_id", "==", bolaoId),
            where("user_id", "==", user.id)
        );

        const unsubscribePredictions = onSnapshot(qPalpites, (snapshot) => {
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

        // If exclusive mode, fetch sanitized score locks to know occupied seats.
        let unsubscribeAll = () => {};
        if (bolao?.scoring_mode === "exclusive") {
            unsubscribeAll = subscribeBolaoExclusiveScoreLocks(bolaoId, setExclusiveSeats);
        } else {
            setExclusiveSeats({});
        }

        return () => {
             unsubscribePredictions();
             unsubscribeMatches();
             unsubscribeAll();
        };
    }, [bolaoId, bolao?.scoring_mode, bolao?.allowed_match_ids, bolao?.championship_id, t, toast, user]);

    const getCurrentPalpite = useMemo(() => {
        return (matchId: string): EditablePalpite => {
            const saved = savedPalpites[matchId];
            const draft = draftPalpites[matchId];
            const exactScorePrediction = effectiveExactScoreMarketByMatchId[matchId]
                ? predictionsByMarketId[effectiveExactScoreMarketByMatchId[matchId].id]
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
    }, [draftPalpites, effectiveExactScoreMarketByMatchId, predictionsByMarketId, savedPalpites]);

    const predictionCutoffMinutes = useMemo(
        () => normalizePredictionCutoffMinutes(bolao?.prediction_cutoff_minutes),
        [bolao?.prediction_cutoff_minutes]
    );

    const getMatchPredictionState = useCallback(
        (match: JogosTabMatch) => {
            const marketClose = (matchMarketsByMatchId[match.id] ?? [])
                .map((market) => getPredictionCloseMs({ closesAt: market.closes_at_ts ?? market.closes_at ?? null }))
                .filter(Number.isFinite)
                .sort((left, right) => left - right)[0];
            const closeMs = Number.isFinite(marketClose)
                ? marketClose
                : getPredictionCloseMs({
                    matchDate: match.match_date,
                    cutoffMinutes: predictionCutoffMinutes,
                });
            const isClosed = isMatchPredictionClosed({
                matchDate: match.match_date,
                matchStatus: match.status,
                cutoffMinutes: predictionCutoffMinutes,
                closesAt: Number.isFinite(closeMs) ? new Date(closeMs) : null,
                nowMs,
            });

            return {
                closeMs,
                isClosed,
                isFinished: match.status === "finished",
            };
        },
        [matchMarketsByMatchId, nowMs, predictionCutoffMinutes]
    );

    const handleSave = async (matchId: string, homeTeam: string, awayTeam: string, options?: { silent?: boolean }) => {
        if (!user) return;
        const silent = options?.silent ?? false;
        const match = matches.find((item) => item.id === matchId);
        if (match && getMatchPredictionState(match).isClosed) {
            if (!silent) toast({
                title: "Palpites encerrados",
                description: "Nao e mais possivel palpitar neste jogo.",
                variant: "destructive",
            });
            return;
        }

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
                const saveScorePalpite =
                    bolao?.scoring_mode === "exclusive" ? saveExclusiveBolaoPalpite : saveBolaoPalpite;

                await saveScorePalpite({
                    bolaoId,
                    userId: user.id,
                    matchId,
                    homeScore: hs,
                    awayScore: as,
                    isPowerPlay: false,
                    existingId: savedPalpites[matchId]?.id,
                });

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

            if (!silent) toast({
                title: t('palpites.saved'),
                description: hasScoreInput
                    ? `${homeTeam} ${hs} x ${as} ${awayTeam}`
                    : t("palpites.market_updated_desc", { home: homeTeam, away: awayTeam }),
                action: (
                    <button
                        onClick={() => {
                            setPublicPicksMatchId(matchId);
                            setPublicPicksDialogOpen(true);
                        }}
                        className="arena-badge-gold px-2 py-1 text-[8px] flex items-center gap-1"
                    >
                        <Users className="w-3 h-3" />
                        {t('palpites.view_public_picks', 'Ver Galera')}
                    </button>
                )
            });
        } catch (error) {
            console.error(error);
            // In batch (silent) mode let the caller count failures and show one summary.
            if (silent) throw error;
            const isClosedError =
                error instanceof Error && (error.message === "prediction_closed" || error.message === "match_finished") ||
                (error as { code?: string })?.code === "BOLAO_PREDICTION_CLOSED";
            toast({
                title:
                    error instanceof Error && error.message === "exclusive_score_taken"
                        ? t("palpites.exclusive_score_taken")
                        : isClosedError
                            ? "Palpites encerrados"
                        : t('palpites.error_save'),
                description:
                    isClosedError
                        ? "Nao e mais possivel palpitar neste jogo."
                        : undefined,
                variant: 'destructive',
            });
        } finally {
            setSavingMatchId(null);
        }
    };

    const [savingAll, setSavingAll] = useState(false);

    const handleSaveAll = async () => {
        // enrichedMatches is in scope at call-time (defined later in the component body).
        const saveableMatches = enrichedMatches.filter((item) => item.canSave);
        if (savingAll || saveableMatches.length === 0) return;
        setSavingAll(true);
        let ok = 0;
        let failed = 0;
        for (const item of saveableMatches) {
            try {
                await handleSave(item.match.id, item.match.home_team_code, item.match.away_team_code, { silent: true });
                ok += 1;
            } catch {
                failed += 1;
            }
        }
        setSavingAll(false);
        if (failed === 0) {
            toast({
                title: t('palpites.saved'),
                description: t('palpites.batch_saved_desc', { count: ok, defaultValue: `${ok} palpites salvos` }),
            });
        } else {
            toast({
                title: ok > 0 ? t('palpites.batch_partial_title', { defaultValue: 'Salvamento parcial' }) : t('palpites.error_save'),
                description: t('palpites.batch_partial_desc', { ok, failed, defaultValue: `${ok} salvos, ${failed} falharam` }),
                variant: 'destructive',
            });
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
                        title: t("palpites.share_native_title"),
                        text: t("palpites.share_native_text"),
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

    // allowedMatches is now declared earlier (before effectiveExactScoreMarketByMatchId)

    const uniqueTeams = useMemo(() => 
        Array.from(new Set(allowedMatches.flatMap(m => [m.home_team_code, m.away_team_code])))
            .filter(Boolean)
            .sort(),
        [allowedMatches]
    );

    const uniqueStages = useMemo(() => {
        const stages = allowedMatches.map(m => m.stage);
        const dates = allowedMatches.map(m => new Date(m.match_date).toLocaleDateString(currentLanguage));
        return Array.from(new Set([...stages, ...dates]))
            .filter(Boolean)
            .sort();
    }, [allowedMatches, currentLanguage]);

    const filteredMatches = allowedMatches.filter(m => {
        if (filterTeam !== "all" && m.home_team_code !== filterTeam && m.away_team_code !== filterTeam) return false;
        if (filterStage !== "all" && m.stage !== filterStage && new Date(m.match_date).toLocaleDateString(currentLanguage) !== filterStage) return false;
        return true;
    });
    const enrichedMatches = useMemo(() => {
        const computed = filteredMatches
            .map((match) => {
                const predictionState = getMatchPredictionState(match);
                const isStarted = predictionState.isClosed;
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
                };
            });

        const nextMatchIds = new Set(
            [...computed]
                .filter((m) => !m.isStarted)
                .sort((a, b) => new Date(a.match.match_date).getTime() - new Date(b.match.match_date).getTime())
                .slice(0, 3)
                .map((m) => m.match.id)
        );

        return computed
            .map((item) => {
                const isUpcoming = nextMatchIds.has(item.match.id);
                const sortPriority = item.isHighlighted 
                    ? 0 
                    : isUpcoming 
                        ? 1 
                        : item.isPending 
                            ? 2 
                            : item.isStarted 
                                ? 4 
                                : 3;

                return { ...item, isUpcoming, sortPriority };
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
        getMatchPredictionState,
        getSavedFirstScorer,
        highlightedMatchId,
        matchMarketsByMatchId,
        predictionsByMarketId,
        savedPalpites,
    ]);
    const pendingMatchesCount = enrichedMatches.filter((item) => item.isPending).length;
    const lockedMatchesCount = enrichedMatches.filter((item) => item.isStarted).length;
    const completedMatchesCount = enrichedMatches.filter((item) => !item.isStarted && !item.isPending).length;
    const saveableCount = enrichedMatches.filter((item) => item.canSave).length;

    // Show skeleton while loading
    if (isLoading) {
        return (
            <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-28 rounded-[16px] bg-white/5 border border-white/10" />
                ))}
            </div>
        );
    }

    // All championship matches loaded but none match the bolão selection
    if (!allowedMatches.length) {
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
            <ArenaPanel tone="strong" className="p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="arena-kicker text-primary">
                            {t('palpites.header_kicker')}
                        </p>
                        <h3 className="mt-1 font-display text-[2rem] font-semibold uppercase leading-[0.88] tracking-[0.02em] text-white sm:text-[2.5rem]">
                            {pendingMatchesCount > 0
                                ? t('palpites.pending_title', { count: pendingMatchesCount })
                                : t('palpites.pending_title_done')}
                        </h3>
                        <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                            {pendingMatchesCount > 0
                                ? t('palpites.pending_desc')
                                : t('palpites.pending_desc_done')}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:min-w-[300px]">
                        <div className="rounded-[16px] border border-white/10 bg-black/20 px-3 py-2 text-center">
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                {t('palpites.stats_pending')}
                            </p>
                            <p className="mt-0.5 text-xl font-black text-white">{pendingMatchesCount}</p>
                        </div>
                        <div className="rounded-[16px] border border-white/10 bg-black/20 px-3 py-2 text-center">
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                {t('palpites.stats_saved')}
                            </p>
                            <p className="mt-0.5 text-xl font-black text-white">{completedMatchesCount}</p>
                        </div>
                        <div className="rounded-[16px] border border-white/10 bg-black/20 px-3 py-2 text-center">
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                {t('palpites.stats_closed')}
                            </p>
                            <p className="mt-0.5 text-xl font-black text-white">{lockedMatchesCount}</p>
                        </div>
                    </div>
                </div>
            </ArenaPanel>

            {/* Filters auto-hide when there are few matches and no filter is active —
                no point in showing two dropdowns above a 1–3 game list. */}
            {(allowedMatches.length > 3 || filterTeam !== "all" || filterStage !== "all") && (
                <ArenaPanel className="p-3">
                    <ArenaSectionHeader
                        eyebrow={t('palpites.filter_kicker', 'Filtro rápido')}
                        title={t('palpites.filter_title', 'Refinar jogos')}
                        action={<div className="arena-badge">{enrichedMatches.length} jogos</div>}
                    />
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <select
                            value={filterTeam}
                            onChange={e => setFilterTeam(e.target.value)}
                            className="flex-1 rounded-[14px] border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white outline-none focus:border-primary/50"
                        >
                            <option value="all" className="bg-zinc-900">{t('palpites.filter_all_teams')}</option>
                            {uniqueTeams.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                        </select>
                        <select
                            value={filterStage}
                            onChange={e => setFilterStage(e.target.value)}
                            className="flex-1 rounded-[14px] border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-white outline-none focus:border-primary/50"
                        >
                            <option value="all" className="bg-zinc-900">{t('palpites.filter_all_stages')}</option>
                            {uniqueStages.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                        </select>
                    </div>
                </ArenaPanel>
            )}

            {enrichedMatches.map(({ match: m, isStarted, marketsForMatch, firstScorerMarket, savedFirstScorer, currentFirstScorer, p, hasSavedPrediction, isDirty, canSave, isHighlighted, isPending, isUpcoming }) => {
                return (
                    <div id={`match-card-${m.id}`} key={m.id} className={cn(
                        "relative overflow-hidden rounded-[16px] border p-3 transition-all shadow-[0_24px_60px_-34px_rgba(0,0,0,0.82)]",
                        isHighlighted
                            ? "border-primary/45 bg-[radial-gradient(circle_at_top_left,rgba(145,255,59,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] ring-1 ring-primary/18"
                            : isUpcoming
                                ? "border-primary/30 bg-[linear-gradient(180deg,rgba(145,255,59,0.04),rgba(255,255,255,0.02))] ring-1 ring-primary/10"
                                : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]"
                    )}>
                        {isUpcoming && !isHighlighted && (
                            <div className="absolute top-0 right-0 rounded-bl-2xl rounded-tr-[16px] bg-primary/20 border border-primary/20 px-3 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-primary">
                                Próximo Jogo
                            </div>
                        )}
                        {isStarted && <div className="absolute inset-0 bg-black/50 z-10 backdrop-blur-sm flex flex-col items-center justify-center">
                            <Lock className="w-8 h-8 text-gray-500 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {t('palpites.closed_label')}
                            </span>
                            {m.status === 'finished' && p.id && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 flex flex-col items-center">
                                    <span className="text-4xl font-black text-white">{p.points}</span>
                                                    <span className="text-[10px] text-primary uppercase font-bold tracking-widest">{p.is_exact ? t('palpites.exact_badge') : t('ranking.points_abbr')}</span>
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
                                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none rounded-[20px]"
                                >
                                    <CheckCircle2 className="w-14 h-14 text-primary mb-3" />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-primary">{t('palpites.saved')}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                {new Date(m.match_date).toLocaleDateString(currentLanguage)} • {new Date(m.match_date).toLocaleTimeString(currentLanguage, { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div className={cn(
                                "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em]",
                                m.status === "live"
                                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                                    : "border-white/10 bg-white/5 text-zinc-400"
                            )}>
                                {m.status === "live" ? "Ao vivo" : m.stage}
                            </div>

                            {matchPredictionCounts && matchPredictionCounts[m.id] > 0 && (
                                <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)] animate-in fade-in zoom-in duration-300">
                                    <Users className="h-3 w-3" />
                                    <span>{matchPredictionCounts[m.id]} {t('palpites.predictions_count', 'palpites')}</span>
                                </div>
                            )}
                        </div>

                        {marketsForMatch.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-2">
                                {marketsForMatch.slice(0, 4).map((market) => (
                                    <div key={market.id} className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                                        <span>{getMarketShortLabel(market.slug, market.title, t)}</span>
                                        <Tooltip delayDuration={200}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-primary/80"
                                                    aria-label={t('palpites.market_help_aria', { title: market.title })}
                                                >
                                                    <CircleHelp className="h-3 w-3" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[240px] rounded-2xl border-white/10 bg-zinc-950 px-4 py-3 text-left text-xs text-zinc-200">
                                                <p className="mb-1 text-[11px] font-black uppercase tracking-[0.16em] text-primary">{market.title}</p>
                                                <p>{market.help_text || market.description}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                ))}
                                {marketsForMatch.length > 4 && (
                                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                        {t("palpites.more_markets", { count: marketsForMatch.length - 4 })}
                                    </span>
                                )}
                            </div>
                        )}

                        {isPending && (
                            <div className="mb-2 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-primary/70">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-pulse" />
                                {isHighlighted
                                    ? t('palpites.highlighted_pending')
                                    : t('palpites.queue_pending')}
                            </div>
                        )}

                            {bolao?.scoring_mode === 'exclusive' ? (
                                <div className="mt-3 mb-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">🎟️ {t("palpites.exclusive_seats_title")}</p>
                                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider">{t('palpites.exclusive_pick_label')}</p>
                                    </div>
                                    <div className="grid grid-cols-5 gap-1.5 rounded-[12px] border border-white/10 bg-black/20 p-2">
                                        {[0,1,2,3,4].flatMap(homeG => [0,1,2,3,4].map(awayG => {
                                            const oc = (exclusiveSeats[m.id] || []).find(ap => ap.home === homeG && ap.away === awayG);
                                            const isMine = oc?.userId === user?.id;
                                            const isTaken = oc && !isMine;
                                            const isSelected = p.home === homeG.toString() && p.away === awayG.toString();
                                            return (
                                                <button
                                                    key={`${homeG}x${awayG}`}
                                                    onClick={() => !isTaken && !isStarted && setDraftScoreBoth(m.id, homeG.toString(), awayG.toString())}
                                                    disabled={isTaken || isStarted}
                                                    className={cn(
                                                        "h-7 flex justify-center items-center text-[10px] font-black rounded-lg transition-all",
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
                                <div className="rounded-[12px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-2 py-3">
                                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                                <Flag code={m.home_team_code} size="sm" />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="font-display text-[1.2rem] font-semibold uppercase text-white">{m.home_team_code}</span>
                                                <div className="mt-1 flex gap-1">
                                                    {getForm(m.home_team_code).map((f, i) => (
                                                        <div key={i} className={cn("w-2 h-2 rounded-full", f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-zinc-500' : 'bg-red-500')} title={f} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="text"
                                                maxLength={2}
                                                inputMode="numeric"
                                                aria-label={t("palpites.score_input_aria", { team: m.home_team_code })}
                                                value={p.home}
                                                onChange={e => updateScore(m.id, 'home', e.target.value)}
                                                className="h-12 w-12 rounded-[12px] border border-white/10 bg-white/[0.06] text-center font-display text-xl font-semibold text-white outline-none focus:border-primary/50"
                                                disabled={isStarted}
                                            />
                                            <span className="font-display text-2xl font-semibold text-white/35">x</span>
                                            <input
                                                type="text"
                                                maxLength={2}
                                                inputMode="numeric"
                                                aria-label={t("palpites.score_input_aria", { team: m.away_team_code })}
                                                value={p.away}
                                                onChange={e => updateScore(m.id, 'away', e.target.value)}
                                                className="h-12 w-12 rounded-[12px] border border-white/10 bg-white/[0.06] text-center font-display text-xl font-semibold text-white outline-none focus:border-primary/50"
                                                disabled={isStarted}
                                            />
                                        </div>

                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                                <Flag code={m.away_team_code} size="sm" />
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="font-display text-[1.2rem] font-semibold uppercase text-white">{m.away_team_code}</span>
                                                <div className="mt-1 flex gap-1">
                                                    {getForm(m.away_team_code).map((f, i) => (
                                                        <div key={i} className={cn("w-2 h-2 rounded-full", f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-zinc-500' : 'bg-red-500')} title={f} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tap-to-fill common scorelines — cuts taps for the most frequent results */}
                                    {!isStarted && (
                                        <div className="mt-2.5 flex items-center justify-center gap-1.5 border-t border-white/5 pt-2.5">
                                            {(["1-0", "2-1", "1-1", "0-0", "2-0"] as const).map((preset) => {
                                                const [ph, pa] = preset.split("-");
                                                const isSelected = p.home === ph && p.away === pa;
                                                return (
                                                    <button
                                                        key={preset}
                                                        type="button"
                                                        onClick={() => setDraftScoreBoth(m.id, ph, pa)}
                                                        aria-label={t('palpites.quick_score_aria', { score: `${ph} a ${pa}`, defaultValue: `Preencher ${ph} a ${pa}` })}
                                                        className={cn(
                                                            "h-7 min-w-[40px] rounded-lg px-2 text-[11px] font-black tabular-nums transition-all active:scale-95",
                                                            isSelected
                                                                ? "bg-primary text-black"
                                                                : "bg-white/[0.06] text-zinc-300 hover:bg-white/[0.12] hover:text-white"
                                                        )}
                                                    >
                                                        {ph}<span className="mx-0.5 text-current/50">×</span>{pa}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                        {firstScorerMarket && !isStarted && (
                            <div className="mt-2 rounded-[12px] border border-white/10 bg-black/10 p-2.5">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">{t('palpites.extra_market_label')}</p>
                                        <p className="mt-0.5 font-display text-[1.2rem] font-semibold uppercase leading-none text-white">{t('palpites.first_scorer_title')}</p>
                                    </div>
                                    <Tooltip delayDuration={200}>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-300"
                                                aria-label={t('palpites.market_help_aria', { title: firstScorerMarket.title })}
                                            >
                                                <CircleHelp className="h-3.5 w-3.5 text-primary" />
                                                {t('palpites.how_it_scores')}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-[240px] rounded-2xl border-white/10 bg-zinc-950 px-4 py-3 text-left text-xs text-zinc-200">
                                            <p className="mb-1 text-[11px] font-black uppercase tracking-[0.16em] text-primary">{firstScorerMarket.title}</p>
                                            <p>{firstScorerMarket.help_text || firstScorerMarket.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>

                                <div className="grid gap-2 md:grid-cols-3">
                                    {[
                                        { value: m.home_team_code, label: m.home_team_code },
                                        { value: m.away_team_code, label: m.away_team_code },
                                        { value: "none", label: t('palpites.no_goals') },
                                    ].map((option) => {
                                        const isSelected = currentFirstScorer === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => updateFirstScorer(m.id, option.value)}
                                                className={cn(
                                                    "rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all",
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
                                        {t('palpites.saved_label')} <span className="font-black text-white">{savedFirstScorer === "none" ? t('palpites.no_goals') : savedFirstScorer}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="relative z-20 mt-3 flex flex-col gap-2">
                            {!isStarted && (
                                <button
                                    onClick={() => handleSave(m.id, m.home_team_code, m.away_team_code)}
                                    disabled={!canSave || savingMatchId === m.id}
                                    className={cn(
                                        "arena-button-gold w-full py-3 rounded-[12px] text-[1rem] font-black uppercase tracking-wider disabled:opacity-50 disabled:hover:scale-100 transition-all",
                                        canSave
                                            ? ""
                                            : "border-white/10 bg-white/5 text-gray-400 shadow-none hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    {savingMatchId === m.id
                                        ? t('palpites.saving_cta', 'Salvando...')
                                        : hasSavedPrediction && !isDirty
                                            ? t('palpites.saved_cta', 'Palpite Salvo')
                                            : t('palpites.save_cta', 'Salvar Palpite')}
                                </button>
                            )}
                            
                            <div className="flex gap-2">
                                {hasSavedPrediction && (
                                    <button
                                        onClick={() => openShareModal(m.id, m.home_team_code, m.away_team_code)}
                                        className="flex-1 arena-button-green rounded-[12px] py-2.5 flex items-center justify-center gap-2 text-[0.8rem] font-bold uppercase tracking-wider transition-all hover:brightness-110"
                                        aria-label={t('palpites.share_prediction_aria', { home: m.home_team_code, away: m.away_team_code })}
                                    >
                                        <Share2 className="h-4 w-4" />
                                        {t('palpites.share_button', 'Compartilhar')}
                                    </button>
                                )}
                                
                                <button
                                    onClick={() => {
                                        setPublicPicksMatchId(m.id);
                                        setPublicPicksDialogOpen(true);
                                    }}
                                    className="flex-1 arena-button-zinc rounded-[12px] py-2.5 flex items-center justify-center gap-2 text-[0.8rem] font-bold uppercase tracking-wider transition-all hover:bg-white/20"
                                    title={t('palpites.view_public_picks', 'Ver Palpites da Galera')}
                                >
                                    <Users className="h-4 w-4" />
                                    {t('palpites.view_public_picks_short', 'Palpites da Galera')}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}

            <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
                <DialogContent className="max-w-sm rounded-[40px] border-white/10 bg-[#050505] p-8 text-center shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="mx-auto font-display text-[2.1rem] font-semibold uppercase tracking-[0.03em]">{t('palpites.share_title')}</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 mt-6">
                        <button disabled={isGenerating} onClick={() => handleShare('whatsapp')} className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] py-4 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-[#1EBE5C] disabled:opacity-50">
                            <MessageCircle className="w-5 h-5" /> {t('palpites.share_whatsapp')}
                        </button>
                        <button disabled={isGenerating} onClick={() => handleShare('copy')} className="w-full flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-white/10 disabled:opacity-50">
                            <Copy className="w-5 h-5" /> {t('palpites.copy_image')}
                        </button>
                        <button disabled={isGenerating} onClick={() => handleShare('download')} className="w-full flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-white/10 disabled:opacity-50">
                            <Download className="w-5 h-5" /> {t('palpites.save_gallery')}
                        </button>
                    </div>

                    <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true" ref={shareRef}>
                        {shareData && <ShareCardGenerator type="my_palpite" format="story" data={shareData} />}
                    </div>
                </DialogContent>
            </Dialog>

            {publicPicksMatchId && (
                <MatchPublicPalpitesDialog
                    open={publicPicksDialogOpen}
                    onOpenChange={setPublicPicksDialogOpen}
                    bolaoId={bolaoId}
                    matchId={publicPicksMatchId}
                    matchHomeCode={matches.find(m => m.id === publicPicksMatchId)?.home_team_code || ""}
                    matchAwayCode={matches.find(m => m.id === publicPicksMatchId)?.away_team_code || ""}
                />
            )}

            {/* Batch save — floats once 2+ matches have unsaved valid scores,
                so users send all picks in one tap instead of saving game-by-game. */}
            <AnimatePresence>
                {saveableCount >= 2 && (
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ duration: 0.2 }}
                        className="sticky bottom-3 z-30 mx-auto flex w-full max-w-md justify-center px-2"
                    >
                        <button
                            onClick={() => void handleSaveAll()}
                            disabled={savingAll}
                            className="arena-button-gold flex w-full items-center justify-center gap-2 rounded-[16px] py-3.5 text-[0.95rem] font-black uppercase tracking-wider shadow-[0_12px_32px_-8px_rgba(0,0,0,0.7)] disabled:opacity-60"
                        >
                            {savingAll ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                                    {t('palpites.saving_cta', 'Salvando...')}
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5" />
                                    {t('palpites.batch_save_cta', { count: saveableCount, defaultValue: `Salvar ${saveableCount} palpites` })}
                                </>
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
