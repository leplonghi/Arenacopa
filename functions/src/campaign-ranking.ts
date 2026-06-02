// campaign-ranking.ts — computeGameRanking Firestore trigger
// Triggered when a match document status changes to "finished" (or "FT").
// Finds all campaign_games linked to that match, scores every palpite,
// writes the rankings subcollection, generates prize_redemptions,
// and creates a quiz_round document if the winner model requires it.
//
// Also finalizes bolões whose every bolao_market now points to a finished match.

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { scoreOnePalpite, computeTotalGoalsBracket } from "./campaign-scoring";
import type { MatchResult, PrizeTier, WinnerModelConfig } from "./campaign-types";

const db = admin.firestore();

export const computeGameRanking = functions.firestore.onDocumentUpdated(
  "matches/{matchId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Only process status transitions to finished
    const prevStatus: string = before.status || before.matchStatus || "";
    const newStatus: string = after.status || after.matchStatus || "";
    if (prevStatus === newStatus) return;
    if (!["finished", "FT", "AET", "PEN"].includes(newStatus)) return;

    const matchId = event.params.matchId;
    console.log(`computeGameRanking: match ${matchId} finished (${newStatus})`);

    // Find all campaign_games linked to this match that are still open/locked/live
    const gamesSnap = await db
      .collection("campaign_games")
      .where("match_id", "==", matchId)
      .where("status", "in", ["open", "locked", "live"])
      .get();

    if (gamesSnap.empty) {
      console.log(`computeGameRanking: no campaign games for match ${matchId}`);
      return;
    }

    // Build MatchResult from the match document
    const homeGoals: number =
      after.home_score ?? after.goals?.home ?? after.score?.fulltime?.home ?? 0;
    const awayGoals: number =
      after.away_score ?? after.goals?.away ?? after.score?.fulltime?.away ?? 0;

    const result: MatchResult = {
      home_score: homeGoals,
      away_score: awayGoals,
      half_time_home:
        after.half_time_home ?? after.score?.halftime?.home ?? null,
      half_time_away:
        after.half_time_away ?? after.score?.halftime?.away ?? null,
      first_scorer: after.first_scorer ?? null,
      total_goals_bracket: computeTotalGoalsBracket(homeGoals, awayGoals),
    };

    for (const gameDoc of gamesSnap.docs) {
      await processOneGame(gameDoc, result).catch((err) => {
        console.error(`computeGameRanking: error on game ${gameDoc.id}`, err);
      });
    }

    // Finalize bolões whose every market now points to a finished match
    await finalizeBoloesByMatch(matchId).catch(
      (err) => console.error(`computeGameRanking: finalização de bolões falhou para ${matchId}`, err),
    );
  },
);

async function processOneGame(
  gameDoc: admin.firestore.QueryDocumentSnapshot,
  result: MatchResult,
): Promise<void> {
  const gameId = gameDoc.id;
  const game = gameDoc.data();

  // Fetch all palpites for this game
  const palpitesSnap = await db
    .collection("campaign_games")
    .doc(gameId)
    .collection("palpites")
    .get();

  // Mark game finished even if there are no palpites
  if (palpitesSnap.empty) {
    await gameDoc.ref.update({
      status: "finished",
      ranking_computed_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return;
  }

  // Score every palpite
  type ScoredEntry = {
    uid: string;
    display_name: string;
    total_points: number;
    exact_score: boolean;
    correct_winner: boolean;
    bonus_points: number;
    rank: number;
    prize_tier: PrizeTier | null;
  };

  const scored: ScoredEntry[] = palpitesSnap.docs.map((doc) => {
    const p = doc.data();
    const palpiteInput = {
      home_score: p.home_score as number,
      away_score: p.away_score as number,
      half_time_home: (p.half_time_home ?? null) as number | null,
      half_time_away: (p.half_time_away ?? null) as number | null,
      first_scorer: (p.first_scorer ?? null) as "home" | "away" | "none" | null,
      total_goals_bracket: (p.total_goals_bracket ?? null) as "0-1" | "2-3" | "4+" | null,
    };
    const scoring = scoreOnePalpite(palpiteInput, result);
    return {
      uid: doc.id,
      display_name: p.display_name ?? "Participante",
      ...scoring,
      rank: 0, // assigned below
      prize_tier: null,
    };
  });

  // Sort: total_points desc → exact_score desc → bonus_points desc
  scored.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    if (Number(b.exact_score) !== Number(a.exact_score))
      return Number(b.exact_score) - Number(a.exact_score);
    return b.bonus_points - a.bonus_points;
  });

  // Assign ranks (tied players share the same rank)
  let rank = 1;
  for (let i = 0; i < scored.length; i++) {
    if (i > 0 && scored[i].total_points === scored[i - 1].total_points
        && scored[i].exact_score === scored[i - 1].exact_score) {
      scored[i].rank = scored[i - 1].rank;
    } else {
      scored[i].rank = rank;
    }
    rank++;
  }

  // Fetch campaign for winner config
  const campaignDoc = await db.collection("campaigns").doc(game.campaign_id).get();
  const campaign = campaignDoc.data()!;
  const winnerConfig: WinnerModelConfig = campaign.winner_config;

  // Assign prize tiers
  for (const s of scored) {
    if (s.rank === 1) {
      s.prize_tier = "champion";
    } else if (s.rank === 2 && winnerConfig.type === "podium") {
      s.prize_tier = "podium_2";
    } else if (s.rank === 3 && winnerConfig.type === "podium") {
      s.prize_tier = "podium_3";
    } else if (winnerConfig.type === "exact_score" && s.exact_score) {
      s.prize_tier = "exact_score";
    }
  }

  // Write scores back to palpite docs + rankings subcollection (batch)
  const BATCH_LIMIT = 490;
  for (let i = 0; i < scored.length; i += BATCH_LIMIT) {
    const chunk = scored.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();

    for (const s of chunk) {
      // Update palpite with computed scores (Admin SDK — bypasses rule write:false)
      batch.update(
        db.collection("campaign_games").doc(gameId).collection("palpites").doc(s.uid),
        {
          total_points: s.total_points,
          exact_score: s.exact_score,
          correct_winner: s.correct_winner,
          bonus_points: s.bonus_points,
          rank: s.rank,
          prize_tier: s.prize_tier,
          status: s.prize_tier ? "winner" : "scored",
        },
      );

      // Write ranking entry (Admin SDK — write:false on client side)
      batch.set(
        db.collection("campaign_games").doc(gameId).collection("rankings").doc(s.uid),
        {
          user_uid: s.uid,
          display_name: s.display_name,
          total_points: s.total_points,
          exact_score: s.exact_score,
          bonus_points: s.bonus_points,
          rank: s.rank,
          prize_tier: s.prize_tier,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        },
      );
    }
    await batch.commit();
  }

  // Detect if quiz round is needed
  const topTied = scored.filter((s) => s.rank === 1);
  const needsQuiz =
    topTied.length > 1 &&
    campaign.quiz_enabled === true &&
    campaign.prize_model !== "all_win";

  // Finalize game document
  await gameDoc.ref.update({
    status: "finished",
    ranking_computed_at: admin.firestore.FieldValue.serverTimestamp(),
    top_winners: scored.slice(0, 3).map((s) => ({
      uid: s.uid,
      display_name: s.display_name,
      total_points: s.total_points,
      rank: s.rank,
    })),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  if (needsQuiz) {
    // Create quiz_round → triggers startQuizRound via onDocumentCreated
    await db.collection("quiz_rounds").add({
      campaign_id: game.campaign_id,
      game_id: gameId,
      status: "pending",
      participant_uids: topTied.map((s) => s.uid),
      questions: [], // populated by startQuizRound
      question_answers: {}, // admin-only
      current_question: 0,
      question_deadline: null,
      scores: Object.fromEntries(topTied.map((s) => [s.uid, 0])),
      winner_uid: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    // Generate prize redemptions immediately (no quiz needed)
    await generateRedemptions(gameId, game.campaign_id, scored, campaign);
  }
}

async function generateRedemptions(
  gameId: string,
  campaignId: string,
  scored: Array<{ uid: string; display_name: string; prize_tier: PrizeTier | null }>,
  campaign: admin.firestore.DocumentData,
): Promise<void> {
  const winners = scored.filter((s) => s.prize_tier !== null);
  if (winners.length === 0) return;

  const batch = db.batch();
  for (const w of winners) {
    batch.set(db.collection("prize_redemptions").doc(), {
      campaign_id: campaignId,
      game_id: gameId,
      winner_uid: w.uid,
      merchant_id: campaign.merchant_id,
      display_name: w.display_name,
      benefit_code: campaign.benefit_code,
      prize_tier: w.prize_tier,
      redemption_code: newRedemptionCode(),
      redeemed_at: null,
      redeemed_by_uid: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}

function newRedemptionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 10 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

// ── Bolão finalization ────────────────────────────────────────────────────────
// When a match finishes, find every bolão that has that match as one of its
// markets. If ALL markets of that bolão now point to finished matches,
// transition the bolão from "active" → "finished".

const FINISHED_STATUSES = new Set(["finished", "FT", "AET", "PEN"]);

async function finalizeBoloesByMatch(matchId: string): Promise<void> {
  // Find bolão markets that reference this match
  const marketsSnap = await db
    .collection("bolao_markets")
    .where("match_id", "==", matchId)
    .get();

  if (marketsSnap.empty) return;

  // Collect unique bolão IDs that contain this match
  const bolaoIds = [...new Set(
    marketsSnap.docs.map((doc) => doc.data().bolao_id as string).filter(Boolean),
  )];

  for (const bolaoId of bolaoIds) {
    // Get all markets for this bolão
    const allMarketsSnap = await db
      .collection("bolao_markets")
      .where("bolao_id", "==", bolaoId)
      .get();

    if (allMarketsSnap.empty) continue;

    // Collect all match IDs referenced by this bolão's markets
    const matchIds = allMarketsSnap.docs
      .map((doc) => doc.data().match_id as string)
      .filter(Boolean);

    if (matchIds.length === 0) continue;

    // Fetch every referenced match in parallel
    const matchDocs = await Promise.all(
      matchIds.map((id) => db.collection("matches").doc(id).get()),
    );

    const allFinished = matchDocs.every((doc) =>
      FINISHED_STATUSES.has(doc.data()?.status ?? ""),
    );

    if (allFinished) {
      await db.collection("boloes").doc(bolaoId).update({
        status: "finished",
        finished_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`finalizeBoloesByMatch: bolão ${bolaoId} finalizado`);
    }
  }
}
