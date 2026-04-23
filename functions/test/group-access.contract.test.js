const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildGroupDocument,
  getBolaoJoinDecision,
  getGroupJoinDecision,
  normalizeGroupDocument,
} = require("../group-access/contract");

test("buildGroupDocument defaults private groups to approval admission", () => {
  const group = buildGroupDocument({
    groupId: "grupo-1",
    actorId: "owner-1",
    nowIso: "2026-04-21T12:00:00.000Z",
    input: {
      presentation: {
        name: "Injeção",
      },
    },
  });

  assert.equal(group.visibility, "private");
  assert.equal(group.admission_mode, "approval");
  assert.equal(group.category, "private");
});

test("normalizeGroupDocument preserves public group direct admission defaults", () => {
  const group = normalizeGroupDocument({
    id: "grupo-1",
    creator_id: "owner-1",
    name: "Arena",
    category: "public",
  });

  assert.equal(group.visibility, "public");
  assert.equal(group.admission_mode, "direct_code_or_invite");
});

test("getGroupJoinDecision requests approval for private groups even with code", () => {
  const decision = getGroupJoinDecision({
    group: {
      id: "grupo-1",
      creator_id: "owner-1",
      name: "Privado",
      category: "private",
      invite_code: "PRIV1234",
    },
    hasMembership: false,
    inviteCode: "PRIV1234",
  });

  assert.equal(decision.action, "request");
});

test("getGroupJoinDecision allows direct join for public code-based groups with valid invite code", () => {
  const decision = getGroupJoinDecision({
    group: {
      id: "grupo-1",
      creator_id: "owner-1",
      name: "Publico",
      visibility: "public",
      admission_mode: "direct_code_or_invite",
      invite_code: "ABCD1234",
    },
    hasMembership: false,
    inviteCode: "ABCD1234",
  });

  assert.equal(decision.action, "direct_join");
});

test("getBolaoJoinDecision blocks group-gated join when group membership is missing", () => {
  const decision = getBolaoJoinDecision({
    bolao: {
      invite_code: "POOL1234",
      category: "private",
      context: {
        group_binding_mode: "group_gated",
        grupo_id: "grupo-1",
      },
      access_policy: {
        join_mode: "private_invite",
      },
    },
    hasMembership: false,
    hasActiveGroupMembership: false,
    inviteCode: "POOL1234",
  });

  assert.equal(decision.action, "blocked");
  assert.equal(decision.code, "join_requires_group");
});

test("getBolaoJoinDecision allows direct join for public open pools", () => {
  const decision = getBolaoJoinDecision({
    bolao: {
      invite_code: "POOL1234",
      category: "public",
      context: {
        group_binding_mode: "none",
      },
      access_policy: {
        join_mode: "public_open",
        admission_mode: "direct_open",
      },
    },
    hasMembership: false,
    hasActiveGroupMembership: false,
    inviteCode: null,
  });

  assert.equal(decision.action, "direct_join");
});
