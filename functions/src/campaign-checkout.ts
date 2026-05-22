// campaign-checkout.ts — Stripe checkout for campaign plans
// createCampaignCheckout: generates a Stripe Checkout session for a draft campaign.
// syncCampaignCheckout: called after redirect back from Stripe to confirm payment
//   and activate the campaign + create the TV state document.

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import type { CampaignPlan } from "./campaign-types";

const db = admin.firestore();

// Stripe Price secret name per plan — set via firebase functions:secrets:set
const PLAN_PRICE_SECRET: Record<CampaignPlan, string> = {
  rodada:   "STRIPE_PRICE_CAMPANHA_RODADA",
  torcida:  "STRIPE_PRICE_CAMPANHA_TORCIDA",
  copa:     "STRIPE_PRICE_CAMPANHA_COPA",
  parceiro: "STRIPE_PRICE_CAMPANHA_PARCEIRO",
};

const PLAN_MODE: Record<CampaignPlan, "payment" | "subscription"> = {
  rodada:   "payment",
  torcida:  "payment",
  copa:     "payment",
  parceiro: "subscription",
};

const CAMPAIGN_SECRETS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_PRICE_CAMPANHA_RODADA",
  "STRIPE_PRICE_CAMPANHA_TORCIDA",
  "STRIPE_PRICE_CAMPANHA_COPA",
  "STRIPE_PRICE_CAMPANHA_PARCEIRO",
] as const;

export const createCampaignCheckout = functions.https.onCall(
  { secrets: [...CAMPAIGN_SECRETS] },
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login obrigatório");
    }

    const { campaign_id, success_url, cancel_url } = request.data as {
      campaign_id: string;
      success_url: string;
      cancel_url: string;
    };

    const campaignDoc = await db.collection("campaigns").doc(campaign_id).get();
    if (!campaignDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Campanha não encontrada");
    }

    const campaign = campaignDoc.data()!;
    if (campaign.owner_uid !== request.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Campanha não é sua");
    }
    if (campaign.status !== "draft") {
      throw new functions.https.HttpsError("failed-precondition", "Campanha já foi paga");
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new functions.https.HttpsError("internal", "Stripe não configurado");

    const plan = campaign.plan as CampaignPlan;
    const priceId = process.env[PLAN_PRICE_SECRET[plan]];
    if (!priceId) {
      throw new functions.https.HttpsError(
        "internal",
        `Price ID não configurado para o plano: ${plan}`,
      );
    }

    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: PLAN_MODE[plan],
      line_items: [{ price: priceId, quantity: 1 }],
      // {CHECKOUT_SESSION_ID} is replaced by Stripe on redirect
      success_url: success_url.replace("{CHECKOUT_SESSION_ID}", "{CHECKOUT_SESSION_ID}"),
      cancel_url,
      metadata: { campaign_id, owner_uid: request.auth.uid },
      client_reference_id: campaign_id,
    });

    // Store session ID on campaign doc so we can sync later
    await db.collection("campaigns").doc(campaign_id).update({
      stripe_order_id: session.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { url: session.url };
  },
);

export const syncCampaignCheckout = functions.https.onCall(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login obrigatório");
    }

    const { session_id } = request.data as { session_id: string };
    if (!session_id) {
      throw new functions.https.HttpsError("invalid-argument", "session_id obrigatório");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return { status: "pending" };
    }

    const campaignId = session.metadata?.campaign_id;
    if (!campaignId) {
      throw new functions.https.HttpsError("internal", "Metadado campaign_id ausente na sessão Stripe");
    }

    const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
    if (!campaignDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Campanha não encontrada");
    }

    const campaign = campaignDoc.data()!;
    if (campaign.owner_uid !== request.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Campanha não é sua");
    }

    // Idempotent — already activated
    if (campaign.status !== "draft") {
      return { status: "already_active", campaign_id: campaignId };
    }

    const merchantId = campaign.merchant_id;

    // Activate campaign (merchant credits are consumed per game, not per campaign)
    await db.runTransaction(async (t) => {
      t.update(db.collection("campaigns").doc(campaignId), {
        status: "active",
        paid_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      t.update(db.collection("merchants").doc(merchantId), {
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Create the public ArenaTV state document (keyed by share_code)
    const merchantDoc = await db.collection("merchants").doc(merchantId).get();
    const merchant = merchantDoc.data()!;
    await db.collection("campaign_tv_state").doc(campaign.share_code).set({
      campaign_id: campaignId,
      merchant_name: merchant.name,
      logo_url: campaign.logo_url || merchant.logo_url || null,
      benefit_summary: campaign.benefit_summary,
      current_game_id: null,
      current_match: null,
      participant_count: 0,
      top_rankings: [],
      quiz_active: false,
      quiz_question: null,
      quiz_timer_ends_at: null,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { status: "active", campaign_id: campaignId };
  },
);
