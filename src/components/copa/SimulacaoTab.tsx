import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Flag } from "@/components/Flag";
import { groups, getGroupTeams, getTeam } from "@/data/mockData";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";
import { RotateCcw, Trophy, ChevronDown, ChevronUp } from "lucide-react";

interface SimMatch {
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
}

interface Standing {
  teamCode: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
}

function generateGroupMatches(group: string): SimMatch[] {
  const teamCodes = getGroupTeams(group).map(t => t.code);
  const matches: SimMatch[] = [];
  for (let i = 0; i < teamCodes.length; i++) {
    for (let j = i + 1; j < teamCodes.length; j++) {
      matches.push({ home: teamCodes[i], away: teamCodes[j], homeScore: null, awayScore: null });
    }
  }
  return matches;
}

function calcStandings(matches: SimMatch[], group: string): Standing[] {
  const teamCodes = getGroupTeams(group).map(t => t.code);
  const map: Record<string, Standing> = {};
  teamCodes.forEach(code => {
    map[code] = { teamCode: code, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
  });

  matches.forEach(m => {
    if (m.homeScore === null || m.awayScore === null) return;
    const h = map[m.home];
    const a = map[m.away];
    h.played++;
    a.played++;
    h.gf += m.homeScore;
    h.ga += m.awayScore;
    a.gf += m.awayScore;
    a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) {
      h.won++; h.points += 3; a.lost++;
    } else if (m.homeScore < m.awayScore) {
      a.won++; a.points += 3; h.lost++;
    } else {
      h.drawn++; a.drawn++; h.points++; a.points++;
    }
  });

  return Object.values(map).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
}

function ScoreInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      value={value ?? ""}
      onChange={e => {
        const v = e.target.value;
        onChange(v === "" ? null : Math.max(0, Math.min(20, parseInt(v) || 0)));
      }}
      className="w-10 h-10 rounded-lg bg-secondary border border-border text-center text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      placeholder="–"
    />
  );
}

export function SimulacaoTab() {
  const [allMatches, setAllMatches] = useState<Record<string, SimMatch[]>>(() => {
    const init: Record<string, SimMatch[]> = {};
    groups.forEach(g => { init[g] = generateGroupMatches(g); });
    return init;
  });

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["A", "B"]));
  const [filledCount, setFilledCount] = useState(0);

  const totalMatches = useMemo(() => {
    return Object.values(allMatches).reduce((sum, ms) => sum + ms.length, 0);
  }, [allMatches]);

  const standings = useMemo(() => {
    const result: Record<string, Standing[]> = {};
    let filled = 0;
    groups.forEach(g => {
      result[g] = calcStandings(allMatches[g], g);
      filled += allMatches[g].filter(m => m.homeScore !== null && m.awayScore !== null).length;
    });
    setFilledCount(filled);
    return result;
  }, [allMatches]);

  const updateScore = useCallback((group: string, matchIdx: number, side: "home" | "away", value: number | null) => {
    setAllMatches(prev => {
      const updated = { ...prev };
      const matches = [...updated[group]];
      matches[matchIdx] = {
        ...matches[matchIdx],
        [side === "home" ? "homeScore" : "awayScore"]: value,
      };
      updated[group] = matches;
      return updated;
    });
  }, []);

  const resetAll = useCallback(() => {
    const init: Record<string, SimMatch[]> = {};
    groups.forEach(g => { init[g] = generateGroupMatches(g); });
    setAllMatches(init);
  }, []);

  const toggleGroup = (g: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });
  };

  const progress = totalMatches > 0 ? Math.round((filledCount / totalMatches) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">Simulador</h2>
          <p className="text-[11px] text-muted-foreground">
            Preencha os placares e veja a classificação
          </p>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors px-3 py-2 rounded-lg bg-secondary"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar
        </button>
      </div>

      {/* Progress bar */}
      <div className="glass-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Progresso</span>
          <span className="text-xs font-black text-primary">{filledCount}/{totalMatches} jogos</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Groups */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {groups.map(g => {
          const expanded = expandedGroups.has(g);
          const groupMatches = allMatches[g];
          const groupStandings = standings[g];
          const groupFilled = groupMatches.filter(m => m.homeScore !== null && m.awayScore !== null).length;
          const groupComplete = groupFilled === groupMatches.length;

          return (
            <motion.div key={g} variants={staggerItem} className="glass-card overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(g)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-black">Grupo {g}</h3>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    groupComplete ? "bg-copa-success/20 text-copa-success" :
                    groupFilled > 0 ? "bg-primary/20 text-primary" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {groupComplete ? "Completo" : `${groupFilled}/${groupMatches.length}`}
                  </span>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {expanded && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Matches */}
                  <div className="space-y-2">
                    {groupMatches.map((m, idx) => {
                      const home = getTeam(m.home);
                      const away = getTeam(m.away);
                      return (
                        <div key={`${m.home}-${m.away}`} className="flex items-center gap-2 py-2">
                          <div className="flex items-center gap-1.5 flex-1 justify-end">
                            <span className="text-xs font-bold truncate max-w-[60px]">{home.name}</span>
                            <Flag code={home.code} size="sm" />
                          </div>
                          <ScoreInput value={m.homeScore} onChange={v => updateScore(g, idx, "home", v)} />
                          <span className="text-xs font-bold text-muted-foreground">×</span>
                          <ScoreInput value={m.awayScore} onChange={v => updateScore(g, idx, "away", v)} />
                          <div className="flex items-center gap-1.5 flex-1">
                            <Flag code={away.code} size="sm" />
                            <span className="text-xs font-bold truncate max-w-[60px]">{away.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Standings table */}
                  {groupFilled > 0 && (
                    <div className="border-t border-border/30 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 block">Classificação</span>
                      <div className="grid grid-cols-[16px_1fr_24px_24px_24px_24px] gap-x-1.5 px-1 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span>#</span>
                        <span>País</span>
                        <span className="text-center">J</span>
                        <span className="text-center">V</span>
                        <span className="text-center">SG</span>
                        <span className="text-center">P</span>
                      </div>
                      {groupStandings.map((s, i) => {
                        const team = getTeam(s.teamCode);
                        const qualifies = i < 2;
                        const gd = s.gf - s.ga;
                        return (
                          <div
                            key={s.teamCode}
                            className={cn(
                              "grid grid-cols-[16px_1fr_24px_24px_24px_24px] gap-x-1.5 items-center px-1 py-2 rounded-md",
                              qualifies && "bg-copa-success/10"
                            )}
                          >
                            <span className={cn("text-xs font-bold", qualifies ? "text-copa-success" : "text-muted-foreground")}>
                              {qualifies && <Trophy className="w-3 h-3 inline" />}
                              {!qualifies && (i + 1)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Flag code={team.code} size="sm" />
                              <span className={cn("text-xs", qualifies ? "font-black" : "font-medium")}>{team.name}</span>
                            </div>
                            <span className="text-center text-xs">{s.played}</span>
                            <span className="text-center text-xs">{s.won}</span>
                            <span className="text-center text-xs">{gd >= 0 ? `+${gd}` : gd}</span>
                            <span className={cn("text-center text-xs", qualifies && "font-black text-copa-success")}>{s.points}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
