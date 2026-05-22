// campaign-prize.ts — validatePrizeRedemption callable
// Merchant scans or types the redemption code at the counter.
// Returns winner info and marks the prize as redeemed (idempotent on success).

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const validatePrizeRedemption = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login obrigatório");
  }

  const { redemption_code } = request.data as { redemption_code: string };
  if (!redemption_code?.trim()) {
    throw new functions.https.HttpsError("invalid-argument", "Código de resgate obrigatório");
  }

  const code = redemption_code.trim().toUpperCase();

  const snap = await db
    .collection("prize_redemptions")
    .where("redemption_code", "==", code)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new functions.https.HttpsError("not-found", "Código inválido ou não encontrado");
  }

  const doc = snap.docs[0];
  const redemption = doc.data();

  // Verify the caller is the merchant for this campaign
  const campaignDoc = await db.collection("campaigns").doc(redemption.campaign_id).get();
  if (!campaignDoc.exists || campaignDoc.data()!.owner_uid !== request.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Este prêmio não pertence à sua campanha",
    );
  }

  if (redemption.redeemed_at !== null) {
    return {
      ok: false,
      reason: "already_redeemed",
      redeemed_at: redemption.redeemed_at.toDate().toISOString(),
      winner_display_name: redemption.display_name,
    };
  }

  await doc.ref.update({
    redeemed_at: admin.firestore.FieldValue.serverTimestamp(),
    redeemed_by_uid: request.auth.uid,
  });

  return {
    ok: true,
    winner_display_name: redemption.display_name,
    prize_tier: redemption.prize_tier,
    benefit_code: redemption.benefit_code,
  };
});
