import { db } from "@/integrations/firebase/client";
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import type { MemberData, Palpite } from "@/types/bolao";
import { leaveBolao, updatePoolMemberPaymentStatus } from "@/services/boloes/bolao-config.service";
import { postAuthedFunction } from "@/services/backend/functions-http";
import { mapFirebaseError } from "@/services/errors/AppError";

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
}) {
  try {
    // We can use a deterministic ID: userId_bolaoId_matchId to avoid duplicates
    const palpiteId = input.existingId || buildBolaoPalpiteId(input);
    const docRef = doc(db, "bolao_palpites", palpiteId);

    const payload = {
      bolao_id: input.bolaoId,
      user_id: input.userId,
      match_id: input.matchId,
      home_score: input.homeScore,
      away_score: input.awayScore,
      is_power_play: input.isPowerPlay,
      updated_at: serverTimestamp(),
    };

    if (input.existingId) {
      await updateDoc(docRef, payload);
    } else {
      await setDoc(docRef, {
        ...payload,
        id: palpiteId,
        created_at: new Date().toISOString(),
        points: null,
      });
    }

    const updatedDoc = await getDoc(docRef);
    const data = updatedDoc.data();

    return {
      id: updatedDoc.id,
      ...data,
      is_power_play: data?.is_power_play ?? false,
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
