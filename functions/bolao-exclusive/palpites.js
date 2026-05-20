const { FieldValue } = require("firebase-admin/firestore");

function buildBolaoPalpiteId({ userId, bolaoId, matchId }) {
  return `${userId}_${bolaoId}_${matchId}`;
}

function buildLegacyBolaoPalpiteId({ userId, bolaoId, matchId }) {
  return `${userId}_${matchId}_${bolaoId}`;
}

function buildExclusiveScoreLockId({ bolaoId, matchId, homeScore, awayScore }) {
  return `${bolaoId}_${matchId}_${homeScore}_${awayScore}`;
}

function normalizeScore(value) {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 20) {
    throw new Error("validation_failed");
  }
  return normalized;
}

function normalizeExclusiveScoreInput(input = {}) {
  const bolaoId = typeof input.bolao_id === "string" ? input.bolao_id.trim() : "";
  const matchId = typeof input.match_id === "string" ? input.match_id.trim() : "";

  if (!bolaoId || !matchId || input.home_score === undefined || input.away_score === undefined) {
    throw new Error("validation_failed");
  }

  return {
    bolaoId,
    matchId,
    homeScore: normalizeScore(input.home_score),
    awayScore: normalizeScore(input.away_score),
    isPowerPlay: Boolean(input.is_power_play),
    existingId: typeof input.existing_id === "string" && input.existing_id.trim() ? input.existing_id.trim() : null,
  };
}

function getCandidateData(candidate) {
  if (!candidate?.exists) return null;
  return typeof candidate.data === "function" ? candidate.data() : candidate.data;
}

function resolveExistingPalpiteCandidate({ actorId, bolaoId, matchId, candidates }) {
  const existing = candidates.find((candidate) => {
    const data = getCandidateData(candidate);
    return data?.user_id === actorId && data?.bolao_id === bolaoId && data?.match_id === matchId;
  });

  if (!existing) return null;

  const data = getCandidateData(existing);
  return {
    id: existing.id,
    ref: existing.ref || null,
    data,
    previousScore:
      Number.isInteger(Number(data?.home_score)) && Number.isInteger(Number(data?.away_score))
        ? {
            homeScore: Number(data.home_score),
            awayScore: Number(data.away_score),
          }
        : null,
  };
}

function assertExclusiveScoreAvailable({ lockData, actorId }) {
  if (lockData?.user_id && lockData.user_id !== actorId) {
    throw new Error("exclusive_score_taken");
  }
}

function normalizePredictionCutoffMinutes(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(15, Math.floor(numeric)));
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value.toDate === "function") {
    const date = value.toDate();
    return Number.isFinite(date.getTime()) ? date : null;
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function assertMatchPredictionOpen({ bolaoData, matchData, nowIso }) {
  if (!matchData) {
    throw new Error("not_found");
  }
  if (matchData.status === "finished") {
    throw new Error("match_finished");
  }

  const kickoff = toDate(matchData.match_date);
  if (!kickoff) return;

  const cutoffMinutes = normalizePredictionCutoffMinutes(
    bolaoData?.competition_rules?.prediction_cutoff_minutes ?? bolaoData?.prediction_cutoff_minutes
  );
  const closesAt = new Date(kickoff.getTime() + cutoffMinutes * 60 * 1000);
  const now = toDate(nowIso) || new Date();
  if (now.getTime() > closesAt.getTime()) {
    throw new Error("prediction_closed");
  }
}

async function saveExclusiveBolaoPalpite({ db, admin, actorId, input, nowIso }) {
  if (!actorId) {
    throw new Error("auth_required");
  }

  const normalized = normalizeExclusiveScoreInput(input);
  const canonicalId = buildBolaoPalpiteId({
    userId: actorId,
    bolaoId: normalized.bolaoId,
    matchId: normalized.matchId,
  });
  const legacyId = buildLegacyBolaoPalpiteId({
    userId: actorId,
    bolaoId: normalized.bolaoId,
    matchId: normalized.matchId,
  });
  const candidateIds = Array.from(new Set([normalized.existingId, canonicalId, legacyId].filter(Boolean)));

  return db.runTransaction(async (transaction) => {
    const bolaoRef = db.collection("boloes").doc(normalized.bolaoId);
    const bolaoSnapshot = await transaction.get(bolaoRef);
    if (!bolaoSnapshot.exists) {
      throw new Error("not_found");
    }
    if (bolaoSnapshot.data()?.scoring_mode !== "exclusive") {
      throw new Error("validation_failed");
    }
    const matchSnapshot = await transaction.get(db.collection("matches").doc(normalized.matchId));
    assertMatchPredictionOpen({
      bolaoData: bolaoSnapshot.data(),
      matchData: matchSnapshot.exists ? matchSnapshot.data() : null,
      nowIso,
    });

    const palpiteRefs = candidateIds.map((id) => db.collection("bolao_palpites").doc(id));
    const palpiteSnapshots = await Promise.all(palpiteRefs.map((ref) => transaction.get(ref)));
    const candidates = palpiteSnapshots.map((snapshot) => ({
      id: snapshot.id,
      ref: snapshot.ref,
      exists: snapshot.exists,
      data: snapshot.exists ? snapshot.data() : null,
    }));
    const explicitExisting = normalized.existingId
      ? candidates.find((candidate) => candidate.id === normalized.existingId && candidate.exists)
      : null;
    const explicitData = getCandidateData(explicitExisting);

    if (explicitData && explicitData.user_id !== actorId) {
      throw new Error("permission_denied");
    }

    const existing = resolveExistingPalpiteCandidate({
      actorId,
      bolaoId: normalized.bolaoId,
      matchId: normalized.matchId,
      candidates,
    });
    const palpiteRef = existing?.ref || db.collection("bolao_palpites").doc(canonicalId);
    const palpiteId = existing?.id || canonicalId;
    const newLockId = buildExclusiveScoreLockId(normalized);
    const newLockRef = db.collection("bolao_exclusive_score_locks").doc(newLockId);
    const newLockSnapshot = await transaction.get(newLockRef);

    assertExclusiveScoreAvailable({
      lockData: newLockSnapshot.exists ? newLockSnapshot.data() : null,
      actorId,
    });

    if (
      existing?.previousScore &&
      (existing.previousScore.homeScore !== normalized.homeScore ||
        existing.previousScore.awayScore !== normalized.awayScore)
    ) {
      const oldLockRef = db.collection("bolao_exclusive_score_locks").doc(
        buildExclusiveScoreLockId({
          bolaoId: normalized.bolaoId,
          matchId: normalized.matchId,
          homeScore: existing.previousScore.homeScore,
          awayScore: existing.previousScore.awayScore,
        })
      );
      const oldLockSnapshot = await transaction.get(oldLockRef);
      if (oldLockSnapshot.exists && oldLockSnapshot.data()?.user_id === actorId) {
        transaction.delete(oldLockRef);
      }
    }

    const palpitePayload = {
      bolao_id: normalized.bolaoId,
      user_id: actorId,
      match_id: normalized.matchId,
      home_score: normalized.homeScore,
      away_score: normalized.awayScore,
      is_power_play: normalized.isPowerPlay,
      updated_at: FieldValue.serverTimestamp(),
    };

    transaction.set(
      palpiteRef,
      existing
        ? palpitePayload
        : {
            id: palpiteId,
            ...palpitePayload,
            points: null,
            created_at: nowIso,
          },
      { merge: true }
    );
    transaction.set(
      newLockRef,
      {
        bolao_id: normalized.bolaoId,
        match_id: normalized.matchId,
        home_score: normalized.homeScore,
        away_score: normalized.awayScore,
        user_id: actorId,
        palpite_id: palpiteId,
        updated_at: FieldValue.serverTimestamp(),
        created_at: nowIso,
      },
      { merge: true }
    );

    return {
      id: palpiteId,
      ...palpitePayload,
      is_power_play: normalized.isPowerPlay,
      points: existing?.data?.points ?? null,
      created_at: existing?.data?.created_at ?? nowIso,
      updated_at: nowIso,
    };
  });
}

module.exports = {
  buildBolaoPalpiteId,
  buildLegacyBolaoPalpiteId,
  buildExclusiveScoreLockId,
  normalizeExclusiveScoreInput,
  resolveExistingPalpiteCandidate,
  assertExclusiveScoreAvailable,
  assertMatchPredictionOpen,
  normalizePredictionCutoffMinutes,
  saveExclusiveBolaoPalpite,
};
