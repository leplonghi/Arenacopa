const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildConfigurationUpdate,
  buildDraftBolaoDocument,
  buildDuplicateDraftDocument,
  buildLifecycleUpdate,
  buildPublishedSnapshot,
  buildPresentationUpdate,
  buildPublishUpdate,
  assertConfigVersion,
  buildRemoveMemberDecision,
} = require("../bolao-config/handlers");

test("buildDraftBolaoDocument seeds lifecycle, integrity, and editable sections", () => {
  const draft = buildDraftBolaoDocument({
    bolaoId: "bolao-1",
    actorId: "owner-1",
    nowIso: "2026-04-20T12:00:00.000Z",
  });

  assert.equal(draft.lifecycle.status, "draft");
  assert.equal(draft.integrity.config_version, 1);
  assert.equal(draft.editable_sections.competition_rules, true);
});

test("buildPublishedSnapshot freezes structural sections but excludes presentation", () => {
  const snapshot = buildPublishedSnapshot({
    schema_version: 2,
    context: { group_binding_mode: "none" },
    competition_rules: { format: "classic" },
    access_policy: { join_mode: "private_invite" },
    finance_rules: { finance_mode: "free" },
    presentation: { name: "Ignorar" },
  });

  assert.deepEqual(snapshot.presentation, undefined);
  assert.equal(snapshot.schema_version, 2);
  assert.equal(snapshot.competition_rules.format, "classic");
});

test("assertConfigVersion throws on stale writes", () => {
  assert.throws(
    () => assertConfigVersion({ expected: 3, current: 4 }),
    /config_conflict/,
  );
});

test("buildRemoveMemberDecision requires an audit reason after publish", () => {
  assert.throws(
    () =>
      buildRemoveMemberDecision({
        lifecycleStatus: "published",
        memberHasPrediction: false,
        paymentStatus: "pending",
        reasonCode: "",
      }),
    /validation_failed/,
  );
});

test("buildConfigurationUpdate increments config version for editable draft sections", () => {
  const draft = buildDraftBolaoDocument({
    bolaoId: "bolao-1",
    actorId: "owner-1",
    nowIso: "2026-04-20T12:00:00.000Z",
  });

  const updated = buildConfigurationUpdate({
    current: draft,
    expectedConfigVersion: 1,
    patch: {
      competition_rules: {
        format: "detailed",
      },
    },
    actorId: "owner-1",
    nowIso: "2026-04-20T12:10:00.000Z",
  });

  assert.equal(updated.competition_rules.format, "detailed");
  assert.equal(updated.integrity.config_version, 2);
});

test("buildConfigurationUpdate blocks structural patch after publish lock", () => {
  const published = buildPublishUpdate({
    current: buildDraftBolaoDocument({
      bolaoId: "bolao-1",
      actorId: "owner-1",
      nowIso: "2026-04-20T12:00:00.000Z",
      input: {
        presentation: { name: "Mata-mata" },
      },
    }),
    expectedConfigVersion: 1,
    actorId: "owner-1",
    nowIso: "2026-04-20T12:05:00.000Z",
  });

  assert.throws(
    () =>
      buildConfigurationUpdate({
        current: published,
        expectedConfigVersion: published.integrity.config_version,
        patch: {
          competition_rules: { format: "detailed" },
        },
        actorId: "owner-1",
        nowIso: "2026-04-20T12:06:00.000Z",
      }),
    /structure_locked/,
  );
});

test("buildPublishUpdate freezes structural sections and stores snapshot", () => {
  const published = buildPublishUpdate({
    current: buildDraftBolaoDocument({
      bolaoId: "bolao-1",
      actorId: "owner-1",
      nowIso: "2026-04-20T12:00:00.000Z",
      input: {
        presentation: { name: "Liga da Galera" },
      },
    }),
    expectedConfigVersion: 1,
    actorId: "owner-1",
    nowIso: "2026-04-20T12:05:00.000Z",
  });

  assert.equal(published.lifecycle.status, "published");
  assert.equal(published.editable_sections.competition_rules, false);
  assert.equal(published.integrity.published_snapshot.competition_rules.format, "classic");
});

test("buildPresentationUpdate keeps presentation editable after publish", () => {
  const published = buildPublishUpdate({
    current: buildDraftBolaoDocument({
      bolaoId: "bolao-1",
      actorId: "owner-1",
      nowIso: "2026-04-20T12:00:00.000Z",
      input: {
        presentation: { name: "Liga da Galera" },
      },
    }),
    expectedConfigVersion: 1,
    actorId: "owner-1",
    nowIso: "2026-04-20T12:05:00.000Z",
  });

  const updated = buildPresentationUpdate({
    current: published,
    patch: { description: "Nova descrição" },
    actorId: "owner-1",
    nowIso: "2026-04-20T12:07:00.000Z",
  });

  assert.equal(updated.presentation.description, "Nova descrição");
  assert.equal(updated.lifecycle.status, "published");
});

test("buildDuplicateDraftDocument uses published snapshot by default", () => {
  const published = buildPublishUpdate({
    current: buildDraftBolaoDocument({
      bolaoId: "bolao-1",
      actorId: "owner-1",
      nowIso: "2026-04-20T12:00:00.000Z",
      input: {
        presentation: { name: "Liga da Galera" },
      },
    }),
    expectedConfigVersion: 1,
    actorId: "owner-1",
    nowIso: "2026-04-20T12:05:00.000Z",
  });

  const duplicated = buildDuplicateDraftDocument({
    source: published,
    bolaoId: "bolao-2",
    actorId: "owner-1",
    nowIso: "2026-04-20T12:10:00.000Z",
    overrides: {
      presentation: { name: "Liga da Galera 2" },
    },
  });

  assert.equal(duplicated.id, "bolao-2");
  assert.equal(duplicated.lifecycle.status, "draft");
  assert.equal(duplicated.presentation.name, "Liga da Galera 2");
  assert.equal(duplicated.competition_rules.format, published.integrity.published_snapshot.competition_rules.format);
});

test("buildLifecycleUpdate finishes and archives with valid transitions", () => {
  const published = buildPublishUpdate({
    current: buildDraftBolaoDocument({
      bolaoId: "bolao-1",
      actorId: "owner-1",
      nowIso: "2026-04-20T12:00:00.000Z",
      input: {
        presentation: { name: "Liga da Galera" },
      },
    }),
    expectedConfigVersion: 1,
    actorId: "owner-1",
    nowIso: "2026-04-20T12:05:00.000Z",
  });

  const finished = buildLifecycleUpdate({
    current: published,
    action: "finish",
    actorId: "owner-1",
    nowIso: "2026-04-20T12:20:00.000Z",
  });
  const archived = buildLifecycleUpdate({
    current: finished,
    action: "archive",
    actorId: "owner-1",
    nowIso: "2026-04-20T12:30:00.000Z",
  });

  assert.equal(finished.lifecycle.status, "finished");
  assert.equal(archived.lifecycle.status, "archived");
});
