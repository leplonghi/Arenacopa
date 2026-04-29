const assert = require("node:assert/strict");
const test = require("node:test");
const {
    normalizeCampaignPayload,
    normalizeMerchantPayload,
} = require("../commercial-campaigns/repository");

test("normalizeMerchantPayload requires valid CEP and WhatsApp formats", () => {
    assert.throws(
        () => normalizeMerchantPayload({ name: "Arena", cep: "123", city: "Fortaleza", neighborhood: "Meireles", contact_whatsapp: "85999999999" }),
        /invalid_cep/,
    );

    assert.throws(
        () => normalizeMerchantPayload({ name: "Arena", cep: "60160-120", city: "Fortaleza", neighborhood: "Meireles", contact_whatsapp: "9999" }),
        /invalid_phone/,
    );

    const merchant = normalizeMerchantPayload({
        name: "Arena Empresas",
        cep: "60160120",
        city: "Fortaleza",
        neighborhood: "Meireles",
        contact_whatsapp: "(85) 99999-9999",
        instagram: "https://instagram.com/arena.cup/",
    });

    assert.equal(merchant.cep, "60160-120");
    assert.equal(merchant.contact_whatsapp, "85999999999");
    assert.equal(merchant.instagram, "arena.cup");
});

test("normalizeCampaignPayload enforces match and period campaign constraints", () => {
    const nowIso = "2026-04-27T12:00:00.000Z";

    assert.throws(
        () => normalizeCampaignPayload({ kind: "match", title: "Rodada", benefit_summary: "Desconto simples", benefit_code: "RODADA" }, { nowIso }),
        /validation_failed/,
    );

    assert.throws(
        () => normalizeCampaignPayload({ kind: "match", title: "Rodada", match_id: "match-1", starts_at: "2026-04-01T12:00:00.000Z", benefit_summary: "Desconto simples", benefit_code: "RODADA" }, { nowIso }),
        /match_not_future/,
    );

    assert.throws(
        () => normalizeCampaignPayload({ kind: "period", title: "Semana da empresa", starts_at: "2026-04-29T12:00:00.000Z", ends_at: "2026-04-28T12:00:00.000Z", benefit_summary: "Desconto simples", benefit_code: "SEMANA" }, { nowIso }),
        /invalid_campaign_period/,
    );

    const campaign = normalizeCampaignPayload({
        kind: "period",
        pricing_plan: "unlimited_monthly",
        title: "Semana da empresa",
        starts_at: "2026-04-28T12:00:00.000Z",
        ends_at: "2026-04-29T12:00:00.000Z",
        benefit_summary: "Desconto simples",
        benefit_code: "SEMANA",
        generated_title_source: "manual",
    }, { nowIso });

    assert.equal(campaign.kind, "period");
    assert.equal(campaign.pricing_plan, "full_cup");
    assert.equal(campaign.billing_mode, "one_time");
    assert.equal(campaign.included_games, 32);
    assert.equal(campaign.participant_limit, 1000);
    assert.equal(campaign.generated_title_source, "manual");
});
