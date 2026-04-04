import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MatchCard } from "@/components/MatchCard";
import { Flag } from "@/components/Flag";
import {
    groupStandings,
    getTeam,
    groups,
    type Match
} from "@/data/mockData";
import { MatchDetailsModal } from "./MatchDetailsModal";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem, heroEnter, titleReveal } from "./animations";
import { Trophy, ChevronRight, Calculator, CalendarDays, TrendingUp } from "lucide-react";
import { TournamentStageTracker } from "./TournamentStageTracker";
import { PremiumModal } from "./PremiumModal";
import { Crown } from "lucide-react";
import { useMonetization } from "@/contexts/MonetizationContext";
import { useTranslation } from "react-i18next";
import { useMatches } from "@/hooks/useMatches";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";

const getQualificationScenario = (teamCode: string, matches: Match[]) => {
    const group = groups.find(g => groupStandings[g]?.some(t => t.teamCode === teamCode));
    if (!group) return null;

    const standings = groupStandings[group];
    const teamStats = standings.find(t => t.teamCode === teamCode);
    if (!teamStats) return null;

    const teamMatches = matches.filter(m => (m.homeTeam === teamCode || m.awayTeam === teamCode) && m.group === group);
    const played = teamStats.played;
    const totalMatches = teamMatches.length;
    const remaining = totalMatches - played;
    const maxPoints = teamStats.points + (remaining * 3);

    let status: "qualified" | "eliminated" | "contention" = "contention";
    let messageKey = "";
    let messageParams = {};

    const sorted = [...standings].sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
    const secondPlace = sorted[1];

    if (teamStats.points >= 6) {
        status = "qualified";
        messageKey = "qualified";
    } else if (maxPoints < secondPlace.points && remaining === 0) {
        status = "eliminated";
        messageKey = "eliminated";
    } else {
        const pointsToSafe = 6 - teamStats.points;
        if (pointsToSafe <= 0) {
            messageKey = "need_draw";
        } else {
            const winsNeeded = Math.ceil(pointsToSafe / 3);
            if (winsNeeded > remaining) {
                messageKey = "need_miracle";
                status = "contention";
            } else {
                messageKey = "need_wins";
                messageParams = { wins: winsNeeded, games: remaining };
            }
        }
    }

    return {
        status,
        messageKey,
        messageParams,
        currentPoints: teamStats.points,
        remaining,
        maxPoints,
        rank: sorted.findIndex(s => s.teamCode === teamCode) + 1
    };
};

export function CopaOverview() {
    const { t } = useTranslation('copa');
    const navigate = useNavigate();
    const { data: matches = [], isLoading } = useMatches();

    const todayMatches = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return matches.filter(m => m.date.startsWith(today));
    }, [matches]);

    const nextMatches = useMemo(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        return matches.filter(m => m.date.startsWith(tomorrowStr));
    }, [matches]);

    const upcomingMatches = useMemo(() => {
        return matches.filter(m => m.status === "scheduled").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [matches]);

    const featureMatch = useMemo(() => {
        return todayMatches.length > 0 ? todayMatches[0] : (nextMatches.length > 0 ? nextMatches[0] : upcomingMatches[0]);
    }, [todayMatches, nextMatches, upcomingMatches]);

    const otherMatches = useMemo(() => {
        return [...todayMatches, ...nextMatches, ...upcomingMatches].filter(m => m.id !== featureMatch?.id).slice(0, 3);
    }, [todayMatches, nextMatches, upcomingMatches, featureMatch]);

    const [selectedTeam, setSelectedTeam] = useState<string>("BRA");
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const { isPremium } = useMonetization();

    const handleInteraction = (action: () => void) => {
        action();
    };

    const openTab = (tab: "grupos" | "simulacao" | "calendario") => {
        navigate(`/copa/${tab}`);
    };

    const scenario = useMemo(() => getQualificationScenario(selectedTeam, matches), [selectedTeam, matches]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-20 relative"
        >
            {/* Dynamic Background */}
            {featureMatch && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="fixed inset-0 pointer-events-none -z-50 overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-2/3 h-2/3 bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-red-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '5s' }} />
                </motion.div>
            )}

            {/* 1. Tournament Stage Tracker */}
            <motion.section variants={staggerItem} className="pt-2">
                <TournamentStageTracker />
            </motion.section>

            {/* 2. Featured Match */}
            <section className="px-1">
                <motion.div variants={titleReveal} className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {t('overview.featured')}
                    </h2>
                </motion.div>
                {featureMatch ? (
                    <motion.div variants={heroEnter}>
                        <MatchCard match={featureMatch} variant="broadcast" onClick={() => handleInteraction(() => setSelectedMatch(featureMatch))} />
                    </motion.div>
                ) : (
                    <div className="glass-card p-6 text-center text-muted-foreground">
                        <p className="text-sm">{t('overview.no_featured')}</p>
                    </div>
                )}
            </section>


            {/* 3. Quick Access to Sub-tabs */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
                {/* Groups Quick Access */}
                <motion.div
                    variants={staggerItem}
                    onClick={() => openTab("grupos")}
                    className="glass-card p-4 relative overflow-hidden group cursor-pointer border-l-4 border-l-secondary-foreground/20 hover:border-l-primary transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black leading-none">{t('overview.quick_access.standings_title')}</h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-2 mt-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold w-4">1</span>
                            <div className="h-1.5 rounded-full bg-primary w-3/4" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold w-4">2</span>
                            <div className="h-1.5 rounded-full bg-primary/60 w-1/2" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold w-4 text-muted-foreground">3</span>
                            <div className="h-1.5 rounded-full bg-secondary w-1/3" />
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 font-medium">{t('overview.quick_access.standings_desc')}</p>
                </motion.div>

                {/* Simulator Quick Access */}
                <motion.div
                    variants={staggerItem}
                    onClick={() => openTab("simulacao")}
                    className="glass-card p-4 relative overflow-hidden group cursor-pointer border-l-4 border-l-secondary-foreground/20 hover:border-l-yellow-500 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black leading-none">{t('overview.quick_access.simulator_title')}</h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
                    </div>
                    <div className="space-y-2 mt-3 flex items-center justify-center py-1">
                        <Trophy className="w-8 h-8 text-yellow-500/50 group-hover:text-yellow-500 transition-colors animate-pulse" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 font-medium text-center">{t('overview.quick_access.simulator_desc')}</p>
                </motion.div>

                {/* Calendar Quick Access */}
                <motion.div
                    variants={staggerItem}
                    onClick={() => openTab("calendario")}
                    className="glass-card p-4 relative overflow-hidden group cursor-pointer border-l-4 border-l-secondary-foreground/20 hover:border-l-blue-400 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black leading-none">{t('overview.quick_access.calendar_title')}</h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div className="space-y-2 mt-3 flex items-center justify-center py-1">
                        <CalendarDays className="w-8 h-8 text-blue-400/50 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 font-medium text-center">{t('overview.quick_access.calendar_desc')}</p>
                </motion.div>

                {/* Guia Quick Access */}
                <motion.div
                    variants={staggerItem}
                    onClick={() => navigate("/guia")}
                    className="glass-card p-4 relative overflow-hidden group cursor-pointer border-l-4 border-l-secondary-foreground/20 hover:border-l-green-400 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black leading-none">{t('overview.quick_access.guide_title')}</h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-green-400 transition-colors" />
                    </div>
                    <div className="space-y-2 mt-3 flex items-center justify-center py-1">
                        <span className="text-2xl">🏙️</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 font-medium text-center">{t('overview.quick_access.guide_desc')}</p>
                </motion.div>
            </section>


            {/* 4. Other Matches */}
            <section className="space-y-3 px-1">
                <motion.div variants={titleReveal} className="flex items-center justify-between px-1">
                    <h2 className="text-lg font-black flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-primary" />
                        {t('overview.upcoming_matches')}
                    </h2>
                    <button
                        onClick={() => openTab("calendario")}
                        className="text-xs font-bold text-primary hover:underline"
                    >
                        {t('overview.view_calendar')}
                    </button>
                </motion.div>
                {otherMatches.length > 0 ? (
                    <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
                        {otherMatches.map((m, i) => (
                            <motion.div key={m.id} variants={staggerItem} custom={i}>
                                <MatchCard match={m} index={i} onClick={() => handleInteraction(() => setSelectedMatch(m))} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card rounded-[28px] p-5">
                        <EmptyState
                            icon="📅"
                            title={t('overview.no_upcoming')}
                            description={t('overview.no_upcoming_desc')}
                        />
                    </div>
                )}
            </section>

            {/* 5. Qualification Calculator */}
            <motion.section variants={staggerItem} className="space-y-3 px-1">
                <div className="flex items-center gap-2 px-1">
                    <Calculator className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-black">{t('overview.calculator.title')}</h2>
                </div>
                <div className="glass-card-premium p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <TrendingUp className="w-32 h-32" />
                    </div>

                    <div className="mb-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">{t('overview.calculator.select_team')}</label>
                        <select
                            value={selectedTeam}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                            className="w-full bg-secondary text-sm font-bold p-3 rounded-xl border-none focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                        >
                            {groups.flatMap(g => groupStandings[g]).map(t => (
                                <option key={t.teamCode} value={t.teamCode}>
                                    {getTeam(t.teamCode).name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {scenario && (
                        <motion.div
                            key={selectedTeam}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center gap-3">
                                <Flag code={selectedTeam} size="lg" className="shrink-0" />
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-black">{scenario.currentPoints}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold">pts</span>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full inline-block",
                                        scenario.status === "qualified" ? "bg-green-500/20 text-green-500" :
                                            scenario.status === "eliminated" ? "bg-red-500/20 text-red-500" :
                                                "bg-yellow-500/20 text-yellow-500"
                                    )}>
                                        {t(`overview.calculator.status.${scenario.status}`)}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs font-medium leading-tight text-foreground/80 bg-secondary/30 p-2 rounded-lg border border-white/5">
                                {t(`overview.calculator.messages.${scenario.messageKey}`, scenario.messageParams)}
                            </p>
                        </motion.div>
                    )}
                </div>
            </motion.section>

            {/* Premium CTA */}
            {!isPremium && (
                <motion.div variants={staggerItem} className="px-1 pb-4">
                    <button
                        onClick={() => setShowPremiumModal(true)}
                        className="w-full bg-gradient-to-r from-yellow-500/20 to-orange-600/20 hover:from-yellow-500/30 hover:to-orange-600/30 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between group transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/20 rounded-full text-yellow-500">
                                <Crown className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-bold text-yellow-500">{t('overview.premium_cta.title')}</h3>
                                <p className="text-[10px] text-muted-foreground">{t('overview.premium_cta.desc')}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-yellow-500/50 group-hover:text-yellow-500 transition-colors" />
                    </button>
                </motion.div>
            )}

            <PremiumModal
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
                onSuccess={() => undefined}
            />


            <MatchDetailsModal
                match={selectedMatch}
                isOpen={!!selectedMatch}
                onClose={() => setSelectedMatch(null)}
            />
        </motion.div>
    );
}
