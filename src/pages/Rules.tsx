import { BookOpen, AlertTriangle, CheckCircle2, ChevronLeft, Trophy, Target, Shield, Info, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function Rules() {
    const navigate = useNavigate();
    const { t } = useTranslation("common");

    const pointCards = [
        {
            title: t("rules_page.cards.exact.title"),
            points: 25,
            example: t("rules_page.cards.exact.example"),
            color: "emerald",
            icon: "🎯"
        },
        {
            title: t("rules_page.cards.winner_goal_diff.title"),
            points: 18,
            example: t("rules_page.cards.winner_goal_diff.example"),
            color: "amber",
            icon: "⚖️"
        },
        {
            title: t("rules_page.cards.winner_and_goals.title"),
            points: 15,
            example: t("rules_page.cards.winner_and_goals.example"),
            color: "blue",
            icon: "⚽"
        },
        {
            title: t("rules_page.cards.winner_only.title"),
            points: 10,
            example: t("rules_page.cards.winner_only.example"),
            color: "orange",
            icon: "🚀"
        },
        {
            title: t("rules_page.cards.single_score.title"),
            points: 4,
            example: t("rules_page.cards.single_score.example"),
            color: "gray",
            icon: "✨"
        }
    ];

    return (
        <div className="min-h-screen bg-[#060606] text-white pb-32 overflow-x-hidden">
            {/* Header com Glassmorphism */}
            <div className="sticky top-[calc(3.5rem+var(--safe-area-top,0px))] md:top-16 z-20 bg-black/60 backdrop-blur-xl border-b border-white/5 p-4 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    aria-label={t("rules_page.back_aria")}
                    className="p-2.5 -ml-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 active:scale-90"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-emerald-400" />
                        {t("rules_page.title")}
                    </h1>
                    <span className="text-[11px] uppercase font-bold tracking-[0.14em] text-emerald-400/70">
                        {t("rules_page.subtitle")}
                    </span>
                </div>
            </div>

            <motion.div
                className="p-4 space-y-8 max-w-2xl mx-auto"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Hero Section */}
                <motion.section variants={itemVariants} className="pt-4 text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                        <Trophy className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-black mb-2 tracking-tight">{t("rules_page.hero_title")}</h2>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        {t("rules_page.hero_desc")}
                    </p>
                </motion.section>

                {/* Grid de Pontuação - Estilo Card Premium */}
                <motion.section variants={itemVariants} className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-400 h-4 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" /> {t("rules_page.points_title")}
                    </h3>

                    <div className="grid gap-3">
                        {pointCards.map((card) => (
                            <PointCard key={card.title} {...card} />
                        ))}
                    </div>
                </motion.section>

                {/* Regras Gerais */}
                <motion.section variants={itemVariants} className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-400 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" /> {t("rules_page.operation_title")}
                    </h3>
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold">{t("rules_page.operation.deadlines_title")}</h4>
                                <p className="text-[13px] text-gray-400 leading-relaxed">
                                    {t("rules_page.operation.deadlines_desc")}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold">{t("rules_page.operation.live_update_title")}</h4>
                                <p className="text-[13px] text-gray-400 leading-relaxed">
                                    {t("rules_page.operation.live_update_desc")}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                <Info className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold">{t("rules_page.operation.responsibility_title")}</h4>
                                <p className="text-[13px] text-gray-400 leading-relaxed">
                                    {t("rules_page.operation.responsibility_desc")}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Desempate */}
                <motion.section variants={itemVariants} className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-400 flex items-center gap-2">
                        <HelpCircle className="w-3.5 h-3.5" /> {t("rules_page.tiebreak_title")}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                            <span className="text-xl">1️⃣</span>
                            <span className="text-[11px] font-black uppercase text-gray-300 tracking-[0.08em]">{t("rules_page.tiebreak.items.exact_scores")}</span>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                            <span className="text-xl">2️⃣</span>
                            <span className="text-[11px] font-black uppercase text-gray-300 tracking-[0.08em]">{t("rules_page.tiebreak.items.last_round")}</span>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                            <span className="text-xl">3️⃣</span>
                            <span className="text-[11px] font-black uppercase text-gray-300 tracking-[0.08em]">{t("rules_page.tiebreak.items.seniority")}</span>
                        </div>
                    </div>
                </motion.section>

                {/* FAQ Footer */}
                <motion.section variants={itemVariants} className="pt-8 pb-12 text-center border-t border-white/5">
                    <p className="text-[13px] text-gray-500 italic mb-4">
                        {t("rules_page.footer_desc")}
                    </p>
                    <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-400">
                        {t("rules_page.footer_cta")}
                    </div>
                </motion.section>
            </motion.div>
        </div>
    );
}

function PointCard({ title, points, example, color, icon }: { title: string, points: number, example: string, color: string, icon: string }) {
    const { t } = useTranslation("common");
    const colors: Record<string, string> = {
        emerald: "from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400",
        amber: "from-amber-500/10 to-transparent border-amber-500/20 text-amber-400",
        blue: "from-blue-500/10 to-transparent border-blue-500/20 text-blue-400",
        orange: "from-orange-500/10 to-transparent border-orange-500/20 text-orange-400",
        gray: "from-white/5 to-transparent border-white/10 text-gray-400"
    };

    return (
        <div className={cn("bg-gradient-to-br p-4 rounded-2xl border flex items-center gap-4 group hover:scale-[1.02] transition-all duration-300", colors[color])}>
            <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center text-xl shrink-0 group-hover:rotate-12 transition-transform">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white mb-0.5">{title}</h4>
                <p className="text-[12px] text-gray-400 truncate opacity-80">{example}</p>
            </div>
            <div className="text-right">
                <span className="text-lg font-black block leading-none">{points}</span>
                <span className="text-[10px] uppercase tracking-[0.12em] opacity-70">{t("rules_page.points_label")}</span>
            </div>
        </div>
    );
}
