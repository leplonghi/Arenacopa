import { describe, it, expect } from "vitest";
import { AppError, mapFirebaseError } from "@/services/errors/AppError";

describe("AppError", () => {
  it("cria erro com código e mensagem corretamente", () => {
    const error = new AppError("AUTH_INVALID_CREDENTIALS", "Credenciais inválidas");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("AUTH_INVALID_CREDENTIALS");
    expect(error.message).toBe("Credenciais inválidas");
    expect(error.name).toBe("AppError");
  });

  it("armazena o erro original", () => {
    const original = new Error("firebase error");
    const error = new AppError("UNKNOWN", "Erro", original);

    expect(error.originalError).toBe(original);
  });
});

describe("mapFirebaseError", () => {
  it("mapeia auth/email-already-in-use → AUTH_EMAIL_IN_USE", () => {
    const firebaseError = { code: "auth/email-already-in-use" };
    const error = mapFirebaseError(firebaseError);

    expect(error.code).toBe("AUTH_EMAIL_IN_USE");
    expect(error.message).toBe("Este e-mail já está em uso.");
  });

  it("mapeia auth/invalid-credential → AUTH_INVALID_CREDENTIALS", () => {
    const error = mapFirebaseError({ code: "auth/invalid-credential" });
    expect(error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("mapeia auth/weak-password → AUTH_WEAK_PASSWORD", () => {
    const error = mapFirebaseError({ code: "auth/weak-password" });
    expect(error.code).toBe("AUTH_WEAK_PASSWORD");
  });

  it("mapeia auth/too-many-requests → AUTH_TOO_MANY_REQUESTS", () => {
    const error = mapFirebaseError({ code: "auth/too-many-requests" });
    expect(error.code).toBe("AUTH_TOO_MANY_REQUESTS");
  });

  it("mapeia auth/popup-closed-by-user → AUTH_POPUP_CLOSED", () => {
    const error = mapFirebaseError({ code: "auth/popup-closed-by-user" });
    expect(error.code).toBe("AUTH_POPUP_CLOSED");
  });

  it("mapeia auth/network-request-failed → AUTH_NETWORK_ERROR", () => {
    const error = mapFirebaseError({ code: "auth/network-request-failed" });
    expect(error.code).toBe("AUTH_NETWORK_ERROR");
  });

  it("mapeia permission-denied → PERMISSION_DENIED", () => {
    const error = mapFirebaseError({ code: "permission-denied" });
    expect(error.code).toBe("PERMISSION_DENIED");
  });

  it("usa o fallback fornecido para erros desconhecidos", () => {
    const error = mapFirebaseError({ code: "unknown-error" }, "DASHBOARD_FETCH_FAILED");
    expect(error.code).toBe("DASHBOARD_FETCH_FAILED");
  });

  it("usa UNKNOWN como fallback padrão", () => {
    const error = mapFirebaseError({ code: "totally-unknown" });
    expect(error.code).toBe("UNKNOWN");
  });

  it("retorna o mesmo AppError se já for uma instância de AppError", () => {
    const original = new AppError("NOT_FOUND", "Não encontrado");
    const result = mapFirebaseError(original);

    expect(result).toBe(original);
  });

  it("armazena o erro original no campo originalError", () => {
    const firebaseError = { code: "auth/invalid-credential", message: "invalid" };
    const error = mapFirebaseError(firebaseError);

    expect(error.originalError).toBe(firebaseError);
  });
});
