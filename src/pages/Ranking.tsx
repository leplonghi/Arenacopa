import { useState } from "react";
import { Trophy, Users, History, Crown, Medal, Award, TrendingUp, Star, Dices, BarChart3, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Flag } from "@/components/Flag";
import { motion, AnimatePresence } from "framer-motion";
import { countryRankings, allTimeTopScorers } from "@/data/historiaData";

type RankingTab = "usuarios" | "boloes" | "historico" | "estatisticas";

const mockTopUsers = [
    { rank: 1, name: "Carlos S.", points: 342, accuracy: 78, avatar: null, teamCode: "BRA" },
    { rank: 2, name: "Ana M.", points: 318, accuracy: 72, avatar: null, teamCode: "ARG" },
    { rank: 3, name: "Pedro L.", points: 305, accuracy: 70, avatar: null, teamCode: "ESP" },
    { rank: 4, name: "Julia R.", points: 289, accuracy: 68, avatar: null, teamCode: "FRA" },
    { rank: 5, name: "Lucas F.", points: 275, accuracy: 65, avatar: null, teamCode: "GER" },
    { rank: 6, name: "Mariana C.", points: 260, accuracy: 63, avatar: null, teamCode: "POR" },
    { rank: 7, name: "Felipe D.", points: 248, accuracy: 60, avatar: null, teamCode: "ITA" },
    { rank: 8, name: "Camila B.", points: 235, accuracy: 58, avatar: null, teamCode: "ENG" },
];

const mockTopBoloes = [
    { rank: 1, name: "Bolão da Firma", members: 32, totalPrize: "R$ 1.600", avgAccuracy: 72 },
    { rank: 2, name: "Família Copa", members: 18, totalPrize: "R$ 900", avgAccuracy: 68 },
    { rank: 3, name: "Amigos FC", members: 24, totalPrize: "R$ 1.200", avgAccuracy: 65 },
    { rank: 4, name: "Escritório 2026", members: 15, totalPrize: "R$ 750", avgAccuracy: 62 },
    { rank: 5, name: "Galera do Fut", members: 28, totalPrize: "R$ 1.400", avgAccuracy: 60 },
];

const mockHistoricWinners = [
    { edition: "Copa 2022", winner: "Carlos S.", teamCode: "ARG", points: 456 },
    { edition: "Copa 2018", winner: "Ana M.", teamCode: "FRA", points: 412 },
    { edition: "Copa 2014", winner: "Pedro L.", teamCode: "GER", points: 389 },
    { edition: "Copa 2010", winner: "Felipe D.", teamCode: "ESP", points: 365 },
];

const rankIcons = [Crown, Medal, Award];
const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
const rankBgs = ["bg-yellow-500/10 border-yellow-500/20", "bg-gray-400/10 border-gray-400/20", "bg-amber-600/10 border-amber-600/20"];

export default function Ranking() {
    const [tab, setTab] = useState<RankingTab>("usuarios");

    const tabs: { id: RankingTab; label: string; icon: React.ReactNode }[] = [
        { id: "usuarios", label: "Usuários", icon: <Users className="w-3.5 h-3.5" /> },
        { id: "boloes", label: "Bolões", icon: <Dices className="w-3.5 h-3.5" /> },
        { id: "historico", label: "Histórico", icon: <History className="w-3.5 h-3.5" /> },
        { id: "estatisticas", label: "Estatísticas", icon: <BarChart3 className="w-3.5 h-3.5" /> },
    ];

    return (
        <div className="py-4 space-y-5">
            {/* Header */}
            <div>
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold block">Classificação Geral</span>
                <h1 className="text-2xl font-black">Ranking</h1>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1.5 p-1 bg-secondary/50 rounded-xl overflow-x-auto scrollbar-hide">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            "flex-1 py-2.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap min-w-[80px]",
                            tab === t.id
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {tab === "usuarios" && <UsuariosSection key="usuarios" />}
                {tab === "boloes" && <BoloesSection key="boloes" />}
                {tab === "historico" && <HistoricoSection key="historico" />}
                {tab === "estatisticas" && <EstatisticasSection key="estatisticas" />}
            </AnimatePresence>
        </div>
    );
}

function UsuariosSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            {/* Podium — Top 3 */}
            <div className="grid grid-cols-3 gap-2 items-end">
                <PodiumCard user={mockTopUsers[1]} position={2} />
                <PodiumCard user={mockTopUsers[0]} position={1} />
                <PodiumCard user={mockTopUsers[2]} position={3} />
            </div>

            {/* Your position banner */}
            <div className="glass-card-premium p-4 flex items-center gap-3 border-l-4 border-l-primary">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-black text-primary">
                    #12
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold">Sua posição</p>
                    <p className="text-[10px] text-muted-foreground">185 pontos • 52% de acerto</p>
                </div>
                <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold">
                    <TrendingUp className="w-3 h-3" />
                    +3
                </div>
            </div>

            {/* Remaining list */}
            <div className="space-y-1.5">
                {mockTopUsers.slice(3).map((user, i) => (
                    <motion.div
                        key={user.rank}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card p-3 flex items-center gap-3"
                    >
                        <span className="text-xs font-black text-muted-foreground w-6 text-center">{user.rank}</span>
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                            <Flag code={user.teamCode} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground">{user.accuracy}% de acerto</p>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-black">{user.points}</span>
                            <span className="text-[9px] text-muted-foreground block">pts</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

function BoloesSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            <p className="text-xs text-muted-foreground">Bolões mais ativos e competitivos:</p>

            {/* Top 3 Boloes */}
            <div className="space-y-2">
                {mockTopBoloes.map((bolao, i) => {
                    const isTop3 = i < 3;
                    const Icon = isTop3 ? rankIcons[i] : null;
                    const colorClass = isTop3 ? rankColors[i] : "text-muted-foreground";

                    return (
                        <motion.div
                            key={bolao.rank}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={cn(
                                "glass-card p-4 flex items-center gap-3",
                                isTop3 && rankBgs[i]
                            )}
                        >
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", isTop3 ? "bg-white/5" : "bg-secondary")}>
                                {Icon ? (
                                    <Icon className={cn("w-5 h-5", colorClass)} />
                                ) : (
                                    <span className="text-xs font-black text-muted-foreground">#{bolao.rank}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-black truncate">{bolao.name}</h3>
                                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{bolao.members}</span>
                                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />{bolao.avgAccuracy}%</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black text-primary">{bolao.totalPrize}</span>
                                <span className="text-[9px] text-muted-foreground block">prêmio</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}

function HistoricoSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            {/* Historic Winners */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Campeões dos Bolões</h3>
                {mockHistoricWinners.map((edition, i) => (
                    <motion.div
                        key={edition.edition}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-4 flex items-center gap-3"
                    >
                        <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-black">{edition.edition}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Flag code={edition.teamCode} size="xs" />
                                <span className="text-xs text-muted-foreground">
                                    {edition.winner} — {edition.points} pts
                                </span>
                            </div>
                        </div>
                        <Star className="w-4 h-4 text-yellow-500/50" />
                    </motion.div>
                ))}
            </div>

            {/* World Cup Historic Ranking */}
            <div className="space-y-3 mt-6">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ranking Histórico de Seleções</h3>
                <p className="text-[10px] text-muted-foreground">Dados do Guia &gt; História</p>

                {countryRankings.slice(0, 8).map((country, i) => (
                    <motion.div
                        key={country.code}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card p-3 flex items-center gap-3"
                    >
                        <span className="text-xs font-black text-muted-foreground w-6 text-center">{i + 1}</span>
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
                            <Flag code={country.code} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{country.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                                {country.titles}x campeão • {country.participations} participações
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-black">{country.goalsScored}</span>
                            <span className="text-[9px] text-muted-foreground block">gols</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

function EstatisticasSection() {
    const topScorers = allTimeTopScorers.slice(0, 10);

    const stats = [
        { label: "Mais títulos", value: "Brasil", sub: "5 títulos", icon: <Trophy className="w-5 h-5 text-yellow-500" /> },
        { label: "Mais vitórias", value: "Brasil", sub: "76 vitórias", icon: <Crown className="w-5 h-5 text-green-500" /> },
        { label: "Mais gols", value: "Brasil", sub: "237 gols", icon: <Target className="w-5 h-5 text-primary" /> },
        { label: "Maior goleada", value: "Hungria 10×1 El Salvador", sub: "Copa 1982", icon: <BarChart3 className="w-5 h-5 text-red-400" /> },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
        >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className="glass-card p-4 space-y-2"
                    >
                        {stat.icon}
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
                        <p className="text-sm font-black leading-tight">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                    </motion.div>
                ))}
            </div>

            {/* Top Scorers */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Artilheiros de Todos os Tempos</h3>
                {topScorers.map((scorer, i) => (
                    <motion.div
                        key={scorer.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card p-3 flex items-center gap-3"
                    >
                        <span className={cn(
                            "text-xs font-black w-6 text-center",
                            i < 3 ? rankColors[i] : "text-muted-foreground"
                        )}>
                            {scorer.rank}
                        </span>
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
                            <Flag code={scorer.countryCode} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{scorer.name}</p>
                            <p className="text-[10px] text-muted-foreground">{scorer.country} • {scorer.editions}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-black text-primary">{scorer.goals}</span>
                            <span className="text-[9px] text-muted-foreground block">gols</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

function PodiumCard({ user, position }: { user: typeof mockTopUsers[0]; position: 1 | 2 | 3 }) {
    const Icon = rankIcons[position - 1];
    const colorClass = rankColors[position - 1];
    const bgClass = rankBgs[position - 1];
    const isFirst = position === 1;

    return (
        <div className={cn(
            "flex flex-col items-center rounded-xl border p-3 text-center transition-all",
            bgClass,
            isFirst && "scale-105 shadow-lg"
        )}>
            <div className="relative mb-2">
                <div className={cn(
                    "rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2",
                    isFirst ? "w-16 h-16 border-yellow-500" : "w-12 h-12 border-border"
                )}>
                    <Flag code={user.teamCode} size={isFirst ? "lg" : "md"} />
                </div>
                <div className={cn(
                    "absolute -bottom-1 -right-1 rounded-full p-1",
                    position === 1 ? "bg-yellow-500" : position === 2 ? "bg-gray-400" : "bg-amber-600"
                )}>
                    <Icon className="w-3 h-3 text-white" />
                </div>
            </div>
            <p className={cn("text-[11px] font-black truncate w-full", isFirst && "text-sm")}>{user.name}</p>
            <p className={cn("text-lg font-black", colorClass)}>{user.points}</p>
            <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">pontos</p>
        </div>
    );
}
