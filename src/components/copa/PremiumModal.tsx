
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Crown, Zap, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMonetization } from "@/contexts/MonetizationContext";
import { monetizationEnv } from "@/lib/env";
import {
    getPremiumSupportMailto,
} from "@/services/monetization/stripe.service";

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function PremiumModal({ isOpen, onClose, onSuccess }: PremiumModalProps) {
    const { purchasePremium, isLoading } = useMonetization();
    const canStartPremiumCheckout = monetizationEnv.enablePremiumSimulation || monetizationEnv.premiumCheckoutEnabled;
    const supportMailto = getPremiumSupportMailto();

    const handlePurchase = async () => {
        if (!canStartPremiumCheckout) {
            window.location.href = supportMailto;
            return;
        }

        const startedCheckout = await purchasePremium();
        if (!startedCheckout) {
            return;
        }
        onSuccess();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-black/80 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Image / Gradient */}
                    <div className="h-32 bg-gradient-to-br from-yellow-400 via-copa-orange to-red-600 relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/60"></div>

                        <div className="relative z-10 text-center text-white">
                            <Crown className="w-12 h-12 mx-auto drop-shadow-lg mb-2" />
                            <h2 className="text-2xl font-black uppercase tracking-widest drop-shadow-md">Arena Premium</h2>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-bold text-foreground">Desbloqueie o potencial máximo!</h3>
                            <p className="text-sm text-muted-foreground">Torne-se um membro Premium e leve sua experiência na Copa para outro nível.</p>
                        </div>

                        <div className="space-y-3">
                            {[
                                { icon: <Zap className="w-4 h-4 text-yellow-500" />, text: "Remover todos os anúncios" },
                                { icon: <Shield className="w-4 h-4 text-copa-blue" />, text: "Estatísticas avançadas" },
                                { icon: <Sparkles className="w-4 h-4 text-copa-green-light" />, text: "Insignia exclusiva de apoiador" },
                                { icon: <Crown className="w-4 h-4 text-copa-orange" />, text: "Acesso antecipado a novidades" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                                    <div className="p-2 rounded-full bg-background shadow-sm">
                                        {item.icon}
                                    </div>
                                    <span className="text-sm font-semibold">{item.text}</span>
                                    <Check className="w-4 h-4 text-green-500 ml-auto" />
                                </div>
                            ))}
                        </div>

                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-muted-foreground line-through">R$ 19,90</span>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-primary">R$ 4,99</span>
                                    <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider">Pagamento Único</span>
                                </div>
                            </div>

                            <Button
                                onClick={handlePurchase}
                                disabled={isLoading}
                                className="w-full h-12 text-base font-bold bg-gradient-to-r from-yellow-500 to-copa-orange hover:from-yellow-400 hover:to-copa-orange/90 text-white shadow-lg shadow-copa-orange/20 rounded-xl"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processando...
                                    </span>
                                ) : !canStartPremiumCheckout ? (
                                    <span className="flex items-center gap-2">
                                        QUERO SER AVISADO <Crown className="w-4 h-4 fill-current" />
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        QUERO SER PREMIUM <Crown className="w-4 h-4 fill-current" />
                                    </span>
                                )}
                            </Button>
                            {!canStartPremiumCheckout && (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="mt-3 w-full h-11 rounded-xl border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                                >
                                    <a href={supportMailto}>Falar com o suporte</a>
                                </Button>
                            )}
                            <p className="text-[10px] text-center text-muted-foreground mt-3">
                                {canStartPremiumCheckout
                                    ? "Compra segura e criptografada. Satisfacao garantida."
                                    : "O checkout ainda está em preparação. Entre na lista de aviso pelo suporte."}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
