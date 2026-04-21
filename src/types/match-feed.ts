import type { Championship } from "@/types/championship";

export type MatchFeedStatus = "scheduled" | "live" | "finished";

export interface MatchFeedItem {
  id: string;
  championshipId: string | null;
  championship: Championship | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamCode: string;
  awayTeamCode: string;
  homeTeamName: string;
  awayTeamName: string;
  homeCrest: string | null;
  awayCrest: string | null;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  status: MatchFeedStatus;
  stage: string | null;
  round: number | null;
  groupId: string | null;
}
