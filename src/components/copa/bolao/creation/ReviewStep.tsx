import { Flag } from "@/components/Flag";
import { getBolaoFormat } from "@/services/boloes/bolao-format.service";
import { getBolaoMarketTemplate } from "@/services/boloes/bolao-market.service";
import { cn } from "@/lib/utils";
import type { BolaoFormatSlug, MarketTemplateSlug, ScoringRules } from "@/types/bolao";

interface ReviewStepProps {
    name: string;
    description: string;
    emoji: string;
    category: "private" | "public";
    formatId: BolaoFormatSlug;
    selectedMarketIds: MarketTemplateSlug[];
    scoringRules: ScoringRules;
    champion: string;
    championEnabled: boolean;
    onChampionSelect: (teamCode: string) => void;
    teams: Array<{ code: string }>;
}

export function ReviewStep({
    name,
    description,
    emoji,
    category,
    formatId,
    selectedMarketIds,
    scoringRules,
    champion,
    championEnabled,
    onChampionSelect,
    teams,
}: ReviewStepProps) {
    const format = getBolaoFormat(formatId);
    const selectedMarkets = selectedMarketIds
        .map((marketId) => getBolaoMarketTemplate(marketId))
        .filter(Boolean);

    return (
        <div className="space-y-6">
            <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Etapa 5 de 5</p>
                <h2 className="mt-1 text-2xl font-black">Revisão final</h2>
                <p className="mt-2 text-sm text-zinc-400">
                    Confira a identidade da liga, os mercados ativos e a aposta inicial antes de publicar.
                </p>
            </div>

            <div className="surface-card-soft rounded-[28px] p-5">
                <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary/15 text-4xl text-primary">
                        {emoji}
                    </div>
                    <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-2xl font-black">{name || "Sua arena"}</h3>
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300">
                                {category === "public" ? "Público" : "Privado"}
                            </span>
                            {format && (
                                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                                    {format.name}
                                </span>
                            )}
                        </div>
                        <p className="mt-2 text-sm text-zinc-400">{description || "Sem descrição extra. A disputa fica toda no ranking."}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="surface-card-soft rounded-[28px] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Mercados ativos</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {selectedMarkets.map((market) => (
                            <span
                                key={market?.id}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-300"
                            >
                                {market?.title}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="surface-card-soft rounded-[28px] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Pontuação base</p>
                    <div className="mt-4 grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/5 bg-black/10 p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Exato</p>
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

            {championEnabled && (
                <div className="surface-card-soft rounded-[28px] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Aposta inicial de campeão</p>
                    <p className="mt-2 text-sm text-zinc-400">
                        Se este mercado estiver ativo, já vale sair da criação com um campeão da casa.
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-6">
                        {teams.map((team) => (
                            <button
                                key={team.code}
                                type="button"
                                onClick={() => onChampionSelect(team.code)}
                                className={cn(
                                    "rounded-[22px] border p-3 transition-all",
                                    champion === team.code ? "scale-[1.03] border-primary bg-primary/10" : "bg-white/5 border-white/5"
                                )}
                            >
                                <div className="mb-2 flex justify-center">
                                    <Flag code={team.code} />
                                </div>
                                <div className="text-center text-xs font-black">{team.code}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
