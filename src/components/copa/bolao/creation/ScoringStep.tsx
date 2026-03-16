import { ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoringRules } from "@/types/bolao";

interface ScoringStepProps {
    presetKey: "standard" | "risky" | "conservative";
    scoringRules: ScoringRules;
    onSelectPreset: (presetKey: "standard" | "risky" | "conservative") => void;
}

const presets = {
    standard: { exact: 10, winner: 3, draw: 3, participation: 1 },
    risky: { exact: 20, winner: 5, draw: 5, participation: 0 },
    conservative: { exact: 5, winner: 2, draw: 2, participation: 1 },
} satisfies Record<"standard" | "risky" | "conservative", ScoringRules>;

export function ScoringStep({ presetKey, scoringRules, onSelectPreset }: ScoringStepProps) {
    return (
        <div className="space-y-6">
            <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Etapa 4 de 5</p>
                <h2 className="mt-1 text-2xl font-black">Pontuação base</h2>
                <p className="mt-2 text-sm text-zinc-400">
                    Escolha a assinatura da liga. Essa base vale para os mercados de jogo e serve como tom competitivo do bolão.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                {Object.entries(presets).map(([key, value]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onSelectPreset(key as keyof typeof presets)}
                        className={cn(
                            "rounded-[24px] border p-5 text-left transition-all",
                            presetKey === key ? "border-primary bg-primary/10" : "surface-card-soft"
                        )}
                    >
                        <div className="mb-3 inline-flex rounded-full bg-primary/15 p-2 text-primary">
                            {key === "standard" ? (
                                <ShieldCheck className="h-4 w-4" />
                            ) : key === "risky" ? (
                                <Sparkles className="h-4 w-4" />
                            ) : (
                                <Trophy className="h-4 w-4" />
                            )}
                        </div>
                        <p className="font-black capitalize">{key}</p>
                        <div className="mt-3 space-y-1 text-sm text-zinc-400">
                            <p>Exato: {value.exact} pts</p>
                            <p>Resultado: {value.winner} pts</p>
                            <p>Empate: {value.draw} pts</p>
                            <p>Participação: {value.participation ?? 0} pt</p>
                        </div>
                    </button>
                ))}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Resumo da base atual</p>
                <div className="mt-3 grid gap-3 text-sm text-zinc-300 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/5 bg-black/10 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Placar exato</p>
                        <p className="mt-2 text-lg font-black">{scoringRules.exact} pts</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-black/10 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Resultado</p>
                        <p className="mt-2 text-lg font-black">{scoringRules.winner} pts</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-black/10 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Empate</p>
                        <p className="mt-2 text-lg font-black">{scoringRules.draw} pts</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-black/10 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Participação</p>
                        <p className="mt-2 text-lg font-black">{scoringRules.participation ?? 0} pt</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
