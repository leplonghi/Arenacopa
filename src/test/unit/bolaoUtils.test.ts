import { describe, expect, it } from "vitest";
import type { Match } from "@/data/mockData";
import type { Palpite, ScoringRules } from "@/types/bolao";
import { calculatePoints } from "@/utils/bolaoUtils";

const rules: ScoringRules = {
  exact: 5,
  winner: 3,
  draw: 2,
  participation: 1,
};

const baseMatch: Match = {
  id: "match-1",
  homeTeam: "BRA",
  awayTeam: "ARG",
  homeScore: 2,
  awayScore: 1,
  date: "2026-07-01T19:00:00-03:00",
  stadium: "maracana",
  status: "finished",
  phase: "groups",
  group: "A",
};

const createPalpite = (home: number | null, away: number | null, isPowerPlay = false): Palpite => ({
  id: "palpite-1",
  bolao_id: "bolao-1",
  user_id: "user-1",
  match_id: "match-1",
  home_score: home,
  away_score: away,
  is_power_play: isPowerPlay,
  created_at: new Date().toISOString(),
});

describe("calculatePoints", () => {
  it("marca placar exato com a pontuacao cheia", () => {
    const result = calculatePoints(createPalpite(2, 1), baseMatch, rules);

    expect(result).toEqual({
      points: 5,
      type: "exact",
      isPowerPlay: false,
    });
  });

  it("pontua vencedor correto mesmo sem placar exato", () => {
    const result = calculatePoints(createPalpite(1, 0), baseMatch, rules);

    expect(result.points).toBe(3);
    expect(result.type).toBe("winner");
  });

  it("usa regra de empate quando acerta o resultado empatado", () => {
    const drawMatch: Match = {
      ...baseMatch,
      homeScore: 1,
      awayScore: 1,
    };

    const result = calculatePoints(createPalpite(0, 0), drawMatch, rules);

    expect(result.points).toBe(2);
    expect(result.type).toBe("draw");
  });

  it("duplica a pontuacao quando o power play acerta", () => {
    const result = calculatePoints(createPalpite(3, 1, true), baseMatch, rules);

    expect(result.points).toBe(6);
    expect(result.isPowerPlay).toBe(true);
  });

  it("nao pontua jogo sem resultado final", () => {
    const scheduledMatch: Match = {
      ...baseMatch,
      status: "scheduled",
      homeScore: undefined,
      awayScore: undefined,
    };

    const result = calculatePoints(createPalpite(2, 1), scheduledMatch, rules);

    expect(result.points).toBe(0);
    expect(result.type).toBe("miss");
  });
});
