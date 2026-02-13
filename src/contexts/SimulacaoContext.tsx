import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { groups as allGroups, getGroupTeams } from "@/data/mockData";
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

export interface Simulation {
  id: string;
  name: string;
  selectedGroups: string[];
  matches: Record<string, SimMatch[]>;
  updatedAt: string;
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

export function calcStandings(matches: SimMatch[], group: string): Standing[] {
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

function initMatches(selectedGroups?: string[]) {
  const init: Record<string, SimMatch[]> = {};
  const gs = selectedGroups || allGroups;
  gs.forEach(g => { init[g] = generateGroupMatches(g); });
  return init;
}

interface SimulacaoContextType {
  simulations: Simulation[];
  currentSim: Simulation | null;
  loading: boolean;
  selectSimulation: (id: string) => void;
  createSimulation: (name: string, selectedGroups: string[]) => Promise<string | null>;
  deleteSimulation: (id: string) => Promise<void>;
  renameSimulation: (id: string, name: string) => Promise<void>;
  // Current sim operations
  allMatches: Record<string, SimMatch[]>;
  standings: Record<string, Standing[]>;
  filledCount: number;
  totalMatches: number;
  updateScore: (group: string, matchIdx: number, side: "home" | "away", value: number | null) => void;
  resetAll: () => void;
  goBackToList: () => void;
}

const SimulacaoContext = createContext<SimulacaoContextType | null>(null);

export function useSimulacao() {
  const ctx = useContext(SimulacaoContext);
  if (!ctx) throw new Error("useSimulacao must be used within SimulacaoProvider");
  return ctx;
}

export function SimulacaoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [currentSimId, setCurrentSimId] = useState<string | null>(null);
  const [allMatches, setAllMatches] = useState<Record<string, SimMatch[]>>({});
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Load all simulations
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("simulations")
      .select("id, name, selected_groups, data, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setSimulations(data.map((s: any) => ({
            id: s.id,
            name: s.name || "Minha Simulação",
            selectedGroups: s.selected_groups || allGroups,
            matches: s.data as Record<string, SimMatch[]>,
            updatedAt: s.updated_at,
          })));
        }
        setLoading(false);
        setLoaded(true);
      });
  }, [user]);

  const currentSim = useMemo(() =>
    simulations.find(s => s.id === currentSimId) || null,
    [simulations, currentSimId]
  );

  // Load current sim matches
  useEffect(() => {
    if (!currentSim) { setAllMatches({}); return; }
    const base = initMatches(currentSim.selectedGroups);
    // Merge saved scores
    Object.keys(base).forEach(g => {
      const saved = currentSim.matches?.[g];
      if (saved) {
        base[g] = base[g].map((m, i) => ({
          ...m,
          homeScore: saved[i]?.homeScore ?? null,
          awayScore: saved[i]?.awayScore ?? null,
        }));
      }
    });
    setAllMatches(base);
  }, [currentSimId, currentSim?.id]);

  // Auto-save current sim (debounced)
  useEffect(() => {
    if (!user || !currentSimId || !loaded || Object.keys(allMatches).length === 0) return;
    const timeout = setTimeout(() => {
      supabase
        .from("simulations")
        .update({ data: allMatches as unknown as Json, updated_at: new Date().toISOString() })
        .eq("id", currentSimId)
        .then(() => {
          // Update local state
          setSimulations(prev => prev.map(s =>
            s.id === currentSimId ? { ...s, matches: allMatches, updatedAt: new Date().toISOString() } : s
          ));
        });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [allMatches, user, currentSimId, loaded]);

  const totalMatches = useMemo(() =>
    Object.values(allMatches).reduce((sum, ms) => sum + ms.length, 0),
    [allMatches]
  );

  const { standings, filledCount } = useMemo(() => {
    const result: Record<string, Standing[]> = {};
    let filled = 0;
    Object.keys(allMatches).forEach(g => {
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

  const resetAll = useCallback(() => {
    if (!currentSim) return;
    setAllMatches(initMatches(currentSim.selectedGroups));
  }, [currentSim]);

  const selectSimulation = useCallback((id: string) => setCurrentSimId(id), []);
  const goBackToList = useCallback(() => setCurrentSimId(null), []);

  const createSimulation = useCallback(async (name: string, selectedGroups: string[]) => {
    if (!user) return null;
    const matchData = initMatches(selectedGroups);
    const { data, error } = await supabase
      .from("simulations")
      .insert({
        user_id: user.id,
        name,
        selected_groups: selectedGroups,
        data: matchData as unknown as Json,
      })
      .select("id, name, selected_groups, data, updated_at")
      .single();

    if (error || !data) return null;

    const newSim: Simulation = {
      id: data.id,
      name: data.name,
      selectedGroups: data.selected_groups as string[],
      matches: data.data as unknown as Record<string, SimMatch[]>,
      updatedAt: data.updated_at,
    };
    setSimulations(prev => [newSim, ...prev]);
    setCurrentSimId(data.id);
    return data.id;
  }, [user]);

  const deleteSimulation = useCallback(async (id: string) => {
    await supabase.from("simulations").delete().eq("id", id);
    setSimulations(prev => prev.filter(s => s.id !== id));
    if (currentSimId === id) setCurrentSimId(null);
  }, [currentSimId]);

  const renameSimulation = useCallback(async (id: string, name: string) => {
    await supabase.from("simulations").update({ name }).eq("id", id);
    setSimulations(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  }, []);

  return (
    <SimulacaoContext.Provider value={{
      simulations, currentSim, loading,
      selectSimulation, createSimulation, deleteSimulation, renameSimulation,
      allMatches, standings, filledCount, totalMatches,
      updateScore, resetAll, goBackToList,
    }}>
      {children}
    </SimulacaoContext.Provider>
  );
}
