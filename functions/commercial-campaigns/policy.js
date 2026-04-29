const BLOCKED_REWARD_TERMS = [
    "aposta",
    "apostar",
    "bet",
    "odd",
    "odds",
    "dinheiro",
    "pix",
    "premio",
    "prêmio",
    "premiacao",
    "premiação",
    "sorteio",
    "rifa",
    "cashback",
    "carteira",
    "rateio",
    "bolada",
    "ganhe dinheiro",
    "lucro",
];

function normalizeBenefitCode(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/[^A-Za-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toUpperCase()
        .slice(0, 24);
}

function validateCommercialBenefitText(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) {
        throw new Error("validation_failed");
    }

    if (BLOCKED_REWARD_TERMS.some((term) => normalized.includes(term))) {
        throw new Error("blocked_commercial_reward_language");
    }
}

function assertSafeCommercialCampaignInput({ benefitSummary, benefitTerms }) {
    validateCommercialBenefitText(benefitSummary);
    if (benefitTerms) {
        validateCommercialBenefitText(benefitTerms);
    }
}

function buildCommercialShareCode(source) {
    const clean = String(source || "")
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase();
    return clean.slice(-8).padStart(6, "B");
}

module.exports = {
    assertSafeCommercialCampaignInput,
    buildCommercialShareCode,
    normalizeBenefitCode,
};
