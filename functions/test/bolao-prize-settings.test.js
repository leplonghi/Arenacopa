const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizePrizeSettingsPayload,
  buildPrizeSettingsUpdate,
} = require("../bolao-prize/settings");

test("normalizePrizeSettingsPayload keeps legacy prize fields with safe values", () => {
  assert.deepEqual(
    normalizePrizeSettingsPayload({
      bolao_id: "bolaoA",
      prize_type: "money",
      prize_description: "Vale camisa oficial",
      pix_key: "user@example.com",
      caixinha_enabled: true,
      caixinha_value_per_person: "25.50",
    }),
    {
      bolaoId: "bolaoA",
      prizeType: "money",
      prizeDescription: "Vale camisa oficial",
      pixKey: "user@example.com",
      caixinhaEnabled: true,
      caixinhaValuePerPerson: 25.5,
    }
  );
});

test("normalizePrizeSettingsPayload clears pix and value when not needed", () => {
  assert.deepEqual(
    normalizePrizeSettingsPayload({
      bolao_id: "bolaoA",
      prize_type: "glory",
      prize_description: "",
      pix_key: "user@example.com",
      caixinha_enabled: false,
      caixinha_value_per_person: "20",
    }),
    {
      bolaoId: "bolaoA",
      prizeType: "glory",
      prizeDescription: null,
      pixKey: null,
      caixinhaEnabled: false,
      caixinhaValuePerPerson: null,
    }
  );
});

test("normalizePrizeSettingsPayload rejects invalid type, pix or fund amount", () => {
  assert.throws(
    () => normalizePrizeSettingsPayload({ bolao_id: "bolaoA", prize_type: "gold" }),
    /validation_failed/
  );
  assert.throws(
    () => normalizePrizeSettingsPayload({ bolao_id: "bolaoA", prize_type: "money", pix_key: "bad-pix" }),
    /validation_failed/
  );
  assert.throws(
    () =>
      normalizePrizeSettingsPayload({
        bolao_id: "bolaoA",
        prize_type: "glory",
        caixinha_enabled: true,
        caixinha_value_per_person: "-5",
      }),
    /validation_failed/
  );
});

test("buildPrizeSettingsUpdate preserves current legacy contract", () => {
  assert.deepEqual(
    buildPrizeSettingsUpdate(
      {
        prizeType: "beer",
        prizeDescription: "Rodada pós-final",
        pixKey: null,
        caixinhaEnabled: true,
        caixinhaValuePerPerson: 15,
      },
      "2026-04-29T12:00:00.000Z"
    ),
    {
      prize_type: "beer",
      prize_description: "Rodada pós-final",
      pix_key: null,
      caixinha_enabled: true,
      caixinha_value_per_person: 15,
      updated_at: "2026-04-29T12:00:00.000Z",
    }
  );
});
