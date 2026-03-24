import { BookOpen, AlertTriangle, CheckCircle2, ChevronLeft, Trophy, Target, Shield, Info, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

    return (
        <div className="min-h-screen bg-[#060606] text-white pb-32 overflow-x-hidden">
            {/* Header com Glassmorphism */}
            <div className="sticky top-[calc(3.5rem+var(--safe-area-top,0px))] md:top-16 z-20 bg-black/60 backdrop-blur-xl border-b border-white/5 p-4 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    aria-label="Voltar"
                    className="p-2.5 -ml-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 active:scale-90"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-emerald-400" />
                        Regulamento
                    </h1>
                    <span className="text-[11px] uppercase font-bold tracking-[0.14em] text-emerald-400/70">
                        Arena Cup 2026 • Manual Oficial
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
                    <h2 className="text-2xl font-black mb-2 tracking-tight">Regras do Bolão</h2>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Bem-vindo ao ArenaCup! Entenda como funciona nosso sistema de pontuação,
                        prazos e critérios de desempate para subir no ranking global.
                    </p>
                </motion.section>

                {/* Grid de Pontuação - Estilo Card Premium */}
                <motion.section variants={itemVariants} className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-400 h-4 flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" /> Sistema de Pontos
                    </h3>

                    <div className="grid gap-3">
                        <PointCard
                            title="Placar Exato"
                            points={25}
                            example="Você palpitou 2x1 e o jogo foi 2x1."
                            color="emerald"
                            icon="🎯"
                        />
                        <PointCard
                            title="Vencedor + Saldo"
                            points={18}
                            example="Palpitou 3x1 (saldo 2) e foi 2x0 (saldo 2)."
                            color="amber"
                            icon="⚖️"
                        />
                        <PointCard
                            title="Vencedor + Gols de um time"
                            points={15}
                            example="Palpitou 2x1 e foi 2x0 (Vencedor A + 2 gols A)."
                            color="blue"
                            icon="⚽"
                        />
                        <PointCard
                            title="Apenas Vencedor/Empate"
                            points={10}
                            example="Você palpitou 1x0 e o jogo foi 3x1."
                            color="orange"
                            icon="🚀"
                        />
                        <PointCard
                            title="Apenas um placar"
                            points={4}
                            example="Você palpitou 1x1 e o jogo foi 0x1."
                            color="gray"
                            icon="✨"
                        />
                    </div>
                </motion.section>

                {/* Regras Gerais */}
                <motion.section variants={itemVariants} className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-400 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5" /> Funcionamento
                    </h3>
                    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold">Prazos de Palpite</h4>
                                <p className="text-[13px] text-gray-400 leading-relaxed">
                                    Os palpites podem ser feitos ou alterados até <strong>30 minutos</strong> antes do início de cada partida em horário local.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold">Atualização Instantânea</h4>
                                <p className="text-[13px] text-gray-400 leading-relaxed">
                                    O ranking oficial e os pontos dos participantes são processados automaticamente no apito final de cada jogo.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                <Info className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold">Responsabilidade</h4>
                                <p className="text-[13px] text-gray-400 leading-relaxed">
                                    Em grupos privados com premiação, a responsabilidade é exclusiva do organizador. O ArenaCup é apenas a plataforma de automação.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Desempate */}
                <motion.section variants={itemVariants} className="space-y-4">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-emerald-400 flex items-center gap-2">
                        <HelpCircle className="w-3.5 h-3.5" /> Critérios de Desempate
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                            <span className="text-xl">1️⃣</span>
                            <span className="text-[11px] font-black uppercase text-gray-300 tracking-[0.08em]">Mais Cravadas</span>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                            <span className="text-xl">2️⃣</span>
                            <span className="text-[11px] font-black uppercase text-gray-300 tracking-[0.08em]">Última Rodada</span>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                            <span className="text-xl">3️⃣</span>
                            <span className="text-[11px] font-black uppercase text-gray-300 tracking-[0.08em]">Antiguidade</span>
                        </div>
                    </div>
                </motion.section>

                {/* FAQ Footer */}
                <motion.section variants={itemVariants} className="pt-8 pb-12 text-center border-t border-white/5">
                    <p className="text-[13px] text-gray-500 italic mb-4">
                        Dúvidas sobre o sistema? Entre em contato com o suporte oficial via app.
                    </p>
                    <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-400">
                        Boa Sorte, Torcedor! ⚽
                    </div>
                </motion.section>
            </motion.div>
        </div>
    );
}

function PointCard({ title, points, example, color, icon }: { title: string, points: number, example: string, color: string, icon: string }) {
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
                <span className="text-[10px] uppercase tracking-[0.12em] opacity-70">pontos</span>
            </div>
        </div>
    );
}
