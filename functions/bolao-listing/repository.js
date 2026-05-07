const admin = require("firebase-admin");
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
        .where(admin.firestore.FieldPath.documentId(), "in", ids)
        .get(),
    ),
  );

  const result = {};
  snapshots.flatMap((snapshot) => snapshot.docs).forEach((doc) => {
    result[doc.id] = { id: doc.id, ...doc.data() };
  });
  return result;
}

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
    return ["closed", "resolved"].includes(status) || (Number.isFinite(closesMs) && closesMs <= nowMs);
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

async function listUserBoloes({ db, actorId }) {
  const [membershipsSnapshot, requestsSnapshot] = await Promise.all([
    db.collection("bolao_members").where("user_id", "==", actorId).get(),
    db.collection("bolao_join_requests").where("user_id", "==", actorId).get(),
  ]);

  const memberships = membershipsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const requests = requestsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const bolaoIds = [
    ...memberships.map((membership) => String(membership.bolao_id || "")),
    ...requests.map((request) => String(request.bolao_id || "")),
  ];
  let publicBoloes = [];
  try {
    const publicSnapshot = await db
      .collection("boloes")
      .where("category", "==", "public")
      .orderBy("created_at", "desc")
      .limit(30)
      .get();
    publicBoloes = publicSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn("Could not load public bolao discovery list", error);
    publicBoloes = [];
  }

  const allBolaoIdsForMeta = [
    ...bolaoIds,
    ...publicBoloes.map((bolao) => String(bolao.id || "")),
  ];
  const [boloesById, marketMetaByBolaoId] = await Promise.all([
    loadBoloesById({ db, bolaoIds }),
    loadMarketMetaByBolaoId({
      db,
      bolaoIds: allBolaoIdsForMeta,
      nowIso: new Date().toISOString(),
    }).catch((error) => {
      console.warn("Could not load bolao market metadata", error);
      return {};
    }),
  ]);

  return buildUserBolaoListing({
    memberships,
    requests,
    boloesById,
    publicBoloes,
    actorId,
    marketMetaByBolaoId,
  });
}

module.exports = {
  computeMarketMeta,
  listUserBoloes,
  loadBoloesById,
  loadMarketMetaByBolaoId,
};
