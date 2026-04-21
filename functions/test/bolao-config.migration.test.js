const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeLegacyBolao } = require("../bolao-config/migration");

test("normalizeLegacyBolao produces conservative editability for legacy published pools", () => {
  const normalized = normalizeLegacyBolao({
    id: "legacy-1",
    status: "active",
    name: "Legado",
    format_id: "classic",
  });

  assert.equal(normalized.legacy_mode, true);
  assert.equal(normalized.editable_sections.presentation, true);
  assert.equal(normalized.editable_sections.competition_rules, false);
});
