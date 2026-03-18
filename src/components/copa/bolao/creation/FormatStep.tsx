import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { listBolaoFormats } from "@/services/boloes/bolao-format.service";
import type { BolaoFormatSlug } from "@/types/bolao";

interface FormatStepProps {
    selectedFormatId: BolaoFormatSlug;
    onSelect: (formatId: BolaoFormatSlug) => void;
}

export function FormatStep({ selectedFormatId, onSelect }: FormatStepProps) {
    const { t } = useTranslation("bolao");
    const formats = listBolaoFormats();

    return (
        <div className="space-y-6">
            <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{t("creation.step_label", { current: 2 })}</p>
                <h2 className="mt-1 text-2xl font-black">{t("creation.format_title")}</h2>
                <p className="mt-2 text-sm text-zinc-400">
                    {t("creation.format_desc")}
                </p>
            </div>

            <div className="grid gap-4">
                {formats.map((format) => {
                    const isSelected = format.id === selectedFormatId;

                    return (
                        <button
                            key={format.id}
                            type="button"
                            onClick={() => onSelect(format.id)}
                            className={cn(
                                "rounded-[28px] border p-5 text-left transition-all",
                                isSelected ? "border-primary bg-primary/10 shadow-[0_10px_30px_rgba(255,193,7,0.08)]" : "surface-card-soft"
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/15 text-3xl text-primary">
                                        {format.icon}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black">{format.name}</h3>
                                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300">
                                                {format.recommendedFor}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-zinc-400">{format.description}</p>
                                        <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                                            {t("creation.default_markets", { count: format.defaultMarketIds.length })}
                                        </p>
                                    </div>
                                </div>

                                {isSelected && <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
