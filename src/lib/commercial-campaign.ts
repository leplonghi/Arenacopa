export type CommercialBenefitValidation =
  | { ok: true; reasonCode: null }
  | { ok: false; reasonCode: "blocked_commercial_reward_language" | "empty_benefit" };

const blockedRewardTerms = [
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

export function normalizeBenefitCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase()
    .slice(0, 24);
}

export function validateCommercialBenefitText(value: string): CommercialBenefitValidation {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return { ok: false, reasonCode: "empty_benefit" };
  }

  if (blockedRewardTerms.some((term) => normalized.includes(term))) {
    return { ok: false, reasonCode: "blocked_commercial_reward_language" };
  }

  return { ok: true, reasonCode: null };
}

export function getCommercialBenefitPolicy() {
  return {
    allowsCashPrize: false,
    allowsWallet: false,
    allowsSweepstakes: false,
    allowsSimpleBenefitCode: true,
  };
}

export function buildCommercialShareText({
  merchantName,
  campaignTitle,
  benefitSummary,
  shareUrl,
}: {
  merchantName: string;
  campaignTitle: string;
  benefitSummary?: string | null;
  shareUrl: string;
}) {
  const benefitLine = benefitSummary ? `\nBenefício: ${benefitSummary}` : "";
  return [
    `${merchantName} abriu uma rodada especial no ArenaCup.`,
    campaignTitle,
    benefitLine.trim(),
    `Entre pelo link: ${shareUrl}`,
  ].filter(Boolean).join("\n");
}
