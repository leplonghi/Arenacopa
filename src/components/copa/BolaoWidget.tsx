import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ChevronRight, Trophy, Zap, Star, ShieldCheck } from "lucide-react";
import { boloes } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function BolaoWidget() {
    const { t } = useTranslation('bolao');
    const navigate = useNavigate();
    // For demo, just pick the first bolao user is part of or a featured one
    const bolao = boloes[0];

    if (!bolao) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -6, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/boloes/${bolao.id}`)}
            className="relative overflow-hidden cursor-pointer group p-[1.5px] rounded-[40px] bg-gradient-to-br from-primary/30 via-white/5 to-transparent shadow-2xl"
        >
            <div className="bg-[#080808] rounded-[39px] p-8 relative overflow-hidden transition-all group-hover:bg-[#0a0a0a] backdrop-blur-3xl">
                {/* Immersive Background Elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-[60px] group-hover:bg-primary/10 transition-colors duration-700" />
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Trophy className="w-32 h-32 text-primary rotate-12" />
                </div>

                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-[22px] bg-primary/20 flex items-center justify-center border border-primary/20 shadow-2xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 relative overflow-hidden">
                                <span className="text-3xl drop-shadow-2xl relative z-10">{bolao.icon}</span>
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-primary flex items-center justify-center border-2 border-[#080808] shadow-lg">
                                <Zap className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                <ShieldCheck className="w-3 h-3 text-primary animate-pulse" />
                                <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">{t('widget.status_live')}</span>
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tighter leading-none group-hover:text-primary transition-colors">{bolao.name}</h3>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all shadow-xl">
                        <ChevronRight className="w-6 h-6 stroke-[2.5px]" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 relative z-10">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-5xl font-black text-white tracking-tighter tabular-nums leading-none">{bolao.myRank}</span>
                                <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">{t('widget.position')}</span>
                            </div>
                            <div className="h-1 w-12 bg-primary/20 rounded-full mt-3 overflow-hidden">
                                <motion.div
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '0%' }}
                                    className="h-full bg-primary"
                                    transition={{ duration: 1.5, type: 'spring' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                        <div className="text-right">
                            <div className="text-4xl font-black text-white tracking-tighter tabular-nums leading-none">{bolao.myPoints}</div>
                            <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">{t('widget.total_points')}</div>
                        </div>

                        <div className={cn(
                            "flex items-center gap-2 rounded-2xl px-5 py-2.5 border font-black text-[11px] transition-all tracking-tighter",
                            bolao.myDelta > 0
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                                : bolao.myDelta < 0
                                    ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                                    : "bg-white/5 text-gray-500 border-white/10"
                        )}>
                            {bolao.myDelta > 0 ? (
                                <>
                                    <TrendingUp className="w-4 h-4" strokeWidth={3} />
                                    <span>{t('widget.up', { count: bolao.myDelta })}</span>
                                </>
                            ) : bolao.myDelta < 0 ? (
                                <>
                                    <TrendingDown className="w-4 h-4" strokeWidth={3} />
                                    <span>{t('widget.down', { count: Math.abs(bolao.myDelta) })}</span>
                                </>
                            ) : (
                                <>
                                    <Minus className="w-4 h-4" strokeWidth={3} />
                                    <span>{t('widget.stable')}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom decorative bar */}
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:via-primary scale-x-75 group-hover:scale-x-100 transition-all duration-1000" />
            </div>
        </motion.div>
    );
}
