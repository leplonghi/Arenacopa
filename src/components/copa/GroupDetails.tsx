import { motion } from "framer-motion";
import { X, Trophy, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Flag } from "@/components/Flag";
import { MatchCard } from "@/components/MatchCard";
import { matches as mockMatches, groupStandings, getTeam } from "@/data/mockData";
import { useSimulacao } from "@/contexts/SimulacaoContext";
import { useMatches } from "@/hooks/useMatches";
import { Skeleton } from "@/components/ui/skeleton";

interface GroupDetailsProps {
    groupId: string;
    onClose: () => void;
    viewMode?: "real" | "simulacao";
}

export function GroupDetails({
  groupId, onClose, viewMode = "real" }: GroupDetailsProps) {
    const { t: _t } = useTranslation('copa');
    const { standings: simStandings } = useSimulacao();
    const { data: firebaseMatches, isLoading } = useMatches();

    const realStandings = groupStandings[groupId] || [];
    const simulatedGroupStandings = simStandings[groupId] || [];

    const useSimData = viewMode === "simulacao" && simulatedGroupStandings.some(s => s.played > 0);

    const displayStandings = useSimData
        ? simulatedGroupStandings.map(s => ({
            teamCode: s.teamCode,
            played: s.played,
            won: s.won,
            drawn: s.drawn,
            lost: s.lost,
            goalsFor: s.gf,
            goalsAgainst: s.ga,
            points: s.points,
            probability: 0,
        }))
        : realStandings;

    const matches = firebaseMatches || mockMatches;
    const groupMatches = matches
        .filter(m => m.group === groupId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-white/10 rounded-3xl shadow-2xl relative scrollbar-hide"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 bg-card/95 backdrop-blur-xl border-b border-white/5">
                    <div>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Detalhes do</span>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-foreground">Grupo {groupId}</h2>
                            {useSimData && (
                                <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Simulação</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                        <X className="w-5 h-5 text-foreground" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Standings Table */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-bold">Classificação</h3>
                        </div>

                        <div className="bg-secondary/30 rounded-2xl overflow-hidden border border-white/5">
                            <div className="grid grid-cols-[auto_1fr_32px_32px_32px_42px] gap-x-2 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/50">
                                <span className="w-4 text-center">#</span>
                                <span>Seleção</span>
                                <span className="text-center">J</span>
                                <span className="text-center">SG</span>
                                <span className="text-center">Pts</span>
                                <span className="text-right text-muted-foreground">{viewMode === "real" ? "%" : "J"}</span>
                            </div>

                            {displayStandings.map((s, i) => {
                                const team = getTeam(s.teamCode);
                                const gd = s.goalsFor - s.goalsAgainst;
                                const qualifies = i < 2;

                                return (
                                    <div
                                        key={s.teamCode}
                                        className={cn(
                                            "grid grid-cols-[auto_1fr_32px_32px_32px_42px] gap-x-2 items-center px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors",
                                            qualifies ? "bg-copa-success/5" : ""
                                        )}
                                    >
                                        <span className={cn(
                                            "text-xs font-bold w-4 text-center",
                                            qualifies ? "text-copa-success" : "text-muted-foreground"
                                        )}>
                                            {i + 1}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <Flag code={team.code} size="sm" />
                                            <span className={cn("text-xs font-bold text-foreground")}>{team.name}</span>
                                        </div>
                                        <span className="text-center text-xs font-medium text-muted-foreground">{s.played}</span>
                                        <span className="text-center text-xs font-medium text-muted-foreground">{gd > 0 ? `+${gd}` : gd}</span>
                                        <span className="text-center text-xs font-black text-foreground">{s.points}</span>
                                        <div className="flex justify-end min-w-[42px]">
                                            {viewMode === "real" ? (
                                                <span className={cn(
                                                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                                    s.probability >= 70 ? "bg-green-500/20 text-green-500" :
                                                        s.probability >= 40 ? "bg-yellow-500/20 text-yellow-500" :
                                                            "bg-red-500/20 text-red-500"
                                                )}>
                                                    {s.probability}%
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-center w-full">{s.played}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Matches List */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarDays className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-bold">Jogos</h3>
                        </div>

                        <div className="space-y-3">
                            {isLoading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-24 rounded-2xl" />
                                ))
                            ) : groupMatches.length > 0 ? (
                                groupMatches.map((match, idx) => (
                                    <MatchCard key={match.id} match={match} index={idx} />
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">Nenhum jogo encontrado para este grupo.</p>
                            )}
                        </div>
                    </section>
                </div>
            </motion.div>
        </motion.div>
    );
}
