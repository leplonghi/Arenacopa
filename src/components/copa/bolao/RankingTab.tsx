import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { matches as mockMatches } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { type MemberData, type Palpite, type ExtraBet, type ScoringRules } from "@/types/bolao";
import { EmptyState } from "@/components/EmptyState";
import { calculatePoints } from "@/utils/bolaoUtils";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Target, Check, Award, Crown, Minus, TrendingUp, Star, ChevronRight } from "lucide-react";
import { staggerContainer, staggerItem } from "../animations";
import { useMatches } from "@/hooks/useMatches";
import { Skeleton } from "@/components/ui/skeleton";

interface RankingTabProps {
    members: MemberData[];
    palpites: Palpite[];
    extraBets?: ExtraBet[];
    scoringRules?: ScoringRules;
}

export function RankingTab({ members, palpites, extraBets = [], scoringRules }: RankingTabProps) {
    const { t } = useTranslation('bolao');
    const { data: supabaseMatches, isLoading } = useMatches();

    const matches = supabaseMatches || mockMatches;
    const finishedMatches = useMemo(() => matches.filter(m => m.status === "finished"), [matches]);

    const ranking = useMemo(() => {
        if (isLoading) return [];
        return members.map(m => {
            const memberPalpites = palpites.filter(p => p.user_id === m.user_id);
            let totalPoints = 0;
            let exactCount = 0;
            let winnerCount = 0;
            let drawCount = 0;

            memberPalpites.forEach(p => {
                const match = finishedMatches.find(fm => fm.id === p.match_id);
                const result = calculatePoints(p, match, scoringRules);
                totalPoints += result.points;

                if (result.type === 'exact') exactCount++;
                else if (result.type === 'winner') winnerCount++;
                else if (result.type === 'draw') drawCount++;
            });

            const memberExtras = extraBets.filter(e => e.user_id === m.user_id);
            const extraPoints = memberExtras.reduce((acc, curr) => acc + (curr.points_awarded || 0), 0);
            totalPoints += extraPoints;

            return {
                ...m,
                palpiteCount: memberPalpites.length,
                points: totalPoints,
                exactCount,
                winnerCount,
                drawCount,
                extraPoints
            };
        }).sort((a, b) => b.points - a.points || b.palpiteCount - a.palpiteCount);
    }, [members, palpites, extraBets, finishedMatches, isLoading, scoringRules]);

    if (isLoading) {
        return (
            <div className="space-y-4 pt-8">
                <div className="flex justify-center gap-4 mb-12">
                    <Skeleton className="h-40 w-32 rounded-3xl" />
                    <Skeleton className="h-48 w-40 rounded-3xl" />
                    <Skeleton className="h-32 w-32 rounded-3xl" />
                </div>
                <div className="space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (ranking.length === 0) {
        return (
            <div className="mt-8">
                <EmptyState icon="🏆" title={t('ranking.empty_title')} description={t('ranking.empty_desc')} />
            </div>
        );
    }

    const exactPts = scoringRules?.exact ?? 5;
    const winnerPts = scoringRules?.winner ?? 3;
    const drawPts = scoringRules?.draw ?? 2;

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* Top 3 Podium - High End Design */}
            {ranking.length >= 3 && (
                <div className="flex items-end justify-center gap-3 pt-12 pb-6 px-2 relative min-h-[260px]">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-50" />

                    {/* 2nd Place */}
                    <motion.div
                        variants={staggerItem}
                        className="flex flex-col items-center gap-2 relative z-10 w-1/3 max-w-[120px]"
                    >
                        <div className="relative group">
                            <div className="w-16 h-16 rounded-2xl p-1 bg-gradient-to-br from-gray-300 to-gray-500 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-transform group-hover:scale-105">
                                <div className="w-full h-full rounded-[14px] bg-black flex items-center justify-center text-xs font-black overflow-hidden border border-white/10">
                                    {ranking[1].profile?.avatar_url ?
                                        <img src={ranking[1].profile.avatar_url} alt="" className="w-full h-full object-cover" /> :
                                        <span className="text-gray-400">{ranking[1].profile?.name.slice(0, 2).toUpperCase()}</span>}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gray-400 text-xs font-black flex items-center justify-center text-gray-950 border-4 border-[#121212] shadow-xl">
                                2
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-[10px] font-black uppercase tracking-widest block truncate text-gray-500 mb-1">
                                {(ranking[1].profile?.name || t('ranking.default_user')).split(" ")[0]}
                            </span>
                            <span className="text-xl font-black text-white">{ranking[1].points}<span className="text-[10px] ml-1 text-gray-600">PTS</span></span>
                        </div>
                        <div className="w-full h-20 bg-gradient-to-t from-gray-500/20 to-white/5 backdrop-blur-xl rounded-t-3xl border-x border-t border-white/10 flex items-center justify-center shadow-2xl">
                            <Award className="w-8 h-8 text-gray-400/20" />
                        </div>
                    </motion.div>

                    {/* 1st Place */}
                    <motion.div
                        variants={staggerItem}
                        className="flex flex-col items-center gap-2 relative z-20 w-1/3 max-w-[140px] -mt-16"
                    >
                        <motion.div
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-10"
                        >
                            <Crown className="w-10 h-10 text-yellow-500 filter drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]" />
                        </motion.div>

                        <div className="relative group">
                            <div className="w-20 h-20 rounded-3xl p-1 bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 shadow-[0_15px_30px_rgba(234,179,8,0.2)] transition-transform group-hover:scale-110">
                                <div className="w-full h-full rounded-[22px] bg-black flex items-center justify-center text-sm font-black overflow-hidden border border-white/10">
                                    {ranking[0].profile?.avatar_url ?
                                        <img src={ranking[0].profile.avatar_url} alt="" className="w-full h-full object-cover" /> :
                                        <span className="text-yellow-500">{ranking[0].profile?.name.slice(0, 2).toUpperCase()}</span>}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-yellow-500 text-sm font-black flex items-center justify-center text-yellow-950 border-4 border-[#121212] shadow-2xl">
                                1
                            </div>
                        </div>

                        <div className="text-center mt-3">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] block truncate text-yellow-500 mb-1">
                                {(ranking[0].profile?.name || t('ranking.default_user')).split(" ")[0]}
                            </span>
                            <span className="text-2xl font-black text-white">{ranking[0].points}<span className="text-[12px] ml-1 text-gray-500 tracking-normal">PTS</span></span>
                        </div>
                        <div className="w-full h-32 bg-gradient-to-t from-yellow-500/20 via-yellow-400/5 to-transparent backdrop-blur-xl rounded-t-[40px] border-x border-t border-yellow-500/30 shadow-[0_-15px_50px_rgba(234,179,8,0.15)] flex flex-col items-center pt-6">
                            <Trophy className="w-10 h-10 text-yellow-500/30" />
                        </div>
                    </motion.div>

                    {/* 3rd Place */}
                    <motion.div
                        variants={staggerItem}
                        className="flex flex-col items-center gap-2 relative z-10 w-1/3 max-w-[120px]"
                    >
                        <div className="relative group">
                            <div className="w-16 h-16 rounded-2xl p-1 bg-gradient-to-br from-amber-600 to-orange-800 shadow-[0_10px_20px_rgba(0,0,0,0.4)] transition-transform group-hover:scale-105">
                                <div className="w-full h-full rounded-[14px] bg-black flex items-center justify-center text-xs font-black overflow-hidden border border-white/10">
                                    {ranking[2].profile?.avatar_url ?
                                        <img src={ranking[2].profile.avatar_url} alt="" className="w-full h-full object-cover" /> :
                                        <span className="text-amber-600">{ranking[2].profile?.name.slice(0, 2).toUpperCase()}</span>}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-600 text-xs font-black flex items-center justify-center text-white border-4 border-[#121212] shadow-xl">
                                3
                            </div>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-[10px] font-black uppercase tracking-widest block truncate text-amber-700 mb-1">
                                {(ranking[2].profile?.name || t('ranking.default_user')).split(" ")[0]}
                            </span>
                            <span className="text-xl font-black text-white">{ranking[2].points}<span className="text-[10px] ml-1 text-gray-600">PTS</span></span>
                        </div>
                        <div className="w-full h-14 bg-gradient-to-t from-amber-800/20 to-white/5 backdrop-blur-xl rounded-t-3xl border-x border-t border-white/10 flex items-center justify-center shadow-xl">
                            <Award className="w-8 h-8 text-amber-600/20" />
                        </div>
                    </motion.div>
                </div>
            )}

            {/* List Header */}
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t('ranking.full_table')}</h3>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
            </div>

            {/* Full List - Premium Scroll */}
            <div className="space-y-2 pb-10">
                {ranking.map((r, i) => {
                    const name = r.profile?.name || t('ranking.default_user');
                    const isTop3 = i < 3;
                    const isMe = false; // Add real logic if available

                    return (
                        <motion.div
                            key={r.user_id}
                            variants={staggerItem}
                            whileHover={{ scale: 1.01, x: 4 }}
                            className={cn(
                                "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all cursor-default relative overflow-hidden group",
                                i === 0 ? "bg-gradient-to-r from-yellow-500/10 via-yellow-500/[0.03] to-transparent border-yellow-500/30 shadow-[0_0_25px_rgba(234,179,8,0.1)]" :
                                    i === 1 ? "bg-gradient-to-r from-gray-400/10 via-gray-400/[0.03] to-transparent border-gray-400/30" :
                                        i === 2 ? "bg-gradient-to-r from-amber-600/10 via-amber-600/[0.03] to-transparent border-amber-600/30" :
                                            "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]"
                            )}
                        >
                            {/* Position Indicator */}
                            <div className="w-8 shrink-0 flex items-center justify-center relative">
                                <span className={cn(
                                    "text-lg font-black italic tracking-tighter transition-all group-hover:scale-110",
                                    i === 0 ? "text-yellow-500" :
                                        i === 1 ? "text-gray-400" :
                                            i === 2 ? "text-amber-600" :
                                                "text-gray-600 group-hover:text-gray-400"
                                )}>
                                    {i + 1}
                                </span>
                            </div>

                            {/* Avatar */}
                            <div className="relative shrink-0 transition-transform group-hover:scale-105">
                                <div className={cn(
                                    "w-11 h-11 rounded-xl flex items-center justify-center p-0.5",
                                    isTop3 ? (i === 0 ? "bg-yellow-500/50" : i === 1 ? "bg-gray-400/50" : "bg-amber-600/50") : "bg-white/10"
                                )}>
                                    <div className="w-full h-full rounded-[10px] bg-black flex items-center justify-center text-[10px] font-black overflow-hidden border border-white/10">
                                        {r.profile?.avatar_url ?
                                            <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" /> :
                                            <span className="text-gray-500">{name.slice(0, 2).toUpperCase()}</span>
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={cn(
                                        "text-sm font-black truncate tracking-tight transition-colors",
                                        isTop3 ? "text-white" : "text-gray-300 group-hover:text-white"
                                    )}>
                                        {name}
                                    </span>
                                    {i === 0 && (
                                        <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-0.5 rounded-lg border border-yellow-500/30">
                                            <Crown className="w-2.5 h-2.5 text-yellow-500 shrink-0" />
                                            <span className="text-[8px] font-black text-yellow-500 uppercase">LEADER</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-widest group-hover:text-gray-400 transition-colors">
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                        {r.palpiteCount} <span className="text-[8px] opacity-60">GUESSES</span>
                                    </div>
                                    {r.exactCount > 0 && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-black">
                                            <Target className="w-3 h-3 group-hover:animate-pulse" />
                                            {r.exactCount} <span className="text-[8px] opacity-60">EXACT</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Points Badge */}
                            <div className="text-right">
                                <div className={cn(
                                    "px-4 py-2 rounded-2xl border-2 transition-all group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
                                    i === 0 ? "bg-yellow-500/20 border-yellow-500 shadow-xl" :
                                        i === 1 ? "bg-gray-400/10 border-gray-400 shadow-lg" :
                                            i === 2 ? "bg-amber-600/10 border-amber-600 shadow-md" :
                                                "bg-white/5 border-white/5 group-hover:border-white/20"
                                )}>
                                    <span className={cn(
                                        "text-lg font-black block leading-none tracking-tighter",
                                        isTop3 ? "text-white" : "text-gray-300 group-hover:text-white"
                                    )}>
                                        {r.points}
                                    </span>
                                    <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest">{t('ranking.points_abbr')}</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Legend - High End Design */}
            <motion.div
                variants={staggerItem}
                className="rounded-[40px] border border-white/5 p-8 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                <div className="flex items-center gap-3 mb-8 justify-center">
                    <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">{t('ranking.legend_rules')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-3 gap-4">
                    <LegendItem icon={<Target className="w-6 h-6" />} label={t('ranking.legend_exact')} points={exactPts} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
                    <LegendItem icon={<Check className="w-6 h-6" />} label={t('ranking.legend_winner')} points={winnerPts} color="text-amber-500" bg="bg-amber-500/10" border="border-amber-500/20" />
                    <LegendItem icon={<Minus className="w-6 h-6" />} label={t('ranking.legend_draw')} points={drawPts} color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" />
                </div>

                <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-600">
                        <Award className="w-3 h-3" />
                        {t('ranking.powerplay_reminder')}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function LegendItem({ icon, label, points, color, bg, border }: { icon: React.ReactNode; label: string; points: number; color: string; bg: string; border: string }) {
    return (
        <div className={cn("group rounded-3xl p-6 border transition-all hover:scale-105 hover:shadow-2xl flex flex-col items-center text-center", bg, border)}>
            <div className={cn("mb-4 transform group-hover:rotate-12 transition-transform", color)}>{icon}</div>
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 leading-tight px-2">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className={cn("text-2xl font-black", color)}>{points}</span>
                <span className="text-[10px] font-black text-gray-600">PTS</span>
            </div>
        </div>
    );
}

