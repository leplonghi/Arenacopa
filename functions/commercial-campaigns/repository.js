const admin = require("firebase-admin");
const bolaoConfigHandlers = require("../bolao-config/handlers");
const bolaoConfigRepository = require("../bolao-config/repository");
const {
    assertSafeCommercialCampaignInput,
    buildCommercialShareCode,
    normalizeBenefitCode,
} = require("./policy");
const { resolveCommercialPricingPlan } = require("./pricing");

function cleanString(value, fallback = "") {
    return String(value || fallback).trim();
}

function cleanNullableString(value) {
    const next = cleanString(value);
    return next || null;
}

function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
}

function normalizeCep(value) {
    const digits = digitsOnly(value);
    if (digits.length !== 8) {
        throw new Error("invalid_cep");
    }
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function normalizeWhatsapp(value) {
    const digits = digitsOnly(value);
    if (!digits) return null;
    if (![10, 11].includes(digits.length)) {
        throw new Error("invalid_phone");
    }
    return digits;
}

function normalizeInstagram(value) {
    const raw = cleanString(value);
    if (!raw) return null;
    return raw
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^instagram\.com\//i, "")
        .replace(/^@/, "")
        .replace(/\/+$/, "")
        .trim()
        .slice(0, 60) || null;
}

function assertFutureDate(value, nowIso, errorCode) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || date.getTime() <= new Date(nowIso).getTime()) {
        throw new Error(errorCode);
    }
    return date.toISOString();
}

function normalizeMerchantPayload(input = {}) {
    const name = cleanString(input.name);
    const cep = normalizeCep(input.cep);
    const city = cleanString(input.city);
    const neighborhood = cleanString(input.neighborhood);

    if (name.length < 3 || city.length < 2 || neighborhood.length < 2) {
        throw new Error("validation_failed");
    }

    return {
        name,
        cep,
        city,
        neighborhood,
        contact_whatsapp: normalizeWhatsapp(input.contact_whatsapp),
        instagram: normalizeInstagram(input.instagram),
    };
}

function normalizeCampaignPayload(input = {}, options = {}) {
    const nowIso = options.nowIso || new Date().toISOString();
    const rawKind = cleanString(input.kind || (input.match_id ? "match" : input.starts_at && input.ends_at ? "period" : "match"));
    const kind = rawKind === "period" ? "period" : "match";
    const title = cleanString(input.title);
    const requestedPricingPlan = cleanString(input.pricing_plan || "single_match");
    const benefitSummary = cleanString(input.benefit_summary);
    const benefitTerms = cleanNullableString(input.benefit_terms);
    const benefitCode = normalizeBenefitCode(input.benefit_code || title);
    const matchId = cleanNullableString(input.match_id);
    const startsAt = cleanNullableString(input.starts_at);
    const endsAt = cleanNullableString(input.ends_at);

    const pricing = resolveCommercialPricingPlan(requestedPricingPlan);
    const pricingPlan = pricing.plan_id;

    if (title.length < 3 || title.length > 90 || benefitCode.length < 4) {
        throw new Error("validation_failed");
    }

    if (kind === "match") {
        if (!matchId || !startsAt) {
            throw new Error("validation_failed");
        }
        assertFutureDate(startsAt, nowIso, "match_not_future");
    }

    if (kind === "period") {
        if (!startsAt || !endsAt) {
            throw new Error("invalid_campaign_period");
        }
        const normalizedStart = assertFutureDate(startsAt, nowIso, "invalid_campaign_period");
        const normalizedEnd = new Date(endsAt);
        if (Number.isNaN(normalizedEnd.getTime()) || normalizedEnd.getTime() <= new Date(normalizedStart).getTime()) {
            throw new Error("invalid_campaign_period");
        }
    }

    assertSafeCommercialCampaignInput({
        benefitSummary,
        benefitTerms,
    });

    return {
        kind,
        title,
        pricing_plan: pricingPlan,
        included_games: pricing.included_games,
        participant_limit: pricing.participant_limit,
        billing_mode: pricing.billing_mode,
        stripe_price_id: null,
        championship_id: cleanNullableString(input.championship_id),
        match_id: kind === "match" ? matchId : null,
        starts_at: startsAt,
        ends_at: kind === "period" ? endsAt : null,
        benefit_summary: benefitSummary,
        benefit_code: benefitCode,
        benefit_terms: benefitTerms,
        generated_title_source: cleanNullableString(input.generated_title_source),
    };
}

async function writeCommercialAudit({ db, actorId, merchantId, campaignId = null, action, before = null, after = null, reason = null }) {
    await db.collection("commercial_audit").add({
        actor_id: actorId,
        merchant_id: merchantId,
        campaign_id: campaignId,
        action,
        before,
        after,
        reason,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function getMerchantRole({ db, merchantId, userId }) {
    const staffSnapshot = await db.collection("merchant_staff").doc(`${merchantId}_${userId}`).get();
    if (!staffSnapshot.exists) return null;
    return staffSnapshot.data().role || null;
}

async function assertCanManageMerchant({ db, merchantId, userId }) {
    const role = await getMerchantRole({ db, merchantId, userId });
    if (!["owner", "manager"].includes(role)) {
        throw new Error("permission_denied");
    }
    return role;
}

async function createOrLoadMerchant({ db, actorId, merchantId, merchantInput, nowIso }) {
    if (merchantId) {
        await assertCanManageMerchant({ db, merchantId, userId: actorId });
        const snapshot = await db.collection("merchants").doc(merchantId).get();
        if (!snapshot.exists) {
            throw new Error("not_found");
        }
        const data = snapshot.data();
        if (data.status === "blocked") {
            throw new Error("permission_denied");
        }
        return { id: snapshot.id, data };
    }

    const merchant = normalizeMerchantPayload(merchantInput);
    const merchantRef = db.collection("merchants").doc();
    const merchantDoc = {
        ...merchant,
        owner_uid: actorId,
        status: "active",
        created_at: nowIso,
        updated_at: nowIso,
    };

    await merchantRef.set(merchantDoc);
    await db.collection("merchant_staff").doc(`${merchantRef.id}_${actorId}`).set({
        merchant_id: merchantRef.id,
        user_id: actorId,
        role: "owner",
        created_at: nowIso,
        updated_at: nowIso,
    });
    await writeCommercialAudit({
        db,
        actorId,
        merchantId: merchantRef.id,
        action: "create_merchant",
        after: merchantDoc,
    });

    return { id: merchantRef.id, data: merchantDoc };
}

async function createCampaignBolao({ db, actorId, nowIso, campaign, merchant }) {
    const bolaoRef = db.collection("boloes").doc();
    const payload = bolaoConfigHandlers.buildDraftBolaoDocument({
        bolaoId: bolaoRef.id,
        actorId,
        nowIso,
        input: {
            championship_id: campaign.championship_id || null,
            presentation: {
                name: campaign.title,
                description: `${merchant.name} abriu uma rodada especial para sua turma.`,
                emoji: "🏢",
                invite_message: "Entre pelo QR da campanha e marque seus resultados com a turma.",
            },
            context: {
                group_binding_mode: "none",
                grupo_id: null,
            },
            access_policy: {
                join_mode: "public_open",
                visibility: "public",
                admission_mode: "direct_open",
            },
            competition_rules: {
                pool_type: "quick",
                format: "classic",
                scoring_mode: "default",
                markets: ["match_winner"],
                scoring_rules: {
                    exact: 10,
                    winner: 3,
                    draw: 3,
                    participation: 1,
                },
            },
            finance_rules: {
                finance_mode: "free",
                entry_fee_amount: null,
                distribution_custom_text: "",
                payment_details: "",
            },
        },
    });

    payload.commercial_context = {
        merchant_id: merchant.id,
        participant_limit: campaign.participant_limit || null,
        commercial_type: "business_campaign",
        sponsor_visibility: "branded",
    };

    const created = await bolaoConfigRepository.createDraft({
        db,
        bolaoId: bolaoRef.id,
        payload,
    });

    return { id: bolaoRef.id, data: created };
}

async function createCampaignDraft({ db, actorId, body, siteUrl, nowIso }) {
    const merchant = await createOrLoadMerchant({
        db,
        actorId,
        merchantId: cleanNullableString(body?.merchant_id),
        merchantInput: body?.merchant || {},
        nowIso,
    });
    const campaignInput = normalizeCampaignPayload(body?.campaign || {}, { nowIso });
    const bolao = await createCampaignBolao({
        db,
        actorId,
        nowIso,
        campaign: campaignInput,
        merchant: { id: merchant.id, ...merchant.data },
    });
    const campaignRef = db.collection("commercial_campaigns").doc();
    const shareCode = buildCommercialShareCode(campaignRef.id);
    const normalizedSiteUrl = String(siteUrl || "https://arenacopa.app").replace(/\/$/, "");
    const campaignDoc = {
        ...campaignInput,
        merchant_id: merchant.id,
        bolao_id: bolao.id,
        group_id: null,
        status: "pending_payment",
        share_code: shareCode,
        qr_payload: `${normalizedSiteUrl}/c/${shareCode}`,
        paid_order_id: null,
        created_by: actorId,
        created_at: nowIso,
        updated_at: nowIso,
    };

    await campaignRef.set(campaignDoc);
    await db.collection("boloes").doc(bolao.id).set({
        commercial_context: {
            merchant_id: merchant.id,
            campaign_id: campaignRef.id,
            participant_limit: campaignInput.participant_limit || null,
            commercial_type: "business_campaign",
            sponsor_visibility: "branded",
        },
    }, { merge: true });
    await writeCommercialAudit({
        db,
        actorId,
        merchantId: merchant.id,
        campaignId: campaignRef.id,
        action: "create_commercial_campaign",
        after: campaignDoc,
    });

    return loadCampaignView({ db, campaignId: campaignRef.id });
}

async function loadCampaignView({ db, campaignId, shareCode }) {
    let campaignSnapshot;
    if (campaignId) {
        campaignSnapshot = await db.collection("commercial_campaigns").doc(campaignId).get();
    } else {
        const querySnapshot = await db
            .collection("commercial_campaigns")
            .where("share_code", "==", shareCode)
            .limit(1)
            .get();
        campaignSnapshot = querySnapshot.docs[0];
    }

    if (!campaignSnapshot?.exists) {
        throw new Error("not_found");
    }

    const campaign = campaignSnapshot.data();
    const [merchantSnapshot, bolaoSnapshot] = await Promise.all([
        db.collection("merchants").doc(campaign.merchant_id).get(),
        campaign.bolao_id ? db.collection("boloes").doc(campaign.bolao_id).get() : null,
    ]);

    const merchantData = merchantSnapshot.exists ? merchantSnapshot.data() : {};
    const bolaoData = bolaoSnapshot?.exists ? bolaoSnapshot.data() : {};

    return {
        campaign_id: campaignSnapshot.id,
        id: campaignSnapshot.id,
        ...campaign,
        merchant: {
            id: merchantSnapshot.id,
            ...merchantData,
        },
        bolao_invite_code: bolaoData.invite_code || null,
    };
}

async function getManagedCampaign({ db, actorId, campaignId }) {
    const view = await loadCampaignView({ db, campaignId });
    await assertCanManageMerchant({
        db,
        merchantId: view.merchant_id,
        userId: actorId,
    });
    return view;
}

async function listManagedMerchants({ db, actorId }) {
    const staffSnapshot = await db
        .collection("merchant_staff")
        .where("user_id", "==", actorId)
        .get();
    const merchantIds = Array.from(new Set(staffSnapshot.docs.map((doc) => doc.data().merchant_id).filter(Boolean)));
    if (!merchantIds.length) {
        return [];
    }

    const snapshots = await Promise.all(merchantIds.map((merchantId) => db.collection("merchants").doc(merchantId).get()));
    return snapshots
        .filter((snapshot) => snapshot.exists)
        .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
        .filter((merchant) => merchant.status !== "blocked")
        .sort((left, right) => String(right.updated_at || right.created_at || "").localeCompare(String(left.updated_at || left.created_at || "")));
}

async function createOrder({ db, actorId, campaignId, checkoutSession, stripePriceId, pricingPlan, nowIso }) {
    const campaign = await getManagedCampaign({ db, actorId, campaignId });
    if (!["pending_payment", "draft"].includes(campaign.status)) {
        throw new Error("invalid_state");
    }

    const orderRef = db.collection("commercial_orders").doc();
    const orderDoc = {
        merchant_id: campaign.merchant_id,
        campaign_id: campaignId,
        status: "pending",
        stripe_checkout_session_id: checkoutSession.id,
        checkout_url: checkoutSession.url || null,
        amount: checkoutSession.amount_total ?? null,
        currency: checkoutSession.currency ?? null,
        created_by: actorId,
        created_at: nowIso,
        updated_at: nowIso,
    };

    await orderRef.set(orderDoc);
    await db.collection("commercial_campaigns").doc(campaignId).set({
        paid_order_id: orderRef.id,
        pricing_plan: pricingPlan || campaign.pricing_plan,
        status: "pending_payment",
        stripe_price_id: stripePriceId || null,
        updated_at: nowIso,
    }, { merge: true });
    await writeCommercialAudit({
        db,
        actorId,
        merchantId: campaign.merchant_id,
        campaignId,
        action: "create_commercial_order",
        after: orderDoc,
    });

    return {
        orderId: orderRef.id,
        campaign,
    };
}

async function publishPaidCampaign({ db, actorId, checkoutSession, nowIso }) {
    const orderSnapshot = await db
        .collection("commercial_orders")
        .where("stripe_checkout_session_id", "==", checkoutSession.id)
        .limit(1)
        .get();

    if (orderSnapshot.empty) {
        throw new Error("not_found");
    }

    const orderRef = orderSnapshot.docs[0].ref;
    const order = orderSnapshot.docs[0].data();
    const campaignRef = db.collection("commercial_campaigns").doc(order.campaign_id);
    const campaignSnapshot = await campaignRef.get();

    if (!campaignSnapshot.exists) {
        throw new Error("not_found");
    }

    const campaign = campaignSnapshot.data();
    await assertCanManageMerchant({
        db,
        merchantId: campaign.merchant_id,
        userId: actorId,
    });

    const isPaid = checkoutSession.status === "complete" && checkoutSession.payment_status === "paid";
    await orderRef.set({
        status: isPaid ? "paid" : "failed",
        amount: checkoutSession.amount_total ?? order.amount ?? null,
        currency: checkoutSession.currency ?? order.currency ?? null,
        updated_at: nowIso,
        paid_at: isPaid ? nowIso : null,
    }, { merge: true });

    if (!isPaid) {
        throw new Error("payment_required");
    }

    const bolaoSnapshot = await db.collection("boloes").doc(campaign.bolao_id).get();
    if (!bolaoSnapshot.exists) {
        throw new Error("not_found");
    }

    const bolaoData = bolaoSnapshot.data();
    if (bolaoData.lifecycle?.status === "draft") {
        await bolaoConfigRepository.publishBolao({
            db,
            bolaoId: campaign.bolao_id,
            actorId,
            expectedConfigVersion: Number(bolaoData.integrity?.config_version || 1),
            nowIso,
        });
    }

    await campaignRef.set({
        status: "published",
        published_at: campaign.published_at || nowIso,
        updated_at: nowIso,
    }, { merge: true });
    await writeCommercialAudit({
        db,
        actorId,
        merchantId: campaign.merchant_id,
        campaignId: campaignSnapshot.id,
        action: "publish_commercial_campaign",
        after: { status: "published", order_id: orderSnapshot.docs[0].id },
    });

    return loadCampaignView({ db, campaignId: campaignSnapshot.id });
}

module.exports = {
    createCampaignDraft,
    createOrder,
    getManagedCampaign,
    listManagedMerchants,
    loadCampaignView,
    normalizeCampaignPayload,
    normalizeMerchantPayload,
    publishPaidCampaign,
};
