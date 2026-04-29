const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildDeleteBolaoUpdate,
  buildDraftBolaoDocument,
  buildPublishUpdate,
} = require("../bolao-config/handlers");

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
