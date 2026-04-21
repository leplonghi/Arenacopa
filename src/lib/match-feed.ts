import type { MatchFeedStatus } from "@/types/match-feed";

type MatchFeedLabelInput = {
  groupId?: string | null;
  round?: number | null;
  stage?: string | null;
};

type MatchStatusInput = {
  status?: string | null;
  matchDate?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
};

const STAGE_LABELS = {
  pt: {
    GROUP_STAGE: "Fase de grupos",
    ROUND_OF_32: "16 avos",
    ROUND_OF_16: "Oitavas",
    QUARTER_FINALS: "Quartas",
    SEMI_FINALS: "Semifinal",
    FINAL: "Final",
    "3RD_PLACE": "3º lugar",
    REGULAR_SEASON: "Liga",
    PLAYOFFS: "Playoffs",
  },
  es: {
    GROUP_STAGE: "Fase de grupos",
    ROUND_OF_32: "Dieciseisavos",
    ROUND_OF_16: "Octavos",
    QUARTER_FINALS: "Cuartos",
    SEMI_FINALS: "Semifinal",
    FINAL: "Final",
    "3RD_PLACE": "3.er puesto",
    REGULAR_SEASON: "Liga",
    PLAYOFFS: "Playoffs",
  },
  en: {
    GROUP_STAGE: "Group stage",
    ROUND_OF_32: "Round of 32",
    ROUND_OF_16: "Round of 16",
    QUARTER_FINALS: "Quarter-finals",
    SEMI_FINALS: "Semi-final",
    FINAL: "Final",
    "3RD_PLACE": "Third place",
    REGULAR_SEASON: "League",
    PLAYOFFS: "Playoffs",
  },
} as const;

const LIVE_SOURCE_STATUSES = new Set(["live", "in_play", "paused"]);
const FINISHED_SOURCE_STATUSES = new Set([
  "finished",
  "full_time",
  "after_extra_time",
  "penalty_shootout",
  "awarded",
]);
const SCHEDULED_SOURCE_STATUSES = new Set([
  "scheduled",
  "upcoming",
  "timed",
  "postponed",
  "suspended",
  "not_started",
]);

const LIVE_MATCH_EARLY_TOLERANCE_MS = 15 * 60 * 1000;
const LIVE_MATCH_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const SCORE_FINALIZATION_GRACE_MS = 90 * 60 * 1000;

function getLanguage(locale: string) {
  if (locale.startsWith("pt")) return "pt";
  if (locale.startsWith("es")) return "es";
  return "en";
}

function getMatchTimestamp(matchDate?: string | null) {
  if (!matchDate) return Number.NaN;

  const timestamp = new Date(matchDate).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
}

function hasFinalScore(homeScore?: number | null, awayScore?: number | null) {
  return homeScore != null && awayScore != null;
}

function normalizeGroupLabel(groupId: string) {
  const cleaned = groupId
    .replace(/^group[\s_-]*/i, "")
    .replace(/^grupo[\s_-]*/i, "")
    .replaceAll("_", " ")
    .trim();

  if (!cleaned) return groupId;

  return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function normalizeMatchDateValue(
  value: string | { toDate?: () => Date } | null | undefined
) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date(0).toISOString();
}

export function normalizeMatchFeedStatus({
  status,
  matchDate,
  homeScore,
  awayScore,
}: MatchStatusInput): MatchFeedStatus {
  const normalized = status?.trim().toLowerCase() ?? "";
  const kickoffTime = getMatchTimestamp(matchDate);
  const now = Date.now();
  const scoreAvailable = hasFinalScore(homeScore, awayScore);

  if (FINISHED_SOURCE_STATUSES.has(normalized)) {
    return "finished";
  }

  if (LIVE_SOURCE_STATUSES.has(normalized)) {
    if (Number.isFinite(kickoffTime) && kickoffTime > now + LIVE_MATCH_EARLY_TOLERANCE_MS) {
      return "scheduled";
    }

    if (Number.isFinite(kickoffTime) && kickoffTime < now - LIVE_MATCH_MAX_AGE_MS) {
      return scoreAvailable ? "finished" : "scheduled";
    }

    return "live";
  }

  if (
    scoreAvailable &&
    Number.isFinite(kickoffTime) &&
    kickoffTime < now - SCORE_FINALIZATION_GRACE_MS
  ) {
    return "finished";
  }

  if (!normalized || SCHEDULED_SOURCE_STATUSES.has(normalized)) {
    return "scheduled";
  }

  return "scheduled";
}

export function getMatchStageLabel(
  { groupId, round, stage }: MatchFeedLabelInput,
  locale: string
) {
  const language = getLanguage(locale);

  if (groupId) {
    const normalizedGroup = normalizeGroupLabel(groupId);
    return language === "en" ? `Group ${normalizedGroup}` : `Grupo ${normalizedGroup}`;
  }

  if (round && stage === "REGULAR_SEASON") {
    if (language === "es") return `Jornada ${round}`;
    if (language === "en") return `Matchday ${round}`;
    return `Rodada ${round}`;
  }

  if (!stage) {
    return null;
  }

  const labelMap = STAGE_LABELS[language];
  return (
    labelMap[stage as keyof typeof labelMap] ??
    stage
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}
