import { useState } from "react";
import {
    Trophy, Users, History, Crown, Medal, Award,
    TrendingUp, Star, Dices, BarChart3, Target,
    ChevronRight, Zap, ArrowLeft, Search,
    ChevronUp, ChevronDown, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Flag } from "@/components/Flag";
import { motion, AnimatePresence } from "framer-motion";
import { countryRankings, allTimeTopScorers, historicRecords } from "@/data/historiaData";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type RankingTab = "usuarios" | "boloes" | "historico" | "estatisticas";

const mockTopUsers = [
    { rank: 1, name: "Carlos Silveira", points: 342, accuracy: 78, avatar: null, teamCode: "BRA", trend: "up" },
    { rank: 2, name: "Ana Maria", points: 318, accuracy: 72, avatar: null, teamCode: "ARG", trend: "same" },
    { rank: 3, name: "Pedro Lima", points: 305, accuracy: 70, avatar: null, teamCode: "ESP", trend: "down" },
    { rank: 4, name: "Julia Rocha", points: 289, accuracy: 68, avatar: null, teamCode: "FRA", trend: "up" },
    { rank: 5, name: "Lucas Ferreira", points: 275, accuracy: 65, avatar: null, teamCode: "GER", trend: "up" },
    { rank: 6, name: "Mariana Costa", points: 260, accuracy: 63, avatar: null, teamCode: "POR", trend: "same" },
    { rank: 7, name: "Felipe Dias", points: 248, accuracy: 60, avatar: null, teamCode: "ITA", trend: "down" },
    { rank: 8, name: "Camila Barros", points: 235, accuracy: 58, avatar: null, teamCode: "ENG", trend: "up" },
];

const mockTopBoloes = [
    { rank: 1, name: "Bolão da Firma Premium", members: 32, totalPrize: "R$ 1.600", avgAccuracy: 72, icon: "🏢" },
    { rank: 2, name: "Família Copa 2026", members: 18, totalPrize: "R$ 900", avgAccuracy: 68, icon: "🏠" },
    { rank: 3, name: "Amigos FC Pro", members: 24, totalPrize: "R$ 1.200", avgAccuracy: 65, icon: "🍻" },
    { rank: 4, name: "Escritório Central", members: 15, totalPrize: "R$ 750", avgAccuracy: 62, icon: "💻" },
    { rank: 5, name: "Galera do Fut", members: 28, totalPrize: "R$ 1.400", avgAccuracy: 60, icon: "⚽" },
];

const mockHistoricWinners = [
    { edition: "COPA 2022", winner: "Carlos S.", teamCode: "ARG", points: 456 },
    { edition: "COPA 2018", winner: "Ana M.", teamCode: "FRA", points: 412 },
    { edition: "COPA 2014", winner: "Pedro L.", teamCode: "GER", points: 389 },
    { edition: "COPA 2010", winner: "Felipe D.", teamCode: "ESP", points: 365 },
];

const Ranking = () => {
    const [tab, setTab] = useState<RankingTab>("usuarios");
    const navigate = useNavigate();
    const { t } = useTranslation('ranking');

    const tabs: { id: RankingTab; label: string; icon: React.ReactNode }[] = [
        { id: "usuarios", label: t('tabs.global'), icon: <Users className="w-4 h-4" /> },
        { id: "boloes", label: t('tabs.boloes'), icon: <Dices className="w-4 h-4" /> },
        { id: "historico", label: t('tabs.historico'), icon: <History className="w-4 h-4" /> },
        { id: "estatisticas", label: t('tabs.stats'), icon: <BarChart3 className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen pb-24 bg-[#020202] text-white">
            {/* Visual background details */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[50%] bg-primary/5 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-accent/5 blur-[120px] rounded-full animate-pulse" />
            </div>

            {/* Header Section */}
            <div className="relative pt-12 pb-16 px-6">
                <div className="max-w-screen-xl mx-auto relative z-10 flex flex-col items-center">
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate(-1)}
                        className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors backdrop-blur-md"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </motion.button>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 p-1 px-4 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-xl flex items-center gap-2"
                    >
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{t('hall_of_fame')}</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black tracking-tighter text-center leading-[0.8] mb-6"
                    >
                        {t('title')}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 text-center max-w-xl text-sm md:text-lg font-medium"
                    >
                        {t('subtitle')}
                    </motion.p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <nav className="sticky top-0 z-50 bg-[#020202]/60 backdrop-blur-2xl border-b border-white/5">
                <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {tabs.map((tabItem) => (
                        <motion.button
                            key={tabItem.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTab(tabItem.id)}
                            className={cn(
                                "relative px-6 py-3 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all",
                                tab === tabItem.id
                                    ? "bg-white text-black shadow-[0_8px_32px_rgba(255,255,255,0.2)]"
                                    : "text-gray-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {tabItem.icon}
                            {tabItem.label}
                            {tab === tabItem.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 rounded-2xl bg-white -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </motion.button>
                    ))}
                </div>
            </nav>

            <main className="max-w-screen-xl mx-auto px-6 py-12">
                <AnimatePresence mode="wait">
                    {tab === "usuarios" && <UsuariosTab key="usuarios" />}
                    {tab === "boloes" && <BoloesTab key="boloes" />}
                    {tab === "historico" && <HistoricoTab key="historico" />}
                    {tab === "estatisticas" && <StatsTab key="stats" />}
                </AnimatePresence>
            </main>
        </div>
    );
};

// --- USUÁRIOS TAB ---
function UsuariosTab() {
    const { t } = useTranslation('ranking');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-16"
        >
            {/* Podium Section */}
            <div className="flex flex-col items-center">
                <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mb-12 opacity-80">
                    {t('user_section.podium_desc')}
                </h2>
                <div className="flex items-end justify-center gap-4 md:gap-12 w-full max-w-4xl px-4">
                    <PodiumCard user={mockTopUsers[1]} position={2} delay={0.2} />
                    <PodiumCard user={mockTopUsers[0]} position={1} delay={0.1} />
                    <PodiumCard user={mockTopUsers[2]} position={3} delay={0.3} />
                </div>
            </div>

            {/* Current User Performance Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="p-8 rounded-[40px] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 backdrop-blur-xl relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:text-primary/20 transition-colors">
                    <TrendingUp className="w-32 h-32 rotate-12" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-4xl font-black text-black shadow-[0_12px_48px_rgba(var(--primary-rgb),0.5)]">
                            #12
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 block mb-1">
                                {t('user_section.status_protective')}
                            </span>
                            <h3 className="text-3xl font-black tracking-tighter">
                                {t('user_section.my_performance')}
                            </h3>
                        </div>
                    </div>

                    <div className="flex gap-12">
                        <div className="text-center">
                            <div className="text-3xl font-black text-white">185</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">{t('user_section.points')}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-black text-white">52%</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">{t('user_section.accuracy')}</div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 text-primary font-black text-xl">
                                <ChevronUp className="w-6 h-6" />
                                +3
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">{t('user_section.climbing')}</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Global List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500">
                        {t('user_section.top_50')}
                    </h3>
                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                        {t('user_section.rank_sync', { time: '2min' })}
                    </span>
                </div>

                <div className="grid gap-4">
                    {mockTopUsers.slice(3).map((user, idx) => (
                        <UserRow key={user.rank} user={user} index={idx} />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function UserRow({ user, index }: { user: typeof mockTopUsers[0], index: number }) {
    const { t } = useTranslation('ranking');
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + (index * 0.05) }}
            className="flex items-center gap-4 p-5 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group hover:scale-[1.02] cursor-pointer"
        >
            <div className="w-12 text-center text-lg font-black text-gray-600 group-hover:text-primary transition-colors">
                {user.rank}
            </div>
            <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center p-1 overflow-hidden shadow-2xl">
                <Flag code={user.teamCode} size="md" />
            </div>
            <div className="flex-1">
                <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors">
                    {user.name}
                </h4>
                <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {user.accuracy}% {t('user_section.accuracy')}
                    </span>
                    {user.trend === "up" && <ChevronUp className="w-4 h-4 text-primary" />}
                    {user.trend === "down" && <ChevronDown className="w-4 h-4 text-destructive" />}
                </div>
            </div>
            <div className="text-right pr-4">
                <div className="text-2xl font-black text-white group-hover:scale-110 transition-transform">
                    {user.points}
                </div>
                <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">
                    {t('user_section.points')}
                </div>
            </div>
        </motion.div>
    );
}

function PodiumCard({ user, position, delay }: { user: typeof mockTopUsers[0]; position: 1 | 2 | 3; delay: number }) {
    const isFirst = position === 1;
    const { t } = useTranslation('ranking');

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 1, type: "spring", bounce: 0.3 }}
            className={cn(
                "flex flex-col items-center flex-1 relative transition-all duration-500",
                isFirst ? "z-20 scale-110" : "z-10"
            )}
        >
            <div className="relative mb-8">
                <div className={cn(
                    "rounded-[40px] p-1.5 backdrop-blur-3xl shadow-2xl transition-transform duration-500 group-hover:rotate-6",
                    isFirst ? "bg-gradient-to-tr from-yellow-500 to-amber-200" : "bg-white/10"
                )}>
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-[34px] overflow-hidden bg-black/60 flex items-center justify-center border border-white/5">
                        <Flag code={user.teamCode} size={isFirst ? "lg" : "md"} />
                    </div>
                </div>

                <div className={cn(
                    "absolute -bottom-4 -right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-black",
                    isFirst ? "bg-yellow-500 text-black" : position === 2 ? "bg-gray-400 text-black" : "bg-amber-600 text-black"
                )}>
                    {isFirst ? <Crown className="w-6 h-6" /> : position === 2 ? <Medal className="w-6 h-6" /> : <Award className="w-6 h-6" />}
                </div>
            </div>

            <div className={cn(
                "w-full rounded-t-[48px] pt-8 pb-4 flex flex-col items-center border-t backdrop-blur-xl transition-all duration-700",
                isFirst
                    ? "h-48 bg-gradient-to-b from-yellow-500/20 to-transparent border-yellow-500/30"
                    : position === 2
                        ? "h-40 bg-gradient-to-b from-white/10 to-transparent border-white/10"
                        : "h-36 bg-gradient-to-b from-amber-600/20 to-transparent border-amber-600/20"
            )}>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
                    #{position}
                </span>
                <span className="text-sm md:text-base font-black text-white truncate px-4 max-w-full">
                    {user.name.split(' ')[0]}
                </span>
                <span className={cn(
                    "text-3xl md:text-4xl font-black tracking-tighter mt-1",
                    isFirst ? "text-yellow-500" : "text-white"
                )}>
                    {user.points}
                </span>
                <div className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] mt-2">
                    {t('user_section.points')}
                </div>
            </div>
        </motion.div>
    );
}

// --- BOLÕES TAB ---
function BoloesTab() {
    const { t } = useTranslation('ranking');

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-12"
        >
            <div className="flex items-center gap-6">
                <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-primary shrink-0">
                    {t('boloes_section.elite')}
                </h2>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            </div>

            <div className="grid gap-6">
                {mockTopBoloes.map((bolao, i) => (
                    <motion.div
                        key={bolao.rank}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        className={cn(
                            "p-8 rounded-[40px] bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center gap-8 group transition-all relative overflow-hidden",
                            i === 0 && "bg-gradient-to-br from-primary/10 via-white/5 to-transparent border-primary/20"
                        )}
                    >
                        <div className={cn(
                            "w-20 h-20 rounded-3xl flex items-center justify-center text-3xl shadow-2xl relative z-10",
                            i === 0 ? "bg-primary text-black" : "bg-white/10 text-white/50"
                        )}>
                            <span className="group-hover:scale-125 transition-transform duration-500 block">
                                {bolao.icon}
                            </span>
                            {i < 3 && (
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center">
                                    <Crown className={cn("w-4 h-4", i === 0 ? "text-primary" : i === 1 ? "text-gray-400" : "text-amber-600")} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 relative z-10">
                            <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors">
                                {bolao.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-6 mt-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-500" />
                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{bolao.members} {t('boloes_section.members')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-gray-500" />
                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{bolao.avgAccuracy}% {t('boloes_section.accuracy')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-left md:text-right relative z-10">
                            <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">
                                {t('boloes_section.total_prize')}
                            </div>
                            <div className="text-3xl font-black text-primary tracking-tighter">
                                {bolao.totalPrize}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

// --- HISTÓRICO TAB ---
function HistoricoTab() {
    const { t } = useTranslation('ranking');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-20"
        >
            {/* Hall of Fame - Winners */}
            <section className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-widest">{t('history_section.legendary_winners')}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {mockHistoricWinners.map((w, idx) => (
                        <motion.div
                            key={w.edition}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-8 rounded-[40px] bg-white/5 border border-white/10 hover:border-yellow-500/40 transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-3xl bg-yellow-500/10 flex items-center justify-center p-3 overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                                    <Flag code={w.teamCode} size="md" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white mb-1 group-hover:text-yellow-500 transition-colors uppercase tracking-tight">{w.edition}</h4>
                                    <div className="flex items-center gap-2 py-1 px-3 rounded-full bg-white/5 border border-white/10 w-fit">
                                        <span className="text-xs font-bold text-gray-400">{w.winner}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black text-yellow-500 tracking-tighter">{w.points}</div>
                                <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{t('history_section.goals')}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Nations Overview */}
            <section className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <History className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-widest">{t('history_section.panorama')}</h2>
                </div>

                <div className="grid gap-3">
                    {countryRankings.slice(0, 7).map((c, idx) => (
                        <motion.div
                            key={c.code}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (idx * 0.05) }}
                            className="flex items-center gap-5 p-6 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group"
                        >
                            <span className="w-8 text-lg font-black text-gray-700 text-center group-hover:text-primary">{idx + 1}</span>
                            <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center p-1.5 shadow-xl">
                                <Flag code={c.code} size="sm" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{c.name}</h4>
                                <div className="flex gap-4 mt-1">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{c.titles} {t('history_section.titles')}</span>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{c.participations} {t('history_section.participations')}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-white">{c.goalsScored}</div>
                                <div className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{t('history_section.goals')}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>
        </motion.div>
    );
}

// --- STATS TAB ---
function StatsTab() {
    const { t } = useTranslation('ranking');

    const recordsCards = [
        { key: 'most_titles', value: "Brasil", sub: "5 Conquistas", icon: "🏆", color: "from-yellow-500/20 via-yellow-500/5" },
        { key: 'most_wins', value: "Brasil", sub: "76 Partidas", icon: "🔥", color: "from-emerald-500/20 via-emerald-500/5" },
        { key: 'goals_record', value: "Brasil", sub: "237 Gols", icon: "⚽", color: "from-blue-500/20 via-blue-500/5" },
        { key: 'biggest_rout', value: "HUN 10×1 ESA", sub: "Espanha 1982", icon: "💣", color: "from-red-500/20 via-red-500/5" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-16"
        >
            {/* Record Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {recordsCards.map((rec, idx) => (
                    <motion.div
                        key={rec.key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -10 }}
                        className={cn(
                            "p-6 rounded-[40px] border border-white/10 bg-gradient-to-br flex flex-col items-center text-center backdrop-blur-md transition-all shadow-xl group",
                            rec.color
                        )}
                    >
                        <div className="w-16 h-16 rounded-3xl bg-black/40 border border-white/5 flex items-center justify-center text-3xl mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                            {rec.icon}
                        </div>
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 leading-relaxed px-4 h-8 flex items-center justify-center italic">
                            {t(`stats_section.records.${rec.key}`)}
                        </span>
                        <h4 className="text-xl font-black text-white tracking-widest break-words w-full">
                            {rec.value}
                        </h4>
                        <span className="text-[10px] font-black text-primary uppercase mt-1 tracking-widest">
                            {rec.sub}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Scorers List */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Target className="w-6 h-6 text-red-500" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-widest">{t('stats_section.top_scorers')}</h2>
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-red-500/30 to-transparent" />
                </div>

                <div className="p-8 rounded-[48px] bg-white/5 border border-white/10 overflow-hidden backdrop-blur-xl">
                    <div className="grid gap-2">
                        {allTimeTopScorers.slice(0, 10).map((s, idx) => (
                            <div
                                key={s.name}
                                className={cn(
                                    "flex items-center gap-6 p-6 rounded-[32px] transition-all group cursor-pointer",
                                    idx < 3 ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
                                )}
                            >
                                <div className={cn(
                                    "w-10 text-xl font-black text-center",
                                    idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : idx === 2 ? "text-amber-600" : "text-gray-700"
                                )}>
                                    {idx + 1}
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-black/40 p-1.5 flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden shrink-0">
                                    <Flag code={s.countryCode} size="sm" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-black text-white group-hover:text-primary transition-colors">{s.name}</h4>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.country} • {s.editions}</span>
                                </div>
                                <div className="text-right flex flex-col items-end pr-4">
                                    <span className="text-3xl font-black text-white tracking-tighter">{s.goals}</span>
                                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{t('history_section.goals')}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-800 group-hover:text-primary transition-colors group-hover:translate-x-1" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fun Facts section */}
            <section className="space-y-8">
                <div className="flex items-center gap-4 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-widest">RECORDES RÁPIDOS</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historicRecords.slice(0, 6).map((rec, idx) => (
                        <div key={idx} className="p-6 rounded-[32px] bg-white/5 border border-white/10 flex items-center gap-6 group hover:bg-white/[0.08] transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Info className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{rec.category}</p>
                                <h4 className="text-base font-black text-white">{rec.record}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </motion.div>
    );
}

export default Ranking;
