const functions = require("firebase-functions");
const admin = require("firebase-admin");
const https = require("https");

admin.initializeApp();

const db = admin.firestore();
const DEFAULT_SITE_URL = "https://arenacopa.app";
const STRIPE_API_BASE_URL = "https://api.stripe.com/v1";
const STRIPE_API_VERSION = "2026-02-25.clover";

const SCORING = {
    EXACT: 5,
    WINNER: 3,
    DRAW: 2,
};
const LEAGUE_CHAMPIONSHIPS = [
    { id: "brasileirao2026", fdoId: 2013, name: "Brasileirão", season: "2026" },
    { id: "ucl2526", fdoId: 2001, name: "Champions League", season: "2025" },
    { id: "laliga2526", fdoId: 2014, name: "La Liga", season: "2025" },
    { id: "premier2526", fdoId: 2021, name: "Premier League", season: "2025" },
];

function applyCors(res) {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
}

function getRuntimeConfig() {
    const runtimeConfig = functions.config();

    return {
        stripeSecretKey: runtimeConfig?.stripe?.secret_key || process.env.STRIPE_SECRET_KEY || "",
        stripePremiumPriceId: runtimeConfig?.stripe?.premium_price_id || process.env.STRIPE_PREMIUM_PRICE_ID || "",
        siteUrl: runtimeConfig?.app?.site_url || process.env.SITE_URL || DEFAULT_SITE_URL,
        footballDataApiKey: runtimeConfig?.football_data?.api_key || process.env.FOOTBALL_DATA_API_KEY || "",
        seedToken: runtimeConfig?.seed?.token || process.env.SEED_ADMIN_TOKEN || "",
    };
}

async function verifyHttpUser(req) {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
        throw new Error("Usuário não autenticado para iniciar o checkout.");
    }

    const idToken = authHeader.slice("Bearer ".length).trim();
    return admin.auth().verifyIdToken(idToken);
}

async function stripeApiRequest({ method, path, params = null }) {
    const { stripeSecretKey } = getRuntimeConfig();
    if (!stripeSecretKey) {
        throw new Error("STRIPE_SECRET_KEY não configurada nas Cloud Functions.");
    }

    const headers = {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Stripe-Version": STRIPE_API_VERSION,
    };

    let url = `${STRIPE_API_BASE_URL}${path}`;
    const requestInit = {
        method,
        headers,
    };

    if (method === "GET" && params) {
        url += `?${new URLSearchParams(params).toString()}`;
    } else if (params) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        requestInit.body = new URLSearchParams(params).toString();
    }

    const response = await fetch(url, requestInit);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error?.message || "Falha ao comunicar com o Stripe.");
    }

    return data;
}

function mapStripeSessionStatus(session) {
    if (session.status === "complete" && session.payment_status === "paid") {
        return "active";
    }

    if (session.status === "expired") {
        return "expired";
    }

    if (session.status === "open") {
        return "pending";
    }

    return "failed";
}

async function upsertPremiumSubscriptionFromSession({ session, userId }) {
    const subscriptionData = {
        user_id: userId,
        status: mapStripeSessionStatus(session),
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent || null,
        stripe_customer_id: session.customer || null,
        amount_total: session.amount_total ?? null,
        currency: session.currency ?? null,
        payment_status: session.payment_status || null,
        customer_email: session.customer_details?.email || session.customer_email || null,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        activated_at:
            session.status === "complete" && session.payment_status === "paid"
                ? admin.firestore.FieldValue.serverTimestamp()
                : null,
    };

    const existingSnapshot = await db
        .collection("premium_subscriptions")
        .where("stripe_checkout_session_id", "==", session.id)
        .limit(1)
        .get();

    if (!existingSnapshot.empty) {
        await existingSnapshot.docs[0].ref.set(subscriptionData, { merge: true });
        return existingSnapshot.docs[0].ref.id;
    }

    const created = await db.collection("premium_subscriptions").add({
        ...subscriptionData,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return created.id;
}

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

function mapFootballDataStatus(status) {
    if (status === "FINISHED" || status === "AWARDED") return "finished";
    if (status === "IN_PLAY" || status === "PAUSED") return "live";
    return "upcoming";
}

async function footballDataRequest(path) {
    const { footballDataApiKey } = getRuntimeConfig();
    if (!footballDataApiKey) {
        throw new Error("FOOTBALL_DATA_API_KEY não configurada.");
    }

    const url = `https://api.football-data.org/v4${path}`;

    return new Promise((resolve, reject) => {
        const request = https.request(url, {
            method: "GET",
            headers: {
                "X-Auth-Token": footballDataApiKey,
                "User-Agent": "ArenaCopaSeed/1.0",
                "Accept": "application/json",
            },
            timeout: 30000,
        }, (response) => {
            const chunks = [];

            response.on("data", (chunk) => {
                chunks.push(chunk);
            });

            response.on("end", () => {
                const body = Buffer.concat(chunks).toString("utf8");

                if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
                    return reject(new Error(`football-data ${path} ${response.statusCode || 0}: ${body}`));
                }

                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(new Error(`football-data JSON inválido: ${error.message}`));
                }
            });
        });

        request.on("timeout", () => {
            request.destroy(new Error("football-data timeout"));
        });

        request.on("error", (error) => {
            reject(error);
        });

        request.end();
    });
}

async function seedTeamsForChampionship(championship) {
    const data = await footballDataRequest(`/competitions/${championship.fdoId}/teams?season=${championship.season}`);
    const teams = (data.teams || []).map((team) => ({
        id: String(team.id),
        name: team.name,
        short_name: team.shortName || team.name,
        tla: team.tla || team.name.slice(0, 3).toUpperCase(),
        crest: team.crest || "",
        country: team.area?.name || "",
        championships: admin.firestore.FieldValue.arrayUnion(championship.id),
    }));

    const batch = db.batch();
    teams.forEach((team) => {
        const { id, ...payload } = team;
        batch.set(db.collection("teams").doc(id), payload, { merge: true });
    });
    await batch.commit();

    return teams.length;
}

async function seedMatchesForChampionship(championship) {
    const data = await footballDataRequest(`/competitions/${championship.fdoId}/matches?season=${championship.season}`);
    const matches = (data.matches || []).map((match) => ({
        id: `fdo-${match.id}`,
        championship_id: championship.id,
        home_team_code: match.homeTeam?.tla || match.homeTeam?.shortName?.slice(0, 3).toUpperCase() || "???",
        away_team_code: match.awayTeam?.tla || match.awayTeam?.shortName?.slice(0, 3).toUpperCase() || "???",
        home_team_name: match.homeTeam?.name || "",
        away_team_name: match.awayTeam?.name || "",
        home_team_id: String(match.homeTeam?.id || ""),
        away_team_id: String(match.awayTeam?.id || ""),
        home_crest: match.homeTeam?.crest || "",
        away_crest: match.awayTeam?.crest || "",
        home_score: match.score?.fullTime?.home ?? null,
        away_score: match.score?.fullTime?.away ?? null,
        match_date: match.utcDate,
        status: mapFootballDataStatus(match.status),
        stage: match.stage || "REGULAR_SEASON",
        round: match.matchday || null,
        group_id: match.group || null,
        venue_id: "",
    }));

    const chunks = chunkArray(matches, 450);
    for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach((match) => {
            const { id, ...payload } = match;
            batch.set(db.collection("matches").doc(id), payload, { merge: true });
        });
        await batch.commit();
    }

    return matches.length;
}

async function seedStandingsForChampionship(championship) {
    let data;
    try {
        data = await footballDataRequest(`/competitions/${championship.fdoId}/standings?season=${championship.season}`);
    } catch (error) {
        if (String(error?.message || "").includes(" 404: ")) {
            functions.logger.warn("Standings indisponíveis para campeonato, seguindo sem tabela oficial", {
                championshipId: championship.id,
                season: championship.season,
            });
            return 0;
        }
        throw error;
    }
    const standing = (data.standings || []).find((item) => item.type === "TOTAL" || item.stage === "REGULAR_SEASON") || data.standings?.[0];

    if (!standing?.table?.length) {
        return 0;
    }

    const table = standing.table.map((row) => ({
        position: row.position,
        team_id: String(row.team?.id || ""),
        team_name: row.team?.name || "",
        team_short: row.team?.shortName || row.team?.name || "",
        team_tla: row.team?.tla || row.team?.name?.slice(0, 3).toUpperCase() || "???",
        crest: row.team?.crest || "",
        played: row.playedGames || 0,
        won: row.won || 0,
        drawn: row.draw || 0,
        lost: row.lost || 0,
        goals_for: row.goalsFor || 0,
        goals_against: row.goalsAgainst || 0,
        goal_difference: row.goalDifference || 0,
        points: row.points || 0,
        form: row.form || "",
    }));

    await db.collection("standings").doc(championship.id).set({
        id: championship.id,
        championship_id: championship.id,
        season: String(championship.season),
        updated_at: new Date().toISOString(),
        table,
    }, { merge: true });

    return table.length;
}

async function seedLeagueNewsCollection() {
    const now = new Date().toISOString();
    const newsItems = [
        {
            id: "news-brasileirao-1",
            championship_id: "brasileirao2026",
            title: "Brasileirão 2026: temporada começa com surpresas na rodada inaugural",
            content: "O Campeonato Brasileiro 2026 deu início com partidas emocionantes. Clubes tradicionais buscam o título nesta que promete ser uma das edições mais disputadas da história.",
            category: "Brasileirão",
            source_name: "GloboEsporte",
            published_at: now,
            url_to_image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&q=80&w=1200",
            url: "https://ge.globo.com",
            views: 8500,
        },
        {
            id: "news-brasileirao-2",
            championship_id: "brasileirao2026",
            title: "Flamengo e Palmeiras já miram o topo do Brasileirão",
            content: "Os dois gigantes do futebol brasileiro chegam reforçados para a temporada 2026 e são apontados como favoritos ao título.",
            category: "Brasileirão",
            source_name: "UOL Esporte",
            published_at: now,
            url_to_image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
            url: "https://esporte.uol.com.br",
            views: 6200,
        },
        {
            id: "news-ucl-1",
            championship_id: "ucl2526",
            title: "Champions League: quartas de final prometem duelos históricos",
            content: "Real Madrid, Barcelona, Manchester City e Bayern de Munique lutam pelas vagas na semifinal da Liga dos Campeões 2025-26.",
            category: "Champions",
            source_name: "ESPN",
            published_at: now,
            url_to_image: "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200",
            url: "https://espn.com.br",
            views: 14300,
        },
        {
            id: "news-ucl-2",
            championship_id: "ucl2526",
            title: "Novo formato da Champions League agrada torcedores e clubes",
            content: "O modelo Swiss com 36 equipes trouxe mais jogos e emoção à fase de grupos.",
            category: "Champions",
            source_name: "UEFA",
            published_at: now,
            url_to_image: "https://images.unsplash.com/photo-1555500578-24b1d65fa9a9?auto=format&fit=crop&q=80&w=1200",
            url: "https://uefa.com",
            views: 9800,
        },
        {
            id: "news-laliga-1",
            championship_id: "laliga2526",
            title: "La Liga 2025-26: temporada caminha para desfecho emocionante",
            content: "Com poucos pontos de diferença entre os líderes, o título espanhol pode ser decidido nas últimas rodadas.",
            category: "La Liga",
            source_name: "Marca",
            published_at: now,
            url_to_image: "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200",
            url: "https://marca.com",
            views: 7600,
        },
        {
            id: "news-laliga-2",
            championship_id: "laliga2526",
            title: "Barcelona e Real Madrid: El Clásico define rumo do título",
            content: "O clássico espanhol desta temporada pode ser decisivo para a corrida pelo título da La Liga.",
            category: "La Liga",
            source_name: "AS",
            published_at: now,
            url_to_image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&q=80&w=1200",
            url: "https://as.com",
            views: 11200,
        },
        {
            id: "news-premier-1",
            championship_id: "premier2526",
            title: "Premier League: título em aberto nas últimas rodadas",
            content: "Manchester City, Arsenal e Liverpool ainda disputam o topo da tabela.",
            category: "Premier League",
            source_name: "BBC Sport",
            published_at: now,
            url_to_image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
            url: "https://bbc.co.uk/sport",
            views: 13100,
        },
        {
            id: "news-premier-2",
            championship_id: "premier2526",
            title: "Haaland e Salah disputam artilharia da Premier League",
            content: "A corrida pela artilharia segue intensa nesta reta decisiva da temporada inglesa.",
            category: "Premier League",
            source_name: "Sky Sports",
            published_at: now,
            url_to_image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&q=80&w=1200",
            url: "https://skysports.com",
            views: 9400,
        },
    ];

    const batch = db.batch();
    newsItems.forEach((item) => {
        const { id, ...payload } = item;
        batch.set(db.collection("news").doc(id), payload, { merge: true });
    });
    await batch.commit();

    return newsItems.length;
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


// =============================================
// NEWS SCRAPING - Scheduled Cloud Function
// Fetches Copa 2026 news from reliable RSS feeds
// and stores in Firestore copa_news collection.
// Runs every 30 minutes.
// =============================================

const RSSParser = require("rss-parser");
const crypto = require("crypto");

// Team name/alias -> FIFA code (used as country_filter in Firestore)
const TEAM_KEYWORDS = {
    // South America
    "brazil": "BRA", "brasil": "BRA", "seleção brasileira": "BRA", "verde-amarela": "BRA",
    "argentina": "ARG", "albiceleste": "ARG", "messi": "ARG",
    "uruguay": "URU", "uruguai": "URU", "celeste": "URU",
    "colombia": "COL", "colômbia": "COL",
    "chile": "CHI",
    "ecuador": "ECU", "equador": "ECU",
    "peru": "PER",
    "bolivia": "BOL", "bolívia": "BOL",
    "paraguay": "PAR",
    "venezuela": "VEN",
    // North/Central America
    "mexico": "MEX", "méxico": "MEX", "el tri": "MEX",
    "united states": "USA", "estados unidos": "USA", "usmnt": "USA",
    "canada": "CAN", "canadá": "CAN",
    "costa rica": "CRC",
    "honduras": "HON",
    "panama": "PAN", "panamá": "PAN",
    "jamaica": "JAM",
    "el salvador": "SLV",
    "haiti": "HAI",
    // Europe
    "france": "FRA", "frança": "FRA", "les bleus": "FRA",
    "germany": "GER", "alemanha": "GER", "deutschland": "GER",
    "england": "ENG", "inglaterra": "ENG", "three lions": "ENG",
    "spain": "ESP", "espanha": "ESP", "españa": "ESP", "la roja": "ESP",
    "portugal": "POR",
    "netherlands": "NED", "holanda": "NED", "holland": "NED", "oranje": "NED",
    "italy": "ITA", "itália": "ITA", "azzurri": "ITA",
    "croatia": "CRO", "croácia": "CRO",
    "belgium": "BEL", "bélgica": "BEL",
    "switzerland": "SUI", "suíça": "SUI",
    "austria": "AUT",
    "poland": "POL", "polônia": "POL",
    "ukraine": "UKR", "ucrânia": "UKR",
    "turkey": "TUR", "turquia": "TUR",
    "denmark": "DEN", "dinamarca": "DEN",
    "serbia": "SRB", "sérvia": "SRB",
    "scotland": "SCO", "escócia": "SCO",
    "wales": "WAL",
    "greece": "GRE", "grécia": "GRE",
    "romania": "ROU",
    "sweden": "SWE", "suécia": "SWE",
    "norway": "NOR", "noruega": "NOR",
    "slovakia": "SVK", "eslováquia": "SVK",
    "czechia": "CZE", "czech republic": "CZE", "república tcheca": "CZE",
    // Africa
    "morocco": "MAR", "marrocos": "MAR",
    "nigeria": "NGA",
    "senegal": "SEN",
    "cameroon": "CMR", "camarões": "CMR",
    "ghana": "GHA",
    "ivory coast": "CIV", "côte d'ivoire": "CIV", "costa do marfim": "CIV",
    "egypt": "EGY", "egito": "EGY",
    "algeria": "ALG", "argélia": "ALG",
    "south africa": "RSA", "áfrica do sul": "RSA",
    "mali": "MLI",
    "angola": "ANG",
    "tunisia": "TUN", "tunísia": "TUN",
    "zambia": "ZAM", "zâmbia": "ZAM",
    "tanzania": "TAN",
    "cape verde": "CPV", "cabo verde": "CPV",
    // Asia/Oceania
    "japan": "JPN", "japão": "JPN",
    "south korea": "KOR", "coreia do sul": "KOR",
    "australia": "AUS",
    "saudi arabia": "KSA", "arábia saudita": "KSA", "arabia saudita": "KSA",
    "iran": "IRN",
    "china": "CHN",
    "qatar": "QAT",
    "indonesia": "IDN",
    "new zealand": "NZL", "nova zelândia": "NZL",
    "uzbekistan": "UZB",
    "iraq": "IRQ",
    "oman": "OMA",
    "bahrain": "BHR",
    "jordan": "JOR",
};

// Keywords to determine if an article is Copa/World Cup relevant
const COPA_KEYWORDS = [
    "copa do mundo", "world cup", "copa mundial", "copa 2026",
    "world cup 2026", "fifa 2026", "mundial 2026", "mundial de futebol",
    "copa do mundo 2026", "fase de grupos", "group stage", "oitavas",
    "round of 16", "quarterfinal", "semifinal", "final do mundial",
    "eliminatórias", "qualifiers", "seleção nacional",
    "futebol", "football", "soccer", "futebol internacional",
    "gol", "goal", "partida internacional", "amistoso", "friendly",
    "convocação", "squad", "escalação", "lineup",
];

// RSS feeds from reliable, well-known sources
const RSS_FEEDS = [
    {
        url: "https://news.google.com/rss/search?q=Copa+do+Mundo+2026+futebol&hl=pt-BR&gl=BR&ceid=BR:pt-419",
        name: "Google News BR",
        alwaysRelevant: true,
    },
    {
        url: "https://news.google.com/rss/search?q=FIFA+World+Cup+2026&hl=en&gl=US&ceid=US:en",
        name: "Google News EN",
        alwaysRelevant: true,
    },
    {
        url: "https://news.google.com/rss/search?q=sele%C3%A7%C3%A3o+brasileira+Copa+2026&hl=pt-BR&gl=BR&ceid=BR:pt-419",
        name: "Google News Seleção",
        alwaysRelevant: true,
    },
    {
        url: "https://esporte.uol.com.br/ultimas-noticias/index.xml",
        name: "UOL Esporte",
        alwaysRelevant: false,
    },
    {
        url: "https://feeds.bbci.co.uk/sport/football/rss.xml",
        name: "BBC Sport Football",
        alwaysRelevant: false,
    },
];

function hashUrl(url) {
    return crypto.createHash("md5").update(url).digest("hex");
}

function detectTeam(text) {
    if (!text) return null;
    const lower = text.toLowerCase();
    for (const [keyword, code] of Object.entries(TEAM_KEYWORDS)) {
        if (lower.includes(keyword)) return code;
    }
    return null;
}

function isCopaRelevant(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    return COPA_KEYWORDS.some((kw) => text.includes(kw));
}

exports.createPremiumCheckoutSession = functions.region("us-central1").https.onRequest(async (req, res) => {
    applyCors(res);

    if (req.method === "OPTIONS") {
        return res.status(204).send("");
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não suportado." });
    }

    try {
        const decodedToken = await verifyHttpUser(req);
        const { stripePremiumPriceId, siteUrl: configuredSiteUrl } = getRuntimeConfig();
        if (!stripePremiumPriceId) {
            throw new Error("STRIPE_PREMIUM_PRICE_ID não configurado nas Cloud Functions.");
        }

        const requestSiteUrl =
            typeof req.body?.siteUrl === "string" && /^https?:\/\//.test(req.body.siteUrl)
                ? req.body.siteUrl
                : configuredSiteUrl;
        const normalizedSiteUrl = requestSiteUrl.replace(/\/$/, "");

        const params = {
            mode: "payment",
            success_url: `${normalizedSiteUrl}/premium?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${normalizedSiteUrl}/premium?checkout=cancelled`,
            client_reference_id: decodedToken.uid,
            "line_items[0][price]": stripePremiumPriceId,
            "line_items[0][quantity]": "1",
            "metadata[user_id]": decodedToken.uid,
            "metadata[source]": "arenacopa",
            allow_promotion_codes: "true",
            billing_address_collection: "auto",
        };

        if (decodedToken.email) {
            params.customer_email = decodedToken.email;
        }

        const session = await stripeApiRequest({
            method: "POST",
            path: "/checkout/sessions",
            params,
        });

        await db.collection("premium_subscriptions").add({
            user_id: decodedToken.uid,
            status: "pending",
            stripe_checkout_session_id: session.id,
            stripe_customer_id: session.customer || null,
            amount_total: session.amount_total ?? null,
            currency: session.currency ?? null,
            payment_status: session.payment_status || null,
            customer_email: session.customer_details?.email || decodedToken.email || null,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.status(200).json({
            url: session.url,
            sessionId: session.id,
        });
    } catch (error) {
        functions.logger.error("createPremiumCheckoutSession failed", {
            error: error?.message || error,
        });
        return res.status(400).json({
            error: error?.message || "Não foi possível iniciar o checkout premium.",
        });
    }
});

exports.syncPremiumCheckoutSession = functions.region("us-central1").https.onRequest(async (req, res) => {
    applyCors(res);

    if (req.method === "OPTIONS") {
        return res.status(204).send("");
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não suportado." });
    }

    try {
        const decodedToken = await verifyHttpUser(req);
        const checkoutSessionId = typeof req.body?.checkoutSessionId === "string" ? req.body.checkoutSessionId.trim() : "";
        if (!checkoutSessionId) {
            throw new Error("Sessão de checkout inválida.");
        }

        const session = await stripeApiRequest({
            method: "GET",
            path: `/checkout/sessions/${checkoutSessionId}`,
        });

        const sessionUserId =
            session.client_reference_id ||
            session.metadata?.user_id ||
            null;

        if (sessionUserId && sessionUserId !== decodedToken.uid) {
            return res.status(403).json({ error: "Sessão de checkout não pertence ao usuário autenticado." });
        }

        await upsertPremiumSubscriptionFromSession({
            session,
            userId: decodedToken.uid,
        });

        const status = mapStripeSessionStatus(session);

        return res.status(200).json({
            isPremium: status === "active",
            status,
            checkoutSessionId: session.id,
            amountTotal: session.amount_total ?? null,
            currency: session.currency ?? null,
        });
    } catch (error) {
        functions.logger.error("syncPremiumCheckoutSession failed", {
            error: error?.message || error,
        });
        return res.status(400).json({
            error: error?.message || "Não foi possível sincronizar o checkout premium.",
        });
    }
});

exports.seedLeagueData = functions.region("us-central1").https.onRequest(async (req, res) => {
    applyCors(res);

    if (req.method === "OPTIONS") {
        return res.status(204).send("");
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não suportado." });
    }

    try {
        const { seedToken } = getRuntimeConfig();
        const requestSeedToken = req.headers["x-seed-token"] || req.body?.seedToken;
        const requestedChampionshipId = typeof req.body?.championshipId === "string"
            ? req.body.championshipId
            : null;

        if (!seedToken || requestSeedToken !== seedToken) {
            return res.status(403).json({ error: "Token inválido para seed." });
        }

        const championshipsToSeed = requestedChampionshipId
            ? LEAGUE_CHAMPIONSHIPS.filter((championship) => championship.id === requestedChampionshipId)
            : LEAGUE_CHAMPIONSHIPS;

        if (!championshipsToSeed.length) {
            return res.status(400).json({ error: "Campeonato inválido para seed." });
        }

        const summary = [];
        for (const championship of championshipsToSeed) {
            const teamsCount = await seedTeamsForChampionship(championship);
            const matchesCount = await seedMatchesForChampionship(championship);
            const standingsCount = await seedStandingsForChampionship(championship);

            summary.push({
                id: championship.id,
                teams: teamsCount,
                matches: matchesCount,
                standings: standingsCount,
            });
        }

        const newsCount = await seedLeagueNewsCollection();

        return res.status(200).json({
            ok: true,
            championships: summary,
            news: newsCount,
        });
    } catch (error) {
        functions.logger.error("seedLeagueData failed", {
            error: error?.message || error,
            cause: error?.cause?.message || null,
        });
        return res.status(400).json({
            error: error?.message || "Não foi possível popular os campeonatos.",
        });
    }
});

function categorizeNews(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    if (
        text.includes("ingresso") || text.includes("ticket") ||
        text.includes("bilhete") || text.includes("ingressos")
    ) return "tickets";
    if (
        text.includes("viagem") || text.includes("travel") ||
        text.includes("hotel") || text.includes("turismo") || text.includes("tourist")
    ) return "travel";
    if (
        text.includes("partida") || text.includes("jogo") ||
        text.includes("match") || text.includes("placar") ||
        text.includes("score") || text.includes("gol") ||
        text.includes("goal") || text.includes("result")
    ) return "matches";
    if (
        text.includes("seleção") || text.includes("team") ||
        text.includes("jogador") || text.includes("player") ||
        text.includes("convocação") || text.includes("squad") ||
        text.includes("treinador") || text.includes("coach")
    ) return "teams";
    return "general";
}

function extractImageUrl(item) {
    if (item["media:content"] && item["media:content"]["$"]) {
        return item["media:content"]["$"].url || null;
    }
    if (item["media:thumbnail"] && item["media:thumbnail"]["$"]) {
        return item["media:thumbnail"]["$"].url || null;
    }
    if (item.enclosure && item.enclosure.url) {
        return item.enclosure.url || null;
    }
    // Try to extract first image from content HTML
    const content = item.content || item["content:encoded"] || "";
    const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) return imgMatch[1];
    return null;
}

exports.fetchNewsScheduled = functions.pubsub
    .schedule("every 30 minutes")
    .timeZone("America/Sao_Paulo")
    .onRun(async (context) => {
        const parser = new RSSParser({
            customFields: {
                item: [
                    ["media:content", "media:content"],
                    ["media:thumbnail", "media:thumbnail"],
                    ["enclosure", "enclosure"],
                    ["content:encoded", "content:encoded"],
                ],
            },
            timeout: 12000,
            headers: {
                "User-Agent": "ArenaCUP/1.0 (Copa 2026 News Aggregator)",
            },
        });

        const newsRef = db.collection("copa_news");
        let totalAdded = 0;

        for (const feed of RSS_FEEDS) {
            try {
                functions.logger.info(`[fetchNews] Fetching: ${feed.name}`);
                const feedData = await parser.parseURL(feed.url);
                const items = (feedData.items || []).slice(0, 20);

                for (const item of items) {
                    try {
                        const title = (item.title || "").trim();
                        const description = (
                            item.contentSnippet ||
                            item.summary ||
                            item.content ||
                            ""
                        ).replace(/<[^>]+>/g, "").trim().substring(0, 600);

                        const url = item.link || item.guid || "";
                        if (!url || !title) continue;

                        // Skip irrelevant articles from non-targeted feeds
                        if (!feed.alwaysRelevant && !isCopaRelevant(title, description)) {
                            continue;
                        }

                        const urlHash = hashUrl(url);

                        // Deduplication: skip if already stored
                        const existing = await newsRef
                            .where("url_hash", "==", urlHash)
                            .limit(1)
                            .get();
                        if (!existing.empty) continue;

                        // Detect team mention for country_filter
                        const countryFilter = detectTeam(`${title} ${description}`);

                        // Image URL extraction
                        const imageUrl = extractImageUrl(item);

                        // Parse publish date
                        let publishedAt = admin.firestore.Timestamp.now();
                        const rawDate = item.pubDate || item.isoDate;
                        if (rawDate) {
                            const parsed = new Date(rawDate);
                            if (!isNaN(parsed.getTime())) {
                                publishedAt = admin.firestore.Timestamp.fromDate(parsed);
                            }
                        }

                        await newsRef.add({
                            title,
                            description,
                            url,
                            url_to_image: imageUrl || null,
                            source_name: feed.name,
                            category: categorizeNews(title, description),
                            country_filter: countryFilter || null,
                            published_at: publishedAt,
                            url_hash: urlHash,
                            created_at: admin.firestore.FieldValue.serverTimestamp(),
                        });

                        totalAdded++;
                        functions.logger.info(`[fetchNews] Added: "${title.substring(0, 60)}"`);
                    } catch (itemErr) {
                        functions.logger.warn(`[fetchNews] Item error in ${feed.name}`, {
                            error: itemErr?.message,
                        });
                    }
                }
            } catch (feedErr) {
                functions.logger.error(`[fetchNews] Feed error: ${feed.name}`, {
                    error: feedErr?.message,
                });
            }
        }

        // Cleanup: delete news older than 7 days (batched, max 100 per run)
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7);
            const cutoffTs = admin.firestore.Timestamp.fromDate(cutoffDate);

            const oldDocs = await newsRef
                .where("created_at", "<", cutoffTs)
                .limit(100)
                .get();

            if (!oldDocs.empty) {
                const batch = db.batch();
                oldDocs.docs.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
                functions.logger.info(`[fetchNews] Deleted ${oldDocs.size} old news items`);
            }
        } catch (cleanErr) {
            functions.logger.warn("[fetchNews] Cleanup error", { error: cleanErr?.message });
        }

        functions.logger.info(`[fetchNews] Completed. Total added: ${totalAdded}`);
        return null;
    });
