const admin = require("firebase-admin");
const { buildBolaoMarkets } = require("./market-sync");
const {
  buildConfigurationUpdate,
  buildDeleteBolaoUpdate,
  buildDuplicateDraftDocument,
  buildLifecycleUpdate,
  buildPaymentProofUpdate,
  buildPresentationUpdate,
  buildPublishUpdate,
  buildRemoveMemberDecision,
  normalizeBolaoDocument,
} = require("./handlers");

async function loadMatchesForBolaoMarketSync({ db, championshipId }) {
  let queryRef = db.collection("matches");
  if (championshipId) {
    queryRef = queryRef.where("championship_id", "==", championshipId);
  }

  const snapshot = await queryRef.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    match_date: doc.data().match_date || null,
    stage: doc.data().stage || null,
    group_id: doc.data().group_id || null,
    home_team_code: doc.data().home_team_code || null,
    away_team_code: doc.data().away_team_code || null,
  }));
}

async function syncBolaoMarkets({ db, bolaoId, competitionRules, championshipId = null, allowedMatchIds = "all" }) {
  const selectedMarketIds = competitionRules?.markets || [];
  if (selectedMarketIds.length === 0) {
    // No markets to sync — clear existing if any
    const existingSnapshot = await db
      .collection("bolao_markets")
      .where("bolao_id", "==", bolaoId)
      .limit(1)
      .get();
    if (existingSnapshot.empty) return [];
    // Fall through to full sync to clear
  }

  // Load existing markets for diff
  const [existingSnapshot, matches] = await Promise.all([
    db.collection("bolao_markets").where("bolao_id", "==", bolaoId).get(),
    loadMatchesForBolaoMarketSync({ db, championshipId }),
  ]);

  const newMarkets = buildBolaoMarkets({
    bolaoId,
    selectedMarketIds,
    matches,
    allowedMatchIds,
    predictionCutoffMinutes: competitionRules?.prediction_cutoff_minutes,
  });
  const newMarketIds = new Set(newMarkets.map((m) => m.id));

  // Build maps for diff
  const existingById = new Map();
  existingSnapshot.docs.forEach((doc) => {
    existingById.set(doc.id, doc.ref);
  });

  const toDelete = [];
  const toCreate = [];
  const toUpdate = [];

  // Find markets to delete (exist but not in new set)
  for (const [id, ref] of existingById) {
    if (!newMarketIds.has(id)) {
      toDelete.push(ref);
    }
  }

  // Find markets to create or update
  for (const market of newMarkets) {
    const existingRef = existingById.get(market.id);
    if (!existingRef) {
      toCreate.push(market);
    } else {
      // Only update if meaningful fields changed
      const existingData = existingSnapshot.docs.find((d) => d.id === market.id)?.data();
      if (existingData) {
        const hasChanged =
          existingData.title !== market.title ||
          existingData.closes_at !== market.closes_at ||
          existingData.status !== market.status ||
          existingData.match_id !== market.match_id;
        if (hasChanged) {
          toUpdate.push({ ref: existingRef, data: market });
        }
      }
    }
  }

  // If nothing changed, skip all writes
  if (toDelete.length === 0 && toCreate.length === 0 && toUpdate.length === 0) {
    return newMarkets;
  }

  // Execute batches
  const maxBatchOperations = 450;
  let batch = db.batch();
  let operationCount = 0;

  const commitIfNeeded = async (force = false) => {
    if (operationCount === 0 || (!force && operationCount < maxBatchOperations)) {
      return;
    }
    await batch.commit();
    batch = db.batch();
    operationCount = 0;
  };

  // Deletes
  for (const ref of toDelete) {
    batch.delete(ref);
    operationCount += 1;
    await commitIfNeeded();
  }

  // Creates
  for (const market of toCreate) {
    batch.set(db.collection("bolao_markets").doc(market.id), market);
    operationCount += 1;
    await commitIfNeeded();
  }

  // Updates
  for (const { ref, data } of toUpdate) {
    batch.set(ref, data, { merge: true });
    operationCount += 1;
    await commitIfNeeded();
  }

  await commitIfNeeded(true);
  return newMarkets;
}

async function writeAuditLog({ db, bolaoId, actorId, action, before, after, reason }) {
  // Fire-and-forget: don't await, don't block the main flow
  db.collection("bolao_audit").add({
    bolao_id: bolaoId,
    actor_id: actorId,
    action,
    before,
    after,
    reason: reason || null,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  }).catch((err) => {
    console.error("Audit log failed (non-blocking):", err.message);
  });
}

async function getOwnedBolaoOrThrow({ db, bolaoId, actorId }) {
  const ref = db.collection("boloes").doc(bolaoId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("not_found");
  }

  const data = { id: snapshot.id, ...snapshot.data() };
  if (data.creator_id && data.creator_id !== actorId) {
    throw new Error("permission_denied");
  }

  return { ref, data };
}

async function createDraft({ db, bolaoId, payload }) {
  const ref = db.collection("boloes").doc(bolaoId);
  const ownerId = payload.creator_id;
  const nowIso = payload.created_at || payload.audit_meta?.last_updated_at || new Date().toISOString();

  // Write bolao document
  await ref.set(payload);

  // Parallel writes for member + onboarding + markets
  const memberPromise = ownerId
    ? db.collection("bolao_members").doc(`${ownerId}_${bolaoId}`).set({
        bolao_id: bolaoId,
        user_id: ownerId,
        role: "admin",
        membership_status: "active",
        payment_status: "not_required",
        created_at: nowIso,
        joined_at: nowIso,
        updated_at: nowIso,
      }, { merge: true })
    : Promise.resolve();

  const onboardingPromise = ownerId
    ? db.collection("bolao_onboarding_state").doc(`${ownerId}_${bolaoId}`).set({
        id: `${ownerId}_${bolaoId}`,
        bolao_id: bolaoId,
        user_id: ownerId,
        seen_intro: false,
        seen_scoring: false,
        seen_markets: false,
        seen_ranking: false,
        completed_at: null,
        updated_at: nowIso,
      }, { merge: true })
    : Promise.resolve();

  const marketsPromise = syncBolaoMarkets({
    db,
    bolaoId,
    competitionRules: payload.competition_rules,
    championshipId: payload.championship_id || null,
    allowedMatchIds: payload.allowed_match_ids ?? "all",
  });

  await Promise.all([memberPromise, onboardingPromise, marketsPromise]);
  return payload;
}

async function updateConfiguration({
  db,
  bolaoId,
  actorId,
  expectedConfigVersion,
  patch,
  championshipId,
  allowedMatchIds,
  nowIso,
  forceEdit = false,
}) {
  const { ref, data } = await getOwnedBolaoOrThrow({ db, bolaoId, actorId });
  const before = normalizeBolaoDocument(data);
  const after = buildConfigurationUpdate({
    current: before,
    expectedConfigVersion,
    patch,
    actorId,
    nowIso,
    forceEdit,
  });
  const hasChampionshipChange = championshipId !== undefined;
  const hasAllowedMatchesChange = allowedMatchIds !== undefined;

  if (hasChampionshipChange) {
    after.championship_id = championshipId || null;
  }

  if (hasAllowedMatchesChange) {
    after.allowed_match_ids = allowedMatchIds ?? "all";
  }

  await ref.set(after, { merge: true });

  // Sync markets in parallel with audit log (fire-and-forget)
  const marketsPromise = patch?.competition_rules || hasChampionshipChange || hasAllowedMatchesChange
    ? syncBolaoMarkets({
        db,
        bolaoId,
        competitionRules: after.competition_rules,
        championshipId: after.championship_id || null,
        allowedMatchIds: after.allowed_match_ids ?? "all",
      })
    : Promise.resolve();

  writeAuditLog({
    db,
    bolaoId,
    actorId,
    action: "update_configuration",
    before,
    after,
  });

  await marketsPromise;
  return after;
}

async function publishBolao({ db, bolaoId, actorId, expectedConfigVersion, nowIso }) {
  const { ref, data } = await getOwnedBolaoOrThrow({ db, bolaoId, actorId });
  const before = normalizeBolaoDocument(data);
  const after = buildPublishUpdate({
    current: before,
    expectedConfigVersion,
    actorId,
    nowIso,
  });

  await ref.set(after, { merge: true });
  writeAuditLog({
    db,
    bolaoId,
    actorId,
    action: "publish_bolao",
    before,
    after,
  });

  return after;
}

async function duplicateBolao({
  db,
  sourceBolaoId,
  actorId,
  nowIso,
  origin,
  overrides,
}) {
  const { data } = await getOwnedBolaoOrThrow({
    db,
    bolaoId: sourceBolaoId,
    actorId,
  });
  const before = normalizeBolaoDocument(data);
  const newRef = db.collection("boloes").doc();
  const after = buildDuplicateDraftDocument({
    source: before,
    bolaoId: newRef.id,
    actorId,
    nowIso,
    origin,
    overrides,
  });

  // Parallel: create bolao + sync markets
  const [_, markets] = await Promise.all([
    newRef.set(after),
    syncBolaoMarkets({
      db,
      bolaoId: newRef.id,
      competitionRules: after.competition_rules,
      championshipId: after.championship_id || null,
      allowedMatchIds: after.allowed_match_ids ?? "all",
    }),
  ]);

  writeAuditLog({
    db,
    bolaoId: sourceBolaoId,
    actorId,
    action: "duplicate_bolao",
    before,
    after: { new_bolao_id: newRef.id, origin: origin || "published_snapshot" },
  });

  return after;
}

async function alterPresentation({ db, bolaoId, actorId, patch, nowIso }) {
  const { ref, data } = await getOwnedBolaoOrThrow({ db, bolaoId, actorId });
  const before = normalizeBolaoDocument(data);
  const after = buildPresentationUpdate({
    current: before,
    patch,
    actorId,
    nowIso,
  });

  await ref.set(after, { merge: true });
  writeAuditLog({
    db,
    bolaoId,
    actorId,
    action: "alter_presentation",
    before,
    after,
  });

  return after;
}

async function finishBolao({ db, bolaoId, actorId, nowIso, reason }) {
  const { ref, data } = await getOwnedBolaoOrThrow({ db, bolaoId, actorId });
  const before = normalizeBolaoDocument(data);
  const after = buildLifecycleUpdate({
    current: before,
    action: "finish",
    actorId,
    nowIso,
    reason,
  });

  await ref.set(after, { merge: true });
  writeAuditLog({
    db,
    bolaoId,
    actorId,
    action: "finish_bolao",
    before,
    after,
    reason,
  });

  return after;
}

async function archiveBolao({ db, bolaoId, actorId, nowIso, reason }) {
  const { ref, data } = await getOwnedBolaoOrThrow({ db, bolaoId, actorId });
  const before = normalizeBolaoDocument(data);
  const after = buildLifecycleUpdate({
    current: before,
    action: "archive",
    actorId,
    nowIso,
    reason,
  });

  await ref.set(after, { merge: true });
  writeAuditLog({
    db,
    bolaoId,
    actorId,
    action: "archive_bolao",
    before,
    after,
    reason,
  });

  return after;
}

async function deleteBolao({ db, bolaoId, actorId, nowIso, reason }) {
  const { ref, data } = await getOwnedBolaoOrThrow({ db, bolaoId, actorId });
  const before = normalizeBolaoDocument(data);
  await assertDeleteAllowedForOwnerOnly({ db, bolaoId, actorId });
  const after = buildDeleteBolaoUpdate({
    current: before,
    actorId,
    nowIso,
    reason,
  });

  await ref.set(after, { merge: true });
  writeAuditLog({
    db,
    bolaoId,
    actorId,
    action: "delete_bolao",
    before,
    after,
    reason,
  });

  return after;
}

function isActiveBolaoMembership(data = {}) {
  const status = String(data.membership_status || "active");
  return !["left", "removed", "withdrawn_by_owner"].includes(status);
}

async function assertDeleteAllowedForOwnerOnly({ db, bolaoId, actorId }) {
  const snapshot = await db
    .collection("bolao_members")
    .where("bolao_id", "==", bolaoId)
    .get();

  const hasExternalActiveMember = snapshot.docs.some((memberDoc) => {
    const member = memberDoc.data();
    return isActiveBolaoMembership(member) && String(member.user_id || "") !== actorId;
  });

  if (hasExternalActiveMember) {
    throw new Error("external_member_exists");
  }
}

async function removePoolMember({
  db,
  bolaoId,
  memberId,
  actorId,
  nowIso,
  reasonCode,
  reasonText,
}) {
  const { data } = await getOwnedBolaoOrThrow({ db, bolaoId, actorId });
  const memberRef = db.collection("bolao_members").doc(memberId);
  const memberSnapshot = await memberRef.get();

  if (!memberSnapshot.exists) {
    throw new Error("not_found");
  }

  const memberData = memberSnapshot.data();
  if (memberData.bolao_id !== bolaoId) {
    throw new Error("validation_failed");
  }
  if (memberData.user_id === actorId) {
    throw new Error("permission_denied");
  }

  const decision = buildRemoveMemberDecision({
    lifecycleStatus: data.lifecycle?.status || "draft",
    memberHasPrediction: Boolean(memberData.has_prediction),
    paymentStatus: memberData.payment_status || "pending",
    reasonCode,
  });

  const before = { id: memberSnapshot.id, ...memberData };
  const after = {
    ...before,
    membership_status: decision.membership_status,
    removal_reason_code: decision.reason_code,
    removal_reason_text: reasonText || null,
    removed_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  await memberRef.set(after, { merge: true });
  await db.collection("boloes").doc(bolaoId).set(
    {
      member_count: admin.firestore.FieldValue.increment(-1),
      updated_at: nowIso,
    },
    { merge: true },
  );
  writeAuditLog({
    db,
    bolaoId,
    actorId,
    action: "remove_pool_member",
    before,
    after: {
      ...after,
      removed_at: nowIso || null,
      updated_at: nowIso || null,
    },
    reason: reasonText || reasonCode || null,
  });

  return after;
}

async function leaveBolao({
  db,
  bolaoId,
  actorId,
  nowIso,
}) {
  const bolaoRef = db.collection("boloes").doc(bolaoId);
  const bolaoSnapshot = await bolaoRef.get();

  if (!bolaoSnapshot.exists) {
    throw new Error("not_found");
  }

  const bolaoData = { id: bolaoSnapshot.id, ...bolaoSnapshot.data() };
  if (bolaoData.creator_id === actorId) {
    throw new Error("creator_cannot_leave");
  }

  const memberRef = db.collection("bolao_members").doc(`${actorId}_${bolaoId}`);
  const memberSnapshot = await memberRef.get();
  if (!memberSnapshot.exists) {
    throw new Error("not_found");
  }

  const memberData = memberSnapshot.data();
  if (memberData.bolao_id !== bolaoId) {
    throw new Error("validation_failed");
  }

  if (
    ["left", "withdrawn_by_owner", "removed"].includes(
      String(memberData.membership_status || "active"),
    )
  ) {
    throw new Error("invalid_state");
  }

  const lifecycleStatus = bolaoData.lifecycle?.status || "draft";
  if (
    ["live", "finished", "archived"].includes(lifecycleStatus) ||
    Boolean(memberData.has_prediction) ||
    ["confirmed", "paid"].includes(String(memberData.payment_status || ""))
  ) {
    throw new Error("member_protected");
  }

  const before = { id: memberSnapshot.id, ...memberData };
  const after = {
    ...before,
    membership_status: "left",
    left_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  await memberRef.set(after, { merge: true });
  await bolaoRef.set(
    {
      member_count: admin.firestore.FieldValue.increment(-1),
      updated_at: nowIso,
    },
    { merge: true },
  );
  writeAuditLog({
    db,
    bolaoId,
    actorId,
    action: "leave_bolao",
    before,
    after: {
      ...after,
      left_at: nowIso || null,
      updated_at: nowIso || null,
    },
  });

  return {
    membership_status: "left",
  };
}

async function updatePoolMemberPaymentStatus({
  db,
  bolaoId,
  memberId,
  actorId,
  paymentStatus,
  nowIso,
}) {
  await getOwnedBolaoOrThrow({ db, bolaoId, actorId });

  if (!["pending", "paid", "exempt"].includes(String(paymentStatus || ""))) {
    throw new Error("validation_failed");
  }

  const memberRef = db.collection("bolao_members").doc(memberId);
  const memberSnapshot = await memberRef.get();

  if (!memberSnapshot.exists) {
    throw new Error("not_found");
  }

  const memberData = memberSnapshot.data();
  if (memberData.bolao_id !== bolaoId) {
    throw new Error("validation_failed");
  }

  const before = { id: memberSnapshot.id, ...memberData };
  const validated = ["paid", "exempt"].includes(paymentStatus);
  const after = {
    ...before,
    payment_status: paymentStatus,
    payment_proof_status: validated ? "validated" : memberData.payment_proof_status || "pending",
    prize_agreement_status: validated ? "validated" : memberData.prize_agreement_status || "pending",
    payment_reviewed_by: actorId,
    payment_reviewed_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  await memberRef.set(after, { merge: true });
  writeAuditLog({
    db,
    bolaoId,
    actorId,
    action: "update_pool_member_payment_status",
    before,
    after: {
      ...before,
      payment_status: paymentStatus,
      payment_proof_status: after.payment_proof_status,
      prize_agreement_status: after.prize_agreement_status,
      payment_reviewed_by: actorId,
      payment_reviewed_at: nowIso || null,
      updated_at: nowIso || null,
    },
  });

  return {
    member_id: memberId,
    payment_status: paymentStatus,
    payment_proof_status: after.payment_proof_status,
    prize_agreement_status: after.prize_agreement_status,
  };
}

async function submitPoolMemberPaymentProof({
  db,
  bolaoId,
  actorId,
  proofText,
  prizeAgreementAccepted,
  nowIso,
}) {
  const bolaoSnapshot = await db.collection("boloes").doc(bolaoId).get();
  if (!bolaoSnapshot.exists) {
    throw new Error("not_found");
  }

  const bolaoData = bolaoSnapshot.data();
  if (bolaoData.lifecycle?.status === "deleted" || bolaoData.status === "deleted") {
    throw new Error("not_found");
  }

  const memberId = `${actorId}_${bolaoId}`;
  const memberRef = db.collection("bolao_members").doc(memberId);
  const memberSnapshot = await memberRef.get();

  if (!memberSnapshot.exists) {
    throw new Error("not_found");
  }

  const before = { id: memberSnapshot.id, ...memberSnapshot.data() };
  const after = buildPaymentProofUpdate({
    currentMember: before,
    actorId,
    bolaoId,
    proofText,
    prizeAgreementAccepted,
    nowIso,
  });

  await memberRef.set(
    {
      ...after,
      payment_proof_submitted_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  writeAuditLog({
    db,
    bolaoId,
    actorId,
    action: "submit_pool_member_payment_proof",
    before,
    after,
  });

  return {
    member_id: memberId,
    payment_proof_status: after.payment_proof_status,
    prize_agreement_status: after.prize_agreement_status,
  };
}

module.exports = {
  alterPresentation,
  archiveBolao,
  createDraft,
  deleteBolao,
  duplicateBolao,
  finishBolao,
  getOwnedBolaoOrThrow,
  assertDeleteAllowedForOwnerOnly,
  leaveBolao,
  loadMatchesForBolaoMarketSync,
  publishBolao,
  removePoolMember,
  submitPoolMemberPaymentProof,
  syncBolaoMarkets,
  updateConfiguration,
  updatePoolMemberPaymentStatus,
  writeAuditLog,
};
