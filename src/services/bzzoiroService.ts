// ===== Bzzoiro Sports API integration =====
// Live scores, fixtures, standings and team data for World Cup 2026
// Docs: https://sports.bzzoiro.com/api/
// Auth: Bearer token via Authorization header
// Set VITE_BZZOIRO_API_KEY and VITE_BZZOIRO_API_URL in .env

import type { LiveMatch, TeamStats } from "@/services/sportsOddsService";

const API_KEY = import.meta.env.VITE_BZZOIRO_API_KEY as string;
const BASE_URL = (import.meta.env.VITE_BZZOIRO_API_URL as string) || "https://sports.bzzoiro.com/api";

// ── Bzzoiro raw response types ─────────────────────────────────────────────

export interface BzzoiroFixture {
  id: string | number;
  status: string;          // "NS" | "1H" | "HT" | "2H" | "FT" | "AET" | "PEN" | "CANC" | "PST"
  minute?: number | null;
  date: string;            // ISO 8601
  competition?: string;
  venue?: string | null;
  homeTeam: { id: string | number; name: string; code?: string };
  awayTeam: { id: string | number; name: string; code?: string };
  score?: {
    home: number | null;
    away: number | null;
    ht?: { home: number | null; away: number | null };
  };
  odds?: {
    home?: number | null;
    draw?: number | null;
    away?: number | null;
  };
}

export interface BzzoiroStanding {
  team: { id: string | number; name: string; code?: string };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface BzzoiroTeam {
  id: string | number;
  name: string;
  code?: string;
  fifaRanking?: number | null;
  form?: string[]; // ["W","D","L","W","W"]
  stats?: {
    goalsFor: number;
    goalsAgainst: number;
    wins: number;
    draws: number;
    losses: number;
  };
}

// ── Helper: map raw status to unified status ───────────────────────────────

function mapStatus(raw: string): LiveMatch["status"] {
  const s = raw.toUpperCase();
  if (["1H", "2H", "HT", "ET", "BT", "P", "INT", "LIVE"].includes(s)) return "live";
  if (["FT", "AET", "PEN"].includes(s)) return "finished";
  if (["CANC", "PST", "ABD", "AWD", "WO"].includes(s)) return "postponed";
  return "scheduled"; // NS, TBD, etc.
}

// ── Core fetch helper ──────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  params?: Record<string, string>
): Promise<T | null> {
  if (!API_KEY) return null;
  try {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "X-API-Key": API_KEY,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ── Map BzzoiroFixture → LiveMatch ─────────────────────────────────────────

function mapFixture(f: BzzoiroFixture): LiveMatch {
  return {
    id: String(f.id),
    homeTeam: f.homeTeam.code || f.homeTeam.name,
    awayTeam: f.awayTeam.code || f.awayTeam.name,
    homeScore: f.score?.home ?? null,
    awayScore: f.score?.away ?? null,
    status: mapStatus(f.status),
    minute: f.minute ?? null,
    startTime: f.date,
    competition: f.competition || "FIFA_WORLD_CUP_2026",
    venue: f.venue ?? null,
    homeOdds: f.odds?.home ?? null,
    drawOdds: f.odds?.draw ?? null,
    awayOdds: f.odds?.away ?? null,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Fetch live + upcoming World Cup 2026 fixtures from Bzzoiro */
export async function bzzoiroFetchLiveMatches(): Promise<LiveMatch[]> {
  // Try common endpoint patterns for football APIs
  const data = await apiFetch<{ data?: BzzoiroFixture[]; fixtures?: BzzoiroFixture[]; matches?: BzzoiroFixture[] }>(
    "/fixtures",
    {
      competition: "FIFA_WORLD_CUP_2026",
      status: "live,NS",
      season: "2026",
    }
  );
  const raw = data?.data ?? data?.fixtures ?? data?.matches ?? [];
  return raw.map(mapFixture);
}

/** Fetch finished matches for a specific team */
export async function bzzoiroFetchTeamResults(teamCode: string): Promise<LiveMatch[]> {
  const data = await apiFetch<{ data?: BzzoiroFixture[]; fixtures?: BzzoiroFixture[]; matches?: BzzoiroFixture[] }>(
    "/fixtures",
    {
      competition: "FIFA_WORLD_CUP_2026",
      team: teamCode,
      status: "FT,AET,PEN",
      season: "2026",
    }
  );
  const raw = data?.data ?? data?.fixtures ?? data?.matches ?? [];
  return raw.map(mapFixture);
}

/** Fetch team statistics from Bzzoiro */
export async function bzzoiroFetchTeamStats(teamCode: string): Promise<TeamStats | null> {
  const data = await apiFetch<BzzoiroTeam>(`/teams/${teamCode}`, {
    competition: "FIFA_WORLD_CUP_2026",
    season: "2026",
  });
  if (!data) return null;
  return {
    code: data.code || teamCode,
    name: data.name,
    fifaRanking: data.fifaRanking ?? null,
    recentForm: data.form ?? [],
    goalsFor: data.stats?.goalsFor ?? 0,
    goalsAgainst: data.stats?.goalsAgainst ?? 0,
    wins: data.stats?.wins ?? 0,
    draws: data.stats?.draws ?? 0,
    losses: data.stats?.losses ?? 0,
  };
}

/** Fetch group standings from Bzzoiro */
export async function bzzoiroFetchStandings(group?: string): Promise<BzzoiroStanding[]> {
  const params: Record<string, string> = {
    competition: "FIFA_WORLD_CUP_2026",
    season: "2026",
  };
  if (group) params.group = group;
  const data = await apiFetch<{ data?: BzzoiroStanding[]; standings?: BzzoiroStanding[] }>(
    "/standings",
    params
  );
  return data?.data ?? data?.standings ?? [];
}

/** Whether the Bzzoiro API is configured */
export const isBzzoiroEnabled = () => Boolean(API_KEY);
