import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check } from "lucide-react";
import { CreateBolaoStepRail } from "@/features/boloes/create/CreateBolaoStepRail";
import { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";
import { useChampionship } from "@/contexts/ChampionshipContext";
import { useDashboardMatches } from "@/hooks/useDashboardMatches";
import { cn } from "@/lib/utils";
import { getToneClasses } from "@/features/boloes/create/stepColors";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

export function CreateBolaoCatalogStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation("bolao");
  const { all: championships } = useChampionship();
  const { data: matches } = useDashboardMatches();
  const [visibleCount, setVisibleCount] = useState(20);
  
  const selectedChampionship = championships.find(c => c.id === flow.state.championshipId);
  const tone = getToneClasses(2);

  const now = Date.now();

  const availableMatches = useMemo(() => {
    if (!selectedChampionship) return [];
    return matches
      .filter(m => m.championshipId === selectedChampionship.id && new Date(m.matchDate).getTime() > now)
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
  }, [matches, selectedChampionship, now]);

  const toggleMatch = (matchId: string) => {
    flow.setState((prev) => {
      if (prev.allowedMatchIds === "all") {
        return {
          ...prev,
          allowedMatchIds: availableMatches.map(m => m.id).filter(id => id !== matchId)
        };
      }
      
      const current = prev.allowedMatchIds as string[];
      if (current.includes(matchId)) {
        const next = current.filter(id => id !== matchId);
        return { ...prev, allowedMatchIds: next };
      } else {
        const next = [...current, matchId];
        if (next.length === availableMatches.length) {
          return { ...prev, allowedMatchIds: "all" };
        }
        return { ...prev, allowedMatchIds: next };
      }
    });
  };

  const isAllSelected = flow.state.allowedMatchIds === "all";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-white">
      <CreateBolaoStepRail activeStep={2} />
      <p className={cn("break-words text-[11px] font-black uppercase leading-tight tracking-[0.18em]", tone.labelText)}>
        {t("creation.catalog.step_label")}
      </p>
      <h1 className="mt-2 break-words font-display text-[2.35rem] font-black uppercase leading-tight tracking-[0.02em] [overflow-wrap:anywhere]">
        {t("creation.catalog.title")}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
        {t("creation.catalog.desc")}
      </p>

      <div className="mt-7">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">{t("creation.catalog.champ_label")}</p>
        
        {selectedChampionship ? (
          <div className={cn("flex items-center gap-3 rounded-[20px] border p-4", tone.border, tone.bg, tone.shadow, "ring-1", tone.ring)}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5">
              <span className="text-xl">{selectedChampionship.logo}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-white">{selectedChampionship.name}</p>
              <p className="text-xs text-zinc-400">{selectedChampionship.season}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {championships.map((champ) => (
              <button
                key={champ.id}
                onClick={() => flow.setState(s => ({ ...s, championshipId: champ.id, allowedMatchIds: "all" }))}
                className={cn(
                  "flex items-center gap-3 rounded-[20px] border p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                  flow.state.championshipId === champ.id
                    ? cn(tone.border, tone.bg, tone.shadow, "ring-1", tone.ring)
                    : "border-white/10 bg-black/20 hover:bg-white/5"
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5">
                  <span className="text-xl">{champ.logo}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-white">{champ.name}</p>
                  <p className="text-xs text-zinc-400">{champ.season}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedChampionship && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">{t("creation.catalog.matches_label")}</p>
            <button
              onClick={() => flow.setState(s => ({ ...s, allowedMatchIds: isAllSelected ? [] : "all" }))}
              className={cn("text-xs font-bold hover:underline", tone.text)}
            >
              {isAllSelected ? t("creation.catalog.unselect_all") : t("creation.catalog.select_all")}
            </button>
          </div>
          
          <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar" onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            if (target.scrollHeight - target.scrollTop <= target.clientHeight * 1.5) {
              setVisibleCount(c => Math.min(c + 20, availableMatches.length));
            }
          }}>
            {availableMatches.length === 0 ? (
               <div className="p-8 text-center border border-white/10 rounded-[20px] bg-white/5">
                 <p className="text-sm text-zinc-400">{t("creation.catalog.no_matches")}</p>
               </div>
            ) : availableMatches.slice(0, visibleCount).map((match) => {
              const isSelected = isAllSelected || (Array.isArray(flow.state.allowedMatchIds) && flow.state.allowedMatchIds.includes(match.id));
              return (
                <button
                  key={match.id}
                  onClick={() => toggleMatch(match.id)}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-[16px] border p-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99]",
                    isSelected
                      ? cn(tone.border, tone.bg)
                      : "border-white/5 bg-black/40 opacity-50 hover:opacity-80"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isSelected ? cn(tone.checkBg, tone.checkText) : "border-white/20"
                    )}>
                      {isSelected && <Check className="h-3 w-3" strokeWidth={4} />}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <p className="text-xs text-zinc-400 truncate">
                        {new Date(match.matchDate).toLocaleDateString()} - {match.stage}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold truncate">{match.homeTeamName}</span>
                        <span className="text-xs text-zinc-500">vs</span>
                        <span className="text-sm font-bold truncate">{match.awayTeamName}</span>
                      </div>
                    </div>
                    {new Date(match.matchDate).getTime() > Date.now() && new Date(match.matchDate).getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000 && (
                      <div className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {t("creation.catalog.upcoming")}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => flow.setStep("quick")}
          className="inline-flex min-w-0 items-center gap-2 whitespace-normal rounded-[20px] border border-white/10 bg-black/20 px-5 py-3 text-center text-[11px] font-black uppercase leading-tight tracking-[0.14em] text-zinc-400 transition-all hover:bg-white/5"
        >
          {t("wizard.back")}
        </button>
        <button
          type="button"
          onClick={() => flow.setStep("context")}
          disabled={!flow.canAdvance}
          className="inline-flex min-w-0 items-center gap-2 whitespace-normal rounded-[20px] bg-primary px-5 py-3 text-center text-[11px] font-black uppercase leading-tight tracking-[0.14em] text-black disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
        >
          {t("wizard.next")}
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
