import { db } from "@/integrations/firebase/client";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { MemberData, Palpite } from "@/types/bolao";
import { mapFirebaseError } from "@/services/errors/AppError";

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
    throw mapFirebaseError(error, "BOLAO_SAVE_PALPITE_FAILED");
  }
}

export async function removeBolaoMember(bolaoId: string, userId: string) {
  try {
    const memberId = `${userId}_${bolaoId}`;
    await deleteDoc(doc(db, "bolao_members", memberId));
  } catch (error) {
    throw mapFirebaseError(error, "BOLAO_REMOVE_MEMBER_FAILED");
  }
}

export async function updateBolaoMemberPaymentStatus(input: {
  bolaoId: string;
  userId: string;
  paymentStatus: NonNullable<MemberData["payment_status"]>;
}) {
  try {
    const memberId = `${input.userId}_${input.bolaoId}`;
    const docRef = doc(db, "bolao_members", memberId);
    await updateDoc(docRef, { payment_status: input.paymentStatus });
  } catch (error) {
    throw mapFirebaseError(error, "BOLAO_UPDATE_PAYMENT_FAILED");
  }
}
