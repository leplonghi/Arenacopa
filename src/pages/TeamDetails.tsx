import { useParams, useNavigate } from "react-router-dom";
import { getTeam, getStadium } from "@/data/mockData";
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

                {/* WC History */}
                {team.stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="glass-card p-5"
                    >
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4 text-muted-foreground border-b border-white/5 pb-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            Histórico na Copa do Mundo
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1 bg-secondary/30 rounded-xl p-3">
                                <span className="text-[10px] uppercase text-muted-foreground font-bold">Títulos</span>
                                <span className="text-2xl font-black text-yellow-500">{team.stats.titles > 0 ? team.stats.titles : '—'}</span>
                            </div>
                            <div className="flex flex-col gap-1 bg-secondary/30 rounded-xl p-3">
                                <span className="text-[10px] uppercase text-muted-foreground font-bold">Participações</span>
                                <span className="text-2xl font-black">{team.stats.appearances || '—'}</span>
                            </div>
                            <div className="flex flex-col gap-1 bg-secondary/30 rounded-xl p-3">
                                <span className="text-[10px] uppercase text-muted-foreground font-bold">Primeira Copa</span>
                                <span className="text-xl font-black">{team.stats.firstAppearance || '—'}</span>
                            </div>
                            <div className="flex flex-col gap-1 bg-secondary/30 rounded-xl p-3">
                                <span className="text-[10px] uppercase text-muted-foreground font-bold">Melhor resultado</span>
                                <span className="text-sm font-bold leading-tight">{team.stats.bestResult || '—'}</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Classic Rivals */}
                {(() => {
                    const RIVALS: Record<string, { code: string; name: string; context: string }[]> = {
                        BRA: [
                            { code: "ARG", name: "Argentina", context: "El Clásico das Américas — maior rivalidade do futebol sul-americano" },
                            { code: "URU", name: "Urugüai", context: "A dor do Maracanazo (1950) ainda ressoa na memória brasileira" },
                            { code: "GER", name: "Alemanha", context: "O 7×1 na semifinal da Copa 2014 é o jogo mais marcante desta rivalidade" },
                        ],
                        ARG: [
                            { code: "BRA", name: "Brasil", context: "El Clásico das Américas — décadas de rivalidade intensa" },
                            { code: "ENG", name: "Inglaterra", context: "A 'Mão de Deus' (1986) e a guerra das Malvinas tornam este duelo único" },
                            { code: "URU", name: "Urugüai", context: "Clásico del Río de la Plata — o derby mais antigo das Américas" },
                        ],
                        GER: [
                            { code: "NED", name: "Holanda", context: "A final de 1974 inaugurou uma das maiores rivalidades europeias" },
                            { code: "ENG", name: "Inglaterra", context: "1966, 1990, 1996 — mais de meio século de encontros decisivos" },
                            { code: "BRA", name: "Brasil", context: "O 7×1 em 2014 é o jogo mais mítico desta rivalidade" },
                        ],
                        FRA: [
                            { code: "GER", name: "Alemanha", context: "Semifinal 1982 — um dos jogos mais polêmicos da história das Copas" },
                            { code: "ARG", name: "Argentina", context: "A final de 2022 é considerada a melhor final de todos os tempos" },
                            { code: "POR", name: "Portugal", context: "Semifinal 2006 e de Euro — rivalidade ibero-latina crescente" },
                        ],
                        ENG: [
                            { code: "ARG", name: "Argentina", context: "Mão de Deus, 1986 — um dos momentos mais controversos do esporte mundial" },
                            { code: "GER", name: "Alemanha", context: "1966, 1990, 1996 — duelo entre gigantes europeus" },
                            { code: "URU", name: "Urugüai", context: "A derrota em 1954 marcou o início de um clássico transatlântico" },
                        ],
                        ESP: [
                            { code: "POR", name: "Portugal", context: "El Deríbi Ibérico — vizinhos com histórias opostas nas Copas" },
                            { code: "NED", name: "Holanda", context: "A final de 2010 — polêmica, física e definitiva para a Espanha" },
                            { code: "GER", name: "Alemanha", context: "Duelo recorrente em grandes torneios europeus" },
                        ],
                        ITA: [
                            { code: "BRA", name: "Brasil", context: "Finais de 1970 e 1994 — dois países com 5 títulos cada" },
                            { code: "FRA", name: "França", context: "A tragedi da cabeçada de Zidane na final de 2006 é inesquecível" },
                            { code: "URU", name: "Urugüai", context: "Final do primeiro mundial em 1930 — a partida mais antiga da rivalidade" },
                        ],
                        URU: [
                            { code: "BRA", name: "Brasil", context: "O Maracanazo (1950) é a vitória mais lembrada do futebol uruguaio" },
                            { code: "ARG", name: "Argentina", context: "Clásico del Río de la Plata — o derby mais antigo do mundo" },
                            { code: "ITA", name: "Itália", context: "Final do primeiro mundial em 1930 — uruguaios sagraram-se campeões" },
                        ],
                        NED: [
                            { code: "GER", name: "Alemanha", context: "A final de 1974 e as guerras europeias tornam esta rivalidade especial" },
                            { code: "ESP", name: "Espanha", context: "A revancha da final de 2010 nunca aconteceu, mas a rivalidade persiste" },
                            { code: "ARG", name: "Argentina", context: "Semifinais de 1974 e 2022 — confrontos memoraveis entre as duas" },
                        ],
                        POR: [
                            { code: "ESP", name: "Espanha", context: "El Deríbi Ibérico — unidos pela língua, separados pela rivalidade" },
                            { code: "FRA", name: "França", context: "Semifinal de 2022 e várias edições de Euro — Mbappé vs Ronaldo" },
                            { code: "ENG", name: "Inglaterra", context: "Quartas da Copa 2006 foram polêmicas e eliminaram Ronaldo do torneio" },
                        ],
                    };
                    const rivals = RIVALS[code || ""] || [];
                    if (rivals.length === 0) return null;
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="glass-card p-5"
                        >
                            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4 text-muted-foreground border-b border-white/5 pb-2">
                                <Coins className="w-4 h-4 text-copa-live" />
                                Grandes Rivalidades
                            </h3>
                            <div className="space-y-3">
                                {rivals.map((rival) => (
                                    <div key={rival.code} className="flex items-start gap-3 bg-secondary/20 rounded-xl p-3">
                                        <div className="shrink-0 mt-0.5">
                                            <Flag code={rival.code} size="sm" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground">{rival.name}</p>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{rival.context}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })()}

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
