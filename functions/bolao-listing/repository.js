const admin = require("firebase-admin");
const { FieldPath } = require("firebase-admin/firestore");
const { buildUserBolaoListing } = require("./mapper");

function chunkValues(values, size = 30) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function loadBoloesById({ db, bolaoIds }) {
  const uniqueIds = Array.from(new Set((bolaoIds || []).filter(Boolean)));
  if (!uniqueIds.length) {
    return {};
  }

  const snapshots = await Promise.all(
    chunkValues(uniqueIds).map((ids) =>
      db
        .collection("boloes")
        .where(FieldPath.documentId(), "in", ids)
        .get(),
    ),
  );

  const result = {};
  snapshots.flatMap((snapshot) => snapshot.docs).forEach((doc) => {
    const data = doc.data();
    // Early filter for deleted bolões to avoid processing them
    if (data.status !== "deleted" && data.lifecycle?.status !== "deleted") {
      result[doc.id] = { id: doc.id, ...data };
    }
  });
  return result;
}

// Um jogo só é considerado "passado" 3h após o kickoff/fechamento — tempo de
// uma partida acabar. Evita marcar como encerrado um bolão cujo último jogo
// ainda está em andamento.
const MATCH_OVER_BUFFER_MS = 3 * 60 * 60 * 1000;

function computeMarketMeta(markets = [], nowMs = Date.now()) {
  const matchMarkets = markets.filter((market) => String(market.scope || "") === "match");
  if (!matchMarkets.length) {
    return {
      is_past: false,
      latest_match_closes_at: null,
    };
  }

  let latestMs = null;
  const isPast = matchMarkets.every((market) => {
    const closesMs = Date.parse(String(market.closes_at || ""));
    if (Number.isFinite(closesMs)) {
      latestMs = latestMs == null ? closesMs : Math.max(latestMs, closesMs);
    }

    const status = String(market.status || "open");
    const terminalMs = Number.isFinite(closesMs) ? closesMs + MATCH_OVER_BUFFER_MS : NaN;
    return ["closed", "resolved"].includes(status) || (Number.isFinite(terminalMs) && terminalMs <= nowMs);
  });

  return {
    is_past: isPast,
    latest_match_closes_at: latestMs == null ? null : new Date(latestMs).toISOString(),
  };
}

// Fonte única de timing dos jogos (coleção `matches`), usada como fallback para
// bolões SEM bolao_markets (legacy/sistema antigo de palpites). Um bolão é
// passado quando TODAS as suas partidas terminaram (status FINISHED ou
// kickoff + 3h <= agora).
function computeMatchMeta(matches = [], nowMs = Date.now()) {
  if (!matches.length) {
    return { is_past: false, latest_match_closes_at: null };
  }

  let latestMs = null;
  const isPast = matches.every((match) => {
    const kickoffMs = Date.parse(String(match.match_date || ""));
    if (Number.isFinite(kickoffMs)) {
      latestMs = latestMs == null ? kickoffMs : Math.max(latestMs, kickoffMs);
    }

    const status = String(match.status || "").toUpperCase();
    const terminalMs = Number.isFinite(kickoffMs) ? kickoffMs + MATCH_OVER_BUFFER_MS : NaN;
    return status === "FINISHED" || (Number.isFinite(terminalMs) && terminalMs <= nowMs);
  });

  return {
    is_past: isPast,
    latest_match_closes_at: latestMs == null ? null : new Date(latestMs).toISOString(),
  };
}

async function loadMarketMetaByBolaoId({ db, bolaoIds, nowIso }) {
  const uniqueIds = Array.from(new Set((bolaoIds || []).filter(Boolean)));
  if (!uniqueIds.length) {
    return {};
  }

  const nowMs = Date.parse(nowIso || "");
  const effectiveNowMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  const marketsByBolaoId = {};

  const snapshots = await Promise.all(
    chunkValues(uniqueIds).map((ids) =>
      db
        .collection("bolao_markets")
        .where("bolao_id", "in", ids)
        .where("scope", "==", "match")
        .select("bolao_id", "scope", "closes_at", "status")
        .get(),
    ),
  );

  snapshots.flatMap((snapshot) => snapshot.docs).forEach((doc) => {
    const market = { id: doc.id, ...doc.data() };
    const bolaoId = String(market.bolao_id || "");
    if (!bolaoId) return;
    const existing = marketsByBolaoId[bolaoId] || [];
    existing.push(market);
    marketsByBolaoId[bolaoId] = existing;
  });

  return uniqueIds.reduce((result, bolaoId) => {
    result[bolaoId] = computeMarketMeta(marketsByBolaoId[bolaoId] || [], effectiveNowMs);
    return result;
  }, {});
}

// Fallback para bolões sem bolao_markets: resolve as partidas do bolão a partir
// do doc (championship_id + allowed_match_ids) na coleção `matches` e calcula
// is_past. Cobre bolões legacy que nunca migrariam para "passado" de outra forma.
async function loadMatchMetaByBolaoId({ db, boloesById, bolaoIds, nowMs = Date.now() }) {
  const targets = (bolaoIds || [])
    .map((id) => ({ id, bolao: boloesById[id] }))
    .filter((entry) => entry.bolao);
  if (!targets.length) {
    return {};
  }

  const explicitMatchIds = new Set();
  const championshipIds = new Set();
  for (const { bolao } of targets) {
    const allowed = bolao.allowed_match_ids;
    if (Array.isArray(allowed)) {
      allowed.forEach((mid) => mid && explicitMatchIds.add(String(mid)));
    } else if (bolao.championship_id) {
      championshipIds.add(String(bolao.championship_id));
    }
  }

  const matchesById = {};
  const matchesByChampionship = {};

  await Promise.all([
    ...chunkValues(Array.from(explicitMatchIds)).map((ids) =>
      db
        .collection("matches")
        .where(FieldPath.documentId(), "in", ids)
        .select("championship_id", "match_date", "status")
        .get()
        .then((snap) => snap.docs.forEach((doc) => { matchesById[doc.id] = { id: doc.id, ...doc.data() }; }))
        .catch((err) => { console.warn("[ListingRepo] matches by id failed:", err.message); }),
    ),
    ...chunkValues(Array.from(championshipIds)).map((ids) =>
      db
        .collection("matches")
        .where("championship_id", "in", ids)
        .select("championship_id", "match_date", "status")
        .get()
        .then((snap) => snap.docs.forEach((doc) => {
          const champ = String(doc.data().championship_id || "");
          (matchesByChampionship[champ] = matchesByChampionship[champ] || []).push({ id: doc.id, ...doc.data() });
        }))
        .catch((err) => { console.warn("[ListingRepo] matches by championship failed:", err.message); }),
    ),
  ]);

  const result = {};
  for (const { id, bolao } of targets) {
    const allowed = bolao.allowed_match_ids;
    const matches = Array.isArray(allowed)
      ? allowed.map((mid) => matchesById[String(mid)]).filter(Boolean)
      : (matchesByChampionship[String(bolao.championship_id || "")] || []);
    result[id] = computeMatchMeta(matches, nowMs);
  }
  return result;
}

async function listUserBoloes({ db, actorId }) {
  const start = Date.now();
  const [membershipsSnapshot, requestsSnapshot, publicSnapshot] = await Promise.all([
    db.collection("bolao_members")
      .where("user_id", "==", actorId)
      .select("bolao_id", "user_id", "membership_status")
      .get()
      .catch(err => { console.error("[ListingRepo] memberships fetch failed:", err); return { docs: [] }; }),
    db.collection("bolao_join_requests")
      .where("user_id", "==", actorId)
      .select("bolao_id", "user_id", "request_status", "updated_at")
      .get()
      .catch(err => { console.error("[ListingRepo] requests fetch failed:", err); return { docs: [] }; }),
    db.collection("boloes")
      .where("category", "==", "public")
      .orderBy("created_at", "desc")
      .limit(10)
      .select("name", "description", "invite_code", "avatar_url", "category", "is_paid", "creator_id", "status", "member_count", "lifecycle", "presentation", "finance_rules", "created_at")
      .get()
      .catch((err) => {
        console.warn("[ListingRepo] public boloes fetch failed:", err.message);
        return { docs: [] };
      }),
  ]);

  const mid1 = Date.now();
  const memberships = membershipsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const requests = requestsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const publicBoloes = publicSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const bolaoIds = [
    ...memberships.map((m) => String(m.bolao_id || "")),
    ...requests.map((r) => String(r.bolao_id || "")),
  ].filter(Boolean);

  // Cap at 20 bolão IDs for market meta to prevent timeout (reduced from 30)
  const bolaoIdsForMeta = Array.from(new Set(bolaoIds)).slice(0, 20);

  console.log(`[ListingRepo] actor=${actorId} init_fetch=${mid1 - start}ms memberships=${memberships.length} bolaoIds=${bolaoIds.length}`);

  const [boloesById, marketMetaByBolaoId] = await Promise.all([
    loadBoloesById({ db, bolaoIds }),
    Promise.race([
      loadMarketMetaByBolaoId({ db, bolaoIds: bolaoIdsForMeta, nowIso: new Date().toISOString() }),
      new Promise((resolve) => setTimeout(() => resolve({}), 8000)),
    ]).catch((error) => {
      console.warn("[ListingRepo] Market meta skipped:", error.message);
      return {};
    }),
  ]);

  // Fallback legacy: para bolões SEM nenhum bolao_market de partida
  // (latest_match_closes_at == null), o is_past via markets nunca dispara.
  // Recalcula a partir da coleção `matches` para que esses bolões também
  // migrem corretamente para "passado". Caminho moderno (com markets) intacto.
  const marketlessIds = bolaoIdsForMeta.filter((id) => {
    const meta = marketMetaByBolaoId[id];
    return meta && meta.is_past === false && meta.latest_match_closes_at == null;
  });
  if (marketlessIds.length) {
    const matchMetaByBolaoId = await Promise.race([
      loadMatchMetaByBolaoId({ db, boloesById, bolaoIds: marketlessIds, nowMs: Date.now() }),
      new Promise((resolve) => setTimeout(() => resolve({}), 6000)),
    ]).catch((error) => {
      console.warn("[ListingRepo] Match meta fallback skipped:", error.message);
      return {};
    });
    for (const id of marketlessIds) {
      if (matchMetaByBolaoId[id]) {
        marketMetaByBolaoId[id] = matchMetaByBolaoId[id];
      }
    }
  }

  const mid2 = Date.now();
  console.log(`[ListingRepo] actor=${actorId} second_fetch=${mid2 - mid1}ms boloesLoaded=${Object.keys(boloesById).length} marketless=${marketlessIds.length}`);

  const result = buildUserBolaoListing({
    memberships,
    requests,
    boloesById,
    publicBoloes,
    actorId,
    marketMetaByBolaoId,
  });

  const end = Date.now();
  console.log(`[ListingRepo] actor=${actorId} mapping=${end - mid2}ms total=${end - start}ms`);
  return result;
}

module.exports = {
  computeMarketMeta,
  computeMatchMeta,
  listUserBoloes,
  loadBoloesById,
  loadMarketMetaByBolaoId,
  loadMatchMetaByBolaoId,
};
