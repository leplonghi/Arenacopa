import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import {
    Trophy, Target, Users, Crown, Medal, Award, Star,
    ChevronDown, ChevronUp, Globe, Crosshair, Calendar,
    TrendingUp, Zap, Eye, Clock, Baby, Bolt, Hash, Swords
} from "lucide-react";
import {
    worldCupEditions,
    countryRankings,
    allTimeTopScorers,
    participationRanking,
    goalRankings,
    historicRecords
} from "@/data/historiaData";
import { staggerContainer, staggerItem } from "./animations";

type HistoriaSection = "edicoes" | "titulos" | "artilheiros" | "participacoes" | "gols" | "recordes";

const sectionTabs: { id: HistoriaSection; label: string; icon: React.ReactNode }[] = [
    { id: "edicoes", label: "Edições", icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: "titulos", label: "Títulos", icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: "artilheiros", label: "Artilheiros", icon: <Crosshair className="w-3.5 h-3.5" /> },
    { id: "participacoes", label: "Participações", icon: <Globe className="w-3.5 h-3.5" /> },
    { id: "gols", label: "Gols", icon: <Target className="w-3.5 h-3.5" /> },
    { id: "recordes", label: "Recordes", icon: <Zap className="w-3.5 h-3.5" /> },
];

const rankIcons = [Crown, Medal, Award];
const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
const rankBgs = [
    "bg-yellow-500/10 border-yellow-500/30",
    "bg-gray-400/10 border-gray-400/20",
    "bg-amber-600/10 border-amber-600/20"
];

function formatNumber(n: number): string {
    return n.toLocaleString("pt-BR");
}

export function HistoriaTab() {
    const [section, setSection] = useState<HistoriaSection>("edicoes");

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-24"
        >
            {/* Hero */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0f2e] via-[#1a1a3e] to-[#0d1b2a] p-8 text-center shadow-2xl border border-white/10">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 mix-blend-overlay" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10"
                >
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-200 drop-shadow-sm">
                            História da Copa
                        </h1>
                        <Trophy className="w-8 h-8 text-yellow-500" />
                    </div>
                    <p className="text-white/60 max-w-lg mx-auto text-sm leading-relaxed font-medium">
                        22 edições • 80+ anos de história • 2.548 gols • Bilhões de emoções
                    </p>
                    <div className="flex justify-center gap-4 mt-4 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                        <span>1930 — 2022</span>
                        <span>•</span>
                        <span>8 Campeões Diferentes</span>
                    </div>
                </motion.div>
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
            </section>

            {/* Section Tabs */}
            <div className="flex gap-1.5 px-1 overflow-x-auto scrollbar-hide pb-1">
                {sectionTabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setSection(t.id)}
                        className={cn(
                            "px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 border",
                            section === t.id
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Section Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={section}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="px-1"
                >
                    {section === "edicoes" && <EdicoesSection />}
                    {section === "titulos" && <TitulosSection />}
                    {section === "artilheiros" && <ArtilheirosSection />}
                    {section === "participacoes" && <ParticipacoesSection />}
                    {section === "gols" && <GolsSection />}
                    {section === "recordes" && <RecordesSection />}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}

// ═══════════════════════════════════════════
// SEÇÃO: TODAS AS EDIÇÕES
// ═══════════════════════════════════════════

function EdicoesSection() {
    const [expandedYear, setExpandedYear] = useState<number | null>(null);
    const reversed = [...worldCupEditions].reverse();

    return (
        <div className="space-y-2">
            <SectionHeader icon={<Calendar className="w-5 h-5 text-primary" />} title="Todas as Edições" subtitle="1930 a 2022 — Linha do tempo completa" />
            {reversed.map((edition, idx) => (
                <motion.div
                    key={edition.year}
                    variants={staggerItem}
                    custom={idx}
                    className={cn(
                        "glass-card overflow-hidden transition-all border",
                        expandedYear === edition.year ? "border-primary/30" : "border-transparent"
                    )}
                >
                    <button
                        onClick={() => setExpandedYear(expandedYear === edition.year ? null : edition.year)}
                        className="w-full p-3.5 flex items-center gap-3 text-left"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                            <span className="text-sm font-black text-primary">{edition.year}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <Flag code={edition.winnerCode} size="xs" />
                                <span className="text-sm font-black text-white truncate">{edition.winner}</span>
                                <Trophy className="w-3 h-3 text-yellow-500 shrink-0" />
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                                {edition.hostCountry} • {edition.totalGoals} gols • {edition.numberOfTeams} seleções
                            </p>
                        </div>
                        <div className="shrink-0">
                            {expandedYear === edition.year
                                ? <ChevronUp className="w-4 h-4 text-primary" />
                                : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                    </button>

                    <AnimatePresence>
                        {expandedYear === edition.year && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="px-3.5 pb-4 space-y-3">
                                    <div className="h-px bg-white/5" />

                                    {/* Semifinal — Final Results */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <ResultCard rank="🥇" team={edition.winner} code={edition.winnerCode} label="Campeão" color="yellow" />
                                        <ResultCard rank="🥈" team={edition.runnerUp} code={edition.runnerUpCode} label="Vice" color="gray" />
                                        <ResultCard rank="🥉" team={edition.thirdPlace} code={edition.thirdPlaceCode} label="3° Lugar" color="amber" />
                                        <ResultCard rank="4°" team={edition.fourthPlace} code={edition.fourthPlaceCode} label="4° Lugar" color="slate" />
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <StatCard label="Sede" value={edition.hostCity} icon={<Globe className="w-3 h-3" />} />
                                        <StatCard label="Jogos" value={String(edition.totalMatches)} icon={<Swords className="w-3 h-3" />} />
                                        <StatCard label="Gols" value={String(edition.totalGoals)} icon={<Target className="w-3 h-3" />} />
                                    </div>

                                    {/* Top Scorer */}
                                    <div className="bg-gradient-to-r from-yellow-500/10 to-transparent p-3 rounded-xl border border-yellow-500/10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                                <Crosshair className="w-4 h-4 text-yellow-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white">{edition.topScorerName}</p>
                                                <p className="text-[10px] text-muted-foreground">{edition.topScorerGoals} gols • Artilheiro</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Extra Info */}
                                    <div className="flex flex-wrap gap-2 text-[10px]">
                                        <span className="px-2 py-1 bg-secondary/50 rounded-md text-white/60 font-medium">
                                            <Users className="w-3 h-3 inline mr-1" />{formatNumber(edition.totalAttendance)} espectadores
                                        </span>
                                        {edition.goldenBall && (
                                            <span className="px-2 py-1 bg-yellow-500/10 rounded-md text-yellow-400 font-medium border border-yellow-500/20">
                                                <Star className="w-3 h-3 inline mr-1" />Bola de Ouro: {edition.goldenBall}
                                            </span>
                                        )}
                                        {edition.mascot && edition.mascot !== "N/A" && (
                                            <span className="px-2 py-1 bg-secondary/50 rounded-md text-white/60 font-medium">
                                                Mascote: {edition.mascot}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════
// SEÇÃO: RANKING DE TÍTULOS
// ═══════════════════════════════════════════

function TitulosSection() {
    const maxTitles = countryRankings[0].titles;

    return (
        <div className="space-y-4">
            <SectionHeader icon={<Trophy className="w-5 h-5 text-yellow-500" />} title="Ranking de Títulos" subtitle="Os maiores campeões de todos os tempos" />

            {/* Podium — Top 3 */}
            <div className="grid grid-cols-3 gap-2 items-end">
                <PodiumCard country={countryRankings[1]} position={2} />
                <PodiumCard country={countryRankings[0]} position={1} />
                <PodiumCard country={countryRankings[2]} position={2} />
            </div>

            {/* Full List */}
            <div className="space-y-2">
                {countryRankings.map((country, idx) => (
                    <motion.div
                        key={country.code}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="glass-card p-3 flex items-center gap-3"
                    >
                        <span className={cn(
                            "text-xs font-black w-6 text-center",
                            idx < 3 ? rankColors[idx] : "text-muted-foreground"
                        )}>
                            {idx + 1}
                        </span>
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                            <Flag code={country.code} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate text-white">{country.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                                {country.titleYears.length > 0 ? country.titleYears.join(", ") : country.bestResult}
                            </p>
                        </div>
                        {/* Title bar */}
                        <div className="w-24 flex items-center gap-2">
                            <div className="flex-1 bg-secondary/50 rounded-full h-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(country.titles / maxTitles) * 100}%` }}
                                    transition={{ delay: idx * 0.1, duration: 0.6 }}
                                    className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full"
                                />
                            </div>
                            <span className="text-sm font-black text-yellow-500 w-5 text-right">{country.titles}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Total Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                {countryRankings.slice(0, 4).map(c => (
                    <div key={c.code} className="glass-card p-3 flex items-center gap-2">
                        <Flag code={c.code} size="xs" />
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-white truncate">{c.name}</p>
                            <p className="text-[9px] text-muted-foreground">
                                {c.wins}V {c.draws}E {c.losses}D • {c.goalsScored} gols
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// SEÇÃO: ARTILHEIROS
// ═══════════════════════════════════════════

function ArtilheirosSection() {
    const maxGoals = allTimeTopScorers[0].goals;

    return (
        <div className="space-y-4">
            <SectionHeader icon={<Crosshair className="w-5 h-5 text-red-400" />} title="Maiores Artilheiros" subtitle="Os goleadores da história da Copa" />

            {allTimeTopScorers.map((scorer, idx) => (
                <motion.div
                    key={scorer.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className={cn(
                        "glass-card p-4 flex items-center gap-3 relative overflow-hidden",
                        idx === 0 && "border border-yellow-500/20 bg-yellow-500/5"
                    )}
                >
                    {idx === 0 && (
                        <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    )}
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0",
                        idx < 3 ? rankBgs[idx] : "bg-secondary/50 text-muted-foreground"
                    )}>
                        {idx < 3 ? (idx === 0 ? "👑" : idx === 1 ? "🥈" : "🥉") : scorer.rank}
                    </div>
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
                        <Flag code={scorer.countryCode} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{scorer.name}</p>
                        <p className="text-[10px] text-muted-foreground">{scorer.country} • {scorer.editions}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className={cn("text-lg font-black", idx === 0 ? "text-yellow-500" : "text-white")}>{scorer.goals}</p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-widest">gols</p>
                    </div>
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary/30">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(scorer.goals / maxGoals) * 100}%` }}
                            transition={{ delay: idx * 0.08, duration: 0.6 }}
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                        />
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════
// SEÇÃO: PARTICIPAÇÕES
// ═══════════════════════════════════════════

function ParticipacoesSection() {
    const maxPart = participationRanking[0].participations;

    return (
        <div className="space-y-4">
            <SectionHeader icon={<Globe className="w-5 h-5 text-blue-400" />} title="Ranking de Participações" subtitle="As seleções mais presentes na Copa" />

            {participationRanking.map((team, idx) => (
                <motion.div
                    key={team.code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                        "glass-card p-3.5 flex items-center gap-3",
                        idx === 0 && "border border-green-500/20 bg-green-500/5"
                    )}
                >
                    <span className={cn(
                        "text-xs font-black w-6 text-center",
                        idx < 3 ? rankColors[idx] : "text-muted-foreground"
                    )}>
                        {idx + 1}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                        <Flag code={team.code} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{team.name}</p>
                        <p className="text-[10px] text-muted-foreground">{team.note}</p>
                    </div>
                    <div className="text-right shrink-0 w-28">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-secondary/50 rounded-full h-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(team.participations / maxPart) * 100}%` }}
                                    transition={{ delay: idx * 0.08, duration: 0.6 }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                />
                            </div>
                            <span className="text-sm font-black text-blue-400 w-5 text-right">{team.participations}</span>
                        </div>
                        <p className="text-[8px] text-muted-foreground mt-0.5">consecutivas: {team.consecutive}</p>
                    </div>
                </motion.div>
            ))}

            {/* Highlight Box */}
            <div className="glass-card-premium p-4 border-l-4 border-l-green-500">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Flag code="BRA" size="sm" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-white">Brasil: Único em Todas</p>
                        <p className="text-[10px] text-muted-foreground">A única seleção presente em todas as 22 edições da Copa do Mundo</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// SEÇÃO: RANKING DE GOLS
// ═══════════════════════════════════════════

function GolsSection() {
    const maxGoals = goalRankings[0].goals;

    return (
        <div className="space-y-4">
            <SectionHeader icon={<Target className="w-5 h-5 text-emerald-400" />} title="Ranking de Gols" subtitle="As seleções mais artilheiras da história" />

            {goalRankings.map((team, idx) => (
                <motion.div
                    key={team.code}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass-card p-3.5 flex items-center gap-3"
                >
                    <span className={cn(
                        "text-xs font-black w-6 text-center",
                        idx < 3 ? rankColors[idx] : "text-muted-foreground"
                    )}>
                        {idx + 1}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                        <Flag code={team.code} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{team.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                            {team.matches} jogos • média: {team.avg.toFixed(2)} gols/jogo
                        </p>
                    </div>
                    <div className="w-28 flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 bg-secondary/50 rounded-full h-2.5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(team.goals / maxGoals) * 100}%` }}
                                    transition={{ delay: idx * 0.08, duration: 0.6 }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
                                />
                            </div>
                            <span className="text-sm font-black text-emerald-400 w-8 text-right">{team.goals}</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════
// SEÇÃO: RECORDES
// ═══════════════════════════════════════════

function RecordesSection() {
    const iconMap: Record<string, typeof Zap> = {
        Zap, Target, Eye, User: Users, Baby, Clock, Bolt, Users
    };

    return (
        <div className="space-y-4">
            <SectionHeader icon={<Zap className="w-5 h-5 text-orange-400" />} title="Recordes Históricos" subtitle="Os números que marcaram a história" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {historicRecords.map((record, idx) => {
                    const Icon = iconMap[record.icon] || Zap;
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.08 }}
                            whileHover={{ y: -2 }}
                            className="glass-card p-4 relative overflow-hidden group hover:border-primary/20 transition-all"
                        >
                            <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors" />
                            <div className="flex gap-3 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 flex items-center justify-center shrink-0 border border-orange-500/10">
                                    <Icon className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-0.5">{record.category}</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{record.record}</p>
                                    <span className="text-[10px] text-primary font-bold mt-1 block">{record.year}</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div className="mb-2">
            <div className="flex items-center gap-2 mb-0.5">
                {icon}
                <h2 className="text-lg font-black text-white">{title}</h2>
            </div>
            <p className="text-[11px] text-muted-foreground pl-7">{subtitle}</p>
        </div>
    );
}

function ResultCard({ rank, team, code, label, color }: {
    rank: string; team: string; code: string; label: string; color: string;
}) {
    const colorMap: Record<string, string> = {
        yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
        gray: "bg-gray-400/10 border-gray-400/20 text-gray-400",
        amber: "bg-amber-600/10 border-amber-600/20 text-amber-500",
        slate: "bg-secondary/50 border-white/5 text-muted-foreground",
    };

    return (
        <div className={cn("rounded-xl border p-2.5 flex items-center gap-2", colorMap[color])}>
            <span className="text-base">{rank}</span>
            <Flag code={code} size="xs" />
            <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{team}</p>
                <p className="text-[9px] text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-secondary/30 rounded-lg p-2.5 text-center border border-white/5">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                {icon}
                <span className="text-[9px] uppercase tracking-wider font-bold">{label}</span>
            </div>
            <p className="text-xs font-bold text-white">{value}</p>
        </div>
    );
}

function PodiumCard({ country, position }: { country: typeof countryRankings[0]; position: 1 | 2 }) {
    const isFirst = position === 1;
    return (
        <div className={cn(
            "flex flex-col items-center rounded-xl border p-3 text-center transition-all",
            isFirst ? rankBgs[0] : rankBgs[1],
            isFirst && "scale-105 shadow-lg"
        )}>
            <div className={cn(
                "rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 mb-2",
                isFirst ? "w-16 h-16 border-yellow-500" : "w-12 h-12 border-border"
            )}>
                <Flag code={country.code} size={isFirst ? "lg" : "md"} />
            </div>
            <p className={cn("text-[11px] font-black truncate w-full", isFirst && "text-sm")}>{country.name}</p>
            <p className={cn("text-2xl font-black", isFirst ? "text-yellow-500" : "text-gray-400")}>
                {country.titles}
            </p>
            <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-bold">
                {country.titles === 1 ? "título" : "títulos"}
            </p>
        </div>
    );
}
