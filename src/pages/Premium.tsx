import { useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle2, Crown, Loader2, Star, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMonetization } from "@/contexts/MonetizationContext";
import { motion } from "framer-motion";

export default function Premium() {
    const navigate = useNavigate();
    const { isPremium, purchasePremium, isLoading } = useMonetization();

    return (
        <div className="min-h-screen bg-background pb-32 pt-20 px-4 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 left-0 h-[400px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none" />

            <div className="max-w-md mx-auto relative z-10">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="text-center mb-8">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary via-copa-live to-amber-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 animate-pulse">
                        <Crown className="w-10 h-10 text-black drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl font-black mb-3 tracking-tighter uppercase drop-shadow">Copa Premium</h1>
                    <p className="text-muted-foreground text-sm">Torne-se um apoiador e desbloqueie a experiência definitiva.</p>
                </div>

                {isPremium ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 text-center border-primary/30">
                        <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Você já é Premium!</h2>
                        <p className="text-sm text-muted-foreground mb-4">Obrigado por apoiar o desenvolvimento do ArenaCopa. Todos os benefícios estão ativos.</p>
                        <Button onClick={() => navigate("/")} className="w-full bg-primary text-black font-bold h-12">
                            Voltar ao Início
                        </Button>
                    </motion.div>
                ) : (
                    <>
                        <div className="glass-card p-4 space-y-4 mb-8">
                            <div className="flex items-start gap-4 p-3 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                    <Star className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Bolões Ilimitados</h3>
                                    <p className="text-[11px] text-muted-foreground mt-1">Crie e participe de quantas ligas quiser. (Limite Free: 2 ligas)</p>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-primary ml-auto mt-2" />
                            </div>

                            <div className="flex items-start gap-4 p-3 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Sem Anúncios</h3>
                                    <p className="text-[11px] text-muted-foreground mt-1">Navegação fluida, sem banners ou interrupções comerciais.</p>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-primary ml-auto mt-2" />
                            </div>

                            <div className="flex items-start gap-4 p-3 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                                    <Crown className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Badge Torcedor Oficial</h3>
                                    <p className="text-[11px] text-muted-foreground mt-1">Destaque exclusivo ao lado do seu nome nos rankings.</p>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-primary ml-auto mt-2" />
                            </div>
                        </div>

                        <Button
                            onClick={() => {
                                if (window.plausible) {
                                    window.plausible('Premium Click');
                                }
                                purchasePremium();
                            }}
                            disabled={isLoading}
                            className="w-full h-14 bg-gradient-to-r from-primary to-[hsl(var(--copa-gold))] text-black font-black uppercase text-sm rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-[1.02] transition-transform"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Garantir Acesso Vitalício - R$9,90"}
                        </Button>
                        <p className="text-center text-[10px] text-muted-foreground mt-4">Pagamento único. Acesso vitalício a todos os torneios.</p>
                    </>
                )}
            </div>
        </div>
    );
}
