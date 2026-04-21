const {
  computeEditableSections,
  canRemoveMember,
  hasValidPublicExpectation,
  isExternalParticipant,
} = require("./contract");

const DEFAULT_PRESENTATION = {
  name: "",
  description: "",
  emoji: "⚽",
  invite_message: "",
};

const DEFAULT_CONTEXT = {
  group_binding_mode: "none",
  grupo_id: null,
};

const DEFAULT_ACCESS_POLICY = {
  join_mode: "private_invite",
  visibility: "private",
};

const DEFAULT_COMPETITION_RULES = {
  pool_type: "rachao",
  format: "classic",
  scoring_mode: "default",
  markets: [],
  scoring_rules: {
    exact: 10,
    winner: 3,
    draw: 3,
    participation: 1,
  },
};

const DEFAULT_FINANCE_RULES = {
  finance_mode: "free",
  entry_fee_amount: null,
  currency: "BRL",
  distribution_model: "winner_take_all",
  distribution_custom_text: "",
  payment_details: "",
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeSection(base, patch) {
  return {
    ...clone(base),
    ...(patch || {}),
  };
}

function legacyStatusFromLifecycle(lifecycleStatus) {
  if (lifecycleStatus === "live") {
    return "active";
  }
  if (["finished", "archived"].includes(lifecycleStatus)) {
    return lifecycleStatus;
  }
  return "open";
}

function buildInviteCode(bolaoId) {
  return String(bolaoId || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(-8)
    .padStart(6, "A");
}

function deriveFacts(source) {
  const activeMembers = Array.isArray(source.members)
    ? source.members.filter((member) =>
        isExternalParticipant({
          poolOwnerId: source.creator_id,
          member,
        }),
      )
    : [];

  const firstPaymentConfirmed = Array.isArray(source.members)
    ? source.members.some((member) => member.payment_status === "confirmed")
    : false;

  const firstPredictionSaved = Array.isArray(source.members)
    ? source.members.some((member) => Boolean(member.has_prediction))
    : false;

  const publicExpectation = hasValidPublicExpectation({
    lifecycleStatus: source.lifecycle?.status,
    accessPolicy: source.access_policy,
    acceptedInviteCount: source.metrics?.accepted_invite_count || 0,
    approvedRequestCount: source.metrics?.approved_request_count || 0,
    reservedSeatCount: source.metrics?.reserved_seat_count || 0,
  });

  return {
    hasExternalParticipant: activeMembers.length > 0,
    hasValidPublicExpectation: publicExpectation,
    isStructureLocked:
      Boolean(source.integrity?.is_structure_locked) ||
      activeMembers.length > 0 ||
      firstPredictionSaved ||
      firstPaymentConfirmed ||
      ["live", "finished", "archived"].includes(source.lifecycle?.status),
    lockTrigger:
      source.integrity?.lock_trigger ||
      (firstPredictionSaved
        ? "first_prediction_saved"
        : firstPaymentConfirmed
          ? "first_payment_confirmed"
          : activeMembers.length > 0
            ? "external_participant_joined"
            : ["live", "finished", "archived"].includes(source.lifecycle?.status)
              ? "competition_started"
              : null),
  };
}

function recomputeDerivedState(source, nowIso) {
  const facts = deriveFacts(source);
  const editableSections = computeEditableSections({
    lifecycleStatus: source.lifecycle.status,
    isStructureLocked: facts.isStructureLocked,
    hasExternalParticipant: facts.hasExternalParticipant,
    hasValidPublicExpectation: facts.hasValidPublicExpectation,
  });

  return {
    integrity: {
      ...clone(source.integrity),
      is_structure_locked: facts.isStructureLocked,
      structure_locked_at:
        facts.isStructureLocked
          ? source.integrity?.structure_locked_at || nowIso || null
          : null,
      structure_lock_reason:
        facts.isStructureLocked
          ? source.integrity?.structure_lock_reason || "competitive_integrity"
          : null,
      lock_trigger: facts.lockTrigger,
    },
    editable_sections: editableSections,
  };
}

function normalizeBolaoDocument(source) {
  const normalized = {
    id: source.id,
    creator_id: source.creator_id,
    schema_version: source.schema_version || 2,
    legacy_mode: Boolean(source.legacy_mode),
    presentation: mergeSection(DEFAULT_PRESENTATION, source.presentation),
    context: mergeSection(DEFAULT_CONTEXT, source.context),
    access_policy: mergeSection(DEFAULT_ACCESS_POLICY, source.access_policy),
    competition_rules: mergeSection(DEFAULT_COMPETITION_RULES, source.competition_rules),
    finance_rules: mergeSection(DEFAULT_FINANCE_RULES, source.finance_rules),
    lifecycle: {
      status: source.lifecycle?.status || "draft",
      published_at: source.lifecycle?.published_at || null,
      finished_at: source.lifecycle?.finished_at || null,
      archived_at: source.lifecycle?.archived_at || null,
    },
    integrity: {
      is_structure_locked: Boolean(source.integrity?.is_structure_locked),
      structure_locked_at: source.integrity?.structure_locked_at || null,
      structure_lock_reason: source.integrity?.structure_lock_reason || null,
      lock_trigger: source.integrity?.lock_trigger || null,
      config_version: Number(source.integrity?.config_version || 1),
      published_snapshot: source.integrity?.published_snapshot || null,
    },
    audit_meta: {
      last_actor_id: source.audit_meta?.last_actor_id || null,
      last_updated_at: source.audit_meta?.last_updated_at || null,
    },
    metrics: {
      accepted_invite_count: Number(source.metrics?.accepted_invite_count || 0),
      approved_request_count: Number(source.metrics?.approved_request_count || 0),
      reserved_seat_count: Number(source.metrics?.reserved_seat_count || 0),
    },
    members: Array.isArray(source.members) ? clone(source.members) : [],
    created_at: source.created_at || source.audit_meta?.last_updated_at || null,
    updated_at: source.updated_at || source.audit_meta?.last_updated_at || null,
    championship_id: source.championship_id || null,
  };

  const derived = recomputeDerivedState(normalized, normalized.audit_meta.last_updated_at);
  normalized.integrity = derived.integrity;
  normalized.editable_sections = derived.editable_sections;
  normalized.name = normalized.presentation.name;
  normalized.description = normalized.presentation.description || null;
  normalized.avatar_url = normalized.presentation.emoji || "⚽";
  normalized.category =
    normalized.access_policy.join_mode === "public_open" ? "public" : "private";
  normalized.is_paid = normalized.finance_rules.finance_mode === "paid_external";
  normalized.entry_fee = normalized.finance_rules.entry_fee_amount;
  normalized.prize_distribution =
    normalized.finance_rules.distribution_custom_text ||
    normalized.finance_rules.distribution_model ||
    null;
  normalized.payment_details = normalized.finance_rules.payment_details || null;
  normalized.grupo_id = normalized.context.grupo_id || null;
  normalized.format_id = normalized.competition_rules.format;
  normalized.scoring_mode = normalized.competition_rules.scoring_mode || "default";
  normalized.scoring_rules = clone(normalized.competition_rules.scoring_rules);
  normalized.visibility_mode = source.visibility_mode || "hidden_until_deadline";
  normalized.cutoff_mode = source.cutoff_mode || "per_match";
  normalized.status = legacyStatusFromLifecycle(normalized.lifecycle.status);
  normalized.invite_code = source.invite_code || buildInviteCode(normalized.id);
  return normalized;
}

function nextAuditMeta(source, actorId, nowIso) {
  return {
    ...clone(source.audit_meta),
    last_actor_id: actorId,
    last_updated_at: nowIso,
  };
}

function ensureDraftState(source) {
  if (source.lifecycle.status !== "draft") {
    throw new Error("invalid_state");
  }
}

function assertSectionEditable(source, sectionName) {
  if (!source.editable_sections?.[sectionName]) {
    throw new Error(
      sectionName === "presentation" ? "permission_denied" : "structure_locked",
    );
  }
}

function getPublishedSnapshotSource(source, origin) {
  if (origin === "live_draft" && source.lifecycle.status === "draft") {
    return source;
  }

  if (source.integrity?.published_snapshot) {
    return {
      schema_version: source.integrity.published_snapshot.schema_version || source.schema_version,
      context: source.integrity.published_snapshot.context,
      competition_rules: source.integrity.published_snapshot.competition_rules,
      access_policy: source.integrity.published_snapshot.access_policy,
      finance_rules: source.integrity.published_snapshot.finance_rules,
    };
  }

  return source;
}

function assertConfigVersion({ expected, current }) {
  if (expected !== current) {
    throw new Error("config_conflict");
  }
}

function buildDraftBolaoDocument({ bolaoId, actorId, nowIso, input = {} }) {
  return normalizeBolaoDocument({
    id: bolaoId,
    creator_id: actorId,
    schema_version: 2,
    presentation: mergeSection(DEFAULT_PRESENTATION, input.presentation),
    context: mergeSection(DEFAULT_CONTEXT, input.context),
    access_policy: mergeSection(DEFAULT_ACCESS_POLICY, input.access_policy),
    competition_rules: mergeSection(DEFAULT_COMPETITION_RULES, input.competition_rules),
    finance_rules: mergeSection(DEFAULT_FINANCE_RULES, input.finance_rules),
    lifecycle: {
      status: "draft",
      published_at: null,
      finished_at: null,
      archived_at: null,
    },
    integrity: {
      is_structure_locked: false,
      structure_locked_at: null,
      structure_lock_reason: null,
      lock_trigger: null,
      config_version: 1,
      published_snapshot: null,
    },
    audit_meta: {
      last_actor_id: actorId,
      last_updated_at: nowIso,
    },
    created_at: input.created_at || nowIso,
    updated_at: nowIso,
    championship_id: input.championship_id || null,
  });
}

function buildPublishedSnapshot(source) {
  return {
    schema_version: source.schema_version,
    context: source.context,
    competition_rules: source.competition_rules,
    access_policy: source.access_policy,
    finance_rules: source.finance_rules,
  };
}

function buildRemoveMemberDecision({
  lifecycleStatus,
  memberHasPrediction,
  paymentStatus,
  reasonCode,
}) {
  if (lifecycleStatus !== "draft" && !reasonCode) {
    throw new Error("validation_failed");
  }

  const decision = canRemoveMember({
    lifecycleStatus,
    memberHasPrediction,
    paymentStatus,
  });

  if (!decision.allowed) {
    throw new Error(decision.code || "removal_blocked");
  }

  return {
      membership_status: decision.nextStatus,
      reason_code: reasonCode || null,
  };
}

function validateConfigurationPatch(patch) {
  const allowedSections = [
    "context",
    "access_policy",
    "competition_rules",
    "finance_rules",
  ];
  const patchKeys = Object.keys(patch || {});

  if (!patchKeys.length) {
    throw new Error("validation_failed");
  }

  for (const key of patchKeys) {
    if (!allowedSections.includes(key)) {
      throw new Error("validation_failed");
    }
  }
}

function buildConfigurationUpdate({
  current,
  expectedConfigVersion,
  patch,
  actorId,
  nowIso,
}) {
  const normalized = normalizeBolaoDocument(current);
  assertConfigVersion({
    expected: expectedConfigVersion,
    current: normalized.integrity.config_version,
  });
  validateConfigurationPatch(patch);

  const next = clone(normalized);
  for (const [sectionName, sectionPatch] of Object.entries(patch || {})) {
    assertSectionEditable(normalized, sectionName);
    next[sectionName] = mergeSection(normalized[sectionName], sectionPatch);
  }

  next.integrity.config_version = normalized.integrity.config_version + 1;
  next.audit_meta = nextAuditMeta(normalized, actorId, nowIso);
  next.updated_at = nowIso;

  const derived = recomputeDerivedState(next, nowIso);
  next.integrity = derived.integrity;
  next.editable_sections = derived.editable_sections;
  return next;
}

function validateBolaoForPublish(source) {
  if (!source.presentation?.name || source.presentation.name.trim().length < 3) {
    throw new Error("validation_failed");
  }

  if (
    source.context?.group_binding_mode === "group_gated" &&
    source.access_policy?.join_mode === "public_open"
  ) {
    throw new Error("validation_failed");
  }

  if (
    source.finance_rules?.finance_mode === "paid_external" &&
    (!source.finance_rules.entry_fee_amount || Number(source.finance_rules.entry_fee_amount) <= 0)
  ) {
    throw new Error("validation_failed");
  }
}

function buildPublishUpdate({ current, expectedConfigVersion, actorId, nowIso }) {
  const normalized = normalizeBolaoDocument(current);
  ensureDraftState(normalized);
  assertConfigVersion({
    expected: expectedConfigVersion,
    current: normalized.integrity.config_version,
  });
  validateBolaoForPublish(normalized);

  const next = clone(normalized);
  next.lifecycle.status = "published";
  next.lifecycle.published_at = nowIso;
  next.integrity.config_version = normalized.integrity.config_version + 1;
  next.integrity.published_snapshot = buildPublishedSnapshot(next);
  next.audit_meta = nextAuditMeta(normalized, actorId, nowIso);
  next.updated_at = nowIso;

  const derived = recomputeDerivedState(next, nowIso);
  next.integrity = derived.integrity;
  next.editable_sections = derived.editable_sections;
  return next;
}

function buildDuplicateDraftDocument({
  source,
  bolaoId,
  actorId,
  nowIso,
  origin = "published_snapshot",
  overrides = {},
}) {
  const normalized = normalizeBolaoDocument(source);
  const base = getPublishedSnapshotSource(normalized, origin);

  return buildDraftBolaoDocument({
    bolaoId,
    actorId,
    nowIso,
    input: {
      presentation: mergeSection(normalized.presentation, overrides.presentation),
      context: mergeSection(base.context || DEFAULT_CONTEXT, overrides.context),
      access_policy: mergeSection(base.access_policy || DEFAULT_ACCESS_POLICY, overrides.access_policy),
      competition_rules: mergeSection(
        base.competition_rules || DEFAULT_COMPETITION_RULES,
        overrides.competition_rules,
      ),
      finance_rules: mergeSection(base.finance_rules || DEFAULT_FINANCE_RULES, overrides.finance_rules),
    },
  });
}

function buildPresentationUpdate({
  current,
  patch,
  actorId,
  nowIso,
}) {
  const normalized = normalizeBolaoDocument(current);
  assertSectionEditable(normalized, "presentation");

  const next = clone(normalized);
  next.presentation = mergeSection(normalized.presentation, patch);
  next.audit_meta = nextAuditMeta(normalized, actorId, nowIso);
  next.updated_at = nowIso;

  const derived = recomputeDerivedState(next, nowIso);
  next.integrity = derived.integrity;
  next.editable_sections = derived.editable_sections;
  return next;
}

function buildLifecycleUpdate({
  current,
  action,
  actorId,
  nowIso,
  reason = null,
}) {
  const normalized = normalizeBolaoDocument(current);
  const next = clone(normalized);

  if (action === "finish") {
    if (!["published", "live"].includes(normalized.lifecycle.status)) {
      throw new Error("invalid_state");
    }
    next.lifecycle.status = "finished";
    next.lifecycle.finished_at = nowIso;
  } else if (action === "archive") {
    if (!["finished", "archived"].includes(normalized.lifecycle.status)) {
      throw new Error("invalid_state");
    }
    next.lifecycle.status = "archived";
    next.lifecycle.archived_at = nowIso;
  } else {
    throw new Error("validation_failed");
  }

  next.integrity.config_version = normalized.integrity.config_version + 1;
  next.audit_meta = nextAuditMeta(normalized, actorId, nowIso);
  next.updated_at = nowIso;
  if (reason && !next.integrity.structure_lock_reason) {
    next.integrity.structure_lock_reason = reason;
  }

  const derived = recomputeDerivedState(next, nowIso);
  next.integrity = derived.integrity;
  next.editable_sections = derived.editable_sections;
  return next;
}

module.exports = {
  assertConfigVersion,
  buildConfigurationUpdate,
  buildDraftBolaoDocument,
  buildDuplicateDraftDocument,
  buildLifecycleUpdate,
  buildPublishedSnapshot,
  buildPresentationUpdate,
  buildPublishUpdate,
  buildRemoveMemberDecision,
  normalizeBolaoDocument,
  recomputeDerivedState,
};
