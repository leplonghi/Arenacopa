import { Compass, Layers3, Sparkles, Swords, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type BolaoIntroModalProps = {
    open: boolean;
    bolaoName: string;
    formatLabel: string | null;
    matchMarketsCount: number;
    phaseMarketsCount: number;
    tournamentMarketsCount: number;
    specialMarketsCount: number;
    onClose: () => void;
    onGoToPredictions: () => void;
};

type ScopeTone = "amber" | "cyan" | "rose" | "violet";

interface ScopeConfig {
    tone: ScopeTone;
    icon: React.ReactNode;
    title: string;
    description: string;
    count: number;
}

const toneClasses: Record<ScopeTone, { border: string; bg: string; bgIcon: string; text: string; textCount: string }> = {
    amber: {
        border: "border-amber-400/20",
        bg: "bg-amber-400/[0.06]",
        bgIcon: "bg-amber-400/12",
        text: "text-amber-400",
        textCount: "text-amber-400",
    },
    cyan: {
        border: "border-cyan-400/20",
        bg: "bg-cyan-400/[0.06]",
        bgIcon: "bg-cyan-400/12",
        text: "text-cyan-400",
        textCount: "text-cyan-400",
    },
    rose: {
        border: "border-rose-400/20",
        bg: "bg-rose-400/[0.06]",
        bgIcon: "bg-rose-400/12",
        text: "text-rose-400",
        textCount: "text-rose-400",
    },
    violet: {
        border: "border-violet-400/20",
        bg: "bg-violet-400/[0.06]",
        bgIcon: "bg-violet-400/12",
        text: "text-violet-400",
        textCount: "text-violet-400",
    },
};

function ScopeCard({ config }: { config: ScopeConfig }) {
    const { t } = useTranslation("bolao");
    const tone = toneClasses[config.tone];
    return (
        <div className={cn("rounded-[18px] border p-3", tone.border, tone.bg)}>
            <div className="flex items-center gap-2.5">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", tone.bgIcon, tone.text)}>
                    {config.icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-black text-white">{config.title}</p>
                    <p className="text-[10px] text-zinc-400 leading-tight">{config.description}</p>
                </div>
            </div>
            <p className={cn("mt-2 text-[9px] font-black uppercase tracking-[0.16em]", tone.textCount)}>
                {t(config.count === 1 ? "onboarding.scope_count_one" : "onboarding.scope_count_other", { count: config.count })}
            </p>
        </div>
    );
}

export function BolaoIntroModal({
    open,
    bolaoName,
    formatLabel,
    matchMarketsCount,
    phaseMarketsCount,
    tournamentMarketsCount,
    specialMarketsCount,
    onClose,
    onGoToPredictions,
}: BolaoIntroModalProps) {
    const { t } = useTranslation("bolao");

    const scopes: ScopeConfig[] = [
        {
            tone: "amber",
            icon: <Swords className="h-4 w-4" />,
            title: t("onboarding.scope_match_title"),
            description: t("onboarding.scope_match_desc"),
            count: matchMarketsCount,
        },
        {
            tone: "cyan",
            icon: <Layers3 className="h-4 w-4" />,
            title: t("onboarding.scope_phase_title"),
            description: t("onboarding.scope_phase_desc"),
            count: phaseMarketsCount,
        },
        {
            tone: "rose",
            icon: <Trophy className="h-4 w-4" />,
            title: t("onboarding.scope_tournament_title"),
            description: t("onboarding.scope_tournament_desc"),
            count: tournamentMarketsCount,
        },
        {
            tone: "violet",
            icon: <Sparkles className="h-4 w-4" />,
            title: t("onboarding.scope_special_title"),
            description: t("onboarding.scope_special_desc"),
            count: specialMarketsCount,
        },
    ];

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogContent className="surface-dialog max-h-[85dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-[20px] bg-primary/12 text-primary">
                        <Compass className="h-5 w-5" />
                    </div>
                    <DialogTitle className="text-xl font-black text-white">
                        {t("onboarding.title", { name: bolaoName })}
                    </DialogTitle>
                    <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-zinc-400">
                        {t("onboarding.format_desc", { format: formatLabel ?? "Clássico" })}
                    </p>
                </DialogHeader>

                <div className="grid gap-2.5 sm:grid-cols-2">
                    {scopes.map((scope) => (
                        <ScopeCard key={scope.title} config={scope} />
                    ))}
                </div>

                <div className="mt-1 rounded-[18px] border border-white/10 bg-black/10 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">{t("onboarding.best_path")}</p>
                    <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                        {t("onboarding.best_path_desc")}
                    </p>
                </div>

                <div className="mt-1 flex flex-col gap-2.5 sm:flex-row">
                    <button
                        type="button"
                        onClick={onClose}
                        className="surface-card-soft flex-1 rounded-[18px] px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-200"
                    >
                        {t("onboarding.understood")}
                    </button>
                    <button
                        type="button"
                        onClick={onGoToPredictions}
                        className="flex-1 rounded-[18px] bg-primary px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-black"
                    >
                        {t("onboarding.go_to_predictions")}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
