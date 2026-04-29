const ALLOWED_PRIZE_TYPES = new Set(["money", "beer", "food", "task", "glory", "custom"]);

function normalizeOptionalText(value, maxLength = 280) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function isValidPixKey(key) {
  const trimmed = String(key || "").trim();
  if (!trimmed) return true;
  const raw = trimmed.replace(/[\s./-]/g, "");
  return (
    /^\d{11}$/.test(raw) ||
    /^\d{14}$/.test(raw) ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ||
    /^(\+55)?[\s-]?\(?\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}$/.test(trimmed) ||
    /^[0-9a-fA-F-]{32,36}$/.test(trimmed)
  );
}

function normalizePrizeSettingsPayload(input = {}) {
  const bolaoId = typeof input.bolao_id === "string" ? input.bolao_id.trim() : "";
  const prizeType = typeof input.prize_type === "string" && input.prize_type.trim() ? input.prize_type.trim() : "glory";
  const caixinhaEnabled = Boolean(input.caixinha_enabled);

  if (!bolaoId || !ALLOWED_PRIZE_TYPES.has(prizeType)) {
    throw new Error("validation_failed");
  }

  const prizeDescription = normalizeOptionalText(input.prize_description);
  const rawPixKey = normalizeOptionalText(input.pix_key, 160);
  const pixKey = prizeType === "money" ? rawPixKey : null;
  if (pixKey && !isValidPixKey(pixKey)) {
    throw new Error("validation_failed");
  }

  let caixinhaValuePerPerson = null;
  if (caixinhaEnabled && input.caixinha_value_per_person !== undefined && input.caixinha_value_per_person !== null && input.caixinha_value_per_person !== "") {
    const numericValue = Number(input.caixinha_value_per_person);
    if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 100000) {
      throw new Error("validation_failed");
    }
    caixinhaValuePerPerson = numericValue;
  }

  return {
    bolaoId,
    prizeType,
    prizeDescription,
    pixKey,
    caixinhaEnabled,
    caixinhaValuePerPerson,
  };
}

function buildPrizeSettingsUpdate(settings, nowIso) {
  return {
    prize_type: settings.prizeType,
    prize_description: settings.prizeDescription,
    pix_key: settings.pixKey,
    caixinha_enabled: settings.caixinhaEnabled,
    caixinha_value_per_person: settings.caixinhaEnabled ? settings.caixinhaValuePerPerson : null,
    updated_at: nowIso,
  };
}

async function updateBolaoPrizeSettings({ db, actorId, input, nowIso }) {
  if (!actorId) {
    throw new Error("auth_required");
  }

  const settings = normalizePrizeSettingsPayload(input);
  const bolaoRef = db.collection("boloes").doc(settings.bolaoId);
  const bolaoSnapshot = await bolaoRef.get();

  if (!bolaoSnapshot.exists) {
    throw new Error("not_found");
  }

  const before = { id: bolaoSnapshot.id, ...bolaoSnapshot.data() };
  if (before.creator_id && before.creator_id !== actorId) {
    throw new Error("permission_denied");
  }

  const update = buildPrizeSettingsUpdate(settings, nowIso);
  await bolaoRef.set(update, { merge: true });

  return {
    bolao_id: settings.bolaoId,
    ...update,
  };
}

module.exports = {
  normalizePrizeSettingsPayload,
  buildPrizeSettingsUpdate,
  updateBolaoPrizeSettings,
};
