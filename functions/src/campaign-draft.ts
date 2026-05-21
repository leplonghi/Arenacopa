// campaign-draft.ts — createCampaignDraft callable
// Creates a draft campaign document after validating merchant plan.
// The merchant must have an active merchant profile with matching plan.

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import type {
  CampaignPlan,
  MerchantType,
  CampaignMode,
  WinnerModelConfig,
  PrizeModel,
  QuotaMode,
} from "./campaign-types";
import { PLAN_MAX_PARTICIPANTS, COPA_ENDS_AT } from "./campaign-types";

const db = admin.firestore();

/** Generates a random 8-char uppercase alphanumeric share code (no ambiguous chars). */
function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

export const createCampaignDraft = functions.https.onCall(
  {
    secrets: ["STRIPE_SECRET_KEY"],
  },
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login obrigatório");
    }

    const {
      plan,
      type,
      mode,
      name,
      benefit_summary,
      benefit_code,
      benefit_terms,
      winner_config,
      prize_model,
      quota_mode,
      quota_value,
      palpite_window_minutes,
      quiz_enabled,
    } = request.data as {
      plan: CampaignPlan;
      type: MerchantType;
      mode: CampaignMode;
      name: string;
      benefit_summary: string;
      benefit_code: string;
      benefit_terms?: string;
      winner_config: WinnerModelConfig;
      prize_model: PrizeModel;
      quota_mode: QuotaMode;
      quota_value?: number;
      palpite_window_minutes: 5 | 15 | 30;
      quiz_enabled: boolean;
    };

    // Validate required fields
    if (!name?.trim()) {
      throw new functions.https.HttpsError("invalid-argument", "Nome da campanha é obrigatório");
    }
    if (!benefit_summary?.trim()) {
      throw new functions.https.HttpsError("invalid-argument", "Benefício é obrigatório");
    }
    if (!["rodada", "torcida", "copa", "parceiro"].includes(plan)) {
      throw new functions.https.HttpsError("invalid-argument", "Plano inválido");
    }

    const uid = request.auth.uid;

    // Verify merchant profile exists and matches plan
    const merchantSnap = await db
      .collection("merchants")
      .where("owner_uid", "==", uid)
      .limit(1)
      .get();

    if (merchantSnap.empty) {
      throw new functions.https.HttpsError(
        "not-found",
        "Perfil de merchant não encontrado. Crie seu perfil primeiro.",
      );
    }

    const merchantDoc = merchantSnap.docs[0];
    const merchant = merchantDoc.data();

    if (merchant.plan !== plan) {
      throw new functions.https.HttpsError(
        "permission-denied",
        `Plano incompatível. Sua assinatura é ${merchant.plan}.`,
      );
    }
    if (merchant.status !== "active") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Conta de merchant não está ativa",
      );
    }

    // Generate unique share_code (retry up to 5x on collision)
    let shareCode = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateShareCode();
      const existing = await db.collection("campaign_tv_state").doc(candidate).get();
      if (!existing.exists) {
        shareCode = candidate;
        break;
      }
    }
    if (!shareCode) {
      throw new functions.https.HttpsError("internal", "Falha ao gerar código único. Tente novamente.");
    }

    const campaignRef = db.collection("campaigns").doc();
    const qrPayload = `https://arenacopa.com.br/c/${shareCode}`;
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Copa and Parceiro plans expire at the end of the tournament
    const endsAt =
      plan === "copa" || plan === "parceiro"
        ? admin.firestore.Timestamp.fromDate(COPA_ENDS_AT)
        : null;

    await campaignRef.set({
      merchant_id: merchantDoc.id,
      owner_uid: uid,
      type,
      mode,
      name: name.trim().slice(0, 80),
      description: null,
      logo_url: merchant.logo_url || null,
      status: "draft",
      plan,
      max_participants: PLAN_MAX_PARTICIPANTS[plan],
      participant_count: 0,
      prediction_quota_mode: quota_mode,
      prediction_quota_value: quota_value ?? null,
      winner_model: winner_config.type,
      winner_config,
      prize_model,
      quiz_enabled,
      benefit_summary: benefit_summary.trim(),
      benefit_code: benefit_code.toUpperCase().trim(),
      benefit_terms: benefit_terms?.trim() || null,
      share_code: shareCode,
      qr_payload: qrPayload,
      palpite_window_minutes,
      copa_round_tracking: plan !== "rodada",
      starts_at: null,
      ends_at: endsAt,
      stripe_order_id: null,
      paid_at: null,
      created_at: now,
      updated_at: now,
    });

    return {
      campaign_id: campaignRef.id,
      share_code: shareCode,
      qr_payload: qrPayload,
    };
  },
);
