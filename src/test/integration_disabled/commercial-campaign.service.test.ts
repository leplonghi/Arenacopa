import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCommercialCampaignDraft,
  createCommercialCampaignCheckout,
  mapCommercialCampaign,
  syncCommercialCampaignCheckout,
} from "@/services/commercial/commercial-campaign.service";

vi.mock("@/integrations/firebase/client", () => ({
  auth: {
    currentUser: null,
  },
}));

describe("commercial-campaign.service", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          campaign_id: "campaign-1",
          merchant_id: "merchant-1",
          bolao_id: "bolao-1",
          status: "pending_payment",
          title: "Rodada do bar",
          pricing_plan: "single_match",
          included_games: 1,
          participant_limit: 100,
          billing_mode: "one_time",
          stripe_price_id: "price_123",
          share_code: "BAR123",
          qr_payload: "https://arenacup.net/c/BAR123",
          benefit_summary: "Mostre o código no balcão.",
          benefit_code: "RODADA-DO-BAR",
          benefit_terms: "Válido no dia do jogo.",
          merchant: {
            id: "merchant-1",
          name: "Bar do Zeca",
          cep: "60160-120",
          city: "Fortaleza",
          neighborhood: "Meireles",
          status: "active",
          },
        }),
      })),
    );
  });

  it("normalizes campaign documents returned by the backend", () => {
    const campaign = mapCommercialCampaign({
      campaign_id: "campaign-1",
      merchant_id: "merchant-1",
      status: "published",
      kind: "match",
      title: "Rodada do bar",
      pricing_plan: "single_match",
      included_games: 1,
      participant_limit: 100,
      billing_mode: "one_time",
      stripe_price_id: "price_123",
      share_code: "BAR123",
      qr_payload: "https://arenacup.net/c/BAR123",
      benefit_summary: "Mostre o código no balcão.",
      benefit_code: "RODADA-DO-BAR",
      benefit_terms: null,
    });

    expect(campaign.id).toBe("campaign-1");
    expect(campaign.shareCode).toBe("BAR123");
    expect(campaign.benefitCode).toBe("RODADA-DO-BAR");
    expect(campaign.participantLimit).toBe(100);
  });

  it("creates a commercial campaign draft through an authed function", async () => {
    const campaign = await createCommercialCampaignDraft({
      token: "token-1",
      payload: {
        merchant: {
          name: "Bar do Zeca",
          cep: "60160-120",
          city: "Fortaleza",
          neighborhood: "Meireles",
          contact_whatsapp: "85999999999",
        },
        campaign: {
          title: "Rodada do clássico",
          kind: "match",
          pricing_plan: "single_match",
          championship_id: "brasileirao2026",
          match_id: "match-1",
          starts_at: "2099-06-12T21:00:00.000Z",
          benefit_summary: "Mostre o código no balcão.",
          benefit_code: "RODADA-DO-BAR",
          benefit_terms: "Válido até o fim do jogo.",
        },
      },
    });

    expect(campaign.merchant?.name).toBe("Bar do Zeca");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/createCommercialCampaignDraft"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer token-1" }),
      }),
    );
  });

  it("starts checkout for a campaign and syncs the result", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ url: "https://checkout.stripe.test/1", sessionId: "cs_1", orderId: "order-1" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            campaign_id: "campaign-1",
            merchant_id: "merchant-1",
            status: "published",
            pricing_plan: "single_match",
            participant_limit: 100,
            billing_mode: "one_time",
            share_code: "BAR123",
            qr_payload: "https://arenacup.net/c/BAR123",
          }),
        }),
    );

    const checkout = await createCommercialCampaignCheckout({
      token: "token-1",
      payload: { campaign_id: "campaign-1", site_url: "https://arenacup.net" },
    });
    const campaign = await syncCommercialCampaignCheckout({
      token: "token-1",
      payload: { checkout_session_id: "cs_1" },
    });

    expect(checkout.orderId).toBe("order-1");
    expect(campaign.status).toBe("published");
  });
});
