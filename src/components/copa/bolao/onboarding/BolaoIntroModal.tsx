import { Compass, Layers3, Sparkles, Swords, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

function ScopeCard({
    icon,
    title,
    description,
    count,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    count: number;
}) {
    const { t } = useTranslation("bolao");
    return (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-black text-white">{title}</p>
                    <p className="text-xs text-zinc-400">{description}</p>
                </div>
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                {t(count === 1 ? "onboarding.scope_count_one" : "onboarding.scope_count_other", { count })}
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
    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogContent className="surface-dialog overflow-hidden sm:max-w-2xl">
                <DialogHeader>
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[24px] bg-primary/12 text-primary">
                        <Compass className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-white">
                        {t("onboarding.title", { name: bolaoName })}
                    </DialogTitle>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                        {t("onboarding.format_desc", { format: formatLabel ?? "Clássico" })}
                    </p>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-2">
                    <ScopeCard
                        icon={<Swords className="h-5 w-5" />}
                        title={t("onboarding.scope_match_title")}
                        description={t("onboarding.scope_match_desc")}
                        count={matchMarketsCount}
                    />
                    <ScopeCard
                        icon={<Layers3 className="h-5 w-5" />}
                        title={t("onboarding.scope_phase_title")}
                        description={t("onboarding.scope_phase_desc")}
                        count={phaseMarketsCount}
                    />
                    <ScopeCard
                        icon={<Trophy className="h-5 w-5" />}
                        title={t("onboarding.scope_tournament_title")}
                        description={t("onboarding.scope_tournament_desc")}
                        count={tournamentMarketsCount}
                    />
                    <ScopeCard
                        icon={<Sparkles className="h-5 w-5" />}
                        title={t("onboarding.scope_special_title")}
                        description={t("onboarding.scope_special_desc")}
                        count={specialMarketsCount}
                    />
                </div>

                <div className="mt-2 rounded-[24px] border border-white/10 bg-black/10 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{t("onboarding.best_path")}</p>
                    <p className="mt-2 text-sm text-zinc-400">
                        {t("onboarding.best_path_desc")}
                    </p>
                </div>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={onClose}
                        className="surface-card-soft flex-1 rounded-[22px] px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200"
                    >
                        {t("onboarding.understood")}
                    </button>
                    <button
                        type="button"
                        onClick={onGoToPredictions}
                        className="flex-1 rounded-[22px] bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black"
                    >
                        {t("onboarding.go_to_predictions")}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
