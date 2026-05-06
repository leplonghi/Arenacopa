import { describe, it, expect } from "vitest";
import { generateGroupMatches, calcStandings, initMatches } from "@/utils/simulacaoUtils";
import type { SimMatch } from "@/contexts/SimulacaoContext";

const GROUP = "A";

describe("generateGroupMatches", () => {
  it("gera combinações únicas de pares sem repetição para grupo com 4 times", () => {
    const matches = generateGroupMatches(GROUP);

    // 4 times → C(4,2) = 6 jogos
    expect(matches).toHaveLength(6);
    // Todos começam sem placar
    matches.forEach((m) => {
      expect(m.homeScore).toBeNull();
      expect(m.awayScore).toBeNull();
    });
  });

  it("não gera jogo de um time contra si mesmo", () => {
    const matches = generateGroupMatches(GROUP);
    matches.forEach((m) => {
      expect(m.home).not.toBe(m.away);
    });
  });

  it("não duplica confrontos (A x B ≠ B x A duplicado)", () => {
    const matches = generateGroupMatches(GROUP);
    const pairs = new Set(matches.map((m) => [m.home, m.away].sort().join("-")));
    expect(pairs.size).toBe(matches.length);
  });
});

describe("calcStandings", () => {
  const makeMatch = (
    home: string,
    away: string,
    homeScore: number,
    awayScore: number
  ): SimMatch => ({
    home,
    away,
    homeScore,
    awayScore,
  });

  it("calcula 3 pontos para o vencedor e 0 para o perdedor", () => {
    const baseMatches = generateGroupMatches(GROUP);
    const teams = [...new Set(baseMatches.flatMap((m) => [m.home, m.away]))];
    const [t1, t2] = teams;

    const matches: SimMatch[] = [makeMatch(t1, t2, 2, 0)];
    const standings = calcStandings(matches, GROUP);

    const winner = standings.find((s) => s.teamCode === t1);
    const loser = standings.find((s) => s.teamCode === t2);

    expect(winner?.points).toBe(3);
    expect(winner?.won).toBe(1);
    expect(loser?.points).toBe(0);
    expect(loser?.lost).toBe(1);
  });

  it("distribui 1 ponto para cada time em caso de empate", () => {
    const baseMatches = generateGroupMatches(GROUP);
    const teams = [...new Set(baseMatches.flatMap((m) => [m.home, m.away]))];
    const [t1, t2] = teams;

    const matches: SimMatch[] = [makeMatch(t1, t2, 1, 1)];
    const standings = calcStandings(matches, GROUP);

    const s1 = standings.find((s) => s.teamCode === t1);
    const s2 = standings.find((s) => s.teamCode === t2);

    expect(s1?.points).toBe(1);
    expect(s2?.points).toBe(1);
    expect(s1?.drawn).toBe(1);
    expect(s2?.drawn).toBe(1);
  });

  it("acumula gols marcados e sofridos corretamente", () => {
    const baseMatches = generateGroupMatches(GROUP);
    const teams = [...new Set(baseMatches.flatMap((m) => [m.home, m.away]))];
    const [t1, t2] = teams;

    const matches: SimMatch[] = [makeMatch(t1, t2, 3, 1)];
    const standings = calcStandings(matches, GROUP);

    const s1 = standings.find((s) => s.teamCode === t1);
    const s2 = standings.find((s) => s.teamCode === t2);

    expect(s1?.gf).toBe(3);
    expect(s1?.ga).toBe(1);
    expect(s2?.gf).toBe(1);
    expect(s2?.ga).toBe(3);
  });

  it("ordena por pontos, saldo de gols e gols marcados", () => {
    const baseMatches = generateGroupMatches(GROUP);
    const teams = [...new Set(baseMatches.flatMap((m) => [m.home, m.away]))];
    const [t1, t2, t3] = teams;

    const matches: SimMatch[] = [
      makeMatch(t1, t2, 2, 0), // t1 → 3pts, t2 → 0pts
      makeMatch(t1, t3, 1, 0), // t1 → 6pts, t3 → 0pts
      makeMatch(t2, t3, 1, 0), // t2 → 3pts, t3 → 0pts
    ];

    const standings = calcStandings(matches, GROUP);

    expect(standings[0].teamCode).toBe(t1);
    expect(standings[0].points).toBe(6);
    expect(standings[1].teamCode).toBe(t2);
    expect(standings[1].points).toBe(3);
  });

  it("ignora partidas sem placar definido", () => {
    const matches: SimMatch[] = [{ home: "BRA", away: "ARG", homeScore: null, awayScore: null }];
    const standings = calcStandings(matches, GROUP);

    standings.forEach((s) => {
      expect(s.played).toBe(0);
      expect(s.points).toBe(0);
    });
  });

  it("retorna standings para todos os times do grupo", () => {
    const matches = generateGroupMatches(GROUP);
    const standings = calcStandings(matches, GROUP);

    // Grupo A tem 4 times
    expect(standings.length).toBeGreaterThanOrEqual(4);
  });
});

describe("initMatches", () => {
  it("inicializa partidas para grupos selecionados", () => {
    const result = initMatches(["A", "B"]);

    expect(result).toHaveProperty("A");
    expect(result).toHaveProperty("B");
    expect(result["A"].length).toBeGreaterThan(0);
    expect(result["B"].length).toBeGreaterThan(0);
  });

  it("todos os jogos começam sem placar", () => {
    const result = initMatches(["A"]);

    result["A"].forEach((m) => {
      expect(m.homeScore).toBeNull();
      expect(m.awayScore).toBeNull();
    });
  });
});
