import { Layers3, Sparkles, Swords, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type RankingBreakdown = {
    match: number;
    phase: number;
    tournament: number;
    special: number;
};

const categoryConfig = {
    match: {
        icon: <Swords className="h-4 w-4" />,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
    },
    phase: {
        icon: <Layers3 className="h-4 w-4" />,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
    },
    tournament: {
        icon: <Trophy className="h-4 w-4" />,
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
    },
    special: {
        icon: <Sparkles className="h-4 w-4" />,
        color: "text-fuchsia-400",
        bg: "bg-fuchsia-500/10",
        border: "border-fuchsia-500/20",
    },
} as const;

export function RankingBreakdownCard({
    breakdown,
    title,
    description,
    labels,
}: {
    breakdown: RankingBreakdown;
    title: string;
    description: string;
    labels: {
        match: string;
        phase: string;
        tournament: string;
        special: string;
    };
}) {
    const { t } = useTranslation("ranking");
    const items = [
        { key: "match", label: labels.match, value: breakdown.match },
        { key: "phase", label: labels.phase, value: breakdown.phase },
        { key: "tournament", label: labels.tournament, value: breakdown.tournament },
        { key: "special", label: labels.special, value: breakdown.special },
    ] as const;

    return (
        <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{title}</p>
                <p className="mt-2 text-sm text-zinc-400">{description}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                {items.map((item) => {
                    const config = categoryConfig[item.key];
                    return (
                        <div key={item.key} className={cn("rounded-[24px] border p-4", config.bg, config.border)}>
                            <div className={cn("mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl", config.bg, config.color)}>
                                {config.icon}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{item.label}</p>
                            <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
                            <p className={cn("text-xs font-bold", config.color)}>{t("common.points_short")}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
