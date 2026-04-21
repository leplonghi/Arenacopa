import { Layers3, Minus, Sparkles, Swords, Target, Check, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function RankingLegend({
    exactLabel,
    winnerLabel,
    drawLabel,
    exactPoints,
    winnerPoints,
    drawPoints,
    rulesTitle,
    categoriesTitle,
    categoryLabels,
}: {
    exactLabel: string;
    winnerLabel: string;
    drawLabel: string;
    exactPoints: number;
    winnerPoints: number;
    drawPoints: number;
    rulesTitle: string;
    categoriesTitle: string;
    categoryLabels: {
        match: string;
        phase: string;
        tournament: string;
        special: string;
    };
}) {
    return (
        <div className="rounded-[40px] border border-white/5 p-8 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-copa-gold/20 to-transparent" />

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
                <div>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2">
                        <Trophy className="h-3.5 w-3.5 text-copa-gold" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">{rulesTitle}</span>
                    </div>
                    <div className="grid grid-cols-1 xs:grid-cols-3 gap-4">
                        <LegendItem icon={<Target className="w-6 h-6" />} label={exactLabel} points={exactPoints} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
                        <LegendItem icon={<Check className="w-6 h-6" />} label={winnerLabel} points={winnerPoints} color="text-amber-500" bg="bg-amber-500/10" border="border-amber-500/20" />
                        <LegendItem icon={<Minus className="w-6 h-6" />} label={drawLabel} points={drawPoints} color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" />
                    </div>
                </div>

                <div>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">{categoriesTitle}</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <CategoryPill icon={<Swords className="h-4 w-4" />} label={categoryLabels.match} color="text-emerald-400" />
                        <CategoryPill icon={<Layers3 className="h-4 w-4" />} label={categoryLabels.phase} color="text-blue-400" />
                        <CategoryPill icon={<Trophy className="h-4 w-4" />} label={categoryLabels.tournament} color="text-amber-400" />
                        <CategoryPill icon={<Sparkles className="h-4 w-4" />} label={categoryLabels.special} color="text-fuchsia-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function LegendItem({ icon, label, points, color, bg, border }: { icon: React.ReactNode; label: string; points: number; color: string; bg: string; border: string }) {
    const { t } = useTranslation("ranking");

    return (
        <div className={cn("group rounded-3xl p-6 border transition-all hover:scale-105 hover:shadow-2xl flex flex-col items-center text-center", bg, border)}>
            <div className={cn("mb-4 transform group-hover:rotate-12 transition-transform", color)}>{icon}</div>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 leading-tight px-2">{label}</span>
            <div className="flex items-baseline gap-1">
                <span className={cn("text-2xl font-black", color)}>{points}</span>
                <span className="text-[10px] font-black text-zinc-600">{t("common.points_short")}</span>
            </div>
        </div>
    );
}

function CategoryPill({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className={cn(color)}>{icon}</div>
            <span className="text-sm font-black text-white">{label}</span>
        </div>
    );
}
