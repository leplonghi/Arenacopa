// campaign-maintenance.ts — expireCampaigns + sendRenewalReminders + checkStaleBoloes schedulers
// expireCampaigns: runs daily after the Copa ends (19/07/2026),
//   marks copa/torcida campaigns as "finished".
// sendRenewalReminders: runs daily, sends in-app notifications to merchants
//   about low credits or plan expiry.
// checkStaleBoloes: runs daily, marks bolões as "finished" when all their
//   bolao_markets are resolved (safety net in case the realtime trigger missed one).

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { COPA_ENDS_AT } from "./campaign-types";

const db = admin.firestore();

export const expireCampaigns = functions.scheduler.onSchedule(
  {
    schedule: "0 7 * * *", // 7am BRT daily
    timeZone: "America/Sao_Paulo",
  },
  async () => {
    const now = new Date();
    if (now < COPA_ENDS_AT) {
      console.log("expireCampaigns: Copa ainda não terminou, pulando");
      return;
    }

    const snap = await db
      .collection("campaigns")
      .where("plan", "in", ["copa", "torcida"])
      .where("status", "==", "active")
      .limit(100)
      .get();

    if (snap.empty) {
      console.log("expireCampaigns: nenhuma campanha para expirar");
      return;
    }

    const batch = db.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "finished",
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    console.log(`expireCampaigns: ${snap.size} campanha(s) encerrada(s)`);
  },
);

export const sendRenewalReminders = functions.scheduler.onSchedule(
  {
    schedule: "0 9 * * *", // 9am BRT daily
    timeZone: "America/Sao_Paulo",
  },
  async () => {
    const batch = db.batch();
    let count = 0;

    // Rodada: 0 credits remaining → suggest repurchase
    const rodadaSnap = await db
      .collection("merchants")
      .where("plan", "==", "rodada")
      .where("plan_credits", "==", 0)
      .get();

    for (const doc of rodadaSnap.docs) {
      batch.set(db.collection("notifications").doc(), {
        user_id: doc.data().owner_uid,
        title: "Sua Rodada foi usada 🎯",
        message: "Ative um novo Pacote Rodada ou faça upgrade para o Pacote Torcida e engaje mais clientes!",
        type: "info",
        read: false,
        link: "/negocio/planos",
        created_at: new Date().toISOString(),
      });
      count++;
    }

    // Torcida: 1 credit left → upsell to Copa Completa
    const torcidaSnap = await db
      .collection("merchants")
      .where("plan", "==", "torcida")
      .where("plan_credits", "==", 1)
      .get();

    for (const doc of torcidaSnap.docs) {
      batch.set(db.collection("notifications").doc(), {
        user_id: doc.data().owner_uid,
        title: "Último jogo do Pacote Torcida 🏆",
        message: "Você tem 1 crédito restante. Considere o upgrade para Copa Completa — jogos ilimitados até a final!",
        type: "warning",
        read: false,
        link: "/negocio/planos",
        created_at: new Date().toISOString(),
      });
      count++;
    }

    if (count > 0) {
      await batch.commit();
    }
    console.log(`sendRenewalReminders: ${count} notificação(ões) enviada(s)`);
  },
);

// ── checkStaleBoloes — safety net para bolões não finalizados ─────────────────
// Runs daily. For every active bolão, checks if every referenced match
// (bolao_markets → match_id → matches.status) is finished. If so, moves
// the bolão to "finished". Catches anything the realtime trigger missed.

const BOLAO_FINISHED_STATUSES = new Set(["finished", "FT", "AET", "PEN"]);

export const checkStaleBoloes = functions.scheduler.onSchedule(
  {
    schedule: "0 4 * * *", // 4am BRT daily
    timeZone: "America/Sao_Paulo",
  },
  async () => {
    const boeloesSnap = await db
      .collection("boloes")
      .where("status", "==", "active")
      .get();

    if (boeloesSnap.empty) {
      console.log("checkStaleBoloes: nenhum bolão ativo");
      return;
    }

    let finalized = 0;

    for (const bolaoDoc of boeloesSnap.docs) {
      const bolaoId = bolaoDoc.id;

      const marketsSnap = await db
        .collection("bolao_markets")
        .where("bolao_id", "==", bolaoId)
        .get();

      if (marketsSnap.empty) continue;

      const matchIds = marketsSnap.docs
        .map((doc) => doc.data().match_id as string)
        .filter(Boolean);

      if (matchIds.length === 0) continue;

      const matchDocs = await Promise.all(
        matchIds.map((id) => db.collection("matches").doc(id).get()),
      );

      const allFinished = matchDocs.every((doc) =>
        BOLAO_FINISHED_STATUSES.has(doc.data()?.status ?? ""),
      );

      if (allFinished) {
        await bolaoDoc.ref.update({
          status: "finished",
          finished_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        finalized++;
        console.log(`checkStaleBoloes: bolão ${bolaoId} finalizado`);
      }
    }

    console.log(`checkStaleBoloes: ${finalized} bolão(ões) finalizado(s)`);
  },
);
