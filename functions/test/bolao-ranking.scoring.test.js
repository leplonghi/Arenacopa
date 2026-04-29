const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_LEGACY_SCORING,
  normalizeScoringRules,
  resolveLegacyMatchPredictionPoints,
} = require("../bolao-ranking/scoring");

test("resolveLegacyMatchPredictionPoints uses bolao scoring_rules when present", () => {
  assert.deepEqual(
    resolveLegacyMatchPredictionPoints({
      predictionHomeScore: 2,
      predictionAwayScore: 1,
      matchHomeScore: 2,
      matchAwayScore: 1,
      scoringRules: { exact: 12, winner: 4, draw: 4, participation: 1 },
    }),
    { points: 12, type: "exact" }
  );

  assert.deepEqual(
    resolveLegacyMatchPredictionPoints({
      predictionHomeScore: 1,
      predictionAwayScore: 0,
      matchHomeScore: 3,
      matchAwayScore: 1,
      scoringRules: { exact: 12, winner: 4, draw: 4, participation: 1 },
    }),
    { points: 4, type: "winner" }
  );

  assert.deepEqual(
    resolveLegacyMatchPredictionPoints({
      predictionHomeScore: 1,
      predictionAwayScore: 1,
      matchHomeScore: 2,
      matchAwayScore: 2,
      scoringRules: { exact: 12, winner: 4, draw: 5, participation: 1 },
    }),
    { points: 5, type: "draw" }
  );
});

test("resolveLegacyMatchPredictionPoints preserves legacy defaults without scoring_rules", () => {
  assert.deepEqual(
    resolveLegacyMatchPredictionPoints({
      predictionHomeScore: 2,
      predictionAwayScore: 1,
      matchHomeScore: 2,
      matchAwayScore: 1,
    }),
    { points: DEFAULT_LEGACY_SCORING.exact, type: "exact" }
  );
});

test("resolveLegacyMatchPredictionPoints applies participation and power play safely", () => {
  assert.deepEqual(
    resolveLegacyMatchPredictionPoints({
      predictionHomeScore: 0,
      predictionAwayScore: 1,
      matchHomeScore: 2,
      matchAwayScore: 1,
      scoringRules: { exact: 10, winner: 3, draw: 3, participation: 1 },
    }),
    { points: 1, type: "miss" }
  );

  assert.deepEqual(
    resolveLegacyMatchPredictionPoints({
      predictionHomeScore: 1,
      predictionAwayScore: 0,
      matchHomeScore: 2,
      matchAwayScore: 0,
      scoringRules: { exact: 10, winner: 3, draw: 3, participation: 1 },
      isPowerPlay: true,
    }),
    { points: 6, type: "winner" }
  );
});

test("normalizeScoringRules falls back per field", () => {
  assert.deepEqual(normalizeScoringRules({ exact: 10 }), {
    exact: 10,
    winner: DEFAULT_LEGACY_SCORING.winner,
    draw: DEFAULT_LEGACY_SCORING.draw,
    participation: DEFAULT_LEGACY_SCORING.participation,
  });
});
