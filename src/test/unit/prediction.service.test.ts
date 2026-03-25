import { describe, it, expect, beforeEach } from "vitest";
import "../mocks/firebase";
import {
  mockSetDoc,
  mockUpdateDoc,
  mockDocData,
  resetFirebaseMocks,
} from "../mocks/firebase";
import { createMockPrediction } from "../fixtures";
import { AppError } from "@/services/errors/AppError";

const { saveBolaoPrediction, buildBolaoPredictionId } =
  await import("@/services/boloes/bolao-prediction.service");

describe("bolao-prediction.service", () => {
  beforeEach(() => {
    resetFirebaseMocks();
  });

  describe("buildBolaoPredictionId", () => {
    it("gera ID determinístico userId_bolaoId_marketId", () => {
      const id = buildBolaoPredictionId({
        userId: "user-123",
        bolaoId: "bolao-1",
        marketId: "market-1",
      });
      expect(id).toBe("user-123_bolao-1_market-1");
    });
  });

  describe("saveBolaoPrediction", () => {
    const baseInput = {
      bolaoId: "bolao-1",
      marketId: "market-1",
      userId: "user-123",
      predictionValue: "BRA" as const,
    };

    it("cria nova previsão quando não existe ID existente", async () => {
      const predId = "user-123_bolao-1_market-1";
      mockDocData[`bolao_predictions/${predId}`] = createMockPrediction();

      const result = await saveBolaoPrediction(baseInput);

      expect(mockSetDoc).toHaveBeenCalledOnce();
      expect(mockUpdateDoc).not.toHaveBeenCalled();
      expect(result.id).toBe(predId);
    });

    it("atualiza previsão existente quando existingId é fornecido", async () => {
      const existingId = "existing-prediction-id";
      mockDocData[`bolao_predictions/${existingId}`] = createMockPrediction({ id: existingId });

      await saveBolaoPrediction({ ...baseInput, existingId });

      expect(mockUpdateDoc).toHaveBeenCalledOnce();
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it("inclui campo resolved: false na criação", async () => {
      const predId = "user-123_bolao-1_market-1";
      mockDocData[`bolao_predictions/${predId}`] = createMockPrediction();

      await saveBolaoPrediction(baseInput);

      const setDocCall = mockSetDoc.mock.calls[0];
      expect(setDocCall[1]).toMatchObject({ resolved: false, points_awarded: null });
    });

    it("inclui prediction_meta quando fornecido", async () => {
      const predId = "user-123_bolao-1_market-1";
      const meta = { extra: "data" };
      mockDocData[`bolao_predictions/${predId}`] = createMockPrediction({ prediction_meta: meta });

      await saveBolaoPrediction({ ...baseInput, predictionMeta: meta });

      const setDocCall = mockSetDoc.mock.calls[0];
      expect(setDocCall[1]).toMatchObject({ prediction_meta: meta });
    });

    it("lança AppError BOLAO_PREDICTION_INVALID_INPUT quando bolaoId está ausente", async () => {
      try {
        await saveBolaoPrediction({ ...baseInput, bolaoId: "" });
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("BOLAO_PREDICTION_INVALID_INPUT");
      }
    });

    it("lança AppError BOLAO_PREDICTION_INVALID_INPUT quando marketId está ausente", async () => {
      try {
        await saveBolaoPrediction({ ...baseInput, marketId: "" });
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("BOLAO_PREDICTION_INVALID_INPUT");
      }
    });

    it("lança AppError BOLAO_PREDICTION_INVALID_INPUT quando userId está ausente", async () => {
      try {
        await saveBolaoPrediction({ ...baseInput, userId: "" });
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("BOLAO_PREDICTION_INVALID_INPUT");
      }
    });

    it("lança AppError BOLAO_PREDICTION_SAVE_FAILED em caso de erro do Firestore", async () => {
      mockSetDoc.mockRejectedValueOnce(new Error("Firestore error"));

      try {
        await saveBolaoPrediction(baseInput);
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("BOLAO_PREDICTION_SAVE_FAILED");
      }
    });

    it("retorna previsão com campos corretos após salvar", async () => {
      const predId = "user-123_bolao-1_market-1";
      mockDocData[`bolao_predictions/${predId}`] = createMockPrediction({
        prediction_value: "BRA",
        resolved: false,
        points_awarded: null,
      });

      const result = await saveBolaoPrediction(baseInput);

      expect(result.bolao_id).toBe("bolao-1");
      expect(result.market_id).toBe("market-1");
      expect(result.user_id).toBe("user-123");
      expect(result.prediction_value).toBe("BRA");
      expect(result.resolved).toBe(false);
      expect(result.points_awarded).toBeNull();
    });
  });
});
