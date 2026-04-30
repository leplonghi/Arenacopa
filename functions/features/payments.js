const { createHttpFunction } = require("../shared/middleware");
const commercialCampaignRepository = require("../commercial-campaigns/repository");

// Helper (porting from index.js)
async function stripeApiRequest({ method, path, params = null, idempotencyKey = null }) {
    const functions = require("firebase-functions");
    const runtimeConfig = functions.config();
    const stripeSecretKey = runtimeConfig?.stripe?.secret_key || process.env.STRIPE_SECRET_KEY || "";
    
    if (!stripeSecretKey) {
        throw new Error("STRIPE_SECRET_KEY não configurada.");
    }

    const STRIPE_API_BASE_URL = "https://api.stripe.com/v1";
    const STRIPE_API_VERSION = "2026-02-25.clover";

    const headers = {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Stripe-Version": STRIPE_API_VERSION,
    };
    if (idempotencyKey) {
        headers["Idempotency-Key"] = idempotencyKey;
    }

    let url = `${STRIPE_API_BASE_URL}${path}`;
    const requestInit = {
        method,
        headers,
    };

    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

    if (method === "GET" && params) {
        url += `?${new URLSearchParams(params).toString()}`;
    } else if (params) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        requestInit.body = new URLSearchParams(params).toString();
    }

    const response = await fetch(url, requestInit);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error?.message || "Falha ao comunicar com o Stripe.");
    }

    return data;
}

exports.createCommercialCampaignCheckout = createHttpFunction(async ({ actorId, payload, db }) => {
    const { campaign_id: campaignId, pricing_plan_id: pricingPlanId } = payload || {};
    if (!campaignId || !pricingPlanId) {
        throw new Error("validation_failed");
    }

    const functions = require("firebase-functions");
    const runtimeConfig = functions.config();
    const siteUrl = runtimeConfig?.app?.site_url || "https://arenacopa.app";

    const campaign = await commercialCampaignRepository.loadCampaignView({ db, campaignId });
    if (!campaign || campaign.creator_id !== actorId) {
        throw new Error("permission_denied");
    }

    const priceIds = runtimeConfig?.stripe?.commercial_campaign_price_ids || {};
    const stripePriceId = priceIds[pricingPlanId];
    if (!stripePriceId) {
        throw new Error("invalid_pricing_plan");
    }

    const session = await stripeApiRequest({
        method: "POST",
        path: "/checkout/sessions",
        params: {
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [{ price: stripePriceId, quantity: 1 }],
            success_url: `${siteUrl}/campanhas/${campaignId}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}/campanhas/${campaignId}?checkout=cancelled`,
            client_reference_id: actorId,
            metadata: { user_id: actorId, campaign_id: campaignId, pricing_plan_id: pricingPlanId },
        },
    });

    const order = await commercialCampaignRepository.createOrder({
        db,
        actorId,
        campaignId,
        checkoutSession: session,
        stripePriceId,
        pricingPlan: pricingPlanId,
        nowIso: new Date().toISOString(),
    });

    return {
        url: session.url,
        sessionId: session.id,
        orderId: order.orderId,
    };
});

exports.syncCommercialCampaignCheckout = createHttpFunction(async ({ actorId, payload, db }) => {
    const checkoutSessionId = payload?.checkout_session_id || "";
    if (!checkoutSessionId) {
        throw new Error("validation_failed");
    }

    const session = await stripeApiRequest({
        method: "GET",
        path: `/checkout/sessions/${checkoutSessionId}`,
    });

    const sessionUserId = session.client_reference_id || session.metadata?.user_id || null;
    if (sessionUserId && sessionUserId !== actorId) {
        throw new Error("permission_denied");
    }

    return commercialCampaignRepository.publishPaidCampaign({
        db,
        actorId,
        checkoutSession: session,
        nowIso: new Date().toISOString(),
    });
});
