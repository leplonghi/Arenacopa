import { Minus, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface ScoreInputProps {
    value: number | null;
    onChange: (v: number) => void;
    disabled?: boolean;
    /** Show tap-to-fill preset chips (0–4) for faster common-score entry. */
    showPresets?: boolean;
}

function triggerHaptic() {
    if ("vibrate" in navigator) {
        navigator.vibrate(12);
    }
}

const PRESETS = [0, 1, 2, 3, 4];

export function ScoreInput({ value, onChange, disabled, showPresets }: ScoreInputProps) {
    const prevValue = useRef<number | null>(value);
    const displayValue = value ?? "-";
    const numericValue = value ?? 0;
    const direction = value !== null && prevValue.current !== null
        ? value > prevValue.current ? 1 : -1
        : 0;

    const handleChange = (next: number) => {
        prevValue.current = numericValue;
        triggerHaptic();
        onChange(next);
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5">
                <motion.button
                    whileTap={{ scale: 0.82 }}
                    onClick={() => handleChange(Math.max(0, numericValue - 1))}
                    className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold active:bg-secondary/70 hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={disabled}
                    aria-label="Diminuir"
                >
                    <Minus className="w-3 h-3" />
                </motion.button>

                {/* Odometer-style score display */}
                <div className="w-7 flex items-center justify-center overflow-hidden" style={{ height: 24 }}>
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={String(displayValue)}
                            initial={{ y: direction > 0 ? 10 : -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: direction > 0 ? -10 : 10, opacity: 0 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="text-base font-black tabular-nums leading-none select-none"
                            style={{ display: "inline-block" }}
                        >
                            {displayValue}
                        </motion.span>
                    </AnimatePresence>
                </div>

                <motion.button
                    whileTap={{ scale: 0.82 }}
                    onClick={() => handleChange(Math.min(20, numericValue + 1))}
                    className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold active:bg-secondary/70 hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={disabled}
                    aria-label="Aumentar"
                >
                    <Plus className="w-3 h-3" />
                </motion.button>
            </div>

            {showPresets && !disabled && (
                <div className="flex items-center gap-1">
                    {PRESETS.map((preset) => {
                        const isSelected = value === preset;
                        return (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => handleChange(preset)}
                                aria-label={`Definir placar ${preset}`}
                                className={cn(
                                    "h-6 w-6 rounded-md text-[11px] font-black tabular-nums transition-colors",
                                    isSelected
                                        ? "bg-primary text-black"
                                        : "bg-white/[0.06] text-zinc-400 hover:bg-white/[0.12] hover:text-white"
                                )}
                            >
                                {preset}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
