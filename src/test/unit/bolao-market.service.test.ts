import { describe, expect, it } from "vitest";
import "../mocks/firebase";
import { buildBolaoMarkets } from "@/services/boloes/bolao-market.service";

const matches = [
  {
    id: "match-1",
    match_date: "2026-06-10T20:00:00.000Z",
    home_team_code: "BRA",
    away_team_code: "ARG",
  },
  {
    id: "match-2",
    match_date: "2026-06-11T20:00:00.000Z",
    home_team_code: "FRA",
    away_team_code: "GER",
  },
];

describe("buildBolaoMarkets", () => {
  it("creates match markets only for allowed matches when the pool is restricted", () => {
    const markets = buildBolaoMarkets({
      bolaoId: "bolao-1",
      formatId: "classic",
      selectedMarketIds: ["exact_score"],
      allowedMatchIds: ["match-1"],
      matches,
    });

    expect(markets).toHaveLength(1);
    expect(markets[0]).toMatchObject({
      bolao_id: "bolao-1",
      match_id: "match-1",
      slug: "exact_score",
    });
  });
});
