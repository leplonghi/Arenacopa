
import { BookOpen, AlertTriangle, CheckCircle2, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Rules() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background pb-24">
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-white/5 p-4 flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-black flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Regras & Regulamento
                </h1>
            </div>

            <div className="p-4 space-y-6 max-w-2xl mx-auto">

                {/* Intro */}
                <section className="space-y-3">
                    <p className="text-muted-foreground leading-relaxed">
                        Bem-vindo ao ArenaCopa! Aqui você encontra todas as regras para participar dos bolões, pontuar e competir no ranking global.
                    </p>
                </section>

                {/* Scoring System */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-5 space-y-4"
                >
                    <h2 className="text-lg font-black text-primary flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Sistema de Pontuação
                    </h2>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="font-medium">Placar Exato</span>
                            <span className="font-black text-primary text-lg">25 pts</span>
                        </div>
                        <p className="text-xs text-muted-foreground px-2">Ex: Você palpitou 2x1 e o jogo foi 2x1.</p>

                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="font-medium">Vencedor + Saldo de Gols</span>
                            <span className="font-black text-yellow-500 text-lg">18 pts</span>
                        </div>
                        <p className="text-xs text-muted-foreground px-2">Ex: Você palpitou 3x1 (saldo 2) e o jogo foi 2x0 (saldo 2).</p>

                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="font-medium">Vencedor + Gols de um time</span>
                            <span className="font-black text-yellow-500 text-lg">15 pts</span>
                        </div>
                        <p className="text-xs text-muted-foreground px-2">Ex: Você palpitou 2x1 (vencedor A, 2 gols A) e o jogo foi 2x0 (vencedor A, 2 gols A).</p>

                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="font-medium">Apenas Vencedor (ou Empate)</span>
                            <span className="font-black text-orange-500 text-lg">10 pts</span>
                        </div>
                        <p className="text-xs text-muted-foreground px-2">Ex: Você palpitou 1x0 e o jogo foi 3x1. Acertou quem venceu.</p>

                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="font-medium">Apenas um placar (Gols)</span>
                            <span className="font-black text-muted-foreground text-lg">4 pts</span>
                        </div>
                        <p className="text-xs text-muted-foreground px-2">Ex: Você palpitou 1x1 e o jogo foi 0x1. Acertou a quantidade de gols de um time.</p>
                    </div>
                </motion.section>

                {/* Rules */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-5 space-y-4"
                >
                    <h2 className="text-lg font-black text-primary flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Regras Gerais
                    </h2>
                    <ul className="space-y-3 text-sm text-foreground/80 list-disc list-inside marker:text-primary">
                        <li>Os palpites podem ser feitos ou alterados até <strong>30 minutos</strong> antes do início de cada partida.</li>
                        <li>O ranking é atualizado automaticamente após o término de cada jogo.</li>
                        <li>Em bolões com premiação, a responsabilidade de pagamento e distribuição é inteiramente do organizador. O app é apenas a plataforma de pontuação.</li>
                        <li>Usuários Premium têm acesso a estatísticas avançadas e não veem anúncios.</li>
                    </ul>
                </motion.section>

                {/* Criteria */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-5 space-y-4"
                >
                    <h2 className="text-lg font-black text-primary">Critérios de Desempate</h2>
                    <ol className="space-y-2 text-sm text-foreground/80 list-decimal list-inside marker:font-bold marker:text-primary">
                        <li>Maior número de placares exatos (Cravadas)</li>
                        <li>Maior pontuação na última rodada</li>
                        <li>Data de entrada no bolão (quem entrou antes vence)</li>
                    </ol>
                </motion.section>

            </div>
        </div>
    );
}
