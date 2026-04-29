const DEFAULT_LEGACY_SCORING = {
  exact: 5,
  winner: 3,
  draw: 2,
  participation: 0,
};

function normalizeScore(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeRule(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeScoringRules(scoringRules = null) {
  return {
    exact: normalizeRule(scoringRules?.exact, DEFAULT_LEGACY_SCORING.exact),
    winner: normalizeRule(scoringRules?.winner, DEFAULT_LEGACY_SCORING.winner),
    draw: normalizeRule(scoringRules?.draw, DEFAULT_LEGACY_SCORING.draw),
    participation: normalizeRule(scoringRules?.participation, DEFAULT_LEGACY_SCORING.participation),
  };
}

function getResultType(homeScore, awayScore) {
  if (homeScore === awayScore) return "draw";
  return homeScore > awayScore ? "home" : "away";
}

function resolveLegacyMatchPredictionPoints({
  predictionHomeScore,
  predictionAwayScore,
  matchHomeScore,
  matchAwayScore,
  scoringRules = null,
  isPowerPlay = false,
}) {
  const predictedHome = normalizeScore(predictionHomeScore);
  const predictedAway = normalizeScore(predictionAwayScore);
  const actualHome = normalizeScore(matchHomeScore);
  const actualAway = normalizeScore(matchAwayScore);

  if (predictedHome === null || predictedAway === null || actualHome === null || actualAway === null) {
    return { points: 0, type: "miss" };
  }

  const rules = normalizeScoringRules(scoringRules);
  let points = rules.participation;
  let type = "miss";

  if (predictedHome === actualHome && predictedAway === actualAway) {
    points = rules.exact;
    type = "exact";
  } else {
    const predictionResult = getResultType(predictedHome, predictedAway);
    const matchResult = getResultType(actualHome, actualAway);

    if (predictionResult === matchResult) {
      if (matchResult === "draw") {
        points = rules.draw;
        type = "draw";
      } else {
        points = rules.winner;
        type = "winner";
      }
    }
  }

  if (isPowerPlay && points > 0) {
    points *= 2;
  }

  return { points, type };
}

module.exports = {
  DEFAULT_LEGACY_SCORING,
  normalizeScoringRules,
  resolveLegacyMatchPredictionPoints,
};
