import { Minus, Plus } from "lucide-react";

interface ScoreInputProps {
    value: number | null;
    onChange: (v: number) => void;
    disabled?: boolean;
}

export function ScoreInput({ value, onChange, disabled }: ScoreInputProps) {
    const displayValue = value ?? "-";
    const numericValue = value ?? 0;

    return (
        <div className="flex items-center gap-1.5">
            <button
                onClick={() => onChange(Math.max(0, numericValue - 1))}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold active:bg-secondary/70 hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled}
            >
                <Minus className="w-3 h-3" />
            </button>
            <span className="w-7 text-center text-base font-black">{displayValue}</span>
            <button
                onClick={() => onChange(Math.min(20, numericValue + 1))}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold active:bg-secondary/70 hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled}
            >
                <Plus className="w-3 h-3" />
            </button>
        </div>
    );
}
