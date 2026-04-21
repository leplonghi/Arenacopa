const test = require("node:test");
const assert = require("node:assert/strict");
const {
  computeEditableSections,
  isExternalParticipant,
  hasValidPublicExpectation,
  getCompetitiveEligibility,
  getFinancialEligibility,
  canRemoveMember,
} = require("../bolao-config/contract");

test("locks access policy when public expectation exists", () => {
  const editable = computeEditableSections({
    lifecycleStatus: "published",
    isStructureLocked: false,
    hasExternalParticipant: false,
    hasValidPublicExpectation: true,
  });

  assert.equal(editable.presentation, true);
  assert.equal(editable.access_policy, false);
  assert.equal(editable.competition_rules, false);
});

test("treats only active non-owner members as external participants", () => {
  assert.equal(
    isExternalParticipant({
      poolOwnerId: "owner-1",
      member: { user_id: "owner-1", membership_status: "active" },
    }),
    false,
  );

  assert.equal(
    isExternalParticipant({
      poolOwnerId: "owner-1",
      member: { user_id: "guest-1", membership_status: "active" },
    }),
    true,
  );
});

test("distinguishes competitive eligibility from financial eligibility", () => {
  assert.equal(
    getCompetitiveEligibility({
      membershipStatus: "active",
      lifecycleStatus: "published",
      paymentStatus: "pending",
    }),
    true,
  );

  assert.equal(getFinancialEligibility({ paymentStatus: "pending" }), false);
  assert.equal(getFinancialEligibility({ paymentStatus: "confirmed" }), true);
});

test("tightens member removal after competitive or financial activity", () => {
  assert.equal(
    canRemoveMember({
      lifecycleStatus: "published",
      memberHasPrediction: false,
      paymentStatus: "pending",
    }).allowed,
    true,
  );

  assert.equal(
    canRemoveMember({
      lifecycleStatus: "published",
      memberHasPrediction: true,
      paymentStatus: "pending",
    }).allowed,
    false,
  );
});

test("recognizes valid public expectation from accepted invites or public publication", () => {
  assert.equal(
    hasValidPublicExpectation({
      lifecycleStatus: "published",
      accessPolicy: { join_mode: "public_open" },
      acceptedInviteCount: 0,
      approvedRequestCount: 0,
    }),
    true,
  );

  assert.equal(
    hasValidPublicExpectation({
      lifecycleStatus: "published",
      accessPolicy: { join_mode: "private_invite" },
      acceptedInviteCount: 1,
      approvedRequestCount: 0,
    }),
    true,
  );
});
