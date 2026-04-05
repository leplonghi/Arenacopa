import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Sparkles, X, CheckCircle2, Zap, ShieldCheck, Trophy, Loader2 } from 'lucide-react';
import { useMonetization } from '@/contexts/MonetizationContext';
import { useToast } from '@/hooks/use-toast';
import { monetizationEnv } from '@/lib/env';
import { useTranslation } from 'react-i18next';
import {
    getPremiumSupportMailto,
} from '@/services/monetization/stripe.service';

export function ElitePassModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { purchasePremium, isLoading, isPremium } = useMonetization();
    const { toast } = useToast();
    const { t } = useTranslation('premium');
    const canStartPremiumCheckout = monetizationEnv.enablePremiumSimulation || monetizationEnv.premiumCheckoutEnabled;
    const supportMailto = getPremiumSupportMailto();
    const benefits = t('elite.benefits', { returnObjects: true }) as Array<{ title: string; desc: string }>;

    // If they already bought it, no need to show the sales pitch again
    if (isPremium) {
        if (isOpen) onClose();
        return null;
    }

    const handlePurchase = async () => {
        try {
            if (!canStartPremiumCheckout) {
                window.location.href = supportMailto;
                return;
            }

            const startedCheckout = await purchasePremium();
            if (!startedCheckout) {
                return;
            }
            onClose();
        } catch (e) {
            toast({
                title: t('elite.transaction_error_title'),
                description: t('elite.transaction_error_desc'),
                variant: "destructive"
            });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Immersive Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-lg relative pointer-events-auto"
                        >
                            {/* Premium Glow Effect Behind Modal */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 rounded-[44px] blur-xl opacity-30 animate-pulse" />

                            {/* Modal Body */}
                            <div className="relative bg-[#0a0a0a] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">

                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-20"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Hero Header */}
                                <div className="relative pt-12 pb-8 px-8 text-center bg-gradient-to-b from-yellow-500/10 to-transparent">
                                    <motion.div
                                        animate={{ rotateY: [0, 360] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                        className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-yellow-400 to-yellow-600 p-[2px] mb-6 shadow-[0_0_30px_rgba(234,179,8,0.3)]"
                                    >
                                        <div className="w-full h-full bg-[#0a0a0a] rounded-[22px] flex items-center justify-center relative overflow-hidden">
                                            <div className="absolute inset-0 bg-yellow-500/20" />
                                            <Crown className="w-10 h-10 text-yellow-500 relative z-10" />
                                        </div>
                                    </motion.div>

                                    <h2 className="text-4xl font-black text-white tracking-tighter mb-2">{t('elite.title')}</h2>
                                    <p className="text-[11px] font-black text-yellow-500 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5" /> {t('elite.subtitle')}
                                    </p>
                                </div>

                                {/* Benefits List */}
                                <div className="px-8 pb-8 space-y-4">
                                    {[
                                        { icon: <Zap className="text-yellow-500" />, title: benefits[0]?.title, desc: benefits[0]?.desc },
                                        { icon: <Trophy className="text-blue-400" />, title: benefits[1]?.title, desc: benefits[1]?.desc },
                                        { icon: <ShieldCheck className="text-emerald-400" />, title: benefits[2]?.title, desc: benefits[2]?.desc },
                                    ].map((benefit, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * i }}
                                            key={i}
                                            className="flex items-center gap-5 p-4 rounded-2xl bg-white/[0.03] border border-white/5"
                                        >
                                            <div className="w-12 h-12 rounded-[14px] bg-white/5 flex items-center justify-center shrink-0">
                                                {benefit.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white">{benefit.title}</h4>
                                                <p className="text-xs text-gray-500 mt-1 font-medium">{benefit.desc}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Pricing & CTA */}
                                <div className="p-8 bg-white/[0.02] border-t border-white/5 text-center">
                                    <div className="mb-6 flex flex-col items-center justify-center">
                                        <span className="text-sm text-gray-500 font-bold line-through decoration-red-500/50">R$ 49,90</span>
                                        <div className="flex items-start gap-2 text-yellow-500">
                                            <span className="text-2xl font-black mt-1">R$</span>
                                            <span className="text-6xl font-black tracking-tighter leading-none">29</span>
                                            <span className="text-2xl font-black mt-1">,90</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-2 bg-white/5 py-1 px-3 rounded-full">
                                            {t('elite.lifetime').toUpperCase()}
                                        </span>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handlePurchase}
                                        disabled={isLoading}
                                        className="w-full relative group h-16 rounded-full flex items-center justify-center overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 bg-[length:200%_auto] animate-gradient" />
                                        <div className="relative z-10 flex items-center gap-3 text-black font-black uppercase tracking-widest text-sm">
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" /> {t('elite.processing').toUpperCase()}
                                                </>
                                            ) : !canStartPremiumCheckout ? (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" /> {t('elite.notify').toUpperCase()}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" /> {t('elite.buy').toUpperCase()}
                                                </>
                                            )}
                                        </div>
                                    </motion.button>
                                    {!canStartPremiumCheckout && (
                                        <a
                                            href={supportMailto}
                                            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/[0.08]"
                                        >
                                            {t('elite.support')}
                                        </a>
                                    )}
                                    <p className="text-[10px] text-gray-600 font-medium mt-4">
                                        {canStartPremiumCheckout
                                            ? t('elite.secure_message')
                                            : t('elite.preparing_message')}
                                    </p>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
