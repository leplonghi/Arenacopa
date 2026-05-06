import { describe, it, expect, beforeEach } from "vitest";
import "../mocks/firebase";
import {
  mockGetDocs,
  mockUpdateDoc,
  mockDoc,
  resetFirebaseMocks,
} from "../mocks/firebase";

const { listNotifications, markNotificationAsRead, markAllNotificationsAsRead } =
  await import("@/services/notifications/notifications.service");

const mockNotification = {
  id: "notif-1",
  user_id: "user-123",
  title: "Novo palpite!",
  message: "Alguém apostou no seu bolão.",
  type: "info" as const,
  read: false,
  link: null,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("notifications.service", () => {
  beforeEach(() => {
    resetFirebaseMocks();
  });

  describe("listNotifications", () => {
    it("retorna lista de notificações do usuário", async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [{ id: "notif-1", data: () => mockNotification }],
      });

      const result = await listNotifications("user-123");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("notif-1");
      expect(result[0].title).toBe("Novo palpite!");
    });

    it("retorna array vazio quando não há notificações", async () => {
      mockGetDocs.mockResolvedValueOnce({ docs: [] });

      const result = await listNotifications("user-123");

      expect(result).toHaveLength(0);
    });

    it("lança AppError em caso de erro do Firestore", async () => {
      mockGetDocs.mockRejectedValueOnce(new Error("Firestore error"));

      await expect(listNotifications("user-123")).rejects.toThrow();
    });
  });

  describe("markNotificationAsRead", () => {
    it("atualiza o campo read para true", async () => {
      await markNotificationAsRead("notif-1", "user-123");

      expect(mockUpdateDoc).toHaveBeenCalledOnce();
      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall[1]).toEqual({ read: true });
    });

    it("usa o ID correto do documento", async () => {
      await markNotificationAsRead("notif-abc", "user-123");

      expect(mockDoc).toHaveBeenCalledWith({}, "notifications", "notif-abc");
    });

    it("lança erro em caso de falha", async () => {
      mockUpdateDoc.mockRejectedValueOnce(new Error("Update failed"));

      await expect(markNotificationAsRead("notif-1", "user-123")).rejects.toThrow();
    });
  });

  describe("markAllNotificationsAsRead", () => {
    it("faz commit do batch sem erros quando há notificações não lidas", async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: "n1", ref: { id: "n1" }, data: () => ({ ...mockNotification, read: false }) },
          { id: "n2", ref: { id: "n2" }, data: () => ({ ...mockNotification, id: "n2", read: false }) },
        ],
      });

      await expect(markAllNotificationsAsRead("user-123")).resolves.not.toThrow();
    });

    it("executa sem erros quando não há notificações não lidas", async () => {
      mockGetDocs.mockResolvedValueOnce({ docs: [] });

      await expect(markAllNotificationsAsRead("user-123")).resolves.not.toThrow();
    });

    it("lança erro em caso de falha na query", async () => {
      mockGetDocs.mockRejectedValueOnce(new Error("Query failed"));

      await expect(markAllNotificationsAsRead("user-123")).rejects.toThrow();
    });
  });
});
