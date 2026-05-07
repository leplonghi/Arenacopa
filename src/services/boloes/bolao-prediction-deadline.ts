import { AppError } from "@/services/errors/AppError";

export type MatchDeadlineInfo = {
  matchDate?: string | Date | { toDate?: () => Date } | null;
  matchStatus?: string | null;
  cutoffMinutes?: number | null;
  closesAt?: string | Date | { toDate?: () => Date } | null;
  nowMs?: number;
};

export function normalizePredictionCutoffMinutes(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(15, Math.floor(numeric)));
}

export function toTimestampMs(value: MatchDeadlineInfo["matchDate"]) {
  if (!value) return Number.NaN;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().getTime();
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function getPredictionCloseMs(input: MatchDeadlineInfo) {
  const explicitCloseMs = toTimestampMs(input.closesAt);
  if (Number.isFinite(explicitCloseMs)) return explicitCloseMs;

  const kickoffMs = toTimestampMs(input.matchDate);
  if (!Number.isFinite(kickoffMs)) return Number.NaN;
  return kickoffMs + normalizePredictionCutoffMinutes(input.cutoffMinutes) * 60 * 1000;
}

export function isMatchPredictionClosed(input: MatchDeadlineInfo) {
  if (input.matchStatus === "finished") return true;
  const closeMs = getPredictionCloseMs(input);
  return Number.isFinite(closeMs) && (input.nowMs ?? Date.now()) > closeMs;
}

export function assertMatchPredictionOpen(input: MatchDeadlineInfo) {
  if (isMatchPredictionClosed(input)) {
    throw new AppError(
      "BOLAO_PREDICTION_CLOSED",
      "Os palpites deste jogo ja foram encerrados."
    );
  }
}
