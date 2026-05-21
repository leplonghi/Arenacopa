// campaign-scoring.ts — pure scoring engine, no Firestore dependencies
// All scoring is computed server-side (Cloud Function) — never trusted from client.

import type { MatchResult, ScoringResult } from "./campaign-types";

type PalpiteScoreInput = {
  home_score: number;
  away_score: number;
  half_time_home?: number | null;
  half_time_away?: number | null;
  first_scorer?: "home" | "away" | "none" | null;
  total_goals_bracket?: "0-1" | "2-3" | "4+" | null;
};

/**
 * Score one palpite against the actual match result.
 * Max possible: 25 pts (15 exact + 5 half-time + 3 first-scorer + 2 total-goals)
 */
export function scoreOnePalpite(
  palpite: PalpiteScoreInput,
  result: MatchResult,
): ScoringResult {
  // ── Base score ────────────────────────────────────────────────────────────
  const exactScore =
    palpite.home_score === result.home_score &&
    palpite.away_score === result.away_score;

  const pSign = Math.sign(palpite.home_score - palpite.away_score);
  const rSign = Math.sign(result.home_score - result.away_score);
  const correctWinner = pSign === rSign;

  const pDiff = palpite.home_score - palpite.away_score;
  const rDiff = result.home_score - result.away_score;
  const exactDiff = pDiff === rDiff;

  let base = 0;
  if (exactScore) {
    base = 15;
  } else if (correctWinner && exactDiff) {
    base = 10;
  } else if (correctWinner) {
    base = 5;
  }

  // ── Bonus: half-time score (+5) ───────────────────────────────────────────
  let halfTime = 0;
  if (
    result.half_time_home !== null &&
    palpite.half_time_home != null &&
    palpite.half_time_away != null &&
    palpite.half_time_home === result.half_time_home &&
    palpite.half_time_away === result.half_time_away
  ) {
    halfTime = 5;
  }

  // ── Bonus: first scorer (+3) ──────────────────────────────────────────────
  let firstScorerBonus = 0;
  if (
    result.first_scorer !== null &&
    palpite.first_scorer != null &&
    palpite.first_scorer === result.first_scorer
  ) {
    firstScorerBonus = 3;
  }

  // ── Bonus: total goals bracket (+2) ──────────────────────────────────────
  let totalGoalsBonus = 0;
  if (
    result.total_goals_bracket !== null &&
    palpite.total_goals_bracket != null &&
    palpite.total_goals_bracket === result.total_goals_bracket
  ) {
    totalGoalsBonus = 2;
  }

  const bonusPoints = halfTime + firstScorerBonus + totalGoalsBonus;

  return {
    total_points: base + bonusPoints,
    exact_score: exactScore,
    correct_winner: correctWinner,
    bonus_points: bonusPoints,
    breakdown: {
      base,
      half_time: halfTime,
      first_scorer: firstScorerBonus,
      total_goals: totalGoalsBonus,
    },
  };
}

/**
 * Compute the total_goals_bracket from actual match scores.
 * Used by computeGameRanking to populate the field if not already in match data.
 */
export function computeTotalGoalsBracket(
  homeGoals: number,
  awayGoals: number,
): "0-1" | "2-3" | "4+" {
  const total = homeGoals + awayGoals;
  if (total <= 1) return "0-1";
  if (total <= 3) return "2-3";
  return "4+";
}
