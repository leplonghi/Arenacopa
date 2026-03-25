import { describe, it, expect, beforeEach } from "vitest";
import "../mocks/firebase";
import {
  mockGetDoc,
  mockSetDoc,
  mockUpdateDoc,
  mockUploadBytes,
  mockGetDownloadURL,
  mockDoc,
  mockDocData,
  resetFirebaseMocks,
} from "../mocks/firebase";
import { createMockProfile } from "../fixtures";
import { AppError } from "@/services/errors/AppError";

const {
  getProfile,
  ensureProfile,
  updateProfile,
  updateFavoriteTeam,
  updatePreferredLanguage,
  acceptTerms,
  uploadAvatar,
} = await import("@/services/profile/profile.service");

describe("profile.service", () => {
  beforeEach(() => {
    resetFirebaseMocks();
  });

  describe("getProfile", () => {
    it("retorna o perfil quando existe", async () => {
      const profile = createMockProfile();
      mockDocData["profiles/user-123"] = profile;

      const result = await getProfile("user-123");

      expect(result).toEqual(profile);
      expect(mockDoc).toHaveBeenCalledWith({}, "profiles", "user-123");
    });

    it("retorna null quando o perfil não existe", async () => {
      // mockDocData vazio → exists() retorna false
      const result = await getProfile("user-999");

      expect(result).toBeNull();
    });

    it("lança AppError PROFILE_FETCH_FAILED em caso de erro do Firestore", async () => {
      mockGetDoc.mockRejectedValueOnce(new Error("Firestore error"));

      try {
        await getProfile("user-123");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("PROFILE_FETCH_FAILED");
      }
    });
  });

  describe("ensureProfile", () => {
    it("cria perfil quando ainda não existe", async () => {
      // mockDocData vazio → exists() retorna false
      const user = {
        id: "user-new",
        email: "novo@example.com",
        user_metadata: { full_name: "Novo Usuário" },
      };

      await ensureProfile(user);

      expect(mockSetDoc).toHaveBeenCalledOnce();
      const setDocCall = mockSetDoc.mock.calls[0];
      expect(setDocCall[1]).toMatchObject({ name: "Novo Usuário", user_id: "user-new" });
    });

    it("não cria perfil quando já existe", async () => {
      mockDocData["profiles/user-123"] = createMockProfile();

      await ensureProfile({ id: "user-123", email: "test@example.com" });

      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it("usa e-mail como nome fallback quando sem metadata", async () => {
      await ensureProfile({ id: "user-abc", email: "torcedor@example.com" });

      const setDocCall = mockSetDoc.mock.calls[0];
      expect(setDocCall[1]).toMatchObject({ name: "torcedor" });
    });

    it("usa 'Torcedor' como nome fallback quando sem e-mail", async () => {
      await ensureProfile({ id: "user-abc", email: null });

      const setDocCall = mockSetDoc.mock.calls[0];
      expect(setDocCall[1]).toMatchObject({ name: "Torcedor" });
    });

    it("lança AppError PROFILE_ENSURE_FAILED em caso de erro", async () => {
      mockGetDoc.mockRejectedValueOnce(new Error("Error"));

      try {
        await ensureProfile({ id: "user-123", email: "test@example.com" });
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("PROFILE_ENSURE_FAILED");
      }
    });
  });

  describe("updateProfile", () => {
    it("atualiza perfil existente via updateDoc", async () => {
      mockDocData["profiles/user-123"] = createMockProfile();

      await updateProfile("user-123", { name: "Novo Nome" });

      expect(mockUpdateDoc).toHaveBeenCalledOnce();
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it("cria perfil via setDoc quando não existe", async () => {
      await updateProfile("user-new", { name: "Criado Agora" });

      expect(mockSetDoc).toHaveBeenCalledOnce();
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it("lança AppError PROFILE_UPDATE_FAILED em caso de erro", async () => {
      mockGetDoc.mockRejectedValueOnce(new Error("Error"));

      try {
        await updateProfile("user-123", { name: "Teste" });
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("PROFILE_UPDATE_FAILED");
      }
    });
  });

  describe("updateFavoriteTeam", () => {
    it("delega para updateProfile com campo favorite_team", async () => {
      mockDocData["profiles/user-123"] = createMockProfile();

      await updateFavoriteTeam("user-123", "BRA");

      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall[1]).toMatchObject({ favorite_team: "BRA" });
    });
  });

  describe("updatePreferredLanguage", () => {
    it("delega para updateProfile com campo preferred_language", async () => {
      mockDocData["profiles/user-123"] = createMockProfile();

      await updatePreferredLanguage("user-123", "es");

      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall[1]).toMatchObject({ preferred_language: "es" });
    });
  });

  describe("acceptTerms", () => {
    it("define terms_accepted como true com timestamps", async () => {
      mockDocData["profiles/user-123"] = createMockProfile({ terms_accepted: false });

      await acceptTerms("user-123");

      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall[1]).toMatchObject({
        terms_accepted: true,
        terms_accepted_at: expect.any(String),
        accepted_terms_at: expect.any(String),
      });
    });
  });

  describe("uploadAvatar", () => {
    it("faz upload do arquivo e retorna URL pública", async () => {
      const file = new File(["img-content"], "avatar.png", { type: "image/png" });
      mockDocData["profiles/user-123"] = createMockProfile();

      const url = await uploadAvatar("user-123", file);

      expect(mockUploadBytes).toHaveBeenCalledOnce();
      expect(mockGetDownloadURL).toHaveBeenCalledOnce();
      expect(url).toBe("https://example.com/avatar.png");
    });

    it("atualiza o campo avatar_url após upload", async () => {
      const file = new File(["content"], "pic.jpg", { type: "image/jpeg" });
      mockDocData["profiles/user-123"] = createMockProfile();

      await uploadAvatar("user-123", file);

      const updateCall = mockUpdateDoc.mock.calls[0];
      expect(updateCall[1]).toMatchObject({ avatar_url: "https://example.com/avatar.png" });
    });

    it("lança AppError PROFILE_UPLOAD_AVATAR_FAILED em caso de erro", async () => {
      const file = new File(["content"], "pic.png", { type: "image/png" });
      mockUploadBytes.mockRejectedValueOnce(new Error("Upload failed"));

      try {
        await uploadAvatar("user-123", file);
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("PROFILE_UPLOAD_AVATAR_FAILED");
      }
    });
  });
});
