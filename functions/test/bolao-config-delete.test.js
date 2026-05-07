const test = require("node:test");
const assert = require("node:assert/strict");
const {
  assertDeleteAllowedForOwnerOnly,
} = require("../bolao-config/repository");
const {
  buildDeleteBolaoUpdate,
  buildDraftBolaoDocument,
  buildPublishUpdate,
} = require("../bolao-config/handlers");

function buildMembersDb(members) {
  return {
    collection(name) {
      assert.equal(name, "bolao_members");
      return {
        where(field, operator, value) {
          assert.equal(field, "bolao_id");
          assert.equal(operator, "==");
          assert.equal(value, "bolao-1");
          return this;
        },
        async get() {
          return {
            docs: members.map((member) => ({
              data: () => member,
            })),
          };
        },
      };
    },
  };
}

test("buildDeleteBolaoUpdate marks a draft as deleted and disables sharing", () => {
  const draft = buildDraftBolaoDocument({
    bolaoId: "bolao-1",
    actorId: "owner-1",
    nowIso: "2026-04-20T12:00:00.000Z",
    input: {
      presentation: { name: "Mesa do Bar" },
    },
  });

  const deleted = buildDeleteBolaoUpdate({
    current: draft,
    actorId: "owner-1",
    nowIso: "2026-04-20T12:05:00.000Z",
    reason: "owner_deleted_from_edit_panel",
  });

  assert.equal(deleted.lifecycle.status, "deleted");
  assert.equal(deleted.status, "deleted");
  assert.equal(deleted.deleted_at, "2026-04-20T12:05:00.000Z");
  assert.equal(deleted.access_policy.visibility, "deleted");
  assert.equal(deleted.editable_sections.operation, false);
});

test("buildDeleteBolaoUpdate deletes a published pool without requiring finish first", () => {
  const published = buildPublishUpdate({
    current: buildDraftBolaoDocument({
      bolaoId: "bolao-1",
      actorId: "owner-1",
      nowIso: "2026-04-20T12:00:00.000Z",
      input: {
        presentation: { name: "Mesa do Bar" },
      },
    }),
    expectedConfigVersion: 1,
    actorId: "owner-1",
    nowIso: "2026-04-20T12:05:00.000Z",
  });

  const deleted = buildDeleteBolaoUpdate({
    current: published,
    actorId: "owner-1",
    nowIso: "2026-04-20T12:10:00.000Z",
  });

  assert.equal(deleted.lifecycle.status, "deleted");
  assert.equal(deleted.status, "deleted");
  assert.equal(deleted.integrity.config_version, published.integrity.config_version + 1);
});

test("buildDeleteBolaoUpdate rejects an already deleted pool", () => {
  const draft = buildDraftBolaoDocument({
    bolaoId: "bolao-1",
    actorId: "owner-1",
    nowIso: "2026-04-20T12:00:00.000Z",
    input: {
      presentation: { name: "Mesa do Bar" },
    },
  });

  const deleted = buildDeleteBolaoUpdate({
    current: draft,
    actorId: "owner-1",
    nowIso: "2026-04-20T12:05:00.000Z",
  });

  assert.throws(
    () =>
      buildDeleteBolaoUpdate({
        current: deleted,
        actorId: "owner-1",
        nowIso: "2026-04-20T12:10:00.000Z",
      }),
    /invalid_state/,
  );
});

test("assertDeleteAllowedForOwnerOnly allows deleting while creator is the only active member", async () => {
  await assertDeleteAllowedForOwnerOnly({
    db: buildMembersDb([
      { bolao_id: "bolao-1", user_id: "owner-1", membership_status: "active" },
      { bolao_id: "bolao-1", user_id: "guest-1", membership_status: "left" },
    ]),
    bolaoId: "bolao-1",
    actorId: "owner-1",
  });
});

test("assertDeleteAllowedForOwnerOnly blocks deleting after another active member joins", async () => {
  await assert.rejects(
    () =>
      assertDeleteAllowedForOwnerOnly({
        db: buildMembersDb([
          { bolao_id: "bolao-1", user_id: "owner-1", membership_status: "active" },
          { bolao_id: "bolao-1", user_id: "guest-1", membership_status: "active" },
        ]),
        bolaoId: "bolao-1",
        actorId: "owner-1",
      }),
    /external_member_exists/,
  );
});
