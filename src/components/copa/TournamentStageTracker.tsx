import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

// Simplified stages focused on macro progress
const simpleStages = [
    { label: "Fase de Grupos", active: true },
    { label: "Mata-mata", active: false },
    { label: "Final", active: false },
];

export function TournamentStageTracker() {
    // Current Progress percentage (approximate for visual)
    const progress = 33;

    return (
        <div className="w-full py-4 px-2">
            <div className="max-w-md mx-auto space-y-2">
                {/* Header with Title and "Live" indicator */}
                <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progresso do Torneio</span>
                    <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                        </span>
                        <span className="text-[9px] font-bold text-primary">Em andamento</span>
                    </div>
                </div>

                {/* Modern Continuous Progress Bar */}
                <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden relative">
                    {/* Background track */}
                    <div className="absolute inset-0 bg-white/5" />

                    {/* Active Bar */}
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary/80 to-primary relative"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                        {/* Glow effect at the tip */}
                        <div className="absolute top-0 right-0 h-full w-2 bg-white/50 blur-[2px]" />
                    </motion.div>
                </div>

                {/* Labels below the bar */}
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-1">
                    {simpleStages.map((stage, i) => (
                        <span
                            key={i}
                            className={cn(
                                "transition-colors duration-500",
                                stage.active ? "text-foreground" : ""
                            )}
                        >
                            {stage.label}
                        </span>
                    ))}
                    <Trophy className="w-3 h-3 text-muted-foreground" />
                </div>
            </div>
        </div>
    );
}
