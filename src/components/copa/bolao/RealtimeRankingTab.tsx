import { useEffect, useMemo, useState } from "react";
import { db } from "@/integrations/firebase/client";
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    getDocs
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Target, Award, Crown, TrendingUp, Minus, Check } from "lucide-react";
import { staggerContainer, staggerItem } from "../animations";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import type { ScoringRules } from "@/types/bolao";
import { RankingBreakdownCard, type RankingBreakdown } from "./ranking/RankingBreakdownCard";
import { RankingLegend } from "./ranking/RankingLegend";

type RankingProfile = {
    user_id: string;
    name: string | null;
    avatar_url: string | null;
};

type RankingRow = {
    user_id: string;
    total_points: number;
    exact_matches: number;
    correct_results: number;
    draws?: number;
    palpites_count?: number;
    points_breakdown?: Partial<RankingBreakdown>;
    match_points?: number;
    phase_points?: number;
    tournament_points?: number;
    special_points?: number;
    profile?: RankingProfile;
};

function asNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeBreakdown(row: RankingRow): RankingBreakdown {
    const nested = row.points_breakdown ?? {};
    const match = asNumber(nested.match) || asNumber(row.match_points);
    const phase = asNumber(nested.phase) || asNumber(row.phase_points);
    const tournament = asNumber(nested.tournament) || asNumber(row.tournament_points);
    const special = asNumber(nested.special) || asNumber(row.special_points);

    if (match || phase || tournament || special) {
        return { match, phase, tournament, special };
    }

    return {
        match: row.total_points || 0,
        phase: 0,
        tournament: 0,
        special: 0,
    };
}

export function RealtimeRankingTab({ bolaoId, rules }: { bolaoId: string; rules?: ScoringRules }) {
    const { t } = useTranslation('bolao');
    const [rankings, setRankings] = useState<RankingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const { user } = useAuth();

    // Default scoring rules for legend
    const exactPts = rules?.exact ?? 5;
    const winnerPts = rules?.winner ?? 3;
    const drawPts = rules?.draw ?? 2;
    const myRanking = useMemo(() => rankings.find((ranking) => ranking.user_id === user?.id) ?? null, [rankings, user?.id]);

    useEffect(() => {
        const rankingsRef = collection(db, 'bolao_rankings');
        const q = query(
            rankingsRef, 
            where('bolao_id', '==', bolaoId), 
            orderBy('total_points', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            setHasError(false);
            const rankingData = snapshot.docs.map(doc => ({ 
                ...doc.data(), 
                user_id: doc.id.includes('_') ? doc.id.split('_')[0] : doc.id 
            })) as RankingRow[];
            
            if (rankingData.length > 0) {
                const userIds = rankingData.map(d => d.user_id);
                
                const profilesRef = collection(db, "profiles");
                const profileChunks: RankingProfile[] = [];
                
                // Firestore "in" query limited to 30 items
                for (let i = 0; i < userIds.length; i += 30) {
                    const chunkIds = userIds.slice(i, i + 30);
                    const pq = query(profilesRef, where("user_id", "in", chunkIds));
                    const pSnap = await getDocs(pq);
                    pSnap.forEach(doc => {
                        const data = doc.data();
                        profileChunks.push({ 
                            user_id: typeof data.user_id === "string" ? data.user_id : doc.id, 
                            name: data.displayName || data.name || null,
                            avatar_url: data.photoURL || data.avatar_url || null
                        });
                    });
                }

                const joined = rankingData.map(d => {
                    const p = profileChunks.find(p => p.user_id === d.user_id);
                    return { ...d, profile: p, points_breakdown: normalizeBreakdown(d) };
                });
                
                setRankings(joined);
            } else {
                setRankings([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error in ranking snapshot:", error);
            setHasError(true);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [bolaoId]);

    if (loading) {
        return (
            <div className="space-y-4 pt-8">
                <div className="flex justify-center gap-4 mb-12">
                    <Skeleton className="h-40 w-32 rounded-3xl bg-white/5" />
                    <Skeleton className="h-48 w-40 rounded-3xl bg-white/5" />
                    <Skeleton className="h-32 w-32 rounded-3xl bg-white/5" />
                </div>
                <div className="space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl bg-white/5" />
                    ))}
                </div>
            </div>
        );
    }

    if (rankings.length === 0) {
        return (
            <div className="mt-8">
                <EmptyState
                    icon={hasError ? "⚠️" : "🏆"}
                    title={hasError ? "Ranking indisponível agora" : t('ranking.empty_title')}
                    description={hasError ? "Não consegui atualizar a classificação em tempo real. Tenta novamente em alguns instantes." : t('ranking.empty_desc')}
                />
            </div>
        );
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* Top 3 Podium - Layered & Fragmented Design */}
            {rankings.length >= 3 && (
                <div className="pt-24 pb-12 px-2 relative min-h-[380px] perspective-1000">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-copa-gold/10 rounded-full blur-[100px] z-0" />
                    
                    <div className="flex items-end justify-center relative translate-z-10 transform-3d">
                        {/* 2nd Place */}
                        <motion.div
                            variants={staggerItem}
                            whileHover={{ scale: 1.05, translateZ: "20px" }}
                            className="flex flex-col items-center gap-2 relative z-10 w-1/3 max-w-[120px] -mr-4 -rotate-y-12 translate-y-4"
                        >
                            <div className="relative group">
                                <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600 shadow-2xl transition-transform">
                                    <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center text-xs font-black overflow-hidden border border-white/5 relative">
                                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                        {rankings[1].profile?.avatar_url ?
                                            <img src={rankings[1].profile.avatar_url} alt="" className="w-full h-full object-cover" /> :
                                            <span className="text-gray-400">{(rankings[1].profile?.name || "??").slice(0, 2).toUpperCase()}</span>}
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-zinc-400 text-xs font-black flex items-center justify-center text-zinc-950 border-4 border-[#0a0a0a] shadow-xl">
                                    2
                                </div>
                            </div>
                            <div className="text-center mt-2 group">
                                <span className="text-[10px] font-black uppercase tracking-widest block truncate text-zinc-500 mb-1 font-display">
                                    {(rankings[1].profile?.name || t('ranking.default_user')).split(" ")[0]}
                                </span>
                                <span className="text-lg font-black text-white font-display leading-none">
                                    {rankings[1].total_points}<span className="text-[10px] ml-0.5 text-zinc-600">PTS</span>
                                </span>
                            </div>
                            <div className="w-full h-24 bg-gradient-to-t from-zinc-800/40 via-zinc-800/10 to-transparent backdrop-blur-xl rounded-t-3xl border-x border-t border-white/5 flex items-center justify-center shadow-inner pt-4">
                                <Award className="w-8 h-8 text-zinc-600/20" />
                            </div>
                        </motion.div>

                        {/* 1st Place */}
                        <motion.div
                            variants={staggerItem}
                            whileHover={{ scale: 1.05, translateZ: "50px" }}
                            className="flex flex-col items-center gap-2 relative z-30 w-1/3 max-w-[160px] translate-z-20 transform-3d"
                        >
                            <motion.div
                                animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-16 z-40"
                            >
                                <Crown className="w-12 h-12 text-copa-gold filter drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
                            </motion.div>

                            <div className="relative group">
                                <div className="absolute inset-0 bg-copa-gold/20 blur-[30px] rounded-full scale-125 opacity-50 group-hover:opacity-100 transition-opacity" />
                                <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-br from-copa-gold via-yellow-400 to-amber-600 shadow-[0_20px_40px_rgba(234,179,8,0.25)] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-1/2 w-full animate-pulse-slow pointer-events-none" />
                                    <div className="w-full h-full rounded-[22px] bg-zinc-950 flex items-center justify-center text-sm font-black overflow-hidden border border-white/10 relative">
                                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                        {rankings[0].profile?.avatar_url ?
                                            <img src={rankings[0].profile.avatar_url} alt="" className="w-full h-full object-cover" /> :
                                            <span className="text-copa-gold text-lg">{(rankings[0].profile?.name || "??").slice(0, 2).toUpperCase()}</span>}
                                    </div>
                                </div>
                                <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-copa-gold text-base font-black flex items-center justify-center text-zinc-950 border-4 border-[#0a0a0a] shadow-2xl z-20">
                                    1
                                </div>
                            </div>

                            <div className="text-center mt-4">
                                <span className="text-[11px] font-black uppercase tracking-[0.3em] block truncate text-copa-gold mb-1 font-display">
                                    {(rankings[0].profile?.name || t('ranking.default_user')).split(" ")[0]}
                                </span>
                                <span className="text-3xl font-black text-white font-display tracking-tight leading-none">
                                    {rankings[0].total_points}<span className="text-[12px] ml-1 text-zinc-500 font-sans tracking-normal font-bold">PTS</span>
                                </span>
                            </div>
                            
                            <div className="w-full h-40 bg-gradient-to-t from-copa-gold/20 via-copa-gold/5 to-transparent backdrop-blur-2xl rounded-t-[48px] border-x border-t border-copa-gold/20 shadow-[0_-20px_60px_rgba(234,179,8,0.15)] flex flex-col items-center pt-8 relative overflow-hidden mt-2">
                                <Trophy className="w-12 h-12 text-copa-gold/20" />
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-copa-gold/40 to-transparent" />
                            </div>
                        </motion.div>

                        {/* 3rd Place */}
                        <motion.div
                            variants={staggerItem}
                            whileHover={{ scale: 1.05, translateZ: "20px" }}
                            className="flex flex-col items-center gap-2 relative z-10 w-1/3 max-w-[120px] -ml-4 rotate-y-12 translate-y-8"
                        >
                            <div className="relative group">
                                <div className="w-16 h-16 rounded-2xl p-0.5 bg-gradient-to-br from-amber-600 via-amber-700 to-orange-900 shadow-2xl transition-transform">
                                    <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center text-xs font-black overflow-hidden border border-white/5 relative">
                                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                        {rankings[2].profile?.avatar_url ?
                                            <img src={rankings[2].profile.avatar_url} alt="" className="w-full h-full object-cover" /> :
                                            <span className="text-amber-700">{(rankings[2].profile?.name || "??").slice(0, 2).toUpperCase()}</span>}
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-700 text-xs font-black flex items-center justify-center text-white border-4 border-[#0a0a0a] shadow-xl">
                                    3
                                </div>
                            </div>
                            <div className="text-center mt-2">
                                <span className="text-[10px] font-black uppercase tracking-widest block truncate text-amber-800 mb-1 font-display">
                                    {(rankings[2].profile?.name || t('ranking.default_user')).split(" ")[0]}
                                </span>
                                <span className="text-lg font-black text-white font-display leading-none">
                                    {rankings[2].total_points}<span className="text-[10px] ml-0.5 text-zinc-600">PTS</span>
                                </span>
                            </div>
                            <div className="w-full h-16 bg-gradient-to-t from-amber-900/40 via-amber-900/10 to-transparent backdrop-blur-xl rounded-t-3xl border-x border-t border-white/5 flex items-center justify-center shadow-inner pt-2">
                                <Award className="w-8 h-8 text-amber-900/20" />
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}

            {myRanking && (
                <motion.div variants={staggerItem}>
                    <RankingBreakdownCard
                        breakdown={normalizeBreakdown(myRanking)}
                        title={t("ranking.breakdown_title")}
                        description={t("ranking.breakdown_desc")}
                        labels={{
                            match: t("ranking.category_match"),
                            phase: t("ranking.category_phase"),
                            tournament: t("ranking.category_tournament"),
                            special: t("ranking.category_special"),
                        }}
                    />
                </motion.div>
            )}

            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-copa-gold rounded-full" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 font-display">{t('ranking.full_table')}</h3>
                </div>
                <div className="flex-1 mx-6 h-px bg-zinc-800/50" />
            </div>

            <div className="grid grid-cols-1 gap-3 pb-20 px-1 perspective-1000">
                {rankings.map((r, i) => {
                    const name = r.profile?.name || t('ranking.default_user');
                    const isTop3 = i < 3;
                    const isMe = r.user_id === user?.id;
                    const breakdown = normalizeBreakdown(r);
                    const breakdownItems = [
                        { key: "match", label: t("ranking.category_match_short"), value: breakdown.match },
                        { key: "phase", label: t("ranking.category_phase_short"), value: breakdown.phase },
                        { key: "tournament", label: t("ranking.category_tournament_short"), value: breakdown.tournament },
                        { key: "special", label: t("ranking.category_special_short"), value: breakdown.special },
                    ].filter((item) => item.value > 0);

                    return (
                        <motion.div
                            key={r.user_id}
                            variants={staggerItem}
                            whileHover={{ scale: 1.02, translateX: isMe ? 0 : 8, translateZ: "10px", rotateY: isMe ? 0 : -2 }}
                            className={cn(
                                "flex items-center gap-4 px-6 py-5 rounded-[28px] border transition-all cursor-default relative overflow-hidden group transform-3d shadow-sm",
                                i === 0 ? "bg-gradient-to-r from-copa-gold/20 via-copa-gold/[0.05] to-transparent border-copa-gold/40 shadow-[0_10px_30px_rgba(234,179,8,0.15)] ring-1 ring-copa-gold/20" :
                                    i === 1 ? "bg-gradient-to-r from-zinc-400/15 via-zinc-400/[0.05] to-transparent border-zinc-400/40" :
                                        i === 2 ? "bg-gradient-to-r from-amber-700/15 via-amber-700/[0.05] to-transparent border-amber-800/40" :
                                            isMe ? "bg-copa-green/10 border-copa-green-light/40 shadow-lg" : "bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-800/60"
                            )}
                        >
                            <div className="w-10 shrink-0 flex items-center justify-center relative">
                                <span className={cn(
                                    "text-2xl font-black font-display italic tracking-tighter transition-all group-hover:scale-110",
                                    i === 0 ? "text-copa-gold drop-shadow-sm" :
                                        i === 1 ? "text-zinc-400" :
                                            i === 2 ? "text-amber-700" :
                                                isMe ? "text-copa-green-light" : "text-zinc-700 group-hover:text-zinc-400"
                                )}>
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                            </div>

                            <div className="relative shrink-0 transition-transform group-hover:scale-105 group-hover:rotate-3">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center p-0.5",
                                    isTop3 ? (i === 0 ? "bg-copa-gold/50" : i === 1 ? "bg-zinc-400/50" : "bg-amber-700/50") : isMe ? "bg-copa-green-light/50" : "bg-white/10"
                                )}>
                                    <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center text-[10px] font-black overflow-hidden border border-zinc-800 relative">
                                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                        {r.profile?.avatar_url ?
                                            <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" /> :
                                            <span className="text-zinc-500">{name.slice(0, 2).toUpperCase()}</span>
                                        }
                                    </div>
                                </div>
                                {isMe && (
                                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-copa-green-light border-2 border-[#0a0a0a] shadow-lg animate-pulse" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                        "text-base font-black truncate tracking-tight transition-colors font-display",
                                        isTop3 || isMe ? "text-white" : "text-zinc-400 group-hover:text-white"
                                    )}>
                                        {name} {isMe && <span className="text-[10px] text-copa-green-light ml-1 opacity-80">(VOCÊ)</span>}
                                    </span>
                                    {i === 0 && (
                                        <div className="flex items-center gap-1.5 bg-copa-gold/20 px-2 py-0.5 rounded-full border border-copa-gold/30">
                                            <Crown className="w-2.5 h-2.5 text-copa-gold shrink-0" />
                                            <span className="text-[8px] font-black text-copa-gold uppercase tracking-tighter">LEADER</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest group-hover:text-zinc-400 transition-colors">
                                        <Target className="w-3.5 h-3.5 text-emerald-500/70" />
                                        {r.exact_matches} <span className="text-[9px] opacity-60 font-sans tracking-normal font-medium">EXATOS</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest group-hover:text-zinc-400 transition-colors">
                                        <Check className="w-3.5 h-3.5 text-amber-500/70" />
                                        {r.correct_results} <span className="text-[9px] opacity-60 font-sans tracking-normal font-medium">ACERTOS</span>
                                    </div>
                                </div>
                                {breakdownItems.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {breakdownItems.map((item) => (
                                            <span
                                                key={`${r.user_id}-${item.key}`}
                                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-300"
                                            >
                                                {item.label}: {item.value}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="text-right">
                                <div className={cn(
                                    "px-5 py-2.5 rounded-2xl border-2 transition-all group-hover:shadow-[0_0_20px_rgba(254,215,170,0.1)]",
                                    i === 0 ? "bg-copa-gold/30 border-copa-gold shadow-xl rotate-1" :
                                        i === 1 ? "bg-zinc-400/20 border-zinc-400 shadow-lg -rotate-1" :
                                            i === 2 ? "bg-amber-700/20 border-amber-800 shadow-md rotate-1" :
                                                isMe ? "bg-copa-green/30 border-copa-green-light/50" : "bg-white/5 border-white/5 group-hover:border-white/20"
                                )}>
                                    <span className={cn(
                                        "text-xl font-black block leading-none tracking-tight font-display mb-0.5",
                                        isTop3 || isMe ? "text-white" : "text-zinc-300 group-hover:text-white"
                                    )}>
                                        {r.total_points}
                                    </span>
                                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em]">{t('ranking.points_abbr')}</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div variants={staggerItem}>
                <RankingLegend
                    exactLabel={t("ranking.legend_exact")}
                    winnerLabel={t("ranking.legend_winner")}
                    drawLabel={t("ranking.legend_draw")}
                    exactPoints={exactPts}
                    winnerPoints={winnerPts}
                    drawPoints={drawPts}
                    rulesTitle={t("ranking.legend_rules")}
                    categoriesTitle={t("ranking.legend_categories")}
                    categoryLabels={{
                        match: t("ranking.category_match"),
                        phase: t("ranking.category_phase"),
                        tournament: t("ranking.category_tournament"),
                        special: t("ranking.category_special"),
                    }}
                />
            </motion.div>
        </motion.div>
    );
}
