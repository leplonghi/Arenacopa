import { describe, expect, it } from "vitest";
import { groups } from "@/data/mockData";
import type { Standing } from "@/contexts/SimulacaoContext";
import {
  buildKnockoutBracket,
  getMatchWinner,
  getQualifiedTeams,
  isDrawRegulation,
  type KnockoutScore,
} from "@/utils/knockoutBracket";

const createStanding = (
  teamCode: string,
  points: number,
  gf: number,
  ga: number,
): Standing => ({
  teamCode,
  played: 3,
  won: 2,
  drawn: 0,
  lost: 1,
  gf,
  ga,
  points,
});

const standings = Object.fromEntries(
  groups.map((group, index) => [
    group,
    [
      createStanding(`${group}1`, 9 - (index % 2), 6 + index, 1),
      createStanding(`${group}2`, 6, 4 + index, 2),
      createStanding(`${group}3`, 4 + (index % 3), 3 + index, 3),
      createStanding(`${group}4`, 1, 1, 5 + index),
    ],
  ]),
) as Record<string, Standing[]>;

describe("knockout bracket helpers", () => {
  it("seleciona 32 classificados quando todos os grupos estao completos", () => {
    const qualified = getQualifiedTeams(standings, groups);

    expect(qualified).not.toBeNull();
    expect(qualified).toHaveLength(32);
    expect(new Set(qualified)).toHaveLength(32);
    expect(qualified?.slice(0, 12).every((teamCode) => teamCode.endsWith("1"))).toBe(true);
    expect(qualified?.slice(12, 24).every((teamCode) => teamCode.endsWith("2"))).toBe(true);
  });

  it("monta a chave e propaga vencedores para a rodada seguinte", () => {
    const seeds = getQualifiedTeams(standings, groups);
    expect(seeds).not.toBeNull();

    const storedScores: Record<string, KnockoutScore[]> = {
      r32: Array.from({ length: 16 }, (_, index) => ({
        homeScore: 2 + (index % 2),
        awayScore: 0,
        homePenalty: null,
        awayPenalty: null,
      })),
    };

    const bracket = buildKnockoutBracket(seeds ?? [], storedScores);

    expect(bracket.r32).toHaveLength(16);
    expect(bracket.r16[0].home).toBe(bracket.r32[0].home);
    expect(bracket.r16[0].away).toBe(bracket.r32[1].home);
  });

  it("resolve vencedor por penaltis quando o tempo normal empata", () => {
    const winner = getMatchWinner({
      home: "BRA",
      away: "ARG",
      score: {
        homeScore: 1,
        awayScore: 1,
        homePenalty: 4,
        awayPenalty: 3,
      },
    });

    expect(winner).toBe("BRA");
    expect(
      isDrawRegulation({
        homeScore: 1,
        awayScore: 1,
        homePenalty: 4,
        awayPenalty: 3,
      }),
    ).toBe(true);
  });
});
