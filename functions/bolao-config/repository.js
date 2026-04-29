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

async function syncBolaoMarkets({ db, bolaoId, competitionRules, championshipId = null }) {
  const existingSnapshot = await db
    .collection("bolao_markets")
    .where("bolao_id", "==", bolaoId)
    .get();

  const matches = await loadMatchesForBolaoMarketSync({ db, championshipId });
  const markets = buildBolaoMarkets({
    bolaoId,
    selectedMarketIds: competitionRules?.markets || [],
    matches,
  });

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

  for (const doc of existingSnapshot.docs) {
    batch.delete(doc.ref);
    operationCount += 1;
    await commitIfNeeded();
  }

  for (const market of markets) {
    batch.set(db.collection("bolao_markets").doc(market.id), market);
    operationCount += 1;
    await commitIfNeeded();
  }

  await commitIfNeeded(true);

  return markets;
}

async function writeAuditLog({ db, bolaoId, actorId, action, before, after, reason }) {
  await db.collection("bolao_audit").add({
    bolao_id: bolaoId,
    actor_id: actorId,
    action,
    before,
    after,
    reason: reason || null,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
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
  await ref.set(payload);
  const ownerId = payload.creator_id;
  const nowIso = payload.created_at || payload.audit_meta?.last_updated_at || new Date().toISOString();

  if (ownerId) {
    await db.collection("bolao_members").doc(`${ownerId}_${bolaoId}`).set({
      bolao_id: bolaoId,
      user_id: ownerId,
      role: "admin",
      membership_status: "active",
      payment_status: "not_required",
      created_at: nowIso,
      joined_at: nowIso,
      updated_at: nowIso,
    }, { merge: true });

    await db.collection("bolao_onboarding_state").doc(`${ownerId}_${bolaoId}`).set({
      id: `${ownerId}_${bolaoId}`,
      bolao_id: bolaoId,
      user_id: ownerId,
      seen_intro: false,
      seen_scoring: false,
      seen_markets: false,
      seen_ranking: false,
      completed_at: null,
      updated_at: nowIso,
    }, { merge: true });
  }

  await syncBolaoMarkets({
    db,
    bolaoId,
    competitionRules: payload.competition_rules,
    championshipId: payload.championship_id || null,
  });

  return payload;
}

async function updateConfiguration({ db, bolaoId, actorId, expectedConfigVersion, patch, nowIso }) {
  const { ref, data } = await getOwnedBolaoOrThrow({ db, bolaoId, actorId });
  const before = normalizeBolaoDocument(data);
  const after = buildConfigurationUpdate({
    current: before,
    expectedConfigVersion,
    patch,
    actorId,
    nowIso,
  });

  await ref.set(after, { merge: true });
  if (patch?.competition_rules) {
    await syncBolaoMarkets({
      db,
      bolaoId,
      competitionRules: after.competition_rules,
      championshipId: after.championship_id || null,
    });
  }
  await writeAuditLog({
    db,
    bolaoId,
    actorId,
    action: "update_configuration",
    before,
    after,
  });

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
  await writeAuditLog({
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

  await newRef.set(after);
  await syncBolaoMarkets({
    db,
    bolaoId: newRef.id,
    competitionRules: after.competition_rules,
    championshipId: after.championship_id || null,
  });
  await writeAuditLog({
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
  await writeAuditLog({
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
  await writeAuditLog({
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
  await writeAuditLog({
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
  const after = buildDeleteBolaoUpdate({
    current: before,
    actorId,
    nowIso,
    reason,
  });

  await ref.set(after, { merge: true });
  await writeAuditLog({
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
  await writeAuditLog({
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
  await writeAuditLog({
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
  await writeAuditLog({
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
  await writeAuditLog({
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
  leaveBolao,
  publishBolao,
  removePoolMember,
  submitPoolMemberPaymentProof,
  syncBolaoMarkets,
  updateConfiguration,
  updatePoolMemberPaymentStatus,
  writeAuditLog,
};
