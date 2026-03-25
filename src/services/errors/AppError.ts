export type AppErrorCode =
  // Auth
  | "AUTH_EMAIL_IN_USE"
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_WEAK_PASSWORD"
  | "AUTH_USER_NOT_FOUND"
  | "AUTH_TOO_MANY_REQUESTS"
  | "AUTH_POPUP_CLOSED"
  | "AUTH_NETWORK_ERROR"
  | "AUTH_UNKNOWN"
  // Bolão
  | "BOLAO_SAVE_PALPITE_FAILED"
  | "BOLAO_REMOVE_MEMBER_FAILED"
  | "BOLAO_UPDATE_PAYMENT_FAILED"
  | "BOLAO_PREDICTION_SAVE_FAILED"
  | "BOLAO_PREDICTION_INVALID_INPUT"
  // Profile
  | "PROFILE_FETCH_FAILED"
  | "PROFILE_UPDATE_FAILED"
  | "PROFILE_UPLOAD_AVATAR_FAILED"
  | "PROFILE_ENSURE_FAILED"
  // Dashboard
  | "DASHBOARD_FETCH_FAILED"
  // Generic
  | "NETWORK_ERROR"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "UNKNOWN";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly originalError?: unknown;

  constructor(code: AppErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.originalError = originalError;
  }
}

const FIREBASE_ERROR_MAP: Record<string, AppErrorCode> = {
  "auth/email-already-in-use": "AUTH_EMAIL_IN_USE",
  "auth/invalid-credential": "AUTH_INVALID_CREDENTIALS",
  "auth/invalid-email": "AUTH_INVALID_CREDENTIALS",
  "auth/wrong-password": "AUTH_INVALID_CREDENTIALS",
  "auth/weak-password": "AUTH_WEAK_PASSWORD",
  "auth/user-not-found": "AUTH_USER_NOT_FOUND",
  "auth/too-many-requests": "AUTH_TOO_MANY_REQUESTS",
  "auth/popup-closed-by-user": "AUTH_POPUP_CLOSED",
  "auth/cancelled-popup-request": "AUTH_POPUP_CLOSED",
  "auth/network-request-failed": "AUTH_NETWORK_ERROR",
  "permission-denied": "PERMISSION_DENIED",
  "not-found": "NOT_FOUND",
};

const FIREBASE_ERROR_MESSAGES: Record<AppErrorCode, string> = {
  AUTH_EMAIL_IN_USE: "Este e-mail já está em uso.",
  AUTH_INVALID_CREDENTIALS: "E-mail ou senha inválidos.",
  AUTH_WEAK_PASSWORD: "Senha muito fraca. Use pelo menos 6 caracteres.",
  AUTH_USER_NOT_FOUND: "Usuário não encontrado.",
  AUTH_TOO_MANY_REQUESTS: "Muitas tentativas. Tente novamente mais tarde.",
  AUTH_POPUP_CLOSED: "Login cancelado.",
  AUTH_NETWORK_ERROR: "Erro de conexão. Verifique sua internet.",
  AUTH_UNKNOWN: "Erro de autenticação. Tente novamente.",
  BOLAO_SAVE_PALPITE_FAILED: "Não foi possível salvar seu palpite.",
  BOLAO_REMOVE_MEMBER_FAILED: "Não foi possível remover o membro.",
  BOLAO_UPDATE_PAYMENT_FAILED: "Não foi possível atualizar o status de pagamento.",
  BOLAO_PREDICTION_SAVE_FAILED: "Não foi possível salvar sua previsão.",
  BOLAO_PREDICTION_INVALID_INPUT: "Dados de previsão inválidos.",
  PROFILE_FETCH_FAILED: "Não foi possível carregar o perfil.",
  PROFILE_UPDATE_FAILED: "Não foi possível atualizar o perfil.",
  PROFILE_UPLOAD_AVATAR_FAILED: "Não foi possível enviar a imagem.",
  PROFILE_ENSURE_FAILED: "Não foi possível criar o perfil.",
  DASHBOARD_FETCH_FAILED: "Não foi possível carregar os dados do dashboard.",
  NETWORK_ERROR: "Erro de conexão. Verifique sua internet.",
  PERMISSION_DENIED: "Você não tem permissão para realizar esta ação.",
  NOT_FOUND: "Recurso não encontrado.",
  UNKNOWN: "Ocorreu um erro inesperado.",
};

export function mapFirebaseError(error: unknown, fallback: AppErrorCode = "UNKNOWN"): AppError {
  if (error instanceof AppError) return error;

  const firebaseCode = (error as { code?: string })?.code ?? "";
  const mappedCode: AppErrorCode = FIREBASE_ERROR_MAP[firebaseCode] ?? fallback;
  const message = FIREBASE_ERROR_MESSAGES[mappedCode] ?? FIREBASE_ERROR_MESSAGES["UNKNOWN"];

  return new AppError(mappedCode, message, error);
}
