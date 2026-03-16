import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTemplatesForFormat, listBolaoMarketTemplates } from "@/services/boloes/bolao-market.service";
import type { BolaoFormatSlug, MarketScope, MarketTemplateSlug } from "@/types/bolao";

interface MarketSelectionStepProps {
    formatId: BolaoFormatSlug;
    selectedMarketIds: MarketTemplateSlug[];
    onToggle: (marketId: MarketTemplateSlug) => void;
    onReset: () => void;
}

const scopeLabels: Record<MarketScope, string> = {
    match: "Por jogo",
    phase: "Por fase",
    tournament: "Campeonato",
    special: "Especiais",
};

export function MarketSelectionStep({
    formatId,
    selectedMarketIds,
    onToggle,
    onReset,
}: MarketSelectionStepProps) {
    const templates = listBolaoMarketTemplates({ onlyEnabled: true });
    const defaultMarketIds = getTemplatesForFormat(formatId).map((template) => template.id);
    const groupedScopes = templates.reduce<Record<MarketScope, typeof templates>>(
        (accumulator, template) => {
            accumulator[template.scope].push(template);
            return accumulator;
        },
        {
            match: [],
            phase: [],
            tournament: [],
            special: [],
        }
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Etapa 3 de 5</p>
                    <h2 className="mt-1 text-2xl font-black">Mercados ativos</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                        Ligue e desligue os mercados que fazem sentido para a sua liga.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onReset}
                    className="surface-chip rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]"
                >
                    Restaurar padrão
                </button>
            </div>

            <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Base do formato</p>
                <p className="mt-2 text-sm text-zinc-300">
                    Este formato começa com {defaultMarketIds.length} mercados padrão. Você pode personalizar agora sem perder a coerência do modelo.
                </p>
            </div>

            <div className="space-y-6">
                {(Object.keys(groupedScopes) as MarketScope[]).map((scope) => {
                    const items = groupedScopes[scope];
                    if (!items.length) return null;

                    return (
                        <section key={scope} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{scopeLabels[scope]}</span>
                                <span className="text-xs text-zinc-500">{items.length} mercados</span>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                {items.map((template) => {
                                    const isSelected = selectedMarketIds.includes(template.id);
                                    const isDefault = defaultMarketIds.includes(template.id);

                                    return (
                                        <button
                                            key={template.id}
                                            type="button"
                                            onClick={() => onToggle(template.id)}
                                            className={cn(
                                                "rounded-[24px] border p-4 text-left transition-all",
                                                isSelected ? "border-primary bg-primary/10" : "surface-card-soft"
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-black">{template.title}</h3>
                                                        {isDefault && (
                                                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-300">
                                                                padrão
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-2 text-sm text-zinc-400">{template.description}</p>
                                                    <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                                                        até {template.defaultPointsExact} pts
                                                    </p>
                                                </div>

                                                {isSelected && <CheckCircle2 className="mt-1 h-5 w-5 text-primary" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}
