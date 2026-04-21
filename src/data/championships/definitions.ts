import type { Championship } from "@/types/championship";

const CHAMPIONSHIP_LOGO_VERSION = "20260405b";

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
    logoUrl: `/images/championships/wc2026.svg?v=${CHAMPIONSHIP_LOGO_VERSION}`,
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
    logoUrl: `/images/championships/brasileirao2026.svg?v=${CHAMPIONSHIP_LOGO_VERSION}`,
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

  // ── 3. CONMEBOL Libertadores 2026 ───────────────────────────────────
  {
    id: "libertadores2026",
    name: "CONMEBOL Libertadores",
    shortName: "Libertadores",
    logo: "🏆",
    color: "#f59e0b",
    gradient: ["#160401", "#4a1206"],
    confederation: "CONMEBOL",
    season: "2026",
    format: "mixed",
    teamType: "club",
    maxTeams: 47,
    dateStart: "2026-02-04",
    dateEnd: "2026-11-28",
    status: "live",
    isActive: true,
    isComingSoon: false,
    isPremium: false,
    fdoCode: "CLI",
    fdoId: 2152,
  },

  // ── 4. Bundesliga 2025-26 ────────────────────────────────────────────
  {
    id: "bundesliga2526",
    name: "Bundesliga",
    shortName: "Bundesliga",
    logo: "🇩🇪",
    color: "#ef4444",
    gradient: ["#1a0303", "#5b0b0b"],
    country: "DE",
    confederation: "DFL",
    season: "2025-26",
    format: "league",
    teamType: "club",
    maxTeams: 18,
    dateStart: "2025-08-22",
    dateEnd: "2026-05-16",
    status: "live",
    isActive: true,
    isComingSoon: false,
    isPremium: false,
    fdoCode: "BL1",
    fdoId: 2002,
  },

  // ── 5. Ligue 1 2025-26 ───────────────────────────────────────────────
  {
    id: "ligue12526",
    name: "Ligue 1",
    shortName: "Ligue 1",
    logo: "🇫🇷",
    color: "#3b82f6",
    gradient: ["#07111f", "#123a73"],
    country: "FR",
    confederation: "LFP",
    season: "2025-26",
    format: "league",
    teamType: "club",
    maxTeams: 18,
    dateStart: "2025-08-15",
    dateEnd: "2026-05-23",
    status: "live",
    isActive: true,
    isComingSoon: false,
    isPremium: false,
    fdoCode: "FL1",
    fdoId: 2015,
  },

  // ── 6. Major League Soccer 2026 ──────────────────────────────────────
  {
    id: "mls2026",
    name: "Major League Soccer",
    shortName: "MLS",
    logo: "🇺🇸",
    color: "#06b6d4",
    gradient: ["#05131a", "#0b4a5b"],
    country: "US",
    confederation: "MLS",
    season: "2026",
    format: "league",
    teamType: "club",
    maxTeams: 30,
    dateStart: "2026-02-21",
    dateEnd: "2026-12-06",
    status: "live",
    isActive: true,
    isComingSoon: false,
    isPremium: false,
    fdoCode: null,
    fdoId: null,
  },

  // ── 7. Saudi Pro League 2025-26 ──────────────────────────────────────
  {
    id: "saudipro2526",
    name: "Saudi Pro League",
    shortName: "Saudi Pro",
    logo: "🇸🇦",
    color: "#10b981",
    gradient: ["#04170f", "#0b5f39"],
    country: "SA",
    confederation: "SPL",
    season: "2025-26",
    format: "league",
    teamType: "club",
    maxTeams: 18,
    dateStart: "2025-08-28",
    dateEnd: "2026-05-21",
    status: "live",
    isActive: true,
    isComingSoon: false,
    isPremium: false,
    fdoCode: null,
    fdoId: null,
  },

  // ── 8. UEFA Champions League 2025-26 ────────────────────────────────
  {
    id: "ucl2526",
    name: "UEFA Champions League",
    shortName: "Champions",
    logo: "⭐",
    logoUrl: `/images/championships/ucl2526.svg?v=${CHAMPIONSHIP_LOGO_VERSION}`,
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

  // ── 9. La Liga 2025-26 ───────────────────────────────────────────────
  {
    id: "laliga2526",
    name: "La Liga",
    shortName: "La Liga",
    logo: "🇪🇸",
    logoUrl: `/images/championships/laliga2526.svg?v=${CHAMPIONSHIP_LOGO_VERSION}`,
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

  // ── 10. Premier League 2025-26 ───────────────────────────────────────
  {
    id: "premier2526",
    name: "Premier League",
    shortName: "Premier",
    logo: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    logoUrl: `/images/championships/premier2526.svg?v=${CHAMPIONSHIP_LOGO_VERSION}`,
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

function normalizeChampionshipAlias(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const CHAMPIONSHIP_ALIAS_MAP = new Map<string, string>();

function registerChampionshipAlias(alias: string | number | null | undefined, id: string) {
  if (alias == null) return;

  const normalized = normalizeChampionshipAlias(String(alias));
  if (!normalized) return;

  CHAMPIONSHIP_ALIAS_MAP.set(normalized, id);
}

for (const championship of CHAMPIONSHIPS) {
  registerChampionshipAlias(championship.id, championship.id);
  registerChampionshipAlias(championship.name, championship.id);
  registerChampionshipAlias(championship.shortName, championship.id);
  registerChampionshipAlias(championship.fdoCode, championship.id);
  registerChampionshipAlias(championship.fdoId, championship.id);
}

registerChampionshipAlias("world cup 2026", "wc2026");
registerChampionshipAlias("copa do mundo 2026", "wc2026");
registerChampionshipAlias("worldcup2026", "wc2026");
registerChampionshipAlias("brasileirao", "brasileirao2026");
registerChampionshipAlias("brasileirao serie a", "brasileirao2026");
registerChampionshipAlias("serie a", "brasileirao2026");
registerChampionshipAlias("libertadores", "libertadores2026");
registerChampionshipAlias("champions league", "ucl2526");
registerChampionshipAlias("uefa champions league", "ucl2526");
registerChampionshipAlias("ucl", "ucl2526");
registerChampionshipAlias("la liga", "laliga2526");
registerChampionshipAlias("premier league", "premier2526");
registerChampionshipAlias("mls", "mls2026");
registerChampionshipAlias("saudi pro league", "saudipro2526");

export function resolveChampionshipId(id?: string | null): string | null {
  if (!id) return null;
  return CHAMPIONSHIP_ALIAS_MAP.get(normalizeChampionshipAlias(id)) ?? null;
}

export function getChampionshipById(id: string): Championship | undefined {
  const resolvedId = resolveChampionshipId(id);
  return resolvedId ? CHAMPIONSHIP_MAP[resolvedId] : undefined;
}

export function getActiveChampionships(): Championship[] {
  return CHAMPIONSHIPS.filter((c) => c.isActive);
}

/** Default championship — shown when no preference is stored */
export const DEFAULT_CHAMPIONSHIP_ID = "wc2026";
