// campaign-tv.ts — updateCampaignTvState trigger
// Triggered when any ranking document in campaign_games/{gameId}/rankings is written.
// Reads top 10 rankings and updates the public campaign_tv_state document.
// Only display_name + total_points + rank are written — zero PII.

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const updateCampaignTvState = functions.firestore.onDocumentWritten(
  "campaign_games/{gameId}/rankings/{userId}",
  async (event) => {
    const gameId = event.params.gameId;

    const gameDoc = await db.collection("campaign_games").doc(gameId).get();
    if (!gameDoc.exists) return;

    const campaignId: string = gameDoc.data()!.campaign_id;
    const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
    if (!campaignDoc.exists) return;

    const shareCode: string = campaignDoc.data()!.share_code;

    // Fetch top 10 by total_points — no PII (display_name is user-chosen pseudonym)
    const rankingsSnap = await db
      .collection("campaign_games")
      .doc(gameId)
      .collection("rankings")
      .orderBy("total_points", "desc")
      .limit(10)
      .get();

    const top_rankings = rankingsSnap.docs.map((doc) => ({
      display_name: doc.data().display_name as string,
      total_points: doc.data().total_points as number,
      rank: doc.data().rank as number,
    }));

    await db.collection("campaign_tv_state").doc(shareCode).update({
      top_rankings,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
);
