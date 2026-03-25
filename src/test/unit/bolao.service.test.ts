import { describe, it, expect, beforeEach } from "vitest";
import "../mocks/firebase";
import {
  mockSetDoc,
  mockUpdateDoc,
  mockDeleteDoc,
  mockDoc,
  mockDocData,
  resetFirebaseMocks,
} from "../mocks/firebase";
import { createMockPalpite } from "../fixtures";
import { AppError } from "@/services/errors/AppError";

const { saveBolaoPalpite, removeBolaoMember, updateBolaoMemberPaymentStatus } =
  await import("@/services/boloes/bolao.service");

describe("bolao.service", () => {
  beforeEach(() => {
    resetFirebaseMocks();
  });

  describe("saveBolaoPalpite", () => {
    const baseInput = {
      bolaoId: "bolao-1",
      userId: "user-123",
      matchId: "match-1",
      homeScore: 2,
      awayScore: 1,
      isPowerPlay: false,
    };

    it("cria um novo palpite quando não existe ID existente", async () => {
      const mockPalpite = createMockPalpite();
      const palpiteId = "user-123_bolao-1_match-1";
      mockDocData[`bolao_palpites/${palpiteId}`] = mockPalpite;

      const result = await saveBolaoPalpite(baseInput);

      expect(mockSetDoc).toHaveBeenCalledOnce();
      expect(mockUpdateDoc).not.toHaveBeenCalled();
      expect(result.id).toBe(palpiteId);
    });

    it("atualiza um palpite existente quando existingId é fornecido", async () => {
      const existingId = "existing-palpite-id";
      const mockPalpite = createMockPalpite({ id: existingId });
      mockDocData[`bolao_palpites/${existingId}`] = mockPalpite;

      await saveBolaoPalpite({ ...baseInput, existingId });

      expect(mockUpdateDoc).toHaveBeenCalledOnce();
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it("usa ID determinístico baseado em userId_bolaoId_matchId", async () => {
      const expectedId = "user-123_bolao-1_match-1";
      mockDocData[`bolao_palpites/${expectedId}`] = createMockPalpite();

      await saveBolaoPalpite(baseInput);

      expect(mockDoc).toHaveBeenCalledWith({}, "bolao_palpites", expectedId);
    });

    it("inclui is_power_play no payload", async () => {
      const palpiteId = "user-123_bolao-1_match-1";
      mockDocData[`bolao_palpites/${palpiteId}`] = createMockPalpite({ is_power_play: true });

      await saveBolaoPalpite({ ...baseInput, isPowerPlay: true });

      const setDocCall = mockSetDoc.mock.calls[0];
      expect(setDocCall[1]).toMatchObject({ is_power_play: true });
    });

    it("lança AppError com código BOLAO_SAVE_PALPITE_FAILED em caso de erro", async () => {
      mockSetDoc.mockRejectedValueOnce(new Error("Firestore error"));

      try {
        await saveBolaoPalpite(baseInput);
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("BOLAO_SAVE_PALPITE_FAILED");
      }
    });

    it("retorna palpite com is_power_play padrão false quando campo ausente", async () => {
      const palpiteId = "user-123_bolao-1_match-1";
      mockDocData[`bolao_palpites/${palpiteId}`] = { ...createMockPalpite() };
      delete (mockDocData[`bolao_palpites/${palpiteId}`] as Record<string, unknown>).is_power_play;

      const result = await saveBolaoPalpite(baseInput);

      expect(result.is_power_play).toBe(false);
    });
  });

  describe("removeBolaoMember", () => {
    it("remove o membro com ID derivado de userId_bolaoId", async () => {
      await removeBolaoMember("bolao-1", "user-123");

      expect(mockDeleteDoc).toHaveBeenCalledOnce();
      expect(mockDoc).toHaveBeenCalledWith({}, "bolao_members", "user-123_bolao-1");
    });

    it("lança AppError com código BOLAO_REMOVE_MEMBER_FAILED em caso de erro", async () => {
      mockDeleteDoc.mockRejectedValueOnce({ code: "permission-denied" });

      try {
        await removeBolaoMember("bolao-1", "user-123");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("PERMISSION_DENIED");
      }
    });
  });

  describe("updateBolaoMemberPaymentStatus", () => {
    it("atualiza o status de pagamento do membro", async () => {
      await updateBolaoMemberPaymentStatus({
        bolaoId: "bolao-1",
        userId: "user-123",
        paymentStatus: "paid",
      });

      expect(mockUpdateDoc).toHaveBeenCalledOnce();
      expect(mockDoc).toHaveBeenCalledWith({}, "bolao_members", "user-123_bolao-1");
      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall[1]).toEqual({ payment_status: "paid" });
    });

    it("lança AppError com código BOLAO_UPDATE_PAYMENT_FAILED em caso de erro", async () => {
      mockUpdateDoc.mockRejectedValueOnce(new Error("Update failed"));

      try {
        await updateBolaoMemberPaymentStatus({
          bolaoId: "bolao-1",
          userId: "user-123",
          paymentStatus: "paid",
        });
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("BOLAO_UPDATE_PAYMENT_FAILED");
      }
    });

    it("aceita diferentes status de pagamento (pending, paid, free)", async () => {
      for (const status of ["pending", "paid", "free"] as const) {
        mockUpdateDoc.mockClear();
        await updateBolaoMemberPaymentStatus({
          bolaoId: "bolao-1",
          userId: "user-123",
          paymentStatus: status,
        });
        const call = mockUpdateDoc.mock.calls[0];
        expect(call[1]).toEqual({ payment_status: status });
      }
    });
  });
});
