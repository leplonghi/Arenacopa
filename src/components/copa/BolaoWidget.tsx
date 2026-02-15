import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ChevronRight, Trophy } from "lucide-react";
import { boloes } from "@/data/mockData";
import { cn } from "@/lib/utils";

export function BolaoWidget() {
    const navigate = useNavigate();
    // For demo, just pick the first bolao user is part of or a featured one
    const bolao = boloes[0];

    if (!bolao) return null;

    return (

        <motion.div
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate(`/boloes/${bolao.id}`)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="glass-card p-4 relative overflow-hidden group cursor-pointer border-l-4 border-l-primary hover:bg-secondary/40 transition-colors"
        >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm">{bolao.icon}</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-black leading-none">{bolao.name}</h3>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Seu Desempenho</span>
                    </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            <div className="flex items-end justify-between">
                <div className="flex flex-col">
                    <span className="text-3xl font-black tabular-nums leading-none tracking-tighter">{bolao.myRank}º</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Colocação</span>
                </div>

                <div className="h-8 w-px bg-border/50 mx-4" />

                <div className="flex flex-col">
                    <span className="text-3xl font-black tabular-nums leading-none tracking-tighter">{bolao.myPoints}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Pontos</span>
                </div>

                <div className="flex-1 flex justify-end">
                    {bolao.myDelta > 0 ? (
                        <div className="flex items-center gap-1 text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded-md">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-xs">+{bolao.myDelta}</span>
                        </div>
                    ) : bolao.myDelta < 0 ? (
                        <div className="flex items-center gap-1 text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded-md">
                            <TrendingDown className="w-3 h-3" />
                            <span className="text-xs">{bolao.myDelta}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-muted-foreground font-bold bg-secondary px-2 py-1 rounded-md">
                            <Minus className="w-3 h-3" />
                            <span className="text-xs">-</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
