const test = require("node:test");
const assert = require("node:assert/strict");
const { buildBolaoMarkets } = require("../bolao-config/market-sync");

test("buildBolaoMarkets creates match and tournament markets from selected templates", () => {
  const markets = buildBolaoMarkets({
    bolaoId: "bolao-1",
    selectedMarketIds: ["match_winner", "champion"],
    matches: [
      {
        id: "match-1",
        match_date: "2026-06-10T20:00:00.000Z",
        home_team_code: "BRA",
        away_team_code: "ARG",
      },
    ],
  });

  assert.equal(markets.length, 2);
  assert.equal(markets[0].id, "bolao-1_match_winner_match-1");
  assert.equal(markets[0].scope, "match");
  assert.equal(markets[1].scope, "tournament");
  assert.equal(markets[1].slug, "champion");
});
