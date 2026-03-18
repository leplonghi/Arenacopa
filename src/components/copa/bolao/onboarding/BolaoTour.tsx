import type { ReactNode } from "react";
import { BarChart3, Compass, Layers3, Sparkles, Swords, X } from "lucide-react";
import { useTranslation } from "react-i18next";

type TourTab = "ranking" | "jogos" | "fase" | "extras" | "especiais";

export function BolaoTour({
    tab,
    onDismiss,
}: {
    tab: TourTab;
    onDismiss: () => void;
}) {
    const { t } = useTranslation("bolao");
    const tourContent: Record<TourTab, { title: string; description: string; icon: ReactNode }> = {
        ranking: {
            title: t("onboarding.tour_ranking_title"),
            description: t("onboarding.tour_ranking_desc"),
            icon: <BarChart3 className="h-5 w-5" />,
        },
        jogos: {
            title: t("onboarding.tour_games_title"),
            description: t("onboarding.tour_games_desc"),
            icon: <Swords className="h-5 w-5" />,
        },
        fase: {
            title: t("onboarding.tour_phase_title"),
            description: t("onboarding.tour_phase_desc"),
            icon: <Layers3 className="h-5 w-5" />,
        },
        extras: {
            title: t("onboarding.tour_tournament_title"),
            description: t("onboarding.tour_tournament_desc"),
            icon: <Compass className="h-5 w-5" />,
        },
        especiais: {
            title: t("onboarding.tour_special_title"),
            description: t("onboarding.tour_special_desc"),
            icon: <Sparkles className="h-5 w-5" />,
        },
    };
    const content = tourContent[tab];

    return (
        <div className="mb-6 rounded-[28px] border border-primary/20 bg-primary/8 p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                        {content.icon}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{t("onboarding.tip_label")}</p>
                        <h3 className="mt-2 text-lg font-black text-white">{content.title}</h3>
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">{content.description}</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onDismiss}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:text-white"
                    aria-label={t("onboarding.tour_close")}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
