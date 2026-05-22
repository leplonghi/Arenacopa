// campaign-quiz.ts — Quiz Round functions
//
// startQuizRound:    onDocumentCreated trigger — picks 5 questions, notifies
//                    participants, updates TV state with first question.
// advanceQuizQuestion: HTTP callable — merchant advances to the next question
//                    after 15s timer; scores answers for current question.
//
// Anti-trapaça: correct_index is NEVER included in the questions array sent
// to clients. It lives only in question_answers (admin-only field on quiz_rounds).

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import type { QuizStatus } from "./campaign-types";

const db = admin.firestore();
const QUIZ_QUESTION_SECONDS = 15;
const QUIZ_TOTAL_QUESTIONS = 5;

export const startQuizRound = functions.firestore.onDocumentCreated(
  "quiz_rounds/{quizId}",
  async (event) => {
    const quizId = event.params.quizId;
    const quiz = event.data?.data();
    if (!quiz) return;
    if (quiz.status !== "pending") return;

    const campaignDoc = await db.collection("campaigns").doc(quiz.campaign_id).get();
    const campaign = campaignDoc.data();
    if (!campaign) return;

    // Pick questions — exclude empresa_custom for non-parceiro plans
    const isPartner = campaign.plan === "parceiro";
    let questionsQuery = db
      .collection("quiz_questions")
      .where("active", "==", true);

    if (!isPartner) {
      questionsQuery = questionsQuery.where("category", "!=", "empresa_custom") as typeof questionsQuery;
    }

    const questionsSnap = await questionsQuery.limit(50).get();

    if (questionsSnap.empty) {
      console.error(`startQuizRound ${quizId}: no questions available`);
      return;
    }

    // Shuffle and pick QUIZ_TOTAL_QUESTIONS
    const shuffled = [...questionsSnap.docs]
      .sort(() => Math.random() - 0.5)
      .slice(0, QUIZ_TOTAL_QUESTIONS);

    // Public questions (no correct_index) + admin answer map
    const questions = shuffled.map((doc) => ({
      id: doc.id,
      category: doc.data().category as string,
      question: doc.data().question as string,
      options: doc.data().options as string[],
      // correct_index intentionally excluded
    }));

    const questionAnswers: Record<string, number> = {};
    shuffled.forEach((doc, i) => {
      questionAnswers[String(i)] = doc.data().correct_index as number;
    });

    const firstDeadline = new Date(Date.now() + QUIZ_QUESTION_SECONDS * 1000);

    await db.collection("quiz_rounds").doc(quizId).update({
      status: "q1" as QuizStatus,
      questions,
      question_answers: questionAnswers, // only readable via Admin SDK
      current_question: 0,
      question_deadline: admin.firestore.Timestamp.fromDate(firstDeadline),
    });

    // Update TV state with first question (no correct_index)
    const shareCode: string = campaign.share_code;
    await db.collection("campaign_tv_state").doc(shareCode).update({
      quiz_active: true,
      quiz_question: questions[0],
      quiz_timer_ends_at: admin.firestore.Timestamp.fromDate(firstDeadline),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`startQuizRound ${quizId}: started with ${questions.length} questions`);
  },
);

export const advanceQuizQuestion = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login obrigatório");
  }

  const { quiz_id } = request.data as { quiz_id: string };
  if (!quiz_id) throw new functions.https.HttpsError("invalid-argument", "quiz_id obrigatório");

  const quizDoc = await db.collection("quiz_rounds").doc(quiz_id).get();
  if (!quizDoc.exists) throw new functions.https.HttpsError("not-found", "Quiz não encontrado");

  const quiz = quizDoc.data()!;

  // Only the campaign owner can advance questions
  const campaignDoc = await db.collection("campaigns").doc(quiz.campaign_id).get();
  if (campaignDoc.data()?.owner_uid !== request.auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "Somente o merchant pode avançar o quiz");
  }

  if (quiz.status === "finished") {
    return { ok: true, message: "Quiz já finalizado" };
  }

  const currentQ: number = quiz.current_question;
  const correctIdx: number = (quiz.question_answers as Record<string, number>)[String(currentQ)];
  const deadlineMs: number = quiz.question_deadline?.toDate().getTime() ?? Date.now();

  // Score answers for the current question
  const answersSnap = await db
    .collection("quiz_rounds")
    .doc(quiz_id)
    .collection("answers")
    .where("question_index", "==", currentQ)
    .get();

  const batch = db.batch();

  for (const answerDoc of answersSnap.docs) {
    const answer = answerDoc.data();
    const correct = answer.answer_index === correctIdx;
    const answeredMs: number = answer.answered_at.toDate().getTime();
    const speedRatio = Math.max(0, (deadlineMs - answeredMs) / (QUIZ_QUESTION_SECONDS * 1000));
    const speedBonus = correct ? Math.round(speedRatio * 10) : 0; // 0–10 bonus pts

    batch.update(answerDoc.ref, { correct, speed_bonus: speedBonus });

    if (correct) {
      // Increment participant's quiz score
      batch.update(db.collection("quiz_rounds").doc(quiz_id), {
        [`scores.${answer.user_uid}`]: admin.firestore.FieldValue.increment(10 + speedBonus),
      });
    }
  }

  const nextQ = currentQ + 1;
  const isLast = nextQ >= QUIZ_TOTAL_QUESTIONS;

  const nextDeadline = new Date(Date.now() + QUIZ_QUESTION_SECONDS * 1000);
  const questions = quiz.questions as Array<{ id: string; question: string; options: string[] }>;

  if (!isLast) {
    batch.update(db.collection("quiz_rounds").doc(quiz_id), {
      current_question: nextQ,
      status: `q${nextQ + 1}` as QuizStatus,
      question_deadline: admin.firestore.Timestamp.fromDate(nextDeadline),
    });
  } else {
    batch.update(db.collection("quiz_rounds").doc(quiz_id), {
      status: "finished" as QuizStatus,
    });
  }

  await batch.commit();

  // Update TV state
  const shareCode: string = campaignDoc.data()!.share_code;
  if (!isLast) {
    await db.collection("campaign_tv_state").doc(shareCode).update({
      quiz_question: questions[nextQ],
      quiz_timer_ends_at: admin.firestore.Timestamp.fromDate(nextDeadline),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    // Quiz over — finalize and clear TV quiz state
    await finalizeQuizRound(quiz_id, quiz, campaignDoc.data()!);
    await db.collection("campaign_tv_state").doc(shareCode).update({
      quiz_active: false,
      quiz_question: null,
      quiz_timer_ends_at: null,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { ok: true, next_question: isLast ? null : nextQ };
});

async function finalizeQuizRound(
  quizId: string,
  quizData: admin.firestore.DocumentData,
  campaign: admin.firestore.DocumentData,
): Promise<void> {
  // Re-read quiz to get final scores (after batch.commit above)
  const quizDoc = await db.collection("quiz_rounds").doc(quizId).get();
  const scores: Record<string, number> = quizDoc.data()!.scores ?? {};

  if (Object.keys(scores).length === 0) {
    console.warn(`finalizeQuizRound ${quizId}: no scores found`);
    return;
  }

  // Winner = highest score; ties broken by UID (deterministic, fair)
  const [winnerUid] = Object.entries(scores).sort(([uidA, a], [uidB, b]) =>
    b - a || uidA.localeCompare(uidB),
  )[0];

  await db.collection("quiz_rounds").doc(quizId).update({ winner_uid: winnerUid });

  // Get winner's display name from palpite document
  const palpiteDoc = await db
    .collection("campaign_games")
    .doc(quizData.game_id)
    .collection("palpites")
    .doc(winnerUid)
    .get();

  const displayName: string = palpiteDoc.data()?.display_name ?? "Participante";
  const redemptionCode = newCode();

  await db.collection("prize_redemptions").add({
    campaign_id: quizData.campaign_id,
    game_id: quizData.game_id,
    winner_uid: winnerUid,
    merchant_id: campaign.merchant_id,
    display_name: displayName,
    benefit_code: campaign.benefit_code,
    prize_tier: "quiz_winner",
    redemption_code: redemptionCode,
    redeemed_at: null,
    redeemed_by_uid: null,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Link quiz_round_id on the game document
  await db.collection("campaign_games").doc(quizData.game_id).update({
    quiz_round_id: quizId,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`finalizeQuizRound ${quizId}: winner ${winnerUid}, code ${redemptionCode}`);
}

function newCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
