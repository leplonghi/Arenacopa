import { db } from "@/integrations/firebase/client";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import type { BolaoPrediction, PredictionValue } from "@/types/bolao";
import { mapFirebaseError, AppError } from "@/services/errors/AppError";

type SaveBolaoPredictionInput = {
  bolaoId: string;
  marketId: string;
  userId: string;
  predictionValue: PredictionValue;
  predictionMeta?: Record<string, unknown> | null;
  existingId?: string;
};

export function buildBolaoPredictionId(input: {
  bolaoId: string;
  marketId: string;
  userId: string;
}) {
  return `${input.userId}_${input.bolaoId}_${input.marketId}`;
}

export async function saveBolaoPrediction(input: SaveBolaoPredictionInput) {
  if (!input.bolaoId || !input.marketId || !input.userId) {
    throw new AppError(
      "BOLAO_PREDICTION_INVALID_INPUT",
      "bolaoId, marketId e userId são obrigatórios."
    );
  }

  try {
    const predictionId =
      input.existingId ??
      buildBolaoPredictionId({
        bolaoId: input.bolaoId,
        marketId: input.marketId,
        userId: input.userId,
      });

    const predictionRef = doc(db, "bolao_predictions", predictionId);
    const payload = {
      bolao_id: input.bolaoId,
      market_id: input.marketId,
      user_id: input.userId,
      prediction_value: input.predictionValue,
      prediction_meta: input.predictionMeta ?? null,
      updated_at: serverTimestamp(),
    };

    if (input.existingId) {
      await updateDoc(predictionRef, payload);
    } else {
      await setDoc(predictionRef, {
        id: predictionId,
        ...payload,
        points_awarded: null,
        resolved: false,
        created_at: new Date().toISOString(),
      });
    }

    const predictionDoc = await getDoc(predictionRef);
    const data = predictionDoc.data();

    return {
      id: predictionDoc.id,
      bolao_id: data?.bolao_id ?? input.bolaoId,
      market_id: data?.market_id ?? input.marketId,
      user_id: data?.user_id ?? input.userId,
      prediction_value: data?.prediction_value ?? input.predictionValue,
      prediction_meta: data?.prediction_meta ?? input.predictionMeta ?? null,
      points_awarded: data?.points_awarded ?? null,
      resolved: data?.resolved ?? false,
      created_at: data?.created_at ?? new Date().toISOString(),
      updated_at:
        typeof data?.updated_at?.toDate === "function"
          ? data.updated_at.toDate().toISOString()
          : new Date().toISOString(),
    } as BolaoPrediction;
  } catch (error) {
    throw mapFirebaseError(error, "BOLAO_PREDICTION_SAVE_FAILED");
  }
}
