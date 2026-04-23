const admin = require("firebase-admin");
const { normalizeBolaoDocument } = require("../bolao-config/handlers");
const { writeAuditLog: writeBolaoAuditLog } = require("../bolao-config/repository");
const {
  buildBolaoJoinRequest,
  buildBolaoMembership,
  buildGroupDocument,
  buildGroupJoinRequest,
  buildGroupMembership,
  buildGroupSettingsUpdate,
  getBolaoJoinDecision,
  getGroupJoinDecision,
  getGroupManagerStatus,
  normalizeGroupDocument,
} = require("./contract");

async function writeGroupAuditLog({
  db,
  groupId,
  actorId,
  action,
  before,
  after,
  reasonCode,
  policySnapshot,
}) {
  await db.collection("group_audit").add({
    group_id: groupId,
    actor_id: actorId,
    action,
    before: before || null,
    after: after || null,
    reason_code: reasonCode || null,
    policy_snapshot: policySnapshot || null,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function getGroupOrThrow({ db, groupId }) {
  const ref = db.collection("grupos").doc(groupId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new Error("not_found");
  }

  return {
    ref,
    data: { id: snapshot.id, ...snapshot.data() },
  };
}

async function getGroupMembership({ db, groupId, userId }) {
  const snapshot = await db.collection("grupo_members").doc(`${userId}_${groupId}`).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

async function getBolaoMembership({ db, bolaoId, userId }) {
  const snapshot = await db.collection("bolao_members").doc(`${userId}_${bolaoId}`).get();
  return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
}

async function ensureGroupManager({ db, groupId, actorId }) {
  const { ref, data } = await getGroupOrThrow({ db, groupId });
  const membership = await getGroupMembership({ db, groupId, userId: actorId });
  const isCreator = data.creator_id === actorId;
  const isManager = getGroupManagerStatus({
    isCreator,
    membershipRole: membership?.role || null,
  });

  if (!isManager) {
    throw new Error("permission_denied");
  }

  return {
    ref,
    data,
    membership,
    isCreator,
  };
}

async function getBolaoOwnedOrThrow({ db, bolaoId, actorId }) {
  const ref = db.collection("boloes").doc(bolaoId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new Error("not_found");
  }

  const data = { id: snapshot.id, ...snapshot.data() };
  if (data.creator_id !== actorId) {
    throw new Error("permission_denied");
  }

  return {
    ref,
    data: normalizeBolaoDocument(data),
  };
}

async function resolveFeaturedBolaoId({ db, groupId, preferredBolaoId = null }) {
  if (preferredBolaoId) {
    const preferred = await db.collection("boloes").doc(preferredBolaoId).get();
    if (
      preferred.exists &&
      preferred.data().grupo_id === groupId &&
      ["open", "active"].includes(preferred.data().status)
    ) {
      return preferred.id;
    }
  }

  const snapshot = await db
    .collection("boloes")
    .where("grupo_id", "==", groupId)
    .orderBy("updated_at", "desc")
    .limit(10)
    .get();

  const featuredCandidate = snapshot.docs.find((doc) =>
    ["open", "active"].includes(doc.data().status),
  );

  return featuredCandidate ? featuredCandidate.id : null;
}

async function createGroup({ db, groupId, actorId, payload, nowIso }) {
  const groupDoc = buildGroupDocument({
    groupId,
    actorId,
    nowIso,
    input: payload || {},
  });

  const batch = db.batch();
  batch.set(db.collection("grupos").doc(groupId), groupDoc);
  batch.set(
    db.collection("grupo_members").doc(`${actorId}_${groupId}`),
    buildGroupMembership({
      groupId,
      userId: actorId,
      role: "admin",
      nowIso,
    }),
  );

  await batch.commit();
  await writeGroupAuditLog({
    db,
    groupId,
    actorId,
    action: "create_group",
    after: groupDoc,
    policySnapshot: {
      visibility: groupDoc.visibility,
      admission_mode: groupDoc.admission_mode,
    },
  });

  return normalizeGroupDocument(groupDoc);
}

async function updateGroupSettings({ db, groupId, actorId, patch, nowIso }) {
  const { ref, data } = await ensureGroupManager({ db, groupId, actorId });
  const before = normalizeGroupDocument(data);

  let featuredBolaoId =
    Object.prototype.hasOwnProperty.call(patch || {}, "featured_bolao_id")
      ? patch.featured_bolao_id || null
      : before.featured_bolao_id;

  if (featuredBolaoId) {
    const validFeaturedId = await resolveFeaturedBolaoId({
      db,
      groupId,
      preferredBolaoId: featuredBolaoId,
    });
    if (validFeaturedId !== featuredBolaoId) {
      throw new Error("invalid_featured_bolao");
    }
  }

  const update = buildGroupSettingsUpdate({
    current: before,
    patch: {
      ...(patch || {}),
      featured_bolao_id: featuredBolaoId,
    },
    nowIso,
  });

  await ref.set(update, { merge: true });
  await writeGroupAuditLog({
    db,
    groupId,
    actorId,
    action: "update_group_settings",
    before,
    after: { ...before, ...update },
    policySnapshot: {
      visibility: update.visibility,
      admission_mode: update.admission_mode,
      featured_bolao_id: update.featured_bolao_id,
    },
  });

  return normalizeGroupDocument({ ...before, ...update, id: groupId, creator_id: data.creator_id });
}

async function requestGroupJoin({ db, groupId, actorId, nowIso, inviteCode, origin }) {
  const { ref, data } = await getGroupOrThrow({ db, groupId });
  const group = normalizeGroupDocument(data);
  const existingMembership = await getGroupMembership({ db, groupId, userId: actorId });
  const decision = getGroupJoinDecision({
    group,
    hasMembership:
      Boolean(existingMembership) &&
      !["removed", "left"].includes(existingMembership.membership_status || "active"),
    inviteCode,
  });

  if (decision.action === "already_member") {
    return {
      status: "already_member",
      group,
    };
  }

  const requestId = `${groupId}_${actorId}`;
  const requestRef = db.collection("grupo_join_requests").doc(requestId);
  const existingRequestSnapshot = await requestRef.get();
  if (existingRequestSnapshot.exists && existingRequestSnapshot.data().request_status === "pending") {
    return {
      status: "requested",
      request_id: requestId,
      group,
    };
  }

  if (decision.action === "direct_join") {
    await db.collection("grupo_members").doc(`${actorId}_${groupId}`).set(
      buildGroupMembership({
        groupId,
        userId: actorId,
        role: "member",
        nowIso,
        inviteCode: inviteCode || null,
      }),
      { merge: true },
    );
    await ref.set(
      {
        member_count: admin.firestore.FieldValue.increment(1),
        updated_at: nowIso,
      },
      { merge: true },
    );
    await requestRef.set(
      buildGroupJoinRequest({
        groupId,
        userId: actorId,
        nowIso,
        inviteCode: inviteCode || null,
        status: "approved",
      }),
      { merge: true },
    );
    await writeGroupAuditLog({
      db,
      groupId,
      actorId,
      action: "group_join_direct",
      after: { user_id: actorId, membership_status: "active" },
      reasonCode: origin || "direct_join",
      policySnapshot: {
        visibility: group.visibility,
        admission_mode: group.admission_mode,
      },
    });

    return {
      status: "joined",
      membership_status: "active",
      group,
    };
  }

  await requestRef.set(
    buildGroupJoinRequest({
      groupId,
      userId: actorId,
      nowIso,
      inviteCode: inviteCode || null,
      status: "pending",
    }),
    { merge: true },
  );
  await writeGroupAuditLog({
    db,
    groupId,
    actorId,
    action: "group_join_requested",
    after: { request_id: requestId, request_status: "pending" },
    reasonCode: origin || "approval_required",
    policySnapshot: {
      visibility: group.visibility,
      admission_mode: group.admission_mode,
    },
  });

  return {
    status: "requested",
    request_id: requestId,
    request_status: "pending",
    group,
  };
}

async function approveGroupJoin({ db, groupId, requestId, actorId, nowIso, reasonCode }) {
  const { ref, data } = await ensureGroupManager({ db, groupId, actorId });
  const requestRef = db.collection("grupo_join_requests").doc(requestId);
  const requestSnapshot = await requestRef.get();

  if (!requestSnapshot.exists) {
    throw new Error("not_found");
  }

  const requestData = requestSnapshot.data();
  if (requestData.grupo_id !== groupId) {
    throw new Error("validation_failed");
  }
  if (requestData.request_status !== "pending") {
    throw new Error("invalid_state");
  }

  await db.collection("grupo_members").doc(`${requestData.user_id}_${groupId}`).set(
    buildGroupMembership({
      groupId,
      userId: requestData.user_id,
      role: "member",
      nowIso,
      inviteCode: requestData.invite_code || null,
    }),
    { merge: true },
  );
  await requestRef.set(
    {
      request_status: "approved",
      approved_at: nowIso,
      approved_by: actorId,
      updated_at: nowIso,
    },
    { merge: true },
  );
  await ref.set(
    {
      member_count: admin.firestore.FieldValue.increment(1),
      updated_at: nowIso,
    },
    { merge: true },
  );
  await writeGroupAuditLog({
    db,
    groupId,
    actorId,
    action: "approve_group_join",
    before: requestData,
    after: { ...requestData, request_status: "approved" },
    reasonCode,
    policySnapshot: {
      visibility: data.visibility || data.category || "private",
      admission_mode: data.admission_mode || "approval",
    },
  });

  return {
    request_id: requestId,
    request_status: "approved",
    membership_status: "active",
  };
}

async function rejectGroupJoin({ db, groupId, requestId, actorId, nowIso, reasonCode }) {
  await ensureGroupManager({ db, groupId, actorId });
  const requestRef = db.collection("grupo_join_requests").doc(requestId);
  const requestSnapshot = await requestRef.get();
  if (!requestSnapshot.exists) {
    throw new Error("not_found");
  }
  const requestData = requestSnapshot.data();
  if (requestData.grupo_id !== groupId) {
    throw new Error("validation_failed");
  }
  if (requestData.request_status !== "pending") {
    throw new Error("invalid_state");
  }

  await requestRef.set(
    {
      request_status: "rejected",
      rejected_at: nowIso,
      rejected_by: actorId,
      updated_at: nowIso,
    },
    { merge: true },
  );
  await writeGroupAuditLog({
    db,
    groupId,
    actorId,
    action: "reject_group_join",
    before: requestData,
    after: { ...requestData, request_status: "rejected" },
    reasonCode,
  });

  return {
    request_id: requestId,
    request_status: "rejected",
  };
}

async function leaveGroup({ db, groupId, actorId, nowIso }) {
  const { ref, data } = await getGroupOrThrow({ db, groupId });
  if (data.creator_id === actorId) {
    throw new Error("creator_cannot_leave");
  }

  const membershipRef = db.collection("grupo_members").doc(`${actorId}_${groupId}`);
  const membershipSnapshot = await membershipRef.get();
  if (!membershipSnapshot.exists) {
    throw new Error("not_found");
  }

  const before = membershipSnapshot.data();
  await membershipRef.set(
    {
      membership_status: "left",
      left_at: nowIso,
      updated_at: nowIso,
    },
    { merge: true },
  );
  await ref.set(
    {
      member_count: admin.firestore.FieldValue.increment(-1),
      updated_at: nowIso,
    },
    { merge: true },
  );
  await writeGroupAuditLog({
    db,
    groupId,
    actorId,
    action: "leave_group",
    before,
    after: { ...before, membership_status: "left" },
  });

  return {
    membership_status: "left",
  };
}

async function removeGroupMember({ db, groupId, memberId, actorId, nowIso, reasonCode }) {
  const { ref, data } = await ensureGroupManager({ db, groupId, actorId });
  const memberRef = db.collection("grupo_members").doc(memberId);
  const memberSnapshot = await memberRef.get();

  if (!memberSnapshot.exists) {
    throw new Error("not_found");
  }

  const memberData = memberSnapshot.data();
  if (memberData.grupo_id !== groupId) {
    throw new Error("validation_failed");
  }
  if (memberData.user_id === data.creator_id) {
    throw new Error("cannot_remove_creator");
  }

  await memberRef.set(
    {
      membership_status: "removed",
      removed_at: nowIso,
      removed_by: actorId,
      updated_at: nowIso,
    },
    { merge: true },
  );
  await ref.set(
    {
      member_count: admin.firestore.FieldValue.increment(-1),
      updated_at: nowIso,
    },
    { merge: true },
  );
  await writeGroupAuditLog({
    db,
    groupId,
    actorId,
    action: "remove_group_member",
    before: memberData,
    after: { ...memberData, membership_status: "removed" },
    reasonCode,
  });

  return {
    member_id: memberId,
    membership_status: "removed",
  };
}

async function setFeaturedGroupBolao({ db, groupId, bolaoId, actorId, nowIso }) {
  const { ref, data } = await ensureGroupManager({ db, groupId, actorId });
  const featuredBolaoId = await resolveFeaturedBolaoId({
    db,
    groupId,
    preferredBolaoId: bolaoId || null,
  });

  await ref.set(
    {
      featured_bolao_id: featuredBolaoId,
      updated_at: nowIso,
    },
    { merge: true },
  );
  await writeGroupAuditLog({
    db,
    groupId,
    actorId,
    action: "set_featured_bolao",
    before: { featured_bolao_id: data.featured_bolao_id || null },
    after: { featured_bolao_id: featuredBolaoId },
  });

  return {
    group_id: groupId,
    featured_bolao_id: featuredBolaoId,
  };
}

async function requestBolaoJoin({ db, bolaoId, actorId, nowIso, inviteCode, origin }) {
  const bolaoSnapshot = await db.collection("boloes").doc(bolaoId).get();
  if (!bolaoSnapshot.exists) {
    throw new Error("not_found");
  }

  const bolao = normalizeBolaoDocument({
    id: bolaoSnapshot.id,
    ...bolaoSnapshot.data(),
  });
  const existingMembership = await getBolaoMembership({ db, bolaoId, userId: actorId });
  const groupId = bolao.context?.grupo_id || bolao.grupo_id || null;
  const groupMembership =
    groupId ? await getGroupMembership({ db, groupId, userId: actorId }) : null;
  const decision = getBolaoJoinDecision({
    bolao,
    hasMembership:
      Boolean(existingMembership) &&
      !["removed", "withdrawn_by_owner", "left"].includes(
        existingMembership.membership_status || "active",
      ),
    hasActiveGroupMembership:
      Boolean(groupMembership) &&
      !["removed", "left"].includes(groupMembership.membership_status || "active"),
    inviteCode,
  });

  if (decision.action === "already_member") {
    return {
      status: "already_member",
      bolao,
    };
  }

  if (decision.action === "blocked") {
    const error = new Error(decision.code || "validation_failed");
    error.required_group_id = decision.required_group_id;
    throw error;
  }

  const requestId = `${bolaoId}_${actorId}`;
  const requestRef = db.collection("bolao_join_requests").doc(requestId);
  const requestSnapshot = await requestRef.get();
  if (requestSnapshot.exists && requestSnapshot.data().request_status === "pending") {
    return {
      status: "requested",
      request_id: requestId,
      bolao,
      required_group_id: groupId,
    };
  }

  if (decision.action === "direct_join") {
    await db.collection("bolao_members").doc(`${actorId}_${bolaoId}`).set(
      buildBolaoMembership({
        bolaoId,
        userId: actorId,
        nowIso,
        paymentStatus: bolao.is_paid ? "pending" : "exempt",
        inviteCode: inviteCode || null,
      }),
      { merge: true },
    );
    await requestRef.set(
      buildBolaoJoinRequest({
        bolaoId,
        userId: actorId,
        nowIso,
        inviteCode: inviteCode || null,
        status: "approved",
      }),
      { merge: true },
    );
    await writeBolaoAuditLog({
      db,
      bolaoId,
      actorId,
      action: "pool_join_direct",
      after: { user_id: actorId, membership_status: "active" },
      reason: origin || "direct_join",
    });

    return {
      status: "joined",
      membership_status: "active",
      bolao,
      required_group_id: groupId,
    };
  }

  await requestRef.set(
    buildBolaoJoinRequest({
      bolaoId,
      userId: actorId,
      nowIso,
      inviteCode: inviteCode || null,
      status: "pending",
    }),
    { merge: true },
  );
  await writeBolaoAuditLog({
    db,
    bolaoId,
    actorId,
    action: "pool_join_requested",
    after: { request_id: requestId, request_status: "pending" },
    reason: origin || "approval_required",
  });

  return {
    status: "requested",
    request_id: requestId,
    request_status: "pending",
    bolao,
    required_group_id: groupId,
  };
}

async function approveBolaoJoin({ db, bolaoId, requestId, actorId, nowIso, reasonCode }) {
  const { data } = await getBolaoOwnedOrThrow({ db, bolaoId, actorId });
  const requestRef = db.collection("bolao_join_requests").doc(requestId);
  const requestSnapshot = await requestRef.get();
  if (!requestSnapshot.exists) {
    throw new Error("not_found");
  }
  const requestData = requestSnapshot.data();
  if (requestData.bolao_id !== bolaoId) {
    throw new Error("validation_failed");
  }
  if (requestData.request_status !== "pending") {
    throw new Error("invalid_state");
  }

  await db.collection("bolao_members").doc(`${requestData.user_id}_${bolaoId}`).set(
    buildBolaoMembership({
      bolaoId,
      userId: requestData.user_id,
      nowIso,
      paymentStatus: data.is_paid ? "pending" : "exempt",
      inviteCode: requestData.invite_code || null,
    }),
    { merge: true },
  );
  await requestRef.set(
    {
      request_status: "approved",
      approved_at: nowIso,
      approved_by: actorId,
      updated_at: nowIso,
    },
    { merge: true },
  );
  await writeBolaoAuditLog({
    db,
    bolaoId,
    actorId,
    action: "approve_pool_join",
    before: requestData,
    after: { ...requestData, request_status: "approved" },
    reason: reasonCode || null,
  });

  return {
    request_id: requestId,
    request_status: "approved",
    membership_status: "active",
  };
}

async function rejectBolaoJoin({ db, bolaoId, requestId, actorId, nowIso, reasonCode }) {
  await getBolaoOwnedOrThrow({ db, bolaoId, actorId });
  const requestRef = db.collection("bolao_join_requests").doc(requestId);
  const requestSnapshot = await requestRef.get();
  if (!requestSnapshot.exists) {
    throw new Error("not_found");
  }
  const requestData = requestSnapshot.data();
  if (requestData.bolao_id !== bolaoId) {
    throw new Error("validation_failed");
  }
  if (requestData.request_status !== "pending") {
    throw new Error("invalid_state");
  }

  await requestRef.set(
    {
      request_status: "rejected",
      rejected_at: nowIso,
      rejected_by: actorId,
      updated_at: nowIso,
    },
    { merge: true },
  );
  await writeBolaoAuditLog({
    db,
    bolaoId,
    actorId,
    action: "reject_pool_join",
    before: requestData,
    after: { ...requestData, request_status: "rejected" },
    reason: reasonCode || null,
  });

  return {
    request_id: requestId,
    request_status: "rejected",
  };
}

module.exports = {
  approveBolaoJoin,
  approveGroupJoin,
  createGroup,
  ensureGroupManager,
  getBolaoMembership,
  getGroupMembership,
  getGroupOrThrow,
  leaveGroup,
  rejectBolaoJoin,
  rejectGroupJoin,
  requestBolaoJoin,
  requestGroupJoin,
  resolveFeaturedBolaoId,
  removeGroupMember,
  setFeaturedGroupBolao,
  updateGroupSettings,
  writeGroupAuditLog,
};
