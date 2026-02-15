import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { matches } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { type MemberData, type Palpite, type ExtraBet, type ScoringRules } from "@/types/bolao";
import { EmptyState } from "@/components/EmptyState";
import { calculatePoints } from "@/utils/bolaoUtils";

interface RankingTabProps {
    members: MemberData[];
    palpites: Palpite[];
    extraBets?: ExtraBet[];
    scoringRules?: ScoringRules;
}

export function RankingTab({ members, palpites, extraBets = [], scoringRules }: RankingTabProps) {
    const { t } = useTranslation('bolao');
    const finishedMatches = useMemo(() => matches.filter(m => m.status === "finished"), []);

    const ranking = useMemo(() => {
        return members.map(m => {
            const memberPalpites = palpites.filter(p => p.user_id === m.user_id);
            let totalPoints = 0;
            let exactCount = 0;
            let winnerCount = 0;
            let drawCount = 0;

            memberPalpites.forEach(p => {
                const match = finishedMatches.find(fm => fm.id === p.match_id);
                // Pass scoringRules to calculatePoints (it handles defaults if undefined)
                const result = calculatePoints(p, match, scoringRules);
                totalPoints += result.points;

                // Track stats for display
                if (result.type === 'exact') exactCount++;
                else if (result.type === 'winner') winnerCount++;
                else if (result.type === 'draw') drawCount++;
            });

            // Extra Bets Points
            const memberExtras = extraBets.filter(e => e.user_id === m.user_id);
            const extraPoints = memberExtras.reduce((acc, curr) => acc + (curr.points_awarded || 0), 0);
            totalPoints += extraPoints;

            return {
                ...m,
                palpiteCount: memberPalpites.length,
                points: totalPoints, // Use calculated total
                exactCount,
                winnerCount,
                drawCount,
                extraPoints
            };
        }).sort((a, b) => b.points - a.points || b.palpiteCount - a.palpiteCount);
    }, [members, palpites, extraBets, finishedMatches, scoringRules]);

    if (ranking.length === 0) {
        return (
            <div className="mt-8">
                <EmptyState icon="🏆" title={t('ranking.empty_title')} description={t('ranking.empty_desc')} />
            </div>
        );
    }

    // Determine configured points for legend
    const exactPts = scoringRules?.exact ?? 5;
    const winnerPts = scoringRules?.winner ?? 3;
    const drawPts = scoringRules?.draw ?? 2;

    return (
        <div className="space-y-6">
            {/* Top 3 Podium (Only if enough members) */}
            {ranking.length >= 3 && (
                <div className="flex items-end justify-center gap-4 pt-6 px-4">
                    {/* 2nd Place */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-secondary border-2 border-secondary flex items-center justify-center text-xs font-black overflow-hidden shadow-sm">
                            {ranking[1].profile?.avatar_url ? <img src={ranking[1].profile.avatar_url} alt="" className="w-full h-full object-cover" /> : ranking[1].profile?.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-center">
                            <span className="text-[10px] font-bold block max-w-[60px] truncate">{ranking[1].profile?.name.split(" ")[0]}</span>
                            <span className="text-xs font-black text-muted-foreground">{ranking[1].points}</span>
                        </div>
                        <div className="w-16 h-16 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg shadow-inner flex items-start justify-center pt-2">
                            <span className="text-2xl font-black text-gray-500/50">2</span>
                        </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex flex-col items-center gap-2 -mt-4 z-10">
                        <div className="absolute -top-6 animate-bounce">
                            <span className="text-2xl">👑</span>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-primary border-4 border-background flex items-center justify-center text-sm font-black overflow-hidden shadow-lg relative">
                            {ranking[0].profile?.avatar_url ? <img src={ranking[0].profile.avatar_url} alt="" className="w-full h-full object-cover" /> : ranking[0].profile?.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-center">
                            <span className="text-xs font-black block max-w-[80px] truncate text-primary">{ranking[0].profile?.name.split(" ")[0]}</span>
                            <span className="text-sm font-black">{ranking[0].points}</span>
                        </div>
                        <div className="w-20 h-24 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-xl shadow-lg flex items-start justify-center pt-3">
                            <span className="text-4xl font-black text-yellow-600/50">1</span>
                        </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-secondary border-2 border-secondary flex items-center justify-center text-xs font-black overflow-hidden shadow-sm">
                            {ranking[2].profile?.avatar_url ? <img src={ranking[2].profile.avatar_url} alt="" className="w-full h-full object-cover" /> : ranking[2].profile?.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-center">
                            <span className="text-[10px] font-bold block max-w-[60px] truncate">{ranking[2].profile?.name.split(" ")[0]}</span>
                            <span className="text-xs font-black text-muted-foreground">{ranking[2].points}</span>
                        </div>
                        <div className="w-16 h-12 bg-gradient-to-t from-orange-300 to-orange-200 rounded-t-lg shadow-inner flex items-start justify-center pt-2">
                            <span className="text-2xl font-black text-orange-600/50">3</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Full List */}
            <div className="glass-card divide-y divide-border/30 overflow-hidden">
                {ranking.map((r, i) => {
                    const name = r.profile?.name || t('ranking.default_user');
                    const isTop3 = i < 3;
                    return (
                        <div key={r.user_id} className={cn("flex items-center gap-4 px-4 py-3 bg-card/50", isTop3 && "bg-primary/5")}>
                            <span className={cn(
                                "w-6 h-6 flex items-center justify-center text-xs font-black rounded",
                                i === 0 ? "bg-yellow-400 text-yellow-900" :
                                    i === 1 ? "bg-gray-300 text-gray-800" :
                                        i === 2 ? "bg-orange-300 text-orange-900" :
                                            "text-muted-foreground"
                            )}>{i + 1}</span>

                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-black overflow-hidden shrink-0 border border-border/50">
                                {r.profile?.avatar_url ? <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : name.slice(0, 2).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                                <span className={cn("text-xs font-bold block truncate", isTop3 && "text-primary")}>{name}</span>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                                    <span>{r.palpiteCount} {t('ranking.guesses')}</span>
                                    {r.exactCount > 0 && <span className="text-green-500 font-bold">🎯 {r.exactCount}</span>}
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-sm font-black block">{r.points}</span>
                                <span className="text-[9px] text-muted-foreground uppercase">{t('ranking.points_abbr')}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend - Dynamic */}
            <div className="rounded-xl border border-dashed border-border p-4 bg-secondary/20">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 text-center">{t('ranking.legend_rules')}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-background/50 rounded p-2">
                        <span className="text-lg block">🎯</span>
                        <span className="text-[10px] font-bold block mt-1">{t('ranking.legend_exact')}</span>
                        <span className="text-xs font-black text-primary">{exactPts} pts</span>
                    </div>
                    <div className="bg-background/50 rounded p-2">
                        <span className="text-lg block">✓</span>
                        <span className="text-[10px] font-bold block mt-1">{t('ranking.legend_winner')}</span>
                        <span className="text-xs font-black text-primary">{winnerPts} pts</span>
                    </div>
                    <div className="bg-background/50 rounded p-2">
                        <span className="text-lg block">=</span>
                        <span className="text-[10px] font-bold block mt-1">{t('ranking.legend_draw')}</span>
                        <span className="text-xs font-black text-primary">{drawPts} pts</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
