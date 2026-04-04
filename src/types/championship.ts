// ============================================================
// championship.ts — Core types for multi-championship support
// ============================================================

/** How the competition is structured */
export type ChampionshipFormat =
  | "league"     // Round-robin (Brasileirão, La Liga, Premier)
  | "knockout"   // Pure elimination bracket
  | "mixed";     // Group stage + knockout (World Cup, Champions League)

/** Whether teams are national selections or clubs */
export type TeamType = "national" | "club";

/** Lifecycle state of the championship */
export type ChampionshipStatus = "upcoming" | "live" | "finished";

export interface Championship {
  /** Unique stable identifier — used as Firestore document ID */
  id: string;

  /** Display name */
  name: string;
  shortName: string;

  /** Visual identity */
  logo: string;         // emoji fallback (always present)
  logoUrl?: string;     // SVG/PNG URL when available
  color: string;        // Primary hex color for UI accents
  gradient: [string, string]; // [from, to] for card backgrounds

  /** Competition metadata */
  country?: string;        // ISO-2 for national leagues ("BR", "ES", "EN")
  confederation?: string;  // "FIFA", "UEFA", "CONMEBOL", "CBF"
  season: string;          // "2026" or "2025-26"
  format: ChampionshipFormat;
  teamType: TeamType;
  maxTeams: number;

  /** Timing */
  dateStart: string; // ISO date "2026-04-01"
  dateEnd: string;

  /** App state */
  status: ChampionshipStatus;
  isActive: boolean;    // visible in app hub
  isComingSoon: boolean; // show "Em Breve" badge
  isPremium: boolean;   // requires Premium to create bolão

  /** Football-Data.org competition code (null = data managed manually) */
  fdoCode?: string | null; // "BSA", "CL", "PD", "PL", "WC"
  fdoId?: number | null;   // Football-Data numeric competition ID
}

/** Summary of a user's participation in a championship (for hub cards) */
export interface ChampionshipUserSummary {
  championshipId: string;
  activeBoloes: number;
  totalBoloes: number;
}
