const assert = require("node:assert/strict");
const test = require("node:test");
const {
  assertCommercialParticipantCapacity,
} = require("../group-access/repository");

function buildDbWithMembers(members) {
  return {
    collection(name) {
      assert.equal(name, "bolao_members");
      return {
        where() {
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

test("commercial participant capacity ignores owner/admin and blocks full campaigns", async () => {
  const bolao = {
    creator_id: "owner-1",
    commercial_context: {
      participant_limit: 2,
    },
  };

  await assertCommercialParticipantCapacity({
    db: buildDbWithMembers([
      { user_id: "owner-1", role: "admin", membership_status: "active" },
      { user_id: "participant-1", role: "member", membership_status: "active" },
    ]),
    bolaoId: "bolao-1",
    bolao,
  });

  await assert.rejects(
    () =>
      assertCommercialParticipantCapacity({
        db: buildDbWithMembers([
          { user_id: "owner-1", role: "admin", membership_status: "active" },
          { user_id: "participant-1", role: "member", membership_status: "active" },
          { user_id: "participant-2", role: "member", membership_status: "active" },
        ]),
        bolaoId: "bolao-1",
        bolao,
      }),
    /commercial_participant_limit_reached/,
  );
});
