import { type ComponentProps, useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Info, Check, Zap, Save, Filter } from "lucide-react";
import { getTeam, type Match } from "@/data/mockData";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScoreInput } from "@/components/ui/ScoreInput";
import { type Palpite } from "@/types/bolao";
import { MatchDetailsModal } from "@/components/copa/MatchDetailsModal";
import { useDateLocale } from "@/hooks/useDateLocale";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer } from "../animations";
import { useMatches } from "@/hooks/useMatches";
import { saveBolaoPalpite } from "@/services/boloes/bolao.service";

interface PalpitesTabProps {
    bolaoId: string;
    palpites: Palpite[];
    setPalpites: (p: Palpite[]) => void;
    userId: string;
}

export function PalpitesTab({ bolaoId, palpites, setPalpites, userId }: PalpitesTabProps) {
    const { t } = useTranslation('bolao');
    const { toast } = useToast();
    const dateLocale = useDateLocale();
    const [selectedGroup, setSelectedGroup] = useState("A");
    const [saving, setSaving] = useState<string | null>(null);
    const [localScores, setLocalScores] = useState<Record<string, { home: number | null; away: number | null; isPowerPlay: boolean }>>({});
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const navigate = useNavigate();
    const { data: matches = [], isLoading } = useMatches();

    const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    const groupMatches = useMemo(() => matches.filter(m => m.phase === "groups" && m.group === selectedGroup), [selectedGroup, matches]);

    useEffect(() => {
        const scores: Record<string, { home: number | null; away: number | null; isPowerPlay: boolean }> = {};
        palpites
            .filter(p => p.user_id === userId)
            .forEach(p => {
                scores[p.match_id] = { home: p.home_score, away: p.away_score, isPowerPlay: p.is_power_play || false };
            });
        setLocalScores(scores);
    }, [palpites, userId]);

    const savePalpite = async (matchId: string, home: number | null, away: number | null, isPowerPlay: boolean) => {
        if (home === null || away === null) {
            toast({ title: t('palpites.fill_score'), variant: "destructive" });
            return;
        }
        setSaving(matchId);
        try {
            const existing = palpites.find(p => p.match_id === matchId && p.user_id === userId);
            const savedPalpite = await saveBolaoPalpite({
                bolaoId,
                userId,
                matchId,
                homeScore: home,
                awayScore: away,
                isPowerPlay,
                existingId: existing?.id,
            });

            if (existing) {
                setPalpites(palpites.map((p) => (p.id === existing.id ? { ...p, ...savedPalpite } : p)));
            } else {
                setPalpites([...palpites, savedPalpite]);
            }
            toast({
                title: t('palpites.saved'),
                className: "bg-emerald-500 border-emerald-600 text-white font-black uppercase text-[10px] tracking-widest"
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : t('palpites.error_save');
            toast({ title: t('palpites.error_save'), description: msg, variant: "destructive" });
        } finally {
            setSaving(null);
        }
    };

    const updateLocal = (matchId: string, field: "home" | "away" | "isPowerPlay", value: number | null | boolean) => {
        setLocalScores(prev => {
            const current = prev[matchId] || { home: null, away: null, isPowerPlay: false };
            return {
                ...prev,
                [matchId]: { ...current, [field]: value }
            };
        });
    };

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
            className="space-y-6"
        >
            <MatchDetailsModal
                match={selectedMatch}
                isOpen={!!selectedMatch}
                onClose={() => setSelectedMatch(null)}
            />

            {/* Filter Pills - Premium Slider */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <Filter className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t('common.filter_group')}</span>
                </div>
                <div className="flex flex-wrap gap-2 pb-2">
                    {groups.map(g => {
                        const groupMatchIds = matches.filter(m => m.group === g && m.phase === "groups").map(m => m.id);
                        const done = palpites.filter(p => p.user_id === userId && groupMatchIds.includes(p.match_id)).length;
                        const total = groupMatchIds.length;
                        const isSelected = selectedGroup === g;

                        return (
                            <motion.button
                                key={g}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedGroup(g)}
                                className={cn(
                                    "px-5 py-2 rounded-2xl text-xs font-black transition-all relative flex items-center gap-2",
                                    isSelected
                                        ? "bg-primary text-primary-foreground shadow-[0_5px_15px_rgba(var(--primary-rgb),0.3)] scale-110 z-10"
                                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5"
                                )}
                            >
                                {t('common.group')} {g}
                                {done === total && total > 0 && (
                                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                                        <Check className="w-2.5 h-2.5 text-white" />
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Matches Grid - Premium Cards */}
            <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
                <AnimatePresence mode="wait">
                    {groupMatches.map((m, idx) => {
                        const home = getTeam(m.homeTeam);
                        const away = getTeam(m.awayTeam);
                        const scores = localScores[m.id] ?? { home: null, away: null, isPowerPlay: false };
                        const existingPalpite = palpites.find(p => p.match_id === m.id && p.user_id === userId);
                        const isLocked = new Date() > new Date(m.date) || m.status !== "scheduled";
                        const hasChanged = existingPalpite
                            ? existingPalpite.home_score !== scores.home || existingPalpite.away_score !== scores.away || existingPalpite.is_power_play !== scores.isPowerPlay
                            : (scores.home !== null || scores.away !== null);

                        return (
                            <motion.div
                                key={m.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={cn(
                                    "glass-card p-5 relative overflow-hidden group border-2 transition-all",
                                    (existingPalpite && !hasChanged) ? "border-emerald-500/20" : "border-white/5 hover:border-white/10",
                                    isLocked && "opacity-80 grayscale-[0.5]"
                                )}
                            >
                                {isLocked && (
                                    <div className="absolute top-0 right-0 bg-red-500/10 backdrop-blur-md text-red-500 text-[8px] font-black px-3 py-1 rounded-bl-2xl z-10 border-l border-b border-red-500/20 flex items-center gap-1 uppercase tracking-tighter">
                                        <LockIcon className="w-2.5 h-2.5" /> {t('palpites.locked')}
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            {format(new Date(m.date), "dd MMM · HH:mm", { locale: dateLocale })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => !isLocked && updateLocal(m.id, "isPowerPlay", !scores.isPowerPlay)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 transition-all",
                                                scores.isPowerPlay
                                                    ? "bg-yellow-500/10 border-yellow-500 text-yellow-500 font-black shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                                                    : "border-white/5 text-gray-500 hover:bg-white/5 hover:text-white"
                                            )}
                                            disabled={isLocked}
                                        >
                                            <Zap className={cn("w-3 h-3", scores.isPowerPlay && "fill-yellow-500")} />
                                            <span className="text-[9px] uppercase tracking-tighter italic">{t('palpites.power_play_badge')}</span>
                                        </motion.button>
                                        <button
                                            onClick={() => setSelectedMatch(m)}
                                            className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                                        >
                                            <Info className="w-3.5 h-3.5 text-gray-500" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                                    <div className="text-right">
                                        <div className="flex flex-col items-end group/team" onClick={() => navigate(`/team/${home.code}`)}>
                                            <span className="text-[28px] mb-1 filter drop-shadow-md transition-transform group-hover/team:scale-110">{home?.flag}</span>
                                            <span className="text-xs font-black text-white group-hover/team:text-primary transition-colors">{home?.code}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <ScoreInput
                                            value={scores.home}
                                            onChange={v => updateLocal(m.id, "home", v)}
                                            disabled={isLocked}
                                        />
                                        <span className="text-gray-600 font-black italic">×</span>
                                        <ScoreInput
                                            value={scores.away}
                                            onChange={v => updateLocal(m.id, "away", v)}
                                            disabled={isLocked}
                                        />
                                    </div>

                                    <div className="text-left">
                                        <div className="flex flex-col items-start group/team" onClick={() => navigate(`/team/${away.code}`)}>
                                            <span className="text-[28px] mb-1 filter drop-shadow-md transition-transform group-hover/team:scale-110">{away?.flag}</span>
                                            <span className="text-xs font-black text-white group-hover/team:text-primary transition-colors">{away?.code}</span>
                                        </div>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {hasChanged && !isLocked && (
                                        <motion.button
                                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                            animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                            onClick={() => savePalpite(m.id, scores.home, scores.away, scores.isPowerPlay)}
                                            disabled={saving === m.id}
                                            className="w-full py-3 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {saving === m.id ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                                    {t('palpites.btn_saving')}
                                                </div>
                                            ) : (
                                                <>
                                                    <Save className="w-3.5 h-3.5" />
                                                    {existingPalpite ? t('palpites.btn_update') : t('palpites.btn_save')}
                                                </>
                                            )}
                                        </motion.button>
                                    )}
                                </AnimatePresence>

                                {existingPalpite && !hasChanged && !isLocked && (
                                    <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                                            </div>
                                            <span className="text-[9px] text-emerald-400 font-black uppercase tracking-tighter">{t('palpites.saved_label')}</span>
                                        </div>
                                        {existingPalpite.is_power_play && (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-4 h-4 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                                                    <Zap className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400/20" />
                                                </div>
                                                <span className="text-[9px] text-yellow-400 font-black uppercase tracking-tighter">{t('palpites.power_play_active_badge')}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

function LockIcon(props: ComponentProps<"svg">) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

