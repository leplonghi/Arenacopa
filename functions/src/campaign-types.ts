// campaign-types.ts — shared types for all campaign Cloud Functions

export type MerchantType = "bar" | "company";
export type CampaignMode = "in_person" | "online" | "hybrid";
export type CampaignPlan = "rodada" | "torcida" | "copa" | "parceiro";
export type CampaignStatus = "draft" | "active" | "paused" | "finished" | "archived";
export type GameStatus = "setup" | "open" | "locked" | "live" | "finished" | "cancelled";
export type PrizeModel = "all_win" | "quiz_decides" | "all_win_quiz_top";
export type QuotaMode = "free" | "auto" | "manual";
export type QuizStatus =
  | "pending" | "active" | "q1" | "q2" | "q3" | "q4" | "q5" | "finished";
export type PrizeTier =
  | "champion" | "podium_2" | "podium_3"
  | "participant" | "exact_score" | "quiz_winner";

export const PLAN_MAX_PARTICIPANTS: Record<CampaignPlan, number> = {
  rodada:   200,
  torcida:  500,
  copa:     1500,
  parceiro: 999999, // ilimitado
};

export const PLAN_CREDITS: Record<CampaignPlan, number> = {
  rodada:   1,
  torcida:  3,
  copa:     -1, // ilimitado até 19/07
  parceiro: -1,
};

export const COPA_ENDS_AT = new Date("2026-07-19T23:59:59Z");

export type WinnerModelConfig =
  | { type: "champion"; benefit: string }
  | { type: "podium"; benefits: [string, string, string] }
  | { type: "exact_score"; benefit: string; max_winners: number | null }
  | { type: "top_percent"; percent: number; benefit: string; max_winners: number }
  | { type: "universal"; min_points: number; benefit: string };

export type MatchResult = {
  home_score: number;
  away_score: number;
  half_time_home: number | null;
  half_time_away: number | null;
  first_scorer: "home" | "away" | "none" | null;
  total_goals_bracket: "0-1" | "2-3" | "4+" | null;
};

export type ScoringResult = {
  total_points: number;
  exact_score: boolean;
  correct_winner: boolean;
  bonus_points: number;
  breakdown: {
    base: number;
    half_time: number;
    first_scorer: number;
    total_goals: number;
  };
};

export type QuizQuestion = {
  id: string;
  category: string;
  question: string;
  options: string[];
  correct_index: number; // NEVER sent to client
  difficulty: "easy" | "medium" | "hard";
};
