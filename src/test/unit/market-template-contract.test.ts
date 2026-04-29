import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { bolaoFormats } from "@/data/bolaoFormats";
import { bolaoMarketTemplates } from "@/data/bolaoMarketTemplates";

type BuildBolaoMarkets = (input: {
  bolaoId: string;
  selectedMarketIds: string[];
  matches: Array<{
    id: string;
    match_date: string;
    home_team_code: string;
    away_team_code: string;
  }>;
}) => Array<{ slug: string }>;

const require = createRequire(import.meta.url);
const { buildBolaoMarkets } = require("../../../functions/bolao-config/market-sync.js") as {
  buildBolaoMarkets: BuildBolaoMarkets;
};

const enabledFormats = bolaoFormats.filter((format) => format.isEnabled);
const frontendTemplateIds = new Set(bolaoMarketTemplates.map((template) => template.id));

describe("market template contract", () => {
  it("keeps enabled format defaults backed by frontend templates", () => {
    const missing = enabledFormats.flatMap((format) =>
      format.defaultMarketIds
        .filter((marketId) => !frontendTemplateIds.has(marketId))
        .map((marketId) => `${format.id}:${marketId}`),
    );

    expect(missing).toEqual([]);
  });

  it("keeps enabled format defaults supported by the Functions market builder", () => {
    const unsupported = enabledFormats.flatMap((format) => {
      const markets = buildBolaoMarkets({
        bolaoId: `contract-${format.id}`,
        selectedMarketIds: format.defaultMarketIds,
        matches: [
          {
            id: "match-1",
            match_date: "2026-06-10T20:00:00.000Z",
            home_team_code: "BRA",
            away_team_code: "ARG",
          },
        ],
      });
      const builtSlugs = new Set(markets.map((market) => market.slug));

      return format.defaultMarketIds
        .filter((marketId) => !builtSlugs.has(marketId))
        .map((marketId) => `${format.id}:${marketId}`);
    });

    expect(unsupported).toEqual([]);
  });

  it("keeps every enabled frontend template supported by the Functions market builder", () => {
    const unsupported = bolaoMarketTemplates
      .filter((template) => template.isEnabled)
      .filter((template) => {
        const markets = buildBolaoMarkets({
          bolaoId: `contract-template-${template.id}`,
          selectedMarketIds: [template.id],
          matches: [
            {
              id: "match-1",
              match_date: "2026-06-10T20:00:00.000Z",
              home_team_code: "BRA",
              away_team_code: "ARG",
            },
          ],
        });

        return !markets.some((market) => market.slug === template.id);
      })
      .map((template) => template.id);

    expect(unsupported).toEqual([]);
  });
});
