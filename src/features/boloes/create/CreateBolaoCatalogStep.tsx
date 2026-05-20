import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Check, Trophy, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";
import { useChampionship } from "@/contexts/ChampionshipContext";
import { useChampionshipMatches } from "@/hooks/useChampionshipMatches";
import { cn } from "@/lib/utils";
import { getToneClasses } from "@/features/boloes/create/stepColors";

type Flow = ReturnType<typeof useBolaoCreateFlow>;
type FilterPeriod = "all" | "week" | "month";

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function CreateBolaoCatalogStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation("bolao");
  const { all: championships } = useChampionship();
  const selectedChampionship = championships.find(c => c.id === flow.state.championshipId);
  const { data: matches } = useChampionshipMatches(selectedChampionship?.id);
  const [visibleCount, setVisibleCount] = useState(20);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [filterWeekOffset, setFilterWeekOffset] = useState(0); // 0 = current week, 1 = next, etc.


  const tone = getToneClasses(2);

  const now = Date.now();
  const nowDate = new Date();

  // All future matches of selected championship
  const allFutureMatches = useMemo(() => {
    if (!selectedChampionship || !Array.isArray(matches)) return [];
    
    // Mostramos todos os jogos do campeonato a partir de "agora" (data de criação do bolão)
    return matches
      .filter(m => m.championshipId === selectedChampionship.id && new Date(m.matchDate).getTime() >= (now - 1000 * 60 * 60)) // Margem de 1h
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
  }, [matches, selectedChampionship, now]);

  // Filtered matches based on period
  const availableMatches = useMemo(() => {
    if (filterPeriod === "all") return allFutureMatches;

    if (filterPeriod === "week") {
      const targetWeek = getWeekNumber(new Date(nowDate.getTime() + filterWeekOffset * 7 * 24 * 60 * 60 * 1000));
      const targetYear = new Date(nowDate.getTime() + filterWeekOffset * 7 * 24 * 60 * 60 * 1000).getFullYear();
      return allFutureMatches.filter(m => {
        const d = new Date(m.matchDate);
        return getWeekNumber(d) === targetWeek && d.getFullYear() === targetYear;
      });
    }

    if (filterPeriod === "month") {
      const targetDate = new Date(nowDate.getFullYear(), nowDate.getMonth() + filterWeekOffset, 1);
      return allFutureMatches.filter(m => {
        const d = new Date(m.matchDate);
        return d.getMonth() === targetDate.getMonth() && d.getFullYear() === targetDate.getFullYear();
      });
    }

    return allFutureMatches;
  }, [allFutureMatches, filterPeriod, filterWeekOffset, nowDate]);

  // Period label for navigation
  const periodLabel = useMemo(() => {
    if (filterPeriod === "all") return "Todos os jogos";
    if (filterPeriod === "week") {
      if (filterWeekOffset === 0) return "Esta semana";
      if (filterWeekOffset === 1) return "Próxima semana";
      return `Semana +${filterWeekOffset}`;
    }
    if (filterPeriod === "month") {
      const target = new Date(nowDate.getFullYear(), nowDate.getMonth() + filterWeekOffset, 1);
      return target.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    }
    return "";
  }, [filterPeriod, filterWeekOffset, nowDate]);

  const toggleMatch = (matchId: string) => {
    flow.setState((prev) => {
      if (prev.allowedMatchIds === "all") {
        return {
          ...prev,
          allowedMatchIds: allFutureMatches.map(m => m.id).filter(id => id !== matchId)
        };
      }

      const current = prev.allowedMatchIds as string[];
      if (current.includes(matchId)) {
        const next = current.filter(id => id !== matchId);
        return { ...prev, allowedMatchIds: next };
      } else {
        const next = [...current, matchId];
        if (next.length === allFutureMatches.length) {
          return { ...prev, allowedMatchIds: "all" };
        }
        return { ...prev, allowedMatchIds: next };
      }
    });
  };

  const isAllSelected = flow.state.allowedMatchIds === "all";

  // Champion bet state
  const hasChampionBet = flow.state.includeChampionBet === true;
  const toggleChampionBet = () => {
    flow.setState((current) => ({
      ...current,
      includeChampionBet: !current.includeChampionBet,
    }));
  };

  const handleChangePeriod = (period: FilterPeriod) => {
    setFilterPeriod(period);
    setFilterWeekOffset(0);
    setVisibleCount(20);
  };

  return (
    <div className="mx-auto max-w-5xl pb-8 text-white">
      <p className={cn("break-words text-[11px] font-black uppercase leading-tight tracking-[0.18em] mt-4", tone.labelText)}>
        {t("creation.catalog.step_label")}
      </p>
      <h1 className="mt-2 break-words font-display text-[2.35rem] font-black uppercase leading-tight tracking-[0.02em] [overflow-wrap:anywhere]">
        {t("creation.catalog.title")}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
        {t("creation.catalog.desc")}
      </p>

      {/* Championship selection */}
      <div className="mt-7">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">{t("creation.catalog.champ_label")}</p>

        {selectedChampionship ? (
          <div className={cn("flex items-center gap-4 rounded-[20px] border p-4", tone.border, tone.bg, tone.shadow, "ring-1", tone.ring)}>
            {/* Championship image (logoUrl) or emoji fallback */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-white/5 overflow-hidden">
              {selectedChampionship.logoUrl ? (
                <img
                  src={selectedChampionship.logoUrl}
                  alt={selectedChampionship.name}
                  className="h-10 w-10 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-2xl">{selectedChampionship.logo}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black text-white">{selectedChampionship.name}</p>
              <p className="text-xs text-zinc-400">{selectedChampionship.season}</p>
            </div>
            <button
              type="button"
              onClick={() => flow.setState(s => ({ ...s, championshipId: "", allowedMatchIds: [] }))}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              Trocar
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {championships.map((champ) => (
              <button
                key={champ.id}
                onClick={() => flow.setState(s => ({ ...s, championshipId: champ.id, allowedMatchIds: [] }))}
                className={cn(
                  "flex items-center gap-3 rounded-[20px] border p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                  flow.state.championshipId === champ.id
                    ? cn(tone.border, tone.bg, tone.shadow, "ring-1", tone.ring)
                    : "border-white/10 bg-black/20 hover:bg-white/5"
                )}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-white/5 overflow-hidden">
                  {champ.logoUrl ? (
                    <img
                      src={champ.logoUrl}
                      alt={champ.name}
                      className="h-9 w-9 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) parent.textContent = champ.logo;
                      }}
                    />
                  ) : (
                    <span className="text-xl">{champ.logo}</span>
                  )}
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
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">

          {/* ── Campeão do campeonato toggle ── */}
          <div className={cn(
            "flex items-center justify-between gap-4 rounded-[20px] border p-4 transition-all",
            hasChampionBet
              ? cn(tone.border, tone.bg, "ring-1", tone.ring)
              : "border-white/10 bg-white/5 hover:bg-white/8"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]",
                hasChampionBet ? "bg-primary/20" : "bg-white/5"
              )}>
                <Trophy className={cn("h-5 w-5", hasChampionBet ? "text-primary" : "text-zinc-400")} />
              </div>
              <div>
                <p className="text-sm font-black text-white">Campeão do Campeonato</p>
                <p className="text-xs text-zinc-400 mt-0.5">Participantes apostam em qual time será o campeão</p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleChampionBet}
              className={cn(
                "relative h-7 w-12 rounded-full border transition-all duration-300 shrink-0",
                hasChampionBet
                  ? cn(tone.border, "bg-primary/30")
                  : "border-white/20 bg-white/5"
              )}
              aria-checked={hasChampionBet}
              role="switch"
            >
              <span className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full transition-all duration-300 shadow-md",
                hasChampionBet
                  ? "left-[calc(100%-1.375rem)] bg-primary"
                  : "left-0.5 bg-white/40"
              )} />
            </button>
          </div>

          {/* ── Matches section ── */}
          <div>
            {/* Header + period filters */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">{t("creation.catalog.matches_label")}</p>
                <button
                  onClick={() => flow.setState(s => ({ ...s, allowedMatchIds: isAllSelected ? [] : "all" }))}
                  className={cn("text-xs font-bold hover:underline", tone.text)}
                >
                  {isAllSelected ? t("creation.catalog.unselect_all") : t("creation.catalog.select_all")}
                </button>
              </div>

              {/* Period filter tabs */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1 rounded-[12px] border border-white/10 bg-white/[0.03] p-1">
                  {(["all", "week", "month"] as FilterPeriod[]).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => handleChangePeriod(period)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all",
                        filterPeriod === period
                          ? cn(tone.bg, tone.text, "border", tone.border)
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                      )}
                    >
                      {period === "all" ? "Todos" : period === "week" ? "Semana" : "Mês"}
                    </button>
                  ))}
                </div>

                {/* Week/month navigation arrows — hidden for "all" */}
                {filterPeriod !== "all" && (
                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      type="button"
                      onClick={() => { setFilterWeekOffset(o => o - 1); setVisibleCount(20); }}
                      disabled={filterWeekOffset <= 0}
                      className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-white/10 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="min-w-[120px] text-center text-[11px] font-black text-zinc-300 uppercase tracking-wide flex items-center justify-center gap-1">
                      <CalendarDays className="h-3 w-3 text-zinc-500" />
                      {periodLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setFilterWeekOffset(o => o + 1); setVisibleCount(20); }}
                      className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-white/10 bg-white/5 text-zinc-400 transition-all hover:bg-white/10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Match list */}
            <div
              className="grid gap-2 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar"
              onScroll={(e) => {
                const target = e.target as HTMLDivElement;
                if (target.scrollHeight - target.scrollTop <= target.clientHeight * 1.5) {
                  setVisibleCount(c => Math.min(c + 20, availableMatches.length));
                }
              }}
            >
              {availableMatches.length === 0 ? (
                <div className="p-8 text-center border border-white/10 rounded-[20px] bg-white/5">
                  <CalendarDays className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">
                    {filterPeriod === "all"
                      ? t("creation.catalog.no_matches")
                      : `Nenhum jogo encontrado para ${periodLabel.toLowerCase()}`}
                  </p>
                </div>
              ) : availableMatches.slice(0, visibleCount).map((match) => {
                const isSelected = isAllSelected || (Array.isArray(flow.state.allowedMatchIds) && flow.state.allowedMatchIds.includes(match.id));
                const matchDate = new Date(match.matchDate);
                
                // Lógica TBD: Se um dos times for "---", "TBD" ou IDs não definidos
                const homeCode = (match.homeTeamCode || "").toUpperCase();
                const awayCode = (match.awayTeamCode || "").toUpperCase();
                const isTbd = homeCode === "---" || homeCode === "TBD" || 
                              awayCode === "---" || awayCode === "TBD" || 
                              !match.homeTeamId || !match.awayTeamId;

                return (
                  <button
                    key={match.id}
                    onClick={() => toggleMatch(match.id)}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-[16px] border p-3 text-left transition-all hover:scale-[1.01] active:scale-[0.99]",
                      isSelected
                        ? cn(tone.border, tone.bg)
                        : "border-white/5 bg-black/40 opacity-50 hover:opacity-80",
                      isTbd && !isSelected && "grayscale opacity-30" // Jogos TBD sem seleção ficam cinzas
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        isSelected ? cn(tone.checkBg, tone.checkText) : "border-white/20",
                        isTbd && !isSelected && "border-zinc-700"
                      )}>
                        {isSelected && <Check className="h-3 w-3" strokeWidth={4} />}
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <p className={cn("text-xs truncate", isTbd ? "text-zinc-600" : "text-zinc-400")}>
                          {matchDate.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })} · {match.stage}
                          {isTbd && " (A definir)"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("text-sm font-bold truncate", isTbd && "text-zinc-500 font-medium")}>
                            {match.homeTeamName}
                          </span>
                          <span className="text-xs text-zinc-600">vs</span>
                          <span className={cn("text-sm font-bold truncate", isTbd && "text-zinc-500 font-medium")}>
                            {match.awayTeamName}
                          </span>
                        </div>
                      </div>
                      {matchDate.getTime() > Date.now() && matchDate.getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000 && !isTbd && (
                        <div className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {t("creation.catalog.upcoming")}
                        </div>
                      )}
                      {isTbd && (
                        <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                          TBD
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
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
