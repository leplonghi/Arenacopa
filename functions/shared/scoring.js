const { db, admin } = require("./db");

function normalizeNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeScalar(value) {
    if (typeof value === "string") return value.trim().toUpperCase();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    return "";
}

function normalizeSelection(value) {
    if (typeof value === "string") return [normalizeScalar(value)].filter(Boolean);
    if (Array.isArray(value)) {
        return value
            .filter((item) => typeof item === "string" || typeof item === "number")
            .map((item) => normalizeScalar(item))
            .filter(Boolean);
    }
    if (value && typeof value === "object" && Array.isArray(value.teams)) {
        return value.teams
            .filter((item) => typeof item === "string" || typeof item === "number")
            .map((item) => normalizeScalar(item))
            .filter(Boolean);
    }
    return [];
}

function hasResolutionValue(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
}

function resolveMatchMarketPoints({ market, predictionValue, matchData }) {
    const homeScore = normalizeNumber(matchData.home_score);
    const awayScore = normalizeNumber(matchData.away_score);
    const matchWinner = homeScore === awayScore ? "draw" : homeScore > awayScore ? matchData.home_team_code : matchData.away_team_code;

    switch (market.slug) {
        case "exact_score": {
            if (predictionValue && typeof predictionValue === "object" && !Array.isArray(predictionValue)) {
                const predictedHome = normalizeNumber(predictionValue.home);
                const predictedAway = normalizeNumber(predictionValue.away);
                if (predictedHome === homeScore && predictedAway === awayScore) {
                    return { points: market.points_exact, resolved: true, hit: true };
                }
            }
            return { points: 0, resolved: true, hit: false };
        }
        case "match_winner": {
            if (typeof predictionValue === "string" && predictionValue === matchWinner) {
                return { points: market.points_exact, resolved: true, hit: true };
            }
            return { points: 0, resolved: true, hit: false };
        }
        // ... (other cases like total_goals, both_score, etc. from index.js)
        default:
            return { points: 0, resolved: false, hit: false };
    }
}

async function recalculateBolaoRankingForUser({ bolaoId, userId }) {
    // Porting from index.js
    // ...
}

module.exports = {
    normalizeNumber,
    normalizeScalar,
    normalizeSelection,
    hasResolutionValue,
    resolveMatchMarketPoints,
    recalculateBolaoRankingForUser,
};
