const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

const SCORING = {
    EXACT: 5,
    WINNER: 3,
    DRAW: 2,
};

function chunkArray(items, size) {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}

function getResultType(homeScore, awayScore) {
    if (homeScore === awayScore) return "draw";
    return homeScore > awayScore ? "home" : "away";
}

function normalizeNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeBreakdown(current = {}) {
    return {
        match: normalizeNumber(current.match),
        phase: normalizeNumber(current.phase),
        tournament: normalizeNumber(current.tournament),
        special: normalizeNumber(current.special),
    };
}

async function createBolaoActivity({ bolaoId, userId = null, type, title, description = null, marketId = null, matchId = null }) {
    if (!bolaoId || !type || !title) return null;

    let actorName = null;
    if (userId) {
        try {
            const profileSnapshot = await db.collection("profiles").doc(userId).get();
            if (profileSnapshot.exists) {
                const profileData = profileSnapshot.data();
                actorName = profileData?.displayName || profileData?.name || null;
            }
        } catch (error) {
            functions.logger.warn("Could not load profile for bolao activity", { userId, error: error?.message || error });
        }
    }

    await db.collection("bolao_activity").add({
        bolao_id: bolaoId,
        user_id: userId,
        actor_name: actorName,
        type,
        title,
        description,
        market_id: marketId,
        match_id: matchId,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return null;
}

function getMatchFirstScorer(matchData) {
    const explicitFirstScorer =
        matchData.first_team_to_score ||
        matchData.first_scorer_team_code ||
        matchData.first_goal_team_code ||
        null;

    if (typeof explicitFirstScorer === "string" && explicitFirstScorer) {
        return explicitFirstScorer;
    }

    const homeScore = normalizeNumber(matchData.home_score);
    const awayScore = normalizeNumber(matchData.away_score);

    if (homeScore === 0 && awayScore === 0) return "none";
    if (homeScore > 0 && awayScore === 0) return matchData.home_team_code || null;
    if (awayScore > 0 && homeScore === 0) return matchData.away_team_code || null;
    return null;
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
        case "home_goals":
            return {
                points: normalizeNumber(predictionValue) === homeScore ? market.points_exact : 0,
                resolved: true,
                hit: normalizeNumber(predictionValue) === homeScore,
            };
        case "away_goals":
            return {
                points: normalizeNumber(predictionValue) === awayScore ? market.points_exact : 0,
                resolved: true,
                hit: normalizeNumber(predictionValue) === awayScore,
            };
        case "total_goals":
            return {
                points: normalizeNumber(predictionValue) === homeScore + awayScore ? market.points_exact : 0,
                resolved: true,
                hit: normalizeNumber(predictionValue) === homeScore + awayScore,
            };
        case "both_score": {
            const bothScore = homeScore > 0 && awayScore > 0 ? "yes" : "no";
            return {
                points: predictionValue === bothScore ? market.points_exact : 0,
                resolved: true,
                hit: predictionValue === bothScore,
            };
        }
        case "first_team_to_score": {
            const firstScorer = getMatchFirstScorer(matchData);
            if (!firstScorer) {
                return { points: null, resolved: false, hit: false };
            }
            return {
                points: predictionValue === firstScorer ? market.points_exact : 0,
                resolved: true,
                hit: predictionValue === firstScorer,
            };
        }
        default:
            return { points: null, resolved: false, hit: false };
    }
}

function hasResolutionValue(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
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

function normalizeBracketPick(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {
            semifinalists: [],
            finalists: [],
            champion: "",
        };
    }

    return {
        semifinalists: Array.isArray(value.semifinalists)
            ? value.semifinalists.map((item) => normalizeScalar(item)).filter(Boolean)
            : [],
        finalists: Array.isArray(value.finalists)
            ? value.finalists.map((item) => normalizeScalar(item)).filter(Boolean)
            : [],
        champion: normalizeScalar(value.champion),
    };
}

function resolveConfiguredMarketPoints({ market, predictionValue, resolutionValue }) {
    if (!hasResolutionValue(resolutionValue)) {
        return { points: null, resolved: false, hit: false };
    }

    if (market.slug === "bracket_pick") {
        const predicted = normalizeBracketPick(predictionValue);
        const resolved = normalizeBracketPick(resolutionValue);
        const finalistsHits = predicted.finalists.filter((item) => resolved.finalists.includes(item)).length;
        const championHit = predicted.champion && predicted.champion === resolved.champion;
        const exact =
            championHit &&
            predicted.finalists.length === resolved.finalists.length &&
            predicted.finalists.every((item) => resolved.finalists.includes(item));

        if (exact) {
            return { points: normalizeNumber(market.points_exact), resolved: true, hit: true };
        }

        const partialUnit = Math.max(1, Math.floor(normalizeNumber(market.points_partial) / 2));
        const partialPoints = Math.min(
            normalizeNumber(market.points_exact),
            finalistsHits * partialUnit + (championHit ? partialUnit : 0)
        );

        return {
            points: partialPoints,
            resolved: true,
            hit: partialPoints > 0,
        };
    }

    if (market.prediction_type === "multi_choice") {
        const predicted = normalizeSelection(predictionValue);
        const resolved = normalizeSelection(resolutionValue);

        if (resolved.length === 0) {
            return { points: null, resolved: false, hit: false };
        }

        const hits = predicted.filter((item) => resolved.includes(item)).length;
        const exact =
            hits === resolved.length &&
            predicted.length === resolved.length &&
            predicted.every((item) => resolved.includes(item));

        if (exact) {
            return { points: normalizeNumber(market.points_exact), resolved: true, hit: true };
        }

        if (hits > 0 && normalizeNumber(market.points_partial) > 0) {
            return {
                points: Math.min(normalizeNumber(market.points_exact), hits * normalizeNumber(market.points_partial)),
                resolved: true,
                hit: true,
            };
        }

        return { points: 0, resolved: true, hit: false };
    }

    if (market.prediction_type === "score") {
        if (
            predictionValue &&
            typeof predictionValue === "object" &&
            !Array.isArray(predictionValue) &&
            resolutionValue &&
            typeof resolutionValue === "object" &&
            !Array.isArray(resolutionValue)
        ) {
            const predictedHome = normalizeNumber(predictionValue.home);
            const predictedAway = normalizeNumber(predictionValue.away);
            const resolvedHome = normalizeNumber(resolutionValue.home);
            const resolvedAway = normalizeNumber(resolutionValue.away);
            const exact = predictedHome === resolvedHome && predictedAway === resolvedAway;
            return {
                points: exact ? normalizeNumber(market.points_exact) : 0,
                resolved: true,
                hit: exact,
            };
        }

        return { points: 0, resolved: true, hit: false };
    }

    const predictedScalar = normalizeScalar(predictionValue);
    const resolvedScalar = normalizeScalar(resolutionValue);

    if (!predictedScalar || !resolvedScalar) {
        return { points: 0, resolved: true, hit: false };
    }

    return {
        points: predictedScalar === resolvedScalar ? normalizeNumber(market.points_exact) : 0,
        resolved: true,
        hit: predictedScalar === resolvedScalar,
    };
}

async function recalculateBolaoRankingForUser({ bolaoId, userId }) {
    if (!bolaoId || !userId) return null;

    const [palpitesSnapshot, predictionsSnapshot, bolaoMarketsSnapshot] = await Promise.all([
        db.collection("bolao_palpites")
            .where("bolao_id", "==", bolaoId)
            .where("user_id", "==", userId)
            .get(),
        db.collection("bolao_predictions")
            .where("bolao_id", "==", bolaoId)
            .where("user_id", "==", userId)
            .get(),
        db.collection("bolao_markets")
            .where("bolao_id", "==", bolaoId)
            .limit(1)
            .get(),
    ]);

    const hasModernMarkets = !bolaoMarketsSnapshot.empty;

    const marketIds = Array.from(
        new Set(
            predictionsSnapshot.docs
                .map((docSnapshot) => docSnapshot.data().market_id)
                .filter((value) => typeof value === "string" && value)
        )
    );

    const marketsMap = new Map();
    if (marketIds.length > 0) {
        const chunkSize = 10;
        for (let index = 0; index < marketIds.length; index += chunkSize) {
            const chunk = marketIds.slice(index, index + chunkSize);
            const marketSnapshot = await db
                .collection("bolao_markets")
                .where(admin.firestore.FieldPath.documentId(), "in", chunk)
                .get();

            marketSnapshot.forEach((marketDoc) => {
                marketsMap.set(marketDoc.id, marketDoc.data());
            });
        }
    }

    let totalPoints = 0;
    let exactMatches = 0;
    let correctResults = 0;
    let draws = 0;
    let palpitesCount = 0;
    const breakdown = {
        match: 0,
        phase: 0,
        tournament: 0,
        special: 0,
    };

    if (!hasModernMarkets) {
        palpitesSnapshot.forEach((docSnapshot) => {
            const palpite = docSnapshot.data();
            const points = normalizeNumber(palpite.points);
            const type = palpite.type || "miss";

            totalPoints += points;
            breakdown.match += points;
            palpitesCount += 1;

            if (type === "exact") {
                exactMatches += 1;
            } else if (type === "winner") {
                correctResults += 1;
            } else if (type === "draw") {
                draws += 1;
                correctResults += 1;
            }
        });
    }

    predictionsSnapshot.forEach((docSnapshot) => {
        const prediction = docSnapshot.data();
        const points = normalizeNumber(prediction.points_awarded);
        const market = marketsMap.get(prediction.market_id);
        const marketScope = market?.scope;

        if (!marketScope) {
            return;
        }

        totalPoints += points;

        if (marketScope === "match") {
            breakdown.match += points;
            if (market.slug === "exact_score" && points > 0) {
                exactMatches += 1;
            }
            if (market.slug === "match_winner" && points > 0) {
                correctResults += 1;
            }
        } else if (marketScope === "phase") {
            breakdown.phase += points;
        } else if (marketScope === "tournament") {
            breakdown.tournament += points;
        } else if (marketScope === "special") {
            breakdown.special += points;
        }

        if (prediction.resolved) {
            palpitesCount += 1;
        }
    });

    const rankingRef = db.collection("bolao_rankings").doc(`${userId}_${bolaoId}`);
    const rankingSnapshot = await rankingRef.get();
    const existingBreakdown = normalizeBreakdown(rankingSnapshot.exists ? rankingSnapshot.data()?.points_breakdown : null);

    await rankingRef.set(
        {
            user_id: userId,
            bolao_id: bolaoId,
            total_points: totalPoints,
            exact_matches: exactMatches,
            correct_results: correctResults,
            draws,
            palpites_count: palpitesCount,
            match_points: breakdown.match,
            phase_points: breakdown.phase,
            tournament_points: breakdown.tournament,
            special_points: breakdown.special,
            points_breakdown: {
                match: breakdown.match,
                phase: breakdown.phase,
                tournament: breakdown.tournament,
                special: breakdown.special,
            },
            rank: rankingSnapshot.exists ? rankingSnapshot.data()?.rank || 0 : 0,
            created_at: rankingSnapshot.exists ? rankingSnapshot.data()?.created_at || admin.firestore.FieldValue.serverTimestamp() : admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            breakdown_migrated_from: existingBreakdown.match || existingBreakdown.phase || existingBreakdown.tournament || existingBreakdown.special ? "recalculated" : "initialized",
        },
        { merge: true }
    );

    return {
        userId,
        bolaoId,
        totalPoints,
        exactMatches,
        correctResults,
        draws,
        breakdown,
    };
}

/**
 * Triggered when a match is updated.
 * If the match finishes or the score changes while finished, recalculates all palpites
 * and then refreshes the affected ranking rows with the new breakdown structure.
 */
exports.onMatchResultUpdated = functions.firestore
    .document("matches/{matchId}")
    .onUpdate(async (change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        const newStatus = newValue.status ? String(newValue.status).toUpperCase() : "";
        const prevStatus = previousValue ? (previousValue.status ? String(previousValue.status).toUpperCase() : "") : "";

        const statusChangedToFinished = newStatus === "FINISHED" && prevStatus !== "FINISHED";
        const scoreChangedWhileFinished =
            newStatus === "FINISHED" &&
            (newValue.home_score !== previousValue.home_score || newValue.away_score !== previousValue.away_score);

        if (!statusChangedToFinished && !scoreChangedWhileFinished) {
            return null;
        }

        const matchId = context.params.matchId;
        const matchHomeScore = newValue.home_score;
        const matchAwayScore = newValue.away_score;

        if (matchHomeScore === null || matchAwayScore === null || typeof matchHomeScore !== "number" || typeof matchAwayScore !== "number") {
            return null;
        }

        functions.logger.info(`Processing match ${matchId} result`, {
            matchId,
            home: matchHomeScore,
            away: matchAwayScore,
        });

        const batch = db.batch();
        const affectedRankings = new Set();
        const legacyPredictionsSnapshot = await db.collection("bolao_palpites").where("match_id", "==", matchId).get();

        for (const docSnapshot of legacyPredictionsSnapshot.docs) {
            const palpite = docSnapshot.data();
            const userId = palpite.user_id;
            const bolaoId = palpite.bolao_id;
            const predictionHomeScore = palpite.home_score;
            const predictionAwayScore = palpite.away_score;

            if (typeof predictionHomeScore !== "number" || typeof predictionAwayScore !== "number" || !userId || !bolaoId) {
                continue;
            }

            let points = 0;
            let type = "miss";

            if (predictionHomeScore === matchHomeScore && predictionAwayScore === matchAwayScore) {
                points = SCORING.EXACT;
                type = "exact";
            } else {
                const predictionResult = getResultType(predictionHomeScore, predictionAwayScore);
                const matchResult = getResultType(matchHomeScore, matchAwayScore);

                if (predictionResult === matchResult) {
                    if (matchResult === "draw") {
                        points = SCORING.DRAW;
                        type = "draw";
                    } else {
                        points = SCORING.WINNER;
                        type = "winner";
                    }
                }
            }

            if (palpite.is_power_play && points > 0) {
                points *= 2;
            }

            batch.update(docSnapshot.ref, {
                points,
                type,
                processed_at: admin.firestore.FieldValue.serverTimestamp(),
            });

            affectedRankings.add(`${userId}__${bolaoId}`);
        }

        const modernMarketsSnapshot = await db.collection("bolao_markets").where("match_id", "==", matchId).get();
        const modernMatchMarkets = modernMarketsSnapshot.docs
            .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
            .filter((market) => market.scope === "match");

        if (modernMatchMarkets.length > 0) {
            const marketIds = modernMatchMarkets.map((market) => market.id);
            const marketMap = new Map(modernMatchMarkets.map((market) => [market.id, market]));
            const predictionChunks = [];

            for (const chunk of chunkArray(marketIds, 10)) {
                predictionChunks.push(
                    db.collection("bolao_predictions")
                        .where("market_id", "in", chunk)
                        .get()
                );
            }

            const predictionSnapshots = await Promise.all(predictionChunks);
            predictionSnapshots.forEach((snapshot) => {
                snapshot.docs.forEach((docSnapshot) => {
                    const prediction = docSnapshot.data();
                    const market = marketMap.get(prediction.market_id);
                    if (!market) return;

                    const resolution = resolveMatchMarketPoints({
                        market,
                        predictionValue: prediction.prediction_value,
                        matchData: newValue,
                    });

                    if (!resolution.resolved) {
                        batch.set(docSnapshot.ref, {
                            resolved: false,
                            updated_at: admin.firestore.FieldValue.serverTimestamp(),
                        }, { merge: true });
                    } else {
                        batch.set(docSnapshot.ref, {
                            points_awarded: resolution.points,
                            resolved: true,
                            resolved_at: admin.firestore.FieldValue.serverTimestamp(),
                            updated_at: admin.firestore.FieldValue.serverTimestamp(),
                        }, { merge: true });
                    }

                    if (prediction.user_id && prediction.bolao_id) {
                        affectedRankings.add(`${prediction.user_id}__${prediction.bolao_id}`);
                    }
                });
            });
        }

        await batch.commit();

        await Promise.all(
            Array.from(affectedRankings).map((key) => {
                const [userId, bolaoId] = key.split("__");
                return recalculateBolaoRankingForUser({ bolaoId, userId });
            })
        );

        functions.logger.info(`Successfully processed match predictions for ${matchId}`, {
            legacyPredictions: legacyPredictionsSnapshot.size,
            modernMarkets: modernMatchMarkets.length,
            affectedRankings: affectedRankings.size,
        });
        return null;
    });

/**
 * Resolves non-match markets once the creator defines an official result directly on bolao_markets.
 */
exports.onBolaoMarketWrite = functions.firestore
    .document("bolao_markets/{marketId}")
    .onWrite(async (change, context) => {
        const afterData = change.after.exists ? change.after.data() : null;
        const beforeData = change.before.exists ? change.before.data() : null;
        const marketData = afterData || beforeData;
        const marketId = context.params.marketId;

        if (!marketData || marketData.scope === "match") {
            return null;
        }

        const resolutionChanged =
            JSON.stringify(afterData?.resolution_value ?? null) !== JSON.stringify(beforeData?.resolution_value ?? null);
        const statusChanged = afterData?.status !== beforeData?.status;

        if (!resolutionChanged && !statusChanged) {
            return null;
        }

        const predictionsSnapshot = await db.collection("bolao_predictions").where("market_id", "==", marketId).get();
        if (predictionsSnapshot.empty) {
            return null;
        }

        const shouldResolve =
            Boolean(afterData) &&
            afterData.status === "resolved" &&
            hasResolutionValue(afterData.resolution_value);

        const batch = db.batch();
        const affectedRankings = new Set();

        predictionsSnapshot.forEach((docSnapshot) => {
            const prediction = docSnapshot.data();

            if (shouldResolve) {
                const resolution = resolveConfiguredMarketPoints({
                    market: afterData,
                    predictionValue: prediction.prediction_value,
                    resolutionValue: afterData.resolution_value,
                });

                if (resolution.resolved) {
                    batch.set(docSnapshot.ref, {
                        points_awarded: resolution.points,
                        resolved: true,
                        resolved_at: admin.firestore.FieldValue.serverTimestamp(),
                        updated_at: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });
                } else {
                    batch.set(docSnapshot.ref, {
                        points_awarded: null,
                        resolved: false,
                        updated_at: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true });
                }
            } else {
                batch.set(docSnapshot.ref, {
                    points_awarded: null,
                    resolved: false,
                    updated_at: admin.firestore.FieldValue.serverTimestamp(),
                }, { merge: true });
            }

            if (prediction.user_id && prediction.bolao_id) {
                affectedRankings.add(`${prediction.user_id}__${prediction.bolao_id}`);
            }
        });

        await batch.commit();

        await Promise.all(
            Array.from(affectedRankings).map((key) => {
                const [userId, bolaoId] = key.split("__");
                return recalculateBolaoRankingForUser({ bolaoId, userId });
            })
        );

        if (shouldResolve) {
            await createBolaoActivity({
                bolaoId: afterData.bolao_id,
                userId: afterData.resolved_by || null,
                type: "market_resolved",
                title: `Resultado oficial definido em ${afterData.title}`,
                description: "O mercado foi resolvido e os pontos da liga foram recalculados.",
                marketId,
            });
        }

        return null;
    });

/**
 * Triggered when a user joins a bolão.
 * Initializes their ranking entry with the modern breakdown fields.
 */
exports.onNewBolaoMember = functions.firestore
    .document("bolao_members/{memberId}")
    .onCreate(async (snap) => {
        const data = snap.data();
        const userId = data.user_id;
        const bolaoId = data.bolao_id;

        if (!userId || !bolaoId) return null;

        const rankingRef = db.collection("bolao_rankings").doc(`${userId}_${bolaoId}`);
        const rankingDoc = await rankingRef.get();

        if (!rankingDoc.exists) {
            await rankingRef.set({
                user_id: userId,
                bolao_id: bolaoId,
                total_points: 0,
                exact_matches: 0,
                correct_results: 0,
                draws: 0,
                palpites_count: 0,
                match_points: 0,
                phase_points: 0,
                tournament_points: 0,
                special_points: 0,
                points_breakdown: {
                    match: 0,
                    phase: 0,
                    tournament: 0,
                    special: 0,
                },
                rank: 0,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
            functions.logger.info(`Initialized ranking for user ${userId} in bolão ${bolaoId}`);
            await createBolaoActivity({
                bolaoId,
                userId,
                type: "member_joined",
                title: "Novo participante entrou na liga",
                description: "A arena ganhou mais um competidor.",
            });
            return null;
        }

        await recalculateBolaoRankingForUser({ bolaoId, userId });
        return null;
    });

/**
 * Keeps legacy match rankings in sync when users create/update/remove their match predictions.
 */
exports.onBolaoPalpiteWrite = functions.firestore
    .document("bolao_palpites/{palpiteId}")
    .onWrite(async (change) => {
        const afterData = change.after.exists ? change.after.data() : null;
        const beforeData = change.before.exists ? change.before.data() : null;
        const userId = afterData?.user_id || beforeData?.user_id;
        const bolaoId = afterData?.bolao_id || beforeData?.bolao_id;

        if (!userId || !bolaoId) {
            return null;
        }

        await recalculateBolaoRankingForUser({ bolaoId, userId });

        const predictionChanged =
            change.after.exists &&
            (
                JSON.stringify(afterData?.home_score ?? null) !== JSON.stringify(beforeData?.home_score ?? null) ||
                JSON.stringify(afterData?.away_score ?? null) !== JSON.stringify(beforeData?.away_score ?? null)
            );

        if (predictionChanged && afterData) {
            await createBolaoActivity({
                bolaoId,
                userId,
                type: "legacy_prediction_saved",
                title: "Palpite de jogo atualizado",
                description: "Um palpite clássico de partida foi salvo na liga.",
                matchId: afterData.match_id || null,
            });
        }

        return null;
    });

/**
 * Keeps the ranking breakdown synced when modern market predictions are resolved or edited.
 */
exports.onBolaoPredictionWrite = functions.firestore
    .document("bolao_predictions/{predictionId}")
    .onWrite(async (change) => {
        const afterData = change.after.exists ? change.after.data() : null;
        const beforeData = change.before.exists ? change.before.data() : null;
        const userId = afterData?.user_id || beforeData?.user_id;
        const bolaoId = afterData?.bolao_id || beforeData?.bolao_id;

        if (!userId || !bolaoId) {
            return null;
        }

        await recalculateBolaoRankingForUser({ bolaoId, userId });

        const predictionChanged =
            change.after.exists &&
            JSON.stringify(afterData?.prediction_value ?? null) !== JSON.stringify(beforeData?.prediction_value ?? null);

        if (predictionChanged && afterData) {
            let marketTitle = "Mercado";
            try {
                const marketSnapshot = await db.collection("bolao_markets").doc(afterData.market_id).get();
                if (marketSnapshot.exists) {
                    marketTitle = marketSnapshot.data()?.title || marketTitle;
                }
            } catch (error) {
                functions.logger.warn("Could not load market title for bolao activity", { marketId: afterData.market_id, error: error?.message || error });
            }

            await createBolaoActivity({
                bolaoId,
                userId,
                type: "prediction_saved",
                title: `Palpite salvo em ${marketTitle}`,
                description: "Um mercado moderno do bolão recebeu nova aposta.",
                marketId: afterData.market_id || null,
            });
        }

        return null;
    });
