import { db } from "@/integrations/firebase/client";
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from "firebase/firestore";
import type { MemberData, Palpite } from "@/types/bolao";
import { leaveBolao, updatePoolMemberPaymentStatus } from "@/services/boloes/bolao-config.service";

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
    const palpiteId = input.existingId || `${input.userId}_${input.bolaoId}_${input.matchId}`;
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
    console.error("Error saving palpite:", error);
    throw error;
  }
}

export async function removeBolaoMember(bolaoId: string, userId: string) {
  if (!bolaoId || !userId) {
    throw new Error("validation_failed");
  }

  return leaveBolao({
    payload: {
      bolao_id: bolaoId,
    },
  });
}

export async function updateBolaoMemberPaymentStatus(input: {
  bolaoId: string;
  userId: string;
  paymentStatus: Extract<NonNullable<MemberData["payment_status"]>, "pending" | "paid" | "exempt">;
}) {
  return updatePoolMemberPaymentStatus({
    payload: {
      bolao_id: input.bolaoId,
      member_id: `${input.userId}_${input.bolaoId}`,
      payment_status: input.paymentStatus,
    },
  });
}
