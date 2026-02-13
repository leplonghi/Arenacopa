import type { Standing } from "@/contexts/SimulacaoContext";
import { groups as allGroups } from "@/data/mockData";

export interface KnockoutScore {
  homeScore: number | null;
  awayScore: number | null;
  homePenalty: number | null;
  awayPenalty: number | null;
}

export interface KnockoutMatchFull {
  home: string | null;
  away: string | null;
  score: KnockoutScore;
}

export type KnockoutRound = "r32" | "r16" | "quarter" | "semi" | "third" | "final";

export interface KnockoutData {
  r32: KnockoutMatchFull[];
  r16: KnockoutMatchFull[];
  quarter: KnockoutMatchFull[];
  semi: KnockoutMatchFull[];
  third: KnockoutMatchFull[];
  final: KnockoutMatchFull[];
}

export const KNOCKOUT_ROUNDS: KnockoutRound[] = ["r32", "r16", "quarter", "semi", "third", "final"];

export const ROUND_LABELS: Record<KnockoutRound, string> = {
  r32: "32 avos",
  r16: "Oitavas",
  quarter: "Quartas",
  semi: "Semis",
  third: "3º Lugar",
  final: "Final",
};

export const ROUND_FULL_LABELS: Record<KnockoutRound, string> = {
  r32: "32 avos de Final",
  r16: "Oitavas de Final",
  quarter: "Quartas de Final",
  semi: "Semifinais",
  third: "Disputa de 3º Lugar",
  final: "Grande Final",
};

// Standard 32-team bracket seed pairings (0-indexed)
const R32_PAIRINGS: [number, number][] = [
  [0, 31], [15, 16],
  [7, 24], [8, 23],
  [3, 28], [12, 19],
  [4, 27], [11, 20],
  [1, 30], [14, 17],
  [6, 25], [9, 22],
  [2, 29], [13, 18],
  [5, 26], [10, 21],
];

function emptyScore(): KnockoutScore {
  return { homeScore: null, awayScore: null, homePenalty: null, awayPenalty: null };
}

export function getMatchWinner(m: KnockoutMatchFull): string | null {
  if (!m.home || !m.away) return null;
  const s = m.score;
  if (s.homeScore === null || s.awayScore === null) return null;
  if (s.homeScore > s.awayScore) return m.home;
  if (s.homeScore < s.awayScore) return m.away;
  if (s.homePenalty === null || s.awayPenalty === null) return null;
  if (s.homePenalty > s.awayPenalty) return m.home;
  if (s.homePenalty < s.awayPenalty) return m.away;
  return null;
}

export function getMatchLoser(m: KnockoutMatchFull): string | null {
  const winner = getMatchWinner(m);
  if (!winner || !m.home || !m.away) return null;
  return winner === m.home ? m.away : m.home;
}

export function isDrawRegulation(s: KnockoutScore): boolean {
  return s.homeScore !== null && s.awayScore !== null && s.homeScore === s.awayScore;
}

/**
 * Get 32 qualified teams seeded 1-32.
 * Seeds 1-12: group winners, 13-24: runners-up, 25-32: best 8 thirds.
 * Returns null if groups incomplete or not all 12 selected.
 */
export function getQualifiedTeams(
  standings: Record<string, Standing[]>,
  selectedGroups: string[]
): string[] | null {
  if (selectedGroups.length !== 12) return null;

  for (const g of allGroups) {
    const s = standings[g];
    if (!s || s.length < 4 || s[0].played < 3) return null;
  }

  type Seed = { code: string; points: number; gd: number; gf: number };
  const sortFn = (a: Seed, b: Seed) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  };
  const toSeed = (st: Standing): Seed => ({
    code: st.teamCode, points: st.points, gd: st.gf - st.ga, gf: st.gf,
  });

  const winners: Seed[] = [];
  const runnersUp: Seed[] = [];
  const thirds: Seed[] = [];

  allGroups.forEach(g => {
    const s = standings[g];
    winners.push(toSeed(s[0]));
    runnersUp.push(toSeed(s[1]));
    thirds.push(toSeed(s[2]));
  });

  winners.sort(sortFn);
  runnersUp.sort(sortFn);
  thirds.sort(sortFn);

  return [...winners, ...runnersUp, ...thirds.slice(0, 8)].map(t => t.code);
}

/**
 * Build full knockout bracket from seeds and stored scores.
 * Resets scores if teams changed due to group results update.
 */
export function buildKnockoutBracket(
  seeds: string[],
  storedScores?: Record<string, KnockoutScore[]>
): KnockoutData {
  const ss = storedScores || {};

  const r32: KnockoutMatchFull[] = R32_PAIRINGS.map(([h, a], i) => ({
    home: seeds[h] || null,
    away: seeds[a] || null,
    score: ss.r32?.[i] || emptyScore(),
  }));

  const r16 = buildNextRound(r32, 8, ss.r16);
  const quarter = buildNextRound(r16, 4, ss.quarter);
  const semi = buildNextRound(quarter, 2, ss.semi);

  const thirdHome = semi[0] ? getMatchLoser(semi[0]) : null;
  const thirdAway = semi[1] ? getMatchLoser(semi[1]) : null;
  const third: KnockoutMatchFull[] = [{
    home: thirdHome,
    away: thirdAway,
    score: keepScoreIfTeamsMatch(thirdHome, thirdAway, ss.third?.[0]),
  }];

  const finalHome = getMatchWinner(semi[0]);
  const finalAway = getMatchWinner(semi[1]);
  const final_: KnockoutMatchFull[] = [{
    home: finalHome,
    away: finalAway,
    score: keepScoreIfTeamsMatch(finalHome, finalAway, ss.final?.[0]),
  }];

  return { r32, r16, quarter, semi, third, final: final_ };
}

function buildNextRound(
  prev: KnockoutMatchFull[],
  count: number,
  stored?: KnockoutScore[]
): KnockoutMatchFull[] {
  return Array.from({ length: count }, (_, i) => {
    const home = getMatchWinner(prev[i * 2]);
    const away = getMatchWinner(prev[i * 2 + 1]);
    return {
      home,
      away,
      score: keepScoreIfTeamsMatch(home, away, stored?.[i]),
    };
  });
}

function keepScoreIfTeamsMatch(
  home: string | null,
  away: string | null,
  stored?: KnockoutScore
): KnockoutScore {
  if (!stored || !home || !away) return emptyScore();
  if (stored.homeScore === null) return emptyScore();
  return stored;
}

export function extractKnockoutScores(data: KnockoutData): Record<string, KnockoutScore[]> {
  return {
    r32: data.r32.map(m => m.score),
    r16: data.r16.map(m => m.score),
    quarter: data.quarter.map(m => m.score),
    semi: data.semi.map(m => m.score),
    third: data.third.map(m => m.score),
    final: data.final.map(m => m.score),
  };
}
