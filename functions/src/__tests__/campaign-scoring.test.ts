import { scoreOnePalpite, computeTotalGoalsBracket } from "../campaign-scoring";
import type { MatchResult } from "../campaign-types";

const FULL_RESULT: MatchResult = {
  home_score: 2,
  away_score: 1,
  half_time_home: 1,
  half_time_away: 0,
  first_scorer: "home",
  total_goals_bracket: "2-3",
};

describe("scoreOnePalpite", () => {
  test("exact score with all bonuses = 25 pts", () => {
    const s = scoreOnePalpite(
      {
        home_score: 2, away_score: 1,
        half_time_home: 1, half_time_away: 0,
        first_scorer: "home", total_goals_bracket: "2-3",
      },
      FULL_RESULT,
    );
    expect(s.total_points).toBe(25);
    expect(s.exact_score).toBe(true);
    expect(s.correct_winner).toBe(true);
    expect(s.breakdown.base).toBe(15);
    expect(s.breakdown.half_time).toBe(5);
    expect(s.breakdown.first_scorer).toBe(3);
    expect(s.breakdown.total_goals).toBe(2);
  });

  test("exact score without bonuses = 15 pts", () => {
    const s = scoreOnePalpite(
      { home_score: 2, away_score: 1 },
      FULL_RESULT,
    );
    expect(s.total_points).toBe(15);
    expect(s.exact_score).toBe(true);
    expect(s.bonus_points).toBe(0);
  });

  test("correct winner + exact goal difference (not exact score) = 10 pts", () => {
    const s = scoreOnePalpite(
      { home_score: 3, away_score: 2 },
      FULL_RESULT,
    );
    expect(s.total_points).toBe(10);
    expect(s.exact_score).toBe(false);
    expect(s.correct_winner).toBe(true);
  });

  test("correct winner only = 5 pts", () => {
    const s = scoreOnePalpite(
      { home_score: 3, away_score: 1 },
      FULL_RESULT,
    );
    expect(s.total_points).toBe(5);
    expect(s.exact_score).toBe(false);
    expect(s.correct_winner).toBe(true);
  });

  test("wrong prediction = 0 pts", () => {
    const s = scoreOnePalpite(
      { home_score: 0, away_score: 2 },
      FULL_RESULT,
    );
    expect(s.total_points).toBe(0);
    expect(s.exact_score).toBe(false);
    expect(s.correct_winner).toBe(false);
  });

  test("exact draw (1-1 predicted, 1-1 result) = 15 pts", () => {
    const drawResult: MatchResult = {
      home_score: 1, away_score: 1,
      half_time_home: null, half_time_away: null,
      first_scorer: null, total_goals_bracket: "2-3",
    };
    const s = scoreOnePalpite({ home_score: 1, away_score: 1 }, drawResult);
    expect(s.total_points).toBe(15); // exact score — still full marks
    expect(s.exact_score).toBe(true);
    expect(s.correct_winner).toBe(true);
  });

  test("correct winner but different goal diff (2-0 pred, 1-0 result) = 5 pts", () => {
    const result: MatchResult = {
      home_score: 1, away_score: 0,
      half_time_home: null, half_time_away: null,
      first_scorer: null, total_goals_bracket: "0-1",
    };
    // pDiff=2, rDiff=1 → different diff → 5 pts (winner correct only)
    const s = scoreOnePalpite({ home_score: 2, away_score: 0 }, result);
    expect(s.total_points).toBe(5);
    expect(s.exact_score).toBe(false);
    expect(s.correct_winner).toBe(true);
  });

  test("draw correct with same diff (0-0 pred, 1-1 result) = 10 pts (same diff)", () => {
    const drawResult: MatchResult = {
      home_score: 1, away_score: 1,
      half_time_home: null, half_time_away: null,
      first_scorer: null, total_goals_bracket: "2-3",
    };
    // Both have diff=0, so correct winner AND exact diff → 10 pts
    const s = scoreOnePalpite({ home_score: 0, away_score: 0 }, drawResult);
    expect(s.total_points).toBe(10);
    expect(s.exact_score).toBe(false);
    expect(s.correct_winner).toBe(true);
  });

  test("wrong half-time gives no bonus", () => {
    const s = scoreOnePalpite(
      { home_score: 2, away_score: 1, half_time_home: 0, half_time_away: 1 },
      FULL_RESULT,
    );
    expect(s.breakdown.half_time).toBe(0);
    expect(s.total_points).toBe(15); // exact score only
  });

  test("null half-time in result gives no bonus regardless of palpite", () => {
    const noHtResult: MatchResult = { ...FULL_RESULT, half_time_home: null, half_time_away: null };
    const s = scoreOnePalpite(
      { home_score: 2, away_score: 1, half_time_home: 1, half_time_away: 0 },
      noHtResult,
    );
    expect(s.breakdown.half_time).toBe(0);
  });
});

describe("computeTotalGoalsBracket", () => {
  test("0 goals → 0-1", () => expect(computeTotalGoalsBracket(0, 0)).toBe("0-1"));
  test("1 goal → 0-1", () => expect(computeTotalGoalsBracket(1, 0)).toBe("0-1"));
  test("2 goals → 2-3", () => expect(computeTotalGoalsBracket(1, 1)).toBe("2-3"));
  test("3 goals → 2-3", () => expect(computeTotalGoalsBracket(2, 1)).toBe("2-3"));
  test("4 goals → 4+", () => expect(computeTotalGoalsBracket(3, 1)).toBe("4+"));
  test("7 goals → 4+", () => expect(computeTotalGoalsBracket(4, 3)).toBe("4+"));
});
