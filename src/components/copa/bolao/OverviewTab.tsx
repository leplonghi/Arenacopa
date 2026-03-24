import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Users, BarChart3, TrendingUp, ChevronRight, UserPlus, Share2, Calendar, Swords, Zap, Check, MapPin, Activity, Trophy, Layers3, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { matches as mockMatches, getTeam, type Match } from "@/data/mockData";
import { useMatches } from "@/hooks/useMatches";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type BolaoActivity, type BolaoData, type BolaoMarket, type BolaoPrediction, type MemberData, type Palpite } from "@/types/bolao";
import { MatchDetailsModal } from "@/components/copa/MatchDetailsModal";
import { useDateLocale } from "@/hooks/useDateLocale";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "../animations";

interface OverviewTabProps {
    bolao: BolaoData;
    members: MemberData[];
    isCreator: boolean;
    palpites: Palpite[];
    markets: BolaoMarket[];
    marketPredictions: BolaoPrediction[];
    activityFeed: BolaoActivity[];
    userId: string;
    onShare: () => void;
}

function getScopeIcon(scope: BolaoMarket["scope"]) {
    switch (scope) {
        case "phase":
            return <Layers3 className="w-4 h-4 text-blue-400" />;
        case "tournament":
            return <Trophy className="w-4 h-4 text-amber-400" />;
        case "special":
            return <Sparkles className="w-4 h-4 text-fuchsia-400" />;
        default:
            return <Swords className="w-4 h-4 text-emerald-400" />;
    }
}

function formatActivityTime(value?: string) {
    if (!value) return "agora";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "agora";
    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function OverviewTab({ bolao, members, palpites, markets, marketPredictions, activityFeed, userId, onShare }: OverviewTabProps) {
    const { t } = useTranslation('bolao');
    const dateLocale = useDateLocale();
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const navigate = useNavigate();
    const { data: supabaseMatches, isLoading } = useMatches();

    const matches = supabaseMatches || mockMatches;
    const matchMarkets = markets.filter((market) => market.scope === "match");
    const uniqueMatchMarketIds = Array.from(new Set(matchMarkets.map((market) => market.match_id).filter(Boolean)));
    const exactScoreMarkets = matchMarkets.filter((market) => market.slug === "exact_score");
    const totalMatches =
        exactScoreMarkets.length ||
        uniqueMatchMarketIds.length ||
        matches.filter(m => m.phase === "groups").length;
    const myPalpites = palpites.filter(p => p.user_id === userId);
    const progress = totalMatches > 0 ? Math.round((myPalpites.length / totalMatches) * 100) : 0;
    const marketEngagement = useMemo(() => {
        if (markets.length === 0 || members.length === 0) return [];

        return markets
            .map((market) => {
                const savedCount = marketPredictions.filter((prediction) => prediction.market_id === market.id).length;
                const coverage = Math.round((savedCount / members.length) * 100);
                return {
                    market,
                    savedCount,
                    coverage,
                };
            })
            .sort((a, b) => b.coverage - a.coverage || b.savedCount - a.savedCount)
            .slice(0, 4);
    }, [marketPredictions, markets, members.length]);

    const nextMatches = matches
        .filter(m => m.status === "scheduled" && m.phase === "groups")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-32 rounded-3xl" />
                    <Skeleton className="h-32 rounded-3xl" />
                    <Skeleton className="h-32 rounded-3xl" />
                </div>
                <Skeleton className="h-48 rounded-[32px]" />
                <div className="space-y-3">
                    <Skeleton className="h-24 rounded-3xl" />
                    <Skeleton className="h-24 rounded-3xl" />
                </div>
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
            <MatchDetailsModal
                match={selectedMatch}
                isOpen={!!selectedMatch}
                onClose={() => setSelectedMatch(null)}
            />

            {/* Stats Dashboard - High End Rendering */}
            <div className="grid grid-cols-3 gap-3">
                <StatCard
                    icon={<Users className="w-5 h-5 text-emerald-400" />}
                    value={members.length}
                    label={t('overview.members_stat')}
                    subLabel="MEMBERS"
                    color="emerald"
                    delay={0.1}
                />
                <StatCard
                    icon={<BarChart3 className="w-5 h-5 text-amber-400" />}
                    value={markets.length > 0 ? markets.length : myPalpites.length}
                    label={t('overview.palpites_stat')}
                    subLabel={markets.length > 0 ? "MARKETS" : "PREDICTIONS"}
                    color="amber"
                    delay={0.2}
                />
                <StatCard
                    icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
                    value={`${progress}%`}
                    label={t('overview.progress_stat')}
                    subLabel="COMPLETE"
                    color="blue"
                    delay={0.3}
                />
            </div>

            {/* Tracking Progress Section */}
            <motion.div
                variants={staggerItem}
                className="rounded-[32px] p-6 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent border border-white/10 relative overflow-hidden group shadow-2xl"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t('overview.journey_title')}</h3>
                        </div>
                        <p className="text-xl font-black text-white tracking-tight leading-none">{t('overview.your_palpites')}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-white leading-none">{myPalpites.length}<span className="text-xs text-gray-500 ml-1">/ {totalMatches}</span></div>
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{t('overview.matches_predicted')}</span>
                    </div>
                </div>

                <div className="relative pt-4 pb-2">
                    <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 p-1 relative">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] relative"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                        </motion.div>
                    </div>

                    <div className="flex justify-between mt-3">
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{t('overview.kickoff')}</span>
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-[9px] font-black text-emerald-500 tracking-tighter uppercase">{progress}% READY</span>
                            </div>
                        </div>
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{t('overview.final')}</span>
                    </div>
                </div>

                {progress < 100 && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between group/tip cursor-pointer hover:bg-amber-500/10 transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover/tip:scale-110 transition-transform">
                                <Zap className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{t('common.tip')}</p>
                                <p className="text-[11px] font-bold text-gray-400">{t('overview.remaining_palpites', { count: totalMatches - myPalpites.length })}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-amber-500/50 group-hover/tip:translate-x-1 transition-transform" />
                    </motion.div>
                )}
            </motion.div>

            {/* Upcoming Actions Section */}
            {nextMatches.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t('overview.next_matches')}</h3>
                        </div>
                        <div className="h-px w-24 bg-gradient-to-r from-transparent to-white/10" />
                    </div>

                    <div className="grid gap-3">
                        {nextMatches.map((m, idx) => {
                            const home = getTeam(m.homeTeam);
                            const away = getTeam(m.awayTeam);
                            const hasPalpite = myPalpites.some(p => p.match_id === m.id);

                            return (
                                <motion.div
                                    key={m.id}
                                    variants={staggerItem}
                                    whileHover={{ x: 6, backgroundColor: "rgba(255,255,255,0.06)" }}
                                    onClick={() => setSelectedMatch(m)}
                                    className={cn(
                                        "rounded-3xl p-5 flex items-center gap-4 cursor-pointer border-2 transition-all relative overflow-hidden group",
                                        hasPalpite
                                            ? "border-emerald-500/20 bg-emerald-500/[0.02]"
                                            : "bg-white/5 border-white/5 hover:border-white/10"
                                    )}
                                >
                                    {/* Match Date Capsule */}
                                    <div className="flex flex-col items-center gap-1 shrink-0 px-3 py-2 rounded-2xl bg-black/40 border border-white/5 min-w-[64px] transition-colors group-hover:border-white/10">
                                        <span className="text-[12px] font-black text-white">{format(new Date(m.date), "dd MMM", { locale: dateLocale })}</span>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{format(new Date(m.date), "HH:mm", { locale: dateLocale })}</span>
                                    </div>

                                    {/* Teams Mini Display */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between px-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl filter drop-shadow-md group-hover:scale-125 transition-transform duration-500">{home?.flag}</span>
                                                <span className="text-sm font-black text-white group-hover:text-primary transition-colors">{home?.code}</span>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                                <span className="text-[9px] font-black text-gray-600 italic">VS</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-black text-white group-hover:text-primary transition-colors">{away?.code}</span>
                                                <span className="text-2xl filter drop-shadow-md group-hover:scale-125 transition-transform duration-500">{away?.flag}</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-1.5 px-2">
                                            <MapPin className="w-2.5 h-2.5 text-gray-600" />
                                            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wide truncate">{m.stadium}</span>
                                        </div>
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="shrink-0">
                                        {hasPalpite ? (
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-500 shadow-[0_5px_15px_rgba(16,185,129,0.3)] flex items-center justify-center border border-emerald-400/50">
                                                <Check className="w-5 h-5 text-white stroke-[3px]" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary transition-all group-hover:border-primary shadow-xl">
                                                <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-white transition-colors" />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {(marketEngagement.length > 0 || activityFeed.length > 0) && (
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <motion.div
                        variants={staggerItem}
                        className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t('overview.market_pulse_kicker')}</p>
                                <h3 className="mt-2 text-xl font-black text-white">{t('overview.market_pulse_title')}</h3>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            {marketEngagement.map(({ market, savedCount, coverage }) => (
                                <div
                                    key={market.id}
                                    className="rounded-[24px] border border-white/10 bg-black/10 p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                {getScopeIcon(market.scope)}
                                                <p className="truncate text-sm font-black text-white">{market.title}</p>
                                            </div>
                                            <p className="mt-1 text-xs text-zinc-400">{market.description}</p>
                                        </div>
                                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300">
                                            {coverage}%
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-400 to-blue-400"
                                                style={{ width: `${Math.max(6, coverage)}%` }}
                                            />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                                            <span>{t('overview.saved_predictions', { count: savedCount })}</span>
                                            <span>{t('overview.members_in_bolao', { count: members.length })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        variants={staggerItem}
                        className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t('overview.live_kicker')}</p>
                                <h3 className="mt-2 text-xl font-black text-white">{t('overview.activity_title')}</h3>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            {activityFeed.length > 0 ? activityFeed.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-[24px] border border-white/10 bg-black/10 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-white">{item.title}</p>
                                            {item.description && <p className="mt-1 text-xs leading-relaxed text-zinc-400">{item.description}</p>}
                                        </div>
                                        <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                            {formatActivityTime(item.created_at)}
                                        </span>
                                    </div>
                                    {item.actor_name && (
                                        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                                            {item.actor_name}
                                        </p>
                                    )}
                                </div>
                            )) : (
                                <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 p-6 text-sm text-zinc-400">
                                    {t('overview.activity_empty')}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Invite card - Ultimate Viral Engine */}
            <motion.div
                variants={staggerItem}
                className="relative rounded-[40px] overflow-hidden p-8 bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-700 shadow-[0_20px_50px_rgba(16,185,129,0.3)] group cursor-default"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl opacity-40 group-hover:scale-110 transition-transform duration-1000" />

                <div className="relative z-10">
                    <div className="flex flex-col items-center text-center mb-8">
                        <motion.div
                            whileHover={{ rotate: 5, scale: 1.1 }}
                            className="w-20 h-20 rounded-[28px] bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl mb-6"
                        >
                            <UserPlus className="w-10 h-10 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-black text-white tracking-tight leading-tight mb-2">{t('overview.invite_friends')}</h3>
                        <p className="text-emerald-50/70 text-sm font-medium leading-relaxed max-w-[240px]">
                            {t('overview.invite_desc')}
                        </p>
                    </div>

                    <div className="bg-black/20 backdrop-blur-md rounded-3xl p-5 mb-6 border border-white/10 flex flex-col items-center">
                        <span className="text-[10px] text-emerald-100 font-black uppercase tracking-[0.3em] mb-3 opacity-60">{t('overview.share_code')}</span>
                        <div className="px-6 py-3 rounded-2xl bg-white/5 border-2 border-dashed border-white/30 flex items-center gap-3 group/code hover:border-white/60 transition-colors">
                            <span className="text-2xl font-black text-white tracking-tighter uppercase">{bolao.invite_code}</span>
                            <div className="w-px h-6 bg-white/20" />
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    navigator.clipboard.writeText(bolao.invite_code);
                                    // Add toast here if needed
                                }}
                                className="text-white/60 hover:text-white transition-colors"
                            >
                                <Share2 className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ y: -4, boxShadow: "0 15px 30px rgba(0,0,0,0.2)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onShare}
                        className="w-full py-5 rounded-3xl bg-white text-emerald-600 font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3"
                    >
                        <Share2 className="w-5 h-5" /> {t('overview.btn_share_whatsapp')}
                    </motion.button>
                </div>
            </motion.div>

            {/* Legal / Disclaimer - Premium Micro-copy */}
            <motion.div variants={staggerItem} className="px-6 pb-8">
                <div className="h-px w-full bg-white/5 mb-6" />
                <p className="text-[10px] text-gray-600 leading-relaxed text-center font-bold font-mono tracking-tight">
                    ARENACUP PROTOCOL V2.5 <span className="mx-2">·</span>
                    {t('overview.disclaimer').toUpperCase()}
                </p>
            </motion.div>
        </motion.div>
    );
}

function StatCard({ icon, value, label, subLabel, color, delay }: { icon: React.ReactNode; value: string | number; label: string; subLabel: string; color: "emerald" | "amber" | "blue"; delay: number }) {
    const colorConfigs = {
        emerald: {
            bg: "from-emerald-500/10 to-transparent border-emerald-500/10",
            iconBg: "bg-emerald-500/10 border-emerald-500/20",
            text: "text-emerald-400"
        },
        amber: {
            bg: "from-amber-500/10 to-transparent border-amber-500/10",
            iconBg: "bg-amber-500/10 border-amber-500/20",
            text: "text-amber-400"
        },
        blue: {
            bg: "from-blue-500/10 to-transparent border-blue-500/10",
            iconBg: "bg-blue-500/10 border-blue-500/20",
            text: "text-blue-400"
        },
    };

    const config = colorConfigs[color];

    return (
        <motion.div
            variants={staggerItem}
            whileHover={{ y: -5, scale: 1.02 }}
            className={cn(
                "rounded-3xl p-5 text-center border-2 bg-gradient-to-b relative overflow-hidden group transition-all duration-300",
                config.bg
            )}
        >
            <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center">
                <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-12", config.iconBg)}>
                    {icon}
                </div>
                <span className="text-2xl font-black block tracking-tighter text-white mb-1 leading-none">
                    {value}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-black text-gray-500 leading-none group-hover:text-gray-400 transition-colors">
                    {subLabel}
                </span>
            </div>
        </motion.div>
    );
}

