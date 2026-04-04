import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Championship } from "@/types/championship";
import {
  CHAMPIONSHIPS,
  DEFAULT_CHAMPIONSHIP_ID,
  getChampionshipById,
} from "@/data/championships/definitions";

const STORAGE_KEY = "arenacopa:championship";

interface ChampionshipContextValue {
  /** Currently active championship */
  current: Championship;
  /** All available championships */
  all: Championship[];
  /** Change the active championship and persist preference */
  setChampionship: (id: string) => void;
  /** Whether the current championship is World Cup 2026 (legacy guard) */
  isWorldCup: boolean;
  /** Whether the current championship is a club league format */
  isLeague: boolean;
}

const ChampionshipContext = createContext<ChampionshipContextValue | null>(null);

function resolveChampionship(id: string): Championship {
  return getChampionshipById(id) ?? getChampionshipById(DEFAULT_CHAMPIONSHIP_ID)!;
}

export function ChampionshipProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Championship>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return resolveChampionship(stored);
    } catch {
      // localStorage unavailable (private mode, etc.) — fall through
    }
    return resolveChampionship(DEFAULT_CHAMPIONSHIP_ID);
  });

  const setChampionship = useCallback((id: string) => {
    const resolved = resolveChampionship(id);
    setCurrent(resolved);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  // Sync if another tab changes the preference
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      setCurrent(resolveChampionship(e.newValue));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const value: ChampionshipContextValue = {
    current,
    all: CHAMPIONSHIPS,
    setChampionship,
    isWorldCup: current.id === "wc2026",
    isLeague: current.format === "league",
  };

  return (
    <ChampionshipContext.Provider value={value}>
      {children}
    </ChampionshipContext.Provider>
  );
}

export function useChampionship(): ChampionshipContextValue {
  const ctx = useContext(ChampionshipContext);
  if (!ctx) {
    throw new Error("useChampionship must be used inside <ChampionshipProvider>");
  }
  return ctx;
}
