// ===== SportsgamesOdds.com API integration =====
// Provides live match data, odds, results and team stats for World Cup 2026
// API key: set VITE_SPORTS_ODDS_API_KEY in .env
// Docs: https://sportsgamesodds.com/docs

const API_KEY = import.meta.env.VITE_SPORTS_ODDS_API_KEY as string;
const BASE_URL = "https://api.sportsgamesodds.com/v2";

export interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "finished" | "postponed";
  minute: number | null;
  startTime: string;
  competition: string;
  venue: string | null;
  homeOdds: number | null;
  drawOdds: number | null;
  awayOdds: number | null;
}

export interface TeamStats {
  code: string;
  name: string;
  fifaRanking: number | null;
  recentForm: string[]; // ["W","D","L","W","W"]
  goalsFor: number;
  goalsAgainst: number;
  wins: number;
  draws: number;
  losses: number;
}

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  if (!API_KEY) return null;
  try {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set("apiKey", API_KEY);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

/** Fetch live and upcoming FIFA World Cup 2026 matches */
export async function fetchLiveMatches(): Promise<LiveMatch[]> {
  const data = await apiFetch<{ data: LiveMatch[] }>("/matches", {
    competition: "FIFA_WORLD_CUP_2026",
    status: "live,scheduled",
    limit: "20",
  });
  return data?.data ?? [];
}

/** Fetch results for a specific team */
export async function fetchTeamResults(teamCode: string): Promise<LiveMatch[]> {
  const data = await apiFetch<{ data: LiveMatch[] }>("/matches", {
    competition: "FIFA_WORLD_CUP_2026",
    team: teamCode,
    status: "finished",
    limit: "10",
  });
  return data?.data ?? [];
}

/** Fetch team stats and FIFA ranking */
export async function fetchTeamStats(teamCode: string): Promise<TeamStats | null> {
  return apiFetch<TeamStats>(`/teams/${teamCode}/stats`, {
    competition: "FIFA_WORLD_CUP_2026",
  });
}

/** Whether the SportsOdds API is configured */
export const isSportsOddsEnabled = () => Boolean(API_KEY);
