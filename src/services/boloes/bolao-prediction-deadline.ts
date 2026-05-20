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
  // Permite até 120 minutos de cutoff (ou grace period se positivo)
  return Math.max(-120, Math.min(120, Math.floor(numeric)));
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

const CLOSED_STATUSES = new Set([
  "finished",
  "full_time",
  "after_extra_time",
  "penalty_shootout",
  "awarded",
  "canceled",
  "postponed"
]);

export function isMatchPredictionClosed(input: MatchDeadlineInfo) {
  const status = input.matchStatus?.toLowerCase()?.trim() || "";
  if (CLOSED_STATUSES.has(status)) return true;
  
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
