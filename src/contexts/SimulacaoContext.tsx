import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { groups, getGroupTeams } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

export interface SimMatch {
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
}

export interface Standing {
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
    h.played++; a.played++;
    h.gf += m.homeScore; h.ga += m.awayScore;
    a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) { h.won++; h.points += 3; a.lost++; }
    else if (m.homeScore < m.awayScore) { a.won++; a.points += 3; h.lost++; }
    else { h.drawn++; a.drawn++; h.points++; a.points++; }
  });

  return Object.values(map).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });
}

interface SimulacaoContextType {
  allMatches: Record<string, SimMatch[]>;
  standings: Record<string, Standing[]>;
  filledCount: number;
  totalMatches: number;
  updateScore: (group: string, matchIdx: number, side: "home" | "away", value: number | null) => void;
  resetAll: () => void;
}

const SimulacaoContext = createContext<SimulacaoContextType | null>(null);

export function useSimulacao() {
  const ctx = useContext(SimulacaoContext);
  if (!ctx) throw new Error("useSimulacao must be used within SimulacaoProvider");
  return ctx;
}

function initMatches() {
  const init: Record<string, SimMatch[]> = {};
  groups.forEach(g => { init[g] = generateGroupMatches(g); });
  return init;
}

export function SimulacaoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allMatches, setAllMatches] = useState<Record<string, SimMatch[]>>(initMatches);
  const [loaded, setLoaded] = useState(false);

  // Load from DB
  useEffect(() => {
    if (!user) return;
    supabase
      .from("simulations")
      .select("data")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.data) {
          const saved = data.data as unknown as Record<string, SimMatch[]>;
          // Merge saved scores into generated matches structure
          const merged = initMatches();
          Object.keys(merged).forEach(g => {
            const savedGroup = saved[g];
            if (savedGroup) {
              merged[g] = merged[g].map((m, i) => ({
                ...m,
                homeScore: savedGroup[i]?.homeScore ?? null,
                awayScore: savedGroup[i]?.awayScore ?? null,
              }));
            }
          });
          setAllMatches(merged);
        }
        setLoaded(true);
      });
  }, [user]);

  // Save to DB (debounced)
  useEffect(() => {
    if (!user || !loaded) return;
    const timeout = setTimeout(() => {
      supabase
        .from("simulations")
        .upsert({
          user_id: user.id,
          data: allMatches as unknown as Json,
        }, { onConflict: "user_id" });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [allMatches, user, loaded]);

  const totalMatches = useMemo(() =>
    Object.values(allMatches).reduce((sum, ms) => sum + ms.length, 0),
    [allMatches]
  );

  const { standings, filledCount } = useMemo(() => {
    const result: Record<string, Standing[]> = {};
    let filled = 0;
    groups.forEach(g => {
      result[g] = calcStandings(allMatches[g], g);
      filled += allMatches[g].filter(m => m.homeScore !== null && m.awayScore !== null).length;
    });
    return { standings: result, filledCount: filled };
  }, [allMatches]);

  const updateScore = useCallback((group: string, matchIdx: number, side: "home" | "away", value: number | null) => {
    setAllMatches(prev => {
      const updated = { ...prev };
      const matches = [...updated[group]];
      matches[matchIdx] = { ...matches[matchIdx], [side === "home" ? "homeScore" : "awayScore"]: value };
      updated[group] = matches;
      return updated;
    });
  }, []);

  const resetAll = useCallback(() => setAllMatches(initMatches()), []);

  return (
    <SimulacaoContext.Provider value={{ allMatches, standings, filledCount, totalMatches, updateScore, resetAll }}>
      {children}
    </SimulacaoContext.Provider>
  );
}
