const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildBolaoPalpiteId,
  buildExclusiveScoreLockId,
  normalizeExclusiveScoreInput,
  assertExclusiveScoreAvailable,
  resolveExistingPalpiteCandidate,
} = require("../bolao-exclusive/palpites");

test("buildExclusiveScoreLockId creates a deterministic seat id", () => {
  assert.equal(
    buildExclusiveScoreLockId({
      bolaoId: "bolaoA",
      matchId: "matchB",
      homeScore: 2,
      awayScore: 1,
    }),
    "bolaoA_matchB_2_1"
  );
});

test("normalizeExclusiveScoreInput accepts integer scores and rejects incomplete payloads", () => {
  assert.deepEqual(
    normalizeExclusiveScoreInput({
      bolao_id: "bolaoA",
      match_id: "matchB",
      home_score: "2",
      away_score: 1,
      is_power_play: true,
    }),
    {
      bolaoId: "bolaoA",
      matchId: "matchB",
      homeScore: 2,
      awayScore: 1,
      isPowerPlay: true,
      existingId: null,
    }
  );

  assert.throws(
    () => normalizeExclusiveScoreInput({ bolao_id: "bolaoA", match_id: "matchB", home_score: 1 }),
    /validation_failed/
  );
});

test("assertExclusiveScoreAvailable rejects a score locked by another participant", () => {
  assert.throws(
    () =>
      assertExclusiveScoreAvailable({
        lockData: { user_id: "otherUser" },
        actorId: "currentUser",
      }),
    /exclusive_score_taken/
  );

  assert.doesNotThrow(() =>
    assertExclusiveScoreAvailable({
      lockData: { user_id: "currentUser" },
      actorId: "currentUser",
    })
  );
});

test("resolveExistingPalpiteCandidate prefers owned current documents over empty slots", () => {
  const canonicalId = buildBolaoPalpiteId({
    userId: "userA",
    bolaoId: "bolaoA",
    matchId: "matchB",
  });

  const resolved = resolveExistingPalpiteCandidate({
    actorId: "userA",
    bolaoId: "bolaoA",
    matchId: "matchB",
    candidates: [
      {
        id: canonicalId,
        exists: true,
        data: {
          user_id: "userA",
          bolao_id: "bolaoA",
          match_id: "matchB",
          home_score: 1,
          away_score: 0,
        },
      },
    ],
  });

  assert.equal(resolved.id, canonicalId);
  assert.deepEqual(resolved.previousScore, { homeScore: 1, awayScore: 0 });
});
