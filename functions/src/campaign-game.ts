// campaign-game.ts — activateCampaignGame + submitPalpite callables
//
// activateCampaignGame: merchant activates a specific Copa 2026 match within
//   their campaign. Consumes a game credit atomically.
//
// submitPalpite: participant submits their score prediction. Runs entirely
//   inside a Firestore transaction to enforce:
//   1. Palpite window still open
//   2. No duplicate palpite (ID = UID enforces 1 per user)
//   3. Quota slot available (if quota mode != "free")
//   4. Atomic participant counter increment

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import type { CampaignPlan, QuotaMode } from "./campaign-types";
import { PLAN_MAX_PARTICIPANTS } from "./campaign-types";

const db = admin.firestore();

export const activateCampaignGame = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login obrigatório");
  }

  const { campaign_id, match_id, palpite_window_minutes } = request.data as {
    campaign_id: string;
    match_id: string;
    palpite_window_minutes: 5 | 15 | 30;
  };

  if (!campaign_id || !match_id) {
    throw new functions.https.HttpsError("invalid-argument", "campaign_id e match_id são obrigatórios");
  }

  const [campaignDoc, matchDoc] = await Promise.all([
    db.collection("campaigns").doc(campaign_id).get(),
    db.collection("matches").doc(match_id).get(),
  ]);

  if (!campaignDoc.exists) throw new functions.https.HttpsError("not-found", "Campanha não encontrada");
  if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Jogo não encontrado");

  const campaign = campaignDoc.data()!;
  const match = matchDoc.data()!;

  if (campaign.owner_uid !== request.auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "Esta campanha não é sua");
  }
  if (campaign.status !== "active") {
    throw new functions.https.HttpsError("failed-precondition", "Campanha não está ativa");
  }

  const matchStatus: string = match.status || match.matchStatus || "";
  if (!["scheduled", "NS", "TBD"].includes(matchStatus)) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Só é possível ativar jogos com status 'scheduled'",
    );
  }

  // Compute palpite window close time
  const matchDateStr: string = match.match_date || match.matchDate || match.date || "";
  const matchDate = new Date(matchDateStr);
  if (isNaN(matchDate.getTime())) {
    throw new functions.https.HttpsError("internal", "Data do jogo inválida");
  }
  const windowCloses = new Date(matchDate.getTime() - palpite_window_minutes * 60 * 1000);

  const merchantId = campaign.merchant_id;
  const plan = campaign.plan as CampaignPlan;
  const quotaMode: QuotaMode = campaign.prediction_quota_mode || "free";
  const maxParticipants = PLAN_MAX_PARTICIPANTS[plan];
  const autoLimit = quotaMode === "auto" ? Math.floor(maxParticipants * 0.05) : null;

  let newGameId = "";

  await db.runTransaction(async (t) => {
    const merchantDoc = await t.get(db.collection("merchants").doc(merchantId));
    const merchant = merchantDoc.data()!;

    // Consume a credit (skip for unlimited plans)
    if (merchant.plan_credits !== -1) {
      if (merchant.plan_credits <= 0) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          "Sem créditos de jogo. Faça upgrade do seu plano.",
        );
      }
      t.update(db.collection("merchants").doc(merchantId), {
        plan_credits: admin.firestore.FieldValue.increment(-1),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const gameRef = db.collection("campaign_games").doc();
    newGameId = gameRef.id;

    t.set(gameRef, {
      campaign_id,
      merchant_id: merchantId,
      owner_uid: request.auth!.uid,
      match_id,
      match_snapshot: {
        home_team: match.homeTeamName || match.home_team || match.teams?.home?.name || "Casa",
        away_team: match.awayTeamName || match.away_team || match.teams?.away?.name || "Fora",
        match_date: matchDateStr,
      },
      status: "open",
      palpite_window_closes_at: admin.firestore.Timestamp.fromDate(windowCloses),
      participant_count: 0,
      quota_config: {
        mode: quotaMode,
        auto_limit: autoLimit,
        manual_value: campaign.prediction_quota_value || null,
      },
      ranking_computed_at: null,
      top_winners: [],
      quiz_round_id: null,
      game_sequence: 1, // simplified: a follow-up task tracks sequence
      credit_consumed: merchant.plan_credits !== -1,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  // Update TV state with current match info (outside transaction — not critical)
  await db.collection("campaign_tv_state").doc(campaign.share_code).update({
    current_game_id: newGameId,
    current_match: {
      home_team: match.homeTeamName || match.home_team || "Casa",
      away_team: match.awayTeamName || match.away_team || "Fora",
      match_date: matchDateStr,
    },
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { game_id: newGameId };
});

export const submitPalpite = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login obrigatório");
  }

  const {
    game_id,
    display_name,
    home_score,
    away_score,
    half_time_home,
    half_time_away,
    first_scorer,
    total_goals_bracket,
  } = request.data as {
    game_id: string;
    display_name: string;
    home_score: number;
    away_score: number;
    half_time_home?: number;
    half_time_away?: number;
    first_scorer?: "home" | "away" | "none";
    total_goals_bracket?: "0-1" | "2-3" | "4+";
  };

  // Input validation (server-side)
  if (!display_name?.trim() || display_name.trim().length < 2) {
    throw new functions.https.HttpsError("invalid-argument", "Nome precisa ter pelo menos 2 caracteres");
  }
  if (typeof home_score !== "number" || typeof away_score !== "number") {
    throw new functions.https.HttpsError("invalid-argument", "Placar inválido");
  }
  if (home_score < 0 || home_score > 20 || away_score < 0 || away_score > 20) {
    throw new functions.https.HttpsError("invalid-argument", "Placar fora do intervalo válido (0–20)");
  }

  const uid = request.auth.uid;

  await db.runTransaction(async (t) => {
    const gameDoc = await t.get(db.collection("campaign_games").doc(game_id));
    if (!gameDoc.exists) throw new functions.https.HttpsError("not-found", "Jogo não encontrado");

    const game = gameDoc.data()!;
    if (game.status !== "open") {
      throw new functions.https.HttpsError("failed-precondition", "Palpites estão encerrados para este jogo");
    }

    const now = new Date();
    const windowCloses: Date = game.palpite_window_closes_at.toDate();
    if (now >= windowCloses) {
      throw new functions.https.HttpsError("failed-precondition", "A janela de palpites fechou");
    }

    const palpiteRef = db
      .collection("campaign_games")
      .doc(game_id)
      .collection("palpites")
      .doc(uid); // doc ID = UID → enforces 1 palpite per user

    const existing = await t.get(palpiteRef);
    if (existing.exists) {
      throw new functions.https.HttpsError("already-exists", "Você já enviou seu palpite para este jogo");
    }

    // Quota check and reservation (atomic)
    const quotaMode: QuotaMode = game.quota_config?.mode || "free";
    if (quotaMode !== "free") {
      const limit: number =
        quotaMode === "auto"
          ? (game.quota_config.auto_limit ?? 999)
          : (game.quota_config.manual_value ?? 999);

      const scoreKey = `${home_score}_${away_score}`;
      const quotaRef = db
        .collection("campaign_games")
        .doc(game_id)
        .collection("score_quotas")
        .doc(scoreKey);

      const quotaDoc = await t.get(quotaRef);
      const currentCount: number = quotaDoc.exists ? (quotaDoc.data()!.count ?? 0) : 0;

      if (currentCount >= limit) {
        throw new functions.https.HttpsError(
          "resource-exhausted",
          `Este placar (${home_score}×${away_score}) já atingiu o limite. Escolha outro placar.`,
        );
      }

      t.set(
        quotaRef,
        {
          score_key: scoreKey,
          count: admin.firestore.FieldValue.increment(1),
          limit,
          is_full: currentCount + 1 >= limit,
        },
        { merge: true },
      );
    }

    // Write the palpite document — all scoring fields start as null (filled by Cloud Function)
    t.set(palpiteRef, {
      user_uid: uid,
      campaign_id: game.campaign_id,
      merchant_id: game.merchant_id,
      display_name: display_name.trim().slice(0, 40),
      home_score,
      away_score,
      half_time_home: half_time_home ?? null,
      half_time_away: half_time_away ?? null,
      first_scorer: first_scorer ?? null,
      total_goals_bracket: total_goals_bracket ?? null,
      submitted_at: admin.firestore.FieldValue.serverTimestamp(),
      quota_slot: null,
      // Admin SDK fills these after the match:
      total_points: null,
      exact_score: null,
      correct_winner: null,
      bonus_points: null,
      rank: null,
      prize_tier: null,
      status: "submitted",
    });

    // Increment game participant counter
    t.update(db.collection("campaign_games").doc(game_id), {
      participant_count: admin.firestore.FieldValue.increment(1),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Upsert campaign_participants record (display_name, games_played)
    const participantRef = db
      .collection("campaign_participants")
      .doc(`${uid}_${game.campaign_id}`);
    t.set(
      participantRef,
      {
        user_uid: uid,
        campaign_id: game.campaign_id,
        merchant_id: game.merchant_id,
        display_name: display_name.trim().slice(0, 40),
        city: null,
        joined_at: admin.firestore.FieldValue.serverTimestamp(),
        games_played: admin.firestore.FieldValue.increment(1),
        is_hidden: false,
        is_blocked: false,
        age_confirmed: true,
      },
      { merge: true },
    );
  });

  // Update TV state participant count (outside transaction — eventual consistency OK)
  try {
    const gameDoc = await db.collection("campaign_games").doc(game_id).get();
    const game = gameDoc.data();
    if (game) {
      const campaignDoc = await db.collection("campaigns").doc(game.campaign_id).get();
      const shareCode = campaignDoc.data()?.share_code;
      if (shareCode) {
        await db.collection("campaign_tv_state").doc(shareCode).update({
          participant_count: admin.firestore.FieldValue.increment(1),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  } catch {
    // Non-fatal: TV state is eventually consistent
    console.warn("submitPalpite: failed to update TV participant_count");
  }

  return { ok: true };
});
