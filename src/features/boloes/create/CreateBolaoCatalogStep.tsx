import { useState, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { CreateBolaoStepRail } from "@/features/boloes/create/CreateBolaoStepRail";
import { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";
import { useChampionship } from "@/contexts/ChampionshipContext";
import { useDashboardMatches } from "@/hooks/useDashboardMatches";
import { cn } from "@/lib/utils";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

export function CreateBolaoCatalogStep({ flow }: { flow: Flow }) {
  const { all: championships } = useChampionship();
  const { data: matches } = useDashboardMatches();
  
  const selectedChampionship = championships.find(c => c.id === flow.state.championshipId);

  // Filter matches based on selected championship
  const availableMatches = useMemo(() => {
    if (!selectedChampionship) return [];
    return matches
      .filter(m => m.championshipId === selectedChampionship.id)
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
  }, [matches, selectedChampionship]);

  const toggleMatch = (matchId: string) => {
    flow.setState((prev) => {
      if (prev.allowedMatchIds === "all") {
        // Switch to explicit list excluding the clicked match
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
        // If they selected all, switch back to "all"
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
      <p className="break-words text-[11px] font-black uppercase leading-tight tracking-[0.18em] text-primary">
        Etapa 2 de 6
      </p>
      <h1 className="mt-2 break-words font-display text-[2.35rem] font-black uppercase leading-tight tracking-[0.02em] [overflow-wrap:anywhere]">
        Selecione os Jogos
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
        Qual campeonato e quais partidas farão parte do seu bolão?
      </p>

      <div className="mt-7">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">1. Escolha o Campeonato</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {championships.map((champ) => (
            <button
              key={champ.id}
              onClick={() => flow.setState(s => ({ ...s, championshipId: champ.id, allowedMatchIds: "all" }))}
              className={cn(
                "flex items-center gap-3 rounded-[20px] border p-4 text-left transition-all",
                flow.state.championshipId === champ.id
                  ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(145,255,59,0.15)] ring-1 ring-primary/20"
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
      </div>

      {selectedChampionship && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">2. Partidas do Bolão</p>
            <button
              onClick={() => flow.setState(s => ({ ...s, allowedMatchIds: isAllSelected ? [] : "all" }))}
              className="text-xs font-bold text-primary hover:underline"
            >
              {isAllSelected ? "Desmarcar todos" : "Selecionar todos"}
            </button>
          </div>
          
          <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {availableMatches.length === 0 ? (
               <div className="p-8 text-center border border-white/10 rounded-[20px] bg-white/5">
                 <p className="text-sm text-zinc-400">Nenhuma partida encontrada para este campeonato.</p>
               </div>
            ) : availableMatches.map((match) => {
              const isSelected = isAllSelected || (Array.isArray(flow.state.allowedMatchIds) && flow.state.allowedMatchIds.includes(match.id));
              return (
                <button
                  key={match.id}
                  onClick={() => toggleMatch(match.id)}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-[16px] border p-3 text-left transition-colors",
                    isSelected
                      ? "border-primary/30 bg-primary/5"
                      : "border-white/5 bg-black/40 opacity-50 hover:opacity-80"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      isSelected ? "border-primary bg-primary text-black" : "border-white/20"
                    )}>
                      {isSelected && <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
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
                      <div className="shrink-0 rounded-full border border-[#D5FF5C]/30 bg-[#D5FF5C]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D5FF5C]">
                        Próximo
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
          Voltar
        </button>
        <button
          type="button"
          onClick={() => flow.setStep("context")}
          disabled={!flow.canAdvance}
          className="inline-flex min-w-0 items-center gap-2 whitespace-normal rounded-[20px] bg-primary px-5 py-3 text-center text-[11px] font-black uppercase leading-tight tracking-[0.14em] text-black disabled:opacity-50"
        >
          Avançar
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}
