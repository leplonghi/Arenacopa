const DEFAULT_GROUP_PRESENTATION = {
  name: "",
  description: "",
  emoji: "👥",
  objective: "friends",
};

const DEFAULT_GROUP_ACCESS = {
  visibility: "private",
  admission_mode: "approval",
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function merge(base, patch) {
  return {
    ...clone(base),
    ...(patch || {}),
  };
}

function buildInviteCode(entityId, fallbackPrefix) {
  const normalized = String(entityId || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(-8);

  if (normalized.length >= 6) {
    return normalized;
  }

  return `${fallbackPrefix}${normalized}`.slice(0, 8);
}

function getLegacyCategory(visibility) {
  return visibility === "public" ? "public" : "private";
}

function getGroupManagerStatus({ isCreator, membershipRole }) {
  return Boolean(isCreator || membershipRole === "admin");
}

function normalizeGroupDocument(source) {
  const presentation = merge(DEFAULT_GROUP_PRESENTATION, source.presentation || source);
  const access = merge(DEFAULT_GROUP_ACCESS, {
    visibility:
      source.visibility ||
      source.access?.visibility ||
      (source.category === "public" ? "public" : "private"),
    admission_mode:
      source.admission_mode ||
      source.access?.admission_mode ||
      (source.category === "public" ? "direct_code_or_invite" : "approval"),
  });

  return {
    id: source.id,
    creator_id: source.creator_id,
    presentation,
    access,
    name: presentation.name,
    description: presentation.description || null,
    emoji: presentation.emoji || "👥",
    objective: presentation.objective || "friends",
    visibility: access.visibility,
    admission_mode: access.admission_mode,
    category: getLegacyCategory(access.visibility),
    featured_bolao_id: source.featured_bolao_id || null,
    invite_code: source.invite_code || buildInviteCode(source.id, "GRP"),
    created_at: source.created_at || null,
    updated_at: source.updated_at || null,
  };
}

function buildGroupDocument({ groupId, actorId, nowIso, input = {} }) {
  const normalized = normalizeGroupDocument({
    id: groupId,
    creator_id: actorId,
    presentation: input.presentation || {},
    visibility: input.visibility || input.category || "private",
    admission_mode:
      input.admission_mode ||
      (input.visibility === "public" || input.category === "public"
        ? "direct_code_or_invite"
        : "approval"),
    featured_bolao_id: input.featured_bolao_id || null,
    created_at: nowIso,
    updated_at: nowIso,
  });

  return {
    id: groupId,
    creator_id: actorId,
    name: normalized.name,
    description: normalized.description,
    emoji: normalized.emoji,
    objective: normalized.objective,
    visibility: normalized.visibility,
    admission_mode: normalized.admission_mode,
    category: normalized.category,
    featured_bolao_id: normalized.featured_bolao_id,
    invite_code: normalized.invite_code,
    member_count: 1,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

function buildGroupSettingsUpdate({ current, patch, nowIso }) {
  const normalized = normalizeGroupDocument(current);
  const next = normalizeGroupDocument({
    ...normalized,
    presentation: {
      name:
        typeof patch?.name === "string" ? patch.name.trim() : normalized.name,
      description:
        typeof patch?.description === "string"
          ? patch.description.trim()
          : normalized.description,
      emoji:
        typeof patch?.emoji === "string" && patch.emoji.trim()
          ? patch.emoji.trim()
          : normalized.emoji,
      objective:
        typeof patch?.objective === "string" && patch.objective.trim()
          ? patch.objective.trim()
          : normalized.objective,
    },
    visibility: patch?.visibility || normalized.visibility,
    admission_mode: patch?.admission_mode || normalized.admission_mode,
    featured_bolao_id:
      Object.prototype.hasOwnProperty.call(patch || {}, "featured_bolao_id")
        ? patch.featured_bolao_id || null
        : normalized.featured_bolao_id,
    created_at: normalized.created_at,
    updated_at: nowIso,
  });

  return {
    name: next.name,
    description: next.description,
    emoji: next.emoji,
    objective: next.objective,
    visibility: next.visibility,
    admission_mode: next.admission_mode,
    category: next.category,
    featured_bolao_id: next.featured_bolao_id,
    updated_at: nowIso,
  };
}

function buildGroupMembership({
  groupId,
  userId,
  role,
  nowIso,
  inviteCode = null,
  membershipStatus = "active",
}) {
  return {
    grupo_id: groupId,
    user_id: userId,
    role,
    membership_status: membershipStatus,
    invite_code: inviteCode,
    joined_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

function buildGroupJoinRequest({
  groupId,
  userId,
  nowIso,
  inviteCode = null,
  status = "pending",
}) {
  return {
    grupo_id: groupId,
    user_id: userId,
    request_status: status,
    invite_code: inviteCode,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

function buildBolaoMembership({
  bolaoId,
  userId,
  nowIso,
  paymentStatus,
  inviteCode = null,
  membershipStatus = "active",
}) {
  return {
    bolao_id: bolaoId,
    user_id: userId,
    role: "member",
    membership_status: membershipStatus,
    payment_status: paymentStatus,
    invite_code: inviteCode,
    created_at: nowIso,
    joined_at: nowIso,
    updated_at: nowIso,
  };
}

function buildBolaoJoinRequest({
  bolaoId,
  userId,
  nowIso,
  inviteCode = null,
  status = "pending",
}) {
  return {
    bolao_id: bolaoId,
    user_id: userId,
    request_status: status,
    invite_code: inviteCode,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

function getGroupJoinDecision({
  group,
  hasMembership,
  inviteCode,
}) {
  if (hasMembership) {
    return { action: "already_member" };
  }

  const normalized = normalizeGroupDocument(group);
  const inviteMatches =
    Boolean(inviteCode) && inviteCode.toUpperCase() === normalized.invite_code;

  if (normalized.visibility === "public") {
    if (normalized.admission_mode === "direct_open") {
      return { action: "direct_join" };
    }

    if (normalized.admission_mode === "direct_code_or_invite" && inviteMatches) {
      return { action: "direct_join" };
    }
  }

  return { action: "request" };
}

function getBolaoJoinDecision({
  bolao,
  hasMembership,
  hasActiveGroupMembership,
  inviteCode,
}) {
  if (hasMembership) {
    return { action: "already_member" };
  }

  const groupBindingMode = bolao?.context?.group_binding_mode || "none";
  const requiredGroupId = bolao?.context?.grupo_id || bolao?.grupo_id || null;
  if (
    groupBindingMode === "group_gated" &&
    requiredGroupId &&
    !hasActiveGroupMembership
  ) {
    return {
      action: "blocked",
      code: "join_requires_group",
      required_group_id: requiredGroupId,
    };
  }

  const joinMode =
    bolao?.access_policy?.join_mode ||
    (bolao?.category === "public" ? "public_open" : "private_invite");
  const admissionMode =
    bolao?.access_policy?.admission_mode ||
    (joinMode === "public_open" ? "direct_open" : "approval");
  const inviteMatches =
    Boolean(inviteCode) &&
    String(inviteCode).toUpperCase() === String(bolao?.invite_code || "").toUpperCase();

  if (joinMode === "public_open") {
    if (admissionMode === "direct_open") {
      return { action: "direct_join" };
    }

    if (admissionMode === "direct_code_or_invite" && inviteMatches) {
      return { action: "direct_join" };
    }
  }

  return { action: "request" };
}

module.exports = {
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
};
