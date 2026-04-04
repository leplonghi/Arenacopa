import type { Championship } from "@/types/championship";

// ============================================================
// Static definitions of all championships supported by ArenaCopa
// Ordered by priority / current relevance
// ============================================================

export const CHAMPIONSHIPS: Championship[] = [
  // ── 1. Copa do Mundo 2026 (existing, highest priority) ─────────────
  {
    id: "wc2026",
    name: "Copa do Mundo 2026",
    shortName: "Copa 2026",
    logo: "🌍",
    logoUrl: "/images/championships/wc2026.svg",
    color: "#22c55e",
    gradient: ["#064e3b", "#14532d"],
    confederation: "FIFA",
    season: "2026",
    format: "mixed",
    teamType: "national",
    maxTeams: 48,
    dateStart: "2026-06-11",
    dateEnd: "2026-07-19",
    status: "upcoming",
    isActive: true,
    isComingSoon: false,
    isPremium: false,
    fdoCode: "WC",
    fdoId: 2000,
  },

  // ── 2. Brasileirão Série A 2026 ─────────────────────────────────────
  {
    id: "brasileirao2026",
    name: "Brasileirão Série A",
    shortName: "Brasileirão",
    logo: "🇧🇷",
    logoUrl: "/images/championships/brasileirao2026.svg",
    color: "#22c55e",
    gradient: ["#001d0e", "#003419"],
    country: "BR",
    confederation: "CBF",
    season: "2026",
    format: "league",
    teamType: "club",
    maxTeams: 20,
    dateStart: "2026-04-05",
    dateEnd: "2026-12-06",
    status: "live",
    isActive: true,
    isComingSoon: false,
    isPremium: false,
    fdoCode: "BSA",
    fdoId: 2013,
  },

  // ── 3. UEFA Champions League 2025-26 ────────────────────────────────
  {
    id: "ucl2526",
    name: "UEFA Champions League",
    shortName: "Champions",
    logo: "⭐",
    logoUrl: "/images/championships/ucl2526.svg",
    color: "#60a5fa",
    gradient: ["#000a1f", "#001035"],
    confederation: "UEFA",
    season: "2025-26",
    format: "mixed",
    teamType: "club",
    maxTeams: 36,
    dateStart: "2025-09-17",
    dateEnd: "2026-05-31",
    status: "live",
    isActive: true,
    isComingSoon: false,
    isPremium: false,
    fdoCode: "CL",
    fdoId: 2001,
  },

  // ── 4. La Liga 2025-26 ───────────────────────────────────────────────
  {
    id: "laliga2526",
    name: "La Liga",
    shortName: "La Liga",
    logo: "🇪🇸",
    logoUrl: "/images/championships/laliga2526.svg",
    color: "#fb923c",
    gradient: ["#280800", "#4d1000"],
    country: "ES",
    confederation: "UEFA",
    season: "2025-26",
    format: "league",
    teamType: "club",
    maxTeams: 20,
    dateStart: "2025-08-15",
    dateEnd: "2026-05-24",
    status: "live",
    isActive: true,
    isComingSoon: false,
    isPremium: false,
    fdoCode: "PD",
    fdoId: 2014,
  },

  // ── 5. Premier League 2025-26 ────────────────────────────────────────
  {
    id: "premier2526",
    name: "Premier League",
    shortName: "Premier",
    logo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    logoUrl: "/images/championships/premier2526.svg",
    color: "#c084fc",
    gradient: ["#120016", "#38003c"],
    country: "GB",
    confederation: "UEFA",
    season: "2025-26",
    format: "league",
    teamType: "club",
    maxTeams: 20,
    dateStart: "2025-08-16",
    dateEnd: "2026-05-24",
    status: "live",
    isActive: true,
    isComingSoon: false,
    isPremium: false,
    fdoCode: "PL",
    fdoId: 2021,
  },
];

/** Map for fast O(1) lookup by ID */
export const CHAMPIONSHIP_MAP = Object.fromEntries(
  CHAMPIONSHIPS.map((c) => [c.id, c])
) as Record<string, Championship>;

export function getChampionshipById(id: string): Championship | undefined {
  return CHAMPIONSHIP_MAP[id];
}

export function getActiveChampionships(): Championship[] {
  return CHAMPIONSHIPS.filter((c) => c.isActive);
}

/** Default championship — shown when no preference is stored */
export const DEFAULT_CHAMPIONSHIP_ID = "wc2026";
