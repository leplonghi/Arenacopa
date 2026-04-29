const test = require("node:test");
const assert = require("node:assert/strict");
const { buildPaymentProofUpdate } = require("../bolao-config/handlers");

test("buildPaymentProofUpdate records a member payment proof and prize agreement", () => {
  const updated = buildPaymentProofUpdate({
    currentMember: {
      id: "user-1_bolao-1",
      bolao_id: "bolao-1",
      user_id: "user-1",
      membership_status: "active",
      payment_status: "pending",
    },
    actorId: "user-1",
    bolaoId: "bolao-1",
    proofText: "Pix de R$ 25 enviado em nome de Edu",
    prizeAgreementAccepted: true,
    nowIso: "2026-04-27T12:00:00.000Z",
  });

  assert.equal(updated.payment_status, "pending");
  assert.equal(updated.payment_proof_text, "Pix de R$ 25 enviado em nome de Edu");
  assert.equal(updated.payment_proof_status, "submitted");
  assert.equal(updated.payment_proof_submitted_at, "2026-04-27T12:00:00.000Z");
  assert.equal(updated.prize_agreement_accepted, true);
  assert.equal(updated.prize_agreement_status, "submitted");
});

test("buildPaymentProofUpdate only lets the member update their own proof", () => {
  assert.throws(
    () =>
      buildPaymentProofUpdate({
        currentMember: {
          id: "user-2_bolao-1",
          bolao_id: "bolao-1",
          user_id: "user-2",
          membership_status: "active",
          payment_status: "pending",
        },
        actorId: "user-1",
        bolaoId: "bolao-1",
        proofText: "Comprovante",
        prizeAgreementAccepted: true,
        nowIso: "2026-04-27T12:00:00.000Z",
      }),
    /permission_denied/,
  );
});
