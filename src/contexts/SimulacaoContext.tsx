import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { groups as allGroups } from "@/data/mockData";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs, orderBy, updateDoc, deleteDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { initMatches, calcStandings } from "@/utils/simulacaoUtils";
import {
  type KnockoutData, type KnockoutScore, type KnockoutRound,
  getQualifiedTeams, buildKnockoutBracket, extractKnockoutScores,
} from "@/utils/knockoutBracket";

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



interface SimulacaoContextType {
  simulations: Simulation[];
  currentSim: Simulation | null;
  loading: boolean;
  selectSimulation: (id: string) => void;
  createSimulation: (name: string, selectedGroups: string[]) => Promise<string | null>;
  deleteSimulation: (id: string) => Promise<void>;
  renameSimulation: (id: string, name: string) => Promise<void>;
  allMatches: Record<string, SimMatch[]>;
  standings: Record<string, Standing[]>;
  filledCount: number;
  totalMatches: number;
  updateScore: (group: string, matchIdx: number, side: "home" | "away", value: number | null) => void;
  resetAll: () => void;
  goBackToList: () => void;
  // Knockout
  knockoutData: KnockoutData | null;
  isGroupsComplete: boolean;
  updateKnockoutScore: (round: KnockoutRound, matchIdx: number, field: keyof KnockoutScore, value: number | null) => void;
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
  const [knockoutScores, setKnockoutScores] = useState<Record<string, KnockoutScore[]>>({});
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Load all simulations
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchSimulations = async () => {
      try {
        const simulationsRef = collection(db, 'simulations');
        const q = query(
          simulationsRef,
          where('user_id', '==', user.id),
          // orderBy('updated_at', 'desc') // Need composite index for this, so order client side
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        // Sort DESC
        data.sort((a, b) => {
          const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return timeB - timeA;
        });

        setSimulations(data.map((s: any) => ({
          id: s.id,
          name: s.name || "Minha Simulação",
          selectedGroups: s.selected_groups || allGroups,
          matches: s.data as unknown as Record<string, SimMatch[]>,
          updatedAt: s.updated_at,
        })));
        setLoading(false);
        setLoaded(true);
      } catch (error) {
        console.error("Error fetching simulations:", error);
        setLoading(false);
        setLoaded(true);
      }
    };
    fetchSimulations();
  }, [user]);

  const currentSim = useMemo(() =>
    simulations.find(s => s.id === currentSimId) || null,
    [simulations, currentSimId]
  );

  // Load current sim matches + knockout scores
  useEffect(() => {
    if (!currentSim) { setAllMatches({}); setKnockoutScores({}); return; }
    const base = initMatches(currentSim.selectedGroups);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = currentSim.matches as any;
    Object.keys(base).forEach(g => {
      const saved = rawData?.[g];
      if (saved && Array.isArray(saved)) {
        base[g] = base[g].map((m, i) => ({
          ...m,
          homeScore: saved[i]?.homeScore ?? null,
          awayScore: saved[i]?.awayScore ?? null,
        }));
      }
    });
    setAllMatches(base);
    // Load knockout scores
    if (rawData?.__knockout) {
      setKnockoutScores(rawData.__knockout);
    } else {
      setKnockoutScores({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSimId, currentSim?.id]);

  // Auto-save (debounced)
  useEffect(() => {
    if (!user || !currentSimId || !loaded || Object.keys(allMatches).length === 0) return;
    const timeout = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataToSave: any = { ...allMatches };
      if (Object.keys(knockoutScores).length > 0) {
        dataToSave.__knockout = knockoutScores;
      }
      const autoSave = async () => {
        try {
          const simRef = doc(db, 'simulations', currentSimId);
          await updateDoc(simRef, {
            data: dataToSave,
            updated_at: new Date().toISOString()
          });
          setSimulations(prev => prev.map(s =>
            s.id === currentSimId ? { ...s, matches: dataToSave, updatedAt: new Date().toISOString() } : s
          ));
        } catch (error) {
          console.error("Error auto-saving simulation:", error);
        }
      };

      autoSave();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [allMatches, knockoutScores, user, currentSimId, loaded]);

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

  const isGroupsComplete = useMemo(() => {
    if (!currentSim || currentSim.selectedGroups.length !== 12) return false;
    return filledCount === totalMatches && totalMatches > 0;
  }, [currentSim, filledCount, totalMatches]);

  const knockoutData = useMemo(() => {
    if (!isGroupsComplete) return null;
    const seeds = getQualifiedTeams(standings, currentSim?.selectedGroups || []);
    if (!seeds) return null;
    return buildKnockoutBracket(seeds, knockoutScores);
  }, [isGroupsComplete, standings, knockoutScores, currentSim?.selectedGroups]);

  const updateScore = useCallback((group: string, matchIdx: number, side: "home" | "away", value: number | null) => {
    setAllMatches(prev => {
      const updated = { ...prev };
      const matches = [...updated[group]];
      matches[matchIdx] = { ...matches[matchIdx], [side === "home" ? "homeScore" : "awayScore"]: value };
      updated[group] = matches;
      return updated;
    });
  }, []);

  const updateKnockoutScore = useCallback((round: KnockoutRound, matchIdx: number, field: keyof KnockoutScore, value: number | null) => {
    setKnockoutScores(prev => {
      const updated = { ...prev };
      const roundScores = [...(updated[round] || [])];
      const current = roundScores[matchIdx] || { homeScore: null, awayScore: null, homePenalty: null, awayPenalty: null };
      roundScores[matchIdx] = { ...current, [field]: value };
      updated[round] = roundScores;
      return updated;
    });
  }, []);

  const resetAll = useCallback(() => {
    if (!currentSim) return;
    setAllMatches(initMatches(currentSim.selectedGroups));
    setKnockoutScores({});
  }, [currentSim]);

  const selectSimulation = useCallback((id: string) => setCurrentSimId(id), []);
  const goBackToList = useCallback(() => setCurrentSimId(null), []);

  const createSimulation = useCallback(async (name: string, selectedGroups: string[]) => {
    if (!user) { console.error("[Simulação] No user found"); return null; }
    const matchData = initMatches(selectedGroups);
    console.log("[Simulação] Creating simulation:", { name, selectedGroups: selectedGroups.length, userId: user.id });
    try {
      const simulationsRef = collection(db, 'simulations');
      const newSimData = {
        user_id: user.id,
        name,
        selected_groups: selectedGroups,
        data: matchData,
        updated_at: new Date().toISOString()
      };
      const docRef = await addDoc(simulationsRef, newSimData);

      const newSim: Simulation = {
        id: docRef.id,
        name: newSimData.name,
        selectedGroups: newSimData.selected_groups,
        matches: newSimData.data as unknown as Record<string, SimMatch[]>,
        updatedAt: newSimData.updated_at,
      };
      setSimulations(prev => [newSim, ...prev]);
      setCurrentSimId(docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("[Simulação] Firebase insert error:", error);
      return null;
    }
  }, [user]);

  const deleteSimulation = useCallback(async (id: string) => {
    try {
      const simRef = doc(db, 'simulations', id);
      await deleteDoc(simRef);
      setSimulations(prev => prev.filter(s => s.id !== id));
      if (currentSimId === id) setCurrentSimId(null);
    } catch (error) {
      console.error("Error deleting simulation:", error);
    }
  }, [currentSimId]);

  const renameSimulation = useCallback(async (id: string, name: string) => {
    try {
      const simRef = doc(db, 'simulations', id);
      await updateDoc(simRef, { name });
      setSimulations(prev => prev.map(s => s.id === id ? { ...s, name } : s));
    } catch (error) {
      console.error("Error renaming simulation:", error);
    }
  }, []);

  return (
    <SimulacaoContext.Provider value={{
      simulations, currentSim, loading,
      selectSimulation, createSimulation, deleteSimulation, renameSimulation,
      allMatches, standings, filledCount, totalMatches,
      updateScore, resetAll, goBackToList,
      knockoutData, isGroupsComplete, updateKnockoutScore,
    }}>
      {children}
    </SimulacaoContext.Provider>
  );
}
