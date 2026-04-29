import { describe, expect, it } from "vitest";
import {
  buildCampaignTitleFromMatch,
  filterFutureMatchesForCampaign,
  formatCep,
  formatWhatsapp,
  normalizeInstagramHandle,
  validateCampaignPeriod,
  validateCep,
  validateWhatsapp,
} from "@/lib/commercial-campaign-input";
import type { MatchFeedItem } from "@/types/match-feed";

const baseMatch: MatchFeedItem = {
  id: "match-1",
  championshipId: "brasileirao2026",
  championship: null,
  homeTeamId: "fortaleza",
  awayTeamId: "ceara",
  homeTeamCode: "FOR",
  awayTeamCode: "CEA",
  homeTeamName: "Fortaleza",
  awayTeamName: "Ceará",
  homeCrest: null,
  awayCrest: null,
  homeScore: null,
  awayScore: null,
  matchDate: "2026-05-01T19:00:00.000Z",
  status: "scheduled",
  stage: null,
  round: null,
  groupId: null,
};

describe("commercial campaign input helpers", () => {
  it("formats and validates Brazilian CEPs", () => {
    expect(formatCep("60160120")).toBe("60160-120");
    expect(validateCep("60160-120").ok).toBe(true);
    expect(validateCep("6016").ok).toBe(false);
  });

  it("formats and validates Brazilian WhatsApp numbers with DDD", () => {
    expect(formatWhatsapp("85999999999")).toBe("(85) 99999-9999");
    expect(validateWhatsapp("(85) 99999-9999").ok).toBe(true);
    expect(validateWhatsapp("9999-9999").ok).toBe(false);
  });

  it("normalizes optional Instagram handles without accepting URLs as stored value", () => {
    expect(normalizeInstagramHandle("@arena.cup")).toBe("arena.cup");
    expect(normalizeInstagramHandle("https://instagram.com/arena.cup/")).toBe("arena.cup");
    expect(normalizeInstagramHandle("")).toBe("");
  });

  it("filters only future scheduled matches for campaign selection", () => {
    const matches = [
      { ...baseMatch, id: "past", matchDate: "2026-04-01T19:00:00.000Z" },
      { ...baseMatch, id: "future", matchDate: "2026-05-01T19:00:00.000Z" },
      { ...baseMatch, id: "live", status: "live" as const, matchDate: "2026-05-01T19:00:00.000Z" },
    ];

    expect(filterFutureMatchesForCampaign(matches, new Date("2026-04-27T12:00:00.000Z")).map((match) => match.id)).toEqual([
      "future",
    ]);
  });

  it("generates a clear round title from the selected match", () => {
    expect(buildCampaignTitleFromMatch(baseMatch)).toBe("Fortaleza x Ceará - rodada especial");
  });

  it("validates campaign periods as future ranges with an end after the start", () => {
    const now = new Date("2026-04-27T12:00:00.000Z");

    expect(validateCampaignPeriod("2026-04-28T12:00", "2026-04-29T12:00", now).ok).toBe(true);
    expect(validateCampaignPeriod("2026-04-26T12:00", "2026-04-29T12:00", now).ok).toBe(false);
    expect(validateCampaignPeriod("2026-04-29T12:00", "2026-04-28T12:00", now).ok).toBe(false);
  });
});
