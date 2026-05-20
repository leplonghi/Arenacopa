import { db } from "@/integrations/firebase/client";
import { 
  doc, 
  getDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
  writeBatch,
} from "firebase/firestore";
import type { MemberData, Palpite } from "@/types/bolao";
import { leaveBolao, updatePoolMemberPaymentStatus } from "@/services/boloes/bolao-config.service";
import { postAuthedFunction } from "@/services/backend/functions-http";
import { mapFirebaseError } from "@/services/errors/AppError";
import { assertMatchPredictionOpen } from "@/services/boloes/bolao-prediction-deadline";

export function buildBolaoPalpiteId(input: {
  userId: string;
  bolaoId: string;
  matchId: string;
}) {
  return `${input.userId}_${input.bolaoId}_${input.matchId}`;
}

export function buildLegacyBolaoPalpiteId(input: {
  userId: string;
  bolaoId: string;
  matchId: string;
}) {
  return `${input.userId}_${input.matchId}_${input.bolaoId}`;
}

export async function saveBolaoPalpite(input: {
  bolaoId: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  isPowerPlay: boolean;
  existingId?: string;
  existingPredictionId?: string;
}) {
  try {
    const [bolaoDoc, matchDoc] = await Promise.all([
      getDoc(doc(db, "boloes", input.bolaoId)),
      getDoc(doc(db, "matches", input.matchId)),
    ]);
    const bolaoData = typeof bolaoDoc.exists === "function" && bolaoDoc.exists() ? bolaoDoc.data() : null;
    const matchData = typeof matchDoc.exists === "function" && matchDoc.exists() ? matchDoc.data() : null;

    // [BUG-007] Fetch exact_score market for deadline + atomic write
    const marketQuery = query(
      collection(db, "bolao_markets"),
      where("bolao_id", "==", input.bolaoId),
      where("match_id", "==", input.matchId),
      where("slug", "==", "exact_score"),
      limit(1)
    );
    const marketSnap = await getDocs(marketQuery);
    const marketDoc = !marketSnap.empty ? marketSnap.docs[0] : null;
    const marketData = marketDoc?.data() ?? null;

    if (matchData) {
      assertMatchPredictionOpen({
        matchDate: matchData.match_date,
        matchStatus: matchData.status,
        cutoffMinutes:
          bolaoData?.competition_rules?.prediction_cutoff_minutes ??
          bolaoData?.prediction_cutoff_minutes ??
          0,
        closesAt: marketData?.closes_at_ts ?? marketData?.closes_at ?? null,
      });
    }

    const now = new Date().toISOString();
    const palpiteId = input.existingId || buildBolaoPalpiteId(input);
    const palpiteRef = doc(db, "bolao_palpites", palpiteId);

    // [BUG-003 FIX] Atomic batch: bolao_palpites + bolao_predictions (exact_score)
    // A failure in one would previously leave the DB in an inconsistent partial state.
    const batch = writeBatch(db);

    const palpitePayload = {
      bolao_id: input.bolaoId,
      user_id: input.userId,
      match_id: input.matchId,
      home_score: input.homeScore,
      away_score: input.awayScore,
      is_power_play: input.isPowerPlay,
      updated_at: serverTimestamp(),
    };

    if (input.existingId) {
      batch.update(palpiteRef, palpitePayload);
    } else {
      batch.set(palpiteRef, { ...palpitePayload, id: palpiteId, created_at: now, points: null });
    }

    // Mirror the score into bolao_predictions for the exact_score market if it exists
    if (marketDoc) {
      const marketId = marketDoc.id;
      const predictionId = input.existingPredictionId ?? `${input.userId}_${input.bolaoId}_${marketId}`;
      const predictionRef = doc(db, "bolao_predictions", predictionId);
      const predictionPayload = {
        bolao_id: input.bolaoId,
        market_id: marketId,
        user_id: input.userId,
        prediction_value: { home: input.homeScore, away: input.awayScore },
        prediction_meta: { is_power_play: input.isPowerPlay },
        updated_at: serverTimestamp(),
      };

      const predSnap = await getDoc(predictionRef);
      if (predSnap.exists()) {
        batch.update(predictionRef, predictionPayload);
      } else {
        batch.set(predictionRef, {
          id: predictionId,
          ...predictionPayload,
          points_awarded: null,
          resolved: false,
          created_at: now,
        });
      }
    }

    await batch.commit();

    return {
      id: palpiteId,
      bolao_id: input.bolaoId,
      user_id: input.userId,
      match_id: input.matchId,
      home_score: input.homeScore,
      away_score: input.awayScore,
      is_power_play: input.isPowerPlay,
      points: null,
      created_at: now,
      updated_at: now,
    } as Palpite;
  } catch (error) {
    throw mapFirebaseError(error, "BOLAO_SAVE_PALPITE_FAILED");
  }
}

export async function saveExclusiveBolaoPalpite(input: {
  bolaoId: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  isPowerPlay: boolean;
  existingId?: string;
}) {
  return postAuthedFunction<Palpite>("saveExclusiveBolaoPalpite", {
    bolao_id: input.bolaoId,
    match_id: input.matchId,
    home_score: input.homeScore,
    away_score: input.awayScore,
    is_power_play: input.isPowerPlay,
    existing_id: input.existingId ?? null,
  });
}

export async function removeBolaoMember(bolaoId: string, userId: string) {
  if (!bolaoId || !userId) {
    throw new Error("validation_failed");
  }

  try {
    return await leaveBolao({
      payload: {
        bolao_id: bolaoId,
      },
    });
  } catch (error) {
    throw mapFirebaseError(error, "BOLAO_REMOVE_MEMBER_FAILED");
  }
}

export async function updateBolaoMemberPaymentStatus(input: {
  bolaoId: string;
  userId: string;
  paymentStatus: Extract<NonNullable<MemberData["payment_status"]>, "pending" | "paid" | "exempt">;
}) {
  try {
    return await updatePoolMemberPaymentStatus({
      payload: {
        bolao_id: input.bolaoId,
        member_id: `${input.userId}_${input.bolaoId}`,
        payment_status: input.paymentStatus,
      },
    });
  } catch (error) {
    throw mapFirebaseError(error, "BOLAO_UPDATE_PAYMENT_FAILED");
  }
}

export async function updateBolaoPrizeSettings(input: {
  bolaoId: string;
  prizeType: string;
  prizeDescription?: string | null;
  pixKey?: string | null;
  caixinhaEnabled: boolean;
  caixinhaValuePerPerson?: number | null;
}) {
  return postAuthedFunction<{
    bolao_id: string;
    prize_type: string;
    prize_description: string | null;
    pix_key: string | null;
    caixinha_enabled: boolean;
    caixinha_value_per_person: number | null;
    updated_at: string;
  }>("updateBolaoPrizeSettings", {
    bolao_id: input.bolaoId,
    prize_type: input.prizeType,
    prize_description: input.prizeDescription ?? null,
    pix_key: input.pixKey ?? null,
    caixinha_enabled: input.caixinhaEnabled,
    caixinha_value_per_person: input.caixinhaValuePerPerson ?? null,
  });
}
