import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Calendar, Info } from "lucide-react";
import { matches, getTeam, type Match } from "@/data/mockData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScoreInput } from "@/components/ui/ScoreInput";
import { type Palpite } from "@/types/bolao";
import { MatchDetailsModal } from "@/components/copa/MatchDetailsModal";

interface PalpitesTabProps {
    bolaoId: string;
    palpites: Palpite[];
    setPalpites: (p: Palpite[]) => void;
    userId: string;
}

export function PalpitesTab({ bolaoId, palpites, setPalpites, userId }: PalpitesTabProps) {
    const { t } = useTranslation('bolao');
    const { toast } = useToast();
    const [selectedGroup, setSelectedGroup] = useState("A");
    const [saving, setSaving] = useState<string | null>(null);
    const [localScores, setLocalScores] = useState<Record<string, { home: number | null; away: number | null; isPowerPlay: boolean }>>({});
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const navigate = useNavigate();

    const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
    const groupMatches = matches.filter(m => m.phase === "groups" && m.group === selectedGroup);

    // Init local scores from palpites
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

            // If setting power play, unset others in this group (optional, but good UX)
            // Implementation note: This might need a separate call or handled by user manually unchecking.
            // For now, let's just save.

            if (existing) {
                const { error } = await supabase.from("bolao_palpites").update({
                    home_score: home,
                    away_score: away,
                    is_power_play: isPowerPlay
                }).eq("id", existing.id);
                if (error) throw error;
                setPalpites(palpites.map(p => p.id === existing.id ? { ...p, home_score: home, away_score: away, is_power_play: isPowerPlay } : p));
            } else {
                const { data, error } = await supabase
                    .from("bolao_palpites")
                    .insert({
                        bolao_id: bolaoId,
                        user_id: userId,
                        match_id: matchId,
                        home_score: home,
                        away_score: away,
                        is_power_play: isPowerPlay
                    })
                    .select()
                    .single();
                if (error) throw error;
                if (data) setPalpites([...palpites, data]);
            }
            toast({ title: t('palpites.saved') });
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

    return (
        <div className="space-y-4">
            <MatchDetailsModal
                match={selectedMatch}
                isOpen={!!selectedMatch}
                onClose={() => setSelectedMatch(null)}
            />

            {/* Group selector */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {groups.map(g => {
                    const groupMatchIds = matches.filter(m => m.group === g && m.phase === "groups").map(m => m.id);
                    const done = palpites.filter(p => p.user_id === userId && groupMatchIds.includes(p.match_id)).length;
                    const total = groupMatchIds.length;
                    return (
                        <button
                            key={g}
                            onClick={() => setSelectedGroup(g)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors relative",
                                selectedGroup === g ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                            )}
                        >
                            {g}
                            {done === total && total > 0 && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[hsl(var(--copa-success))] text-[7px] text-background font-black flex items-center justify-center">✓</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Matches */}
            <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
                {groupMatches.map(m => {
                    const home = getTeam(m.homeTeam);
                    const away = getTeam(m.awayTeam);
                    const scores = localScores[m.id] ?? { home: null, away: null, isPowerPlay: false };
                    const existingPalpite = palpites.find(p => p.match_id === m.id && p.user_id === userId);

                    const isLocked = new Date() > new Date(m.date) || m.status !== "scheduled";

                    const hasChanged = existingPalpite
                        ? existingPalpite.home_score !== scores.home || existingPalpite.away_score !== scores.away || existingPalpite.is_power_play !== scores.isPowerPlay
                        : (scores.home !== null || scores.away !== null); // Considered changed if user typed something but hasn't saved

                    return (
                        <div key={m.id} className={cn("glass-card p-3 relative overflow-hidden", (existingPalpite && !hasChanged) ? "border-[hsl(var(--copa-success))]/20" : "")}>
                            {isLocked && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                                    {t('palpites.locked')}
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[9px] text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(m.date), "dd MMM · HH:mm", { locale: ptBR })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        title={t('palpites.power_play_title')}
                                        onClick={() => !isLocked && updateLocal(m.id, "isPowerPlay", !scores.isPowerPlay)}
                                        className={cn(
                                            "flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border transition-all",
                                            scores.isPowerPlay
                                                ? "bg-yellow-500/20 border-yellow-500 text-yellow-500 font-bold"
                                                : "border-border text-muted-foreground hover:bg-secondary"
                                        )}
                                        disabled={isLocked}
                                    >
                                        ⚡ x2
                                    </button>
                                    <button
                                        onClick={() => setSelectedMatch(m)}
                                        className="p-1 rounded-full hover:bg-secondary/50 transition-colors"
                                    >
                                        <Info className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div
                                    className="flex-1 flex items-center gap-2 justify-end cursor-pointer hover:underline"
                                    onClick={() => navigate(`/team/${home.code}`)}
                                >
                                    <span className="text-xs font-bold">{home?.name}</span>
                                    <span className="text-lg">{home?.flag}</span>
                                </div>
                                <ScoreInput
                                    value={scores.home}
                                    onChange={v => updateLocal(m.id, "home", v)}
                                    disabled={isLocked}
                                />
                                <span className="text-muted-foreground text-xs font-bold">×</span>
                                <ScoreInput
                                    value={scores.away}
                                    onChange={v => updateLocal(m.id, "away", v)}
                                    disabled={isLocked}
                                />
                                <div
                                    className="flex-1 flex items-center gap-2 cursor-pointer hover:underline"
                                    onClick={() => navigate(`/team/${away.code}`)}
                                >
                                    <span className="text-lg">{away?.flag}</span>
                                    <span className="text-xs font-bold">{away?.name}</span>
                                </div>
                            </div>
                            {hasChanged && !isLocked && (
                                <button
                                    onClick={() => savePalpite(m.id, scores.home, scores.away, scores.isPowerPlay)}
                                    disabled={saving === m.id}
                                    className="w-full mt-2 py-2 rounded-lg bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                    {saving === m.id ? t('palpites.btn_saving') : existingPalpite ? t('palpites.btn_update') : t('palpites.btn_save')}
                                </button>
                            )}
                            {existingPalpite && !hasChanged && !isLocked && (
                                <div className="text-center mt-1">
                                    <span className="text-[9px] text-[hsl(var(--copa-success))] font-bold">{t('palpites.saved_label')}</span>
                                    {existingPalpite.is_power_play && <span className="ml-2 text-[9px] text-yellow-500 font-bold">{t('palpites.power_play_active')}</span>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
