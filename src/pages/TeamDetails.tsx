import { useParams, useNavigate } from "react-router-dom";
import { teams, getTeam, getStadium } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { ArrowLeft, Trophy, Users, MapPin, Coins, Info, Globe, Calendar, MapPin as StadiumIcon, TrendingUp } from "lucide-react";
import { formatMatchDate, formatMatchTime } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useMatches } from "@/hooks/useMatches";

const TeamDetails = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { data: matches = [], isLoading } = useMatches();

    const team = code ? getTeam(code) : undefined;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
                <h2 className="text-xl font-bold mb-2">Equipe não encontrada</h2>
                <button onClick={() => navigate(-1)} className="text-primary hover:underline">
                    Voltar
                </button>
            </div>
        );
    }

    const teamMatches = matches.filter(
        (m) => m.homeTeam === code || m.awayTeam === code
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    };

    return (
        <div className="pb-20">
            {/* Header with blurred background */}
            <div className="relative overflow-hidden bg-secondary/30 pt-8 pb-6 px-4 mb-6 border-b border-white/5">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                    <Flag code={team.code} className="w-64 h-64 rounded-full blur-xl" />
                </div>

                <button
                    onClick={() => navigate(-1)}
                    className="relative z-10 flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Voltar</span>
                </button>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="mb-4 shadow-2xl rounded-lg overflow-hidden ring-4 ring-white/10"
                    >
                        <Flag code={team.code} className="w-24 h-16 object-cover" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl font-black uppercase tracking-tight mb-2"
                    >
                        {team.name}
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3 text-sm font-medium text-muted-foreground"
                    >
                        <div className="px-3 py-1 bg-secondary rounded-full flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            {team.confederation}
                        </div>
                        <div className="px-3 py-1 bg-secondary rounded-full flex items-center gap-1.5">
                            <span className="font-bold text-primary">Grupo {team.group}</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="px-4 space-y-6 max-w-lg mx-auto">
                {/* Key Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <motion.div
                        {...fadeIn}
                        className="glass-card p-4 flex flex-col items-center justify-center text-center gap-1"
                    >
                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Ranking FIFA</span>
                        <span className="text-2xl font-black tabular-nums">#{team.fifaRanking || '-'}</span>
                    </motion.div>

                    <motion.div
                        {...fadeIn}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-4 flex flex-col items-center justify-center text-center gap-1"
                    >
                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Títulos Mundiais</span>
                        <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span className="text-2xl font-black tabular-nums">{team.fifaTitles || 0}</span>
                        </div>
                    </motion.div>
                </div>

                {/* Performance Stats (Calculated) */}
                {(() => {
                    const playedMatches = teamMatches.filter(m => m.status === 'finished');
                    if (playedMatches.length === 0) return null;

                    const stats = playedMatches.reduce((acc, match) => {
                        const isHome = match.homeTeam === team.code;
                        const ourScore = isHome ? match.homeScore : match.awayScore;
                        const oppScore = isHome ? match.awayScore : match.homeScore;

                        // Type guards for scores
                        if (ourScore === null || oppScore === null || ourScore === undefined || oppScore === undefined) return acc;

                        acc.played++;
                        acc.gf += ourScore;
                        acc.ga += oppScore;

                        if (ourScore > oppScore) {
                            acc.wins++;
                            acc.points += 3;
                        } else if (ourScore === oppScore) {
                            acc.draws++;
                            acc.points += 1;
                        } else {
                            acc.losses++;
                        }
                        return acc;
                    }, { played: 0, points: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 });

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="glass-card p-4 space-y-3"
                        >
                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-white/5 pb-2">
                                <TrendingUp className="w-4 h-4" />
                                Desempenho Atual
                            </h3>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="flex flex-col">
                                    <span className="text-xl font-black">{stats.points}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Pts</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black">{stats.played}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">J</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-[hsl(var(--copa-success))]">{stats.wins}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">V</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black">{stats.gf}:{stats.ga}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">SG</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })()}

                {/* Demographics */}
                {team.demographics && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-5"
                    >
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4 text-muted-foreground border-b border-white/5 pb-2">
                            <Info className="w-4 h-4" />
                            Curiosidades
                        </h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Capital
                                </span>
                                <span className="text-sm font-medium">{team.demographics.capital}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
                                    <Users className="w-3 h-3" /> População
                                </span>
                                <span className="text-sm font-medium">{team.demographics.population}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
                                    <Coins className="w-3 h-3" /> Moeda
                                </span>
                                <span className="text-sm font-medium">{team.demographics.currency}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase text-muted-foreground font-bold flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> Idioma
                                </span>
                                <span className="text-sm font-medium">{team.demographics.language}</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Qualifiers */}
                {team.qualifiers && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-5"
                    >
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-3 text-muted-foreground">
                            <Trophy className="w-4 h-4" />
                            Nas Eliminatórias
                        </h3>
                        <p className="text-sm leading-relaxed text-foreground/90 bg-secondary/30 p-3 rounded-lg border border-white/5">
                            {team.qualifiers}
                        </p>
                    </motion.div>
                )}

                {/* Matches */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-3"
                >
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground pl-1">
                        <Calendar className="w-4 h-4" />
                        Jogos na Copa
                    </h3>

                    {teamMatches.length > 0 ? (
                        <div className="space-y-3">
                            {teamMatches.map((match) => {
                                const stadium = getStadium(match.stadium);
                                const isHome = match.homeTeam === team.code;
                                const opponentCode = isHome ? match.awayTeam : match.homeTeam;
                                const opponent = getTeam(opponentCode);

                                return (
                                    <div key={match.id} className="glass-card p-4 hover:border-primary/50 transition-colors cursor-default">
                                        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground font-medium">
                                            <span>{formatMatchDate(match.date)} • {formatMatchTime(match.date)}</span>
                                            <span className="uppercase tracking-wider">{match.phase === 'groups' ? `Grupo ${match.group}` : match.phase}</span>
                                        </div>

                                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-3">
                                            <div className={cn("flex items-center gap-2", isHome ? "flex-row-reverse text-right" : "flex-row")}>
                                                <span className={cn("text-sm font-bold", isHome ? "text-primary" : "text-muted-foreground")}>{isHome ? team.name : opponent?.name}</span>
                                                <Flag code={isHome ? team.code : opponentCode} size="sm" />
                                            </div>

                                            <div className="px-3 py-1 bg-secondary rounded text-sm font-mono font-bold text-center min-w-[60px]">
                                                {match.status === 'scheduled' ? 'vs' : `${match.homeScore} - ${match.awayScore}`}
                                            </div>

                                            <div className={cn("flex items-center gap-2", !isHome ? "flex-row-reverse text-right" : "flex-row")}>
                                                <span className={cn("text-sm font-bold", !isHome ? "text-primary" : "text-muted-foreground")}>{!isHome ? team.name : opponent?.name}</span>
                                                <Flag code={!isHome ? team.code : opponentCode} size="sm" />
                                            </div>
                                        </div>

                                        <div className="border-t border-white/5 pt-3 mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <StadiumIcon className="w-3 h-3" />
                                            <span className="truncate">{stadium?.name}, {stadium?.city}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground bg-secondary/20 rounded-lg">
                            Nenhum jogo encontrado.
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default TeamDetails;
