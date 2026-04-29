import { describe, expect, it } from "vitest";
import {
  buildCommercialShareText,
  getCommercialBenefitPolicy,
  normalizeBenefitCode,
  validateCommercialBenefitText,
} from "@/lib/commercial-campaign";

describe("commercial campaign policy", () => {
  it("blocks benefit copy that suggests betting, cash prizes or sweepstakes", () => {
    const result = validateCommercialBenefitText("Ganhe dinheiro no sorteio do bar com aposta de R$ 10");

    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe("blocked_commercial_reward_language");
  });

  it("allows simple non-financial benefits for participants", () => {
    const result = validateCommercialBenefitText("Mostre o código no balcão e ganhe 10% de desconto no petisco da rodada.");

    expect(result.ok).toBe(true);
  });

  it("normalizes benefit codes for bar counter validation", () => {
    expect(normalizeBenefitCode(" rodada  especial  ")).toBe("RODADA-ESPECIAL");
  });

  it("builds share text without bet-like language", () => {
    const text = buildCommercialShareText({
      merchantName: "Bar do Zeca",
      campaignTitle: "Rodada do clássico",
      shareUrl: "https://arenacup.net/c/ABC123",
      benefitSummary: "Mostre o código no balcão.",
    });

    expect(text).toContain("Bar do Zeca");
    expect(text).toContain("https://arenacup.net/c/ABC123");
    expect(text.toLowerCase()).not.toContain("aposta");
    expect(text.toLowerCase()).not.toContain("prêmio");
  });

  it("documents the v1 commercial safety boundary", () => {
    expect(getCommercialBenefitPolicy()).toEqual({
      allowsCashPrize: false,
      allowsWallet: false,
      allowsSweepstakes: false,
      allowsSimpleBenefitCode: true,
    });
  });
});
