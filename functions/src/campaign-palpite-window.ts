// campaign-palpite-window.ts — lockPalpiteWindow scheduler
// Runs every minute. Finds campaign_games with status="open" whose
// palpite_window_closes_at has passed, and sets them to "locked".
// This ensures palpites stop being accepted even if no client polls.

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const lockPalpiteWindow = functions.scheduler.onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "America/Sao_Paulo",
  },
  async () => {
    const now = admin.firestore.Timestamp.now();

    const snap = await db
      .collection("campaign_games")
      .where("status", "==", "open")
      .where("palpite_window_closes_at", "<=", now)
      .limit(20) // process max 20 per invocation; next run handles remainder
      .get();

    if (snap.empty) {
      console.log("lockPalpiteWindow: nenhum jogo para fechar");
      return;
    }

    const batch = db.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "locked",
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    console.log(`lockPalpiteWindow: ${snap.size} janela(s) fechada(s)`);
  },
);
