import { describe, it, expect, beforeEach } from "vitest";
import "../mocks/firebase";
import {
  mockSignInWithEmailAndPassword,
  mockCreateUserWithEmailAndPassword,
  mockSignInWithPopup,
  mockSignOut,
  mockUpdateProfile,
  resetFirebaseMocks,
  mockUser,
} from "../mocks/firebase";
import { AppError } from "@/services/errors/AppError";

// Import after mocks are set up
const { signInWithPassword, signUpWithPassword, signInWithGoogle, signOutUser } =
  await import("@/services/auth/auth.service");

describe("auth.service", () => {
  beforeEach(() => {
    resetFirebaseMocks();
  });

  describe("signInWithPassword", () => {
    it("retorna o usuário ao fazer login com sucesso", async () => {
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });

      const user = await signInWithPassword("test@example.com", "password123");

      expect(user).toEqual(mockUser);
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        "test@example.com",
        "password123"
      );
    });

    it("lança AppError com código AUTH_INVALID_CREDENTIALS em credenciais inválidas", async () => {
      const firebaseError = { code: "auth/invalid-credential", message: "Invalid credential" };
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(firebaseError);

      await expect(signInWithPassword("test@example.com", "wrong")).rejects.toThrow(AppError);

      try {
        await signInWithPassword("test@example.com", "wrong");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("AUTH_INVALID_CREDENTIALS");
      }
    });

    it("lança AppError com código AUTH_TOO_MANY_REQUESTS após muitas tentativas", async () => {
      const firebaseError = { code: "auth/too-many-requests", message: "Too many requests" };
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(firebaseError);

      try {
        await signInWithPassword("test@example.com", "password");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("AUTH_TOO_MANY_REQUESTS");
      }
    });

    it("lança AppError com código AUTH_NETWORK_ERROR em erro de rede", async () => {
      const firebaseError = { code: "auth/network-request-failed", message: "Network error" };
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(firebaseError);

      try {
        await signInWithPassword("test@example.com", "password");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("AUTH_NETWORK_ERROR");
      }
    });
  });

  describe("signUpWithPassword", () => {
    it("cria usuário e atualiza o displayName", async () => {
      const newUser = { ...mockUser, uid: "new-user-456" };
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: newUser });

      const user = await signUpWithPassword("new@example.com", "password123", "Novo Torcedor");

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        "new@example.com",
        "password123"
      );
      expect(mockUpdateProfile).toHaveBeenCalledWith(newUser, { displayName: "Novo Torcedor" });
      expect(user).toEqual(newUser);
    });

    it("lança AppError quando e-mail já está em uso", async () => {
      const firebaseError = { code: "auth/email-already-in-use", message: "Email in use" };
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(firebaseError);

      try {
        await signUpWithPassword("existing@example.com", "password123", "Torcedor");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("AUTH_EMAIL_IN_USE");
      }
    });

    it("lança AppError quando senha é muito fraca", async () => {
      const firebaseError = { code: "auth/weak-password", message: "Weak password" };
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(firebaseError);

      try {
        await signUpWithPassword("test@example.com", "123", "Torcedor");
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("AUTH_WEAK_PASSWORD");
      }
    });
  });

  describe("signInWithGoogle", () => {
    it("retorna o usuário do Google com sucesso", async () => {
      const googleUser = { ...mockUser, uid: "google-user-789" };
      mockSignInWithPopup.mockResolvedValueOnce({ user: googleUser });

      const user = await signInWithGoogle();

      expect(user).toEqual(googleUser);
      expect(mockSignInWithPopup).toHaveBeenCalled();
    });

    it("lança AppError quando o popup é fechado", async () => {
      const firebaseError = { code: "auth/popup-closed-by-user", message: "Popup closed" };
      mockSignInWithPopup.mockRejectedValueOnce(firebaseError);

      try {
        await signInWithGoogle();
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
        expect((e as AppError).code).toBe("AUTH_POPUP_CLOSED");
      }
    });
  });

  describe("signOutUser", () => {
    it("faz logout com sucesso", async () => {
      mockSignOut.mockResolvedValueOnce(undefined);

      await expect(signOutUser()).resolves.not.toThrow();
      expect(mockSignOut).toHaveBeenCalled();
    });

    it("lança AppError em caso de falha no logout", async () => {
      const error = new Error("Sign out failed");
      mockSignOut.mockRejectedValueOnce(error);

      try {
        await signOutUser();
      } catch (e) {
        expect(e).toBeInstanceOf(AppError);
      }
    });
  });
});
