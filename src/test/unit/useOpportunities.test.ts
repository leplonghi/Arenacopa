import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOpportunities } from "@/hooks/useOpportunities";

describe("getOpportunities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-29T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("prioritizes pending predictions and routes to the first pending pool", () => {
    const opportunities = getOpportunities({
      user: { id: "user-1" },
      pendingPredictions: [{ bolaoIds: ["bolao-1"] }],
      activeBoloes: [{ id: "bolao-1" }],
      upcomingMatches: [{ status: "scheduled", matchDate: "2026-04-29T18:00:00.000Z" }],
      surface: "home",
    });

    expect(opportunities[0]).toMatchObject({
      type: "predict_now",
      ctaRoute: "/boloes/bolao-1",
      priority: 100,
    });
    expect(opportunities.some((opportunity) => opportunity.type === "create_pool")).toBe(true);
  });

  it("suggests discovery when the user has no active pools", () => {
    const opportunities = getOpportunities({
      user: { id: "user-1" },
      activeBoloes: [],
      surface: "boloes",
    });

    expect(opportunities[0]).toMatchObject({
      type: "join_pool",
      ctaRoute: "/descobrir/boloes",
    });
  });

  it("surfaces Creator Pro for recurring creators", () => {
    const opportunities = getOpportunities({
      user: { id: "user-1" },
      activeBoloes: [{ id: "bolao-1" }],
      createdBoloes: [{ id: "bolao-1" }, { id: "bolao-2" }],
      surface: "creator_pro",
    });

    expect(opportunities[0]).toMatchObject({
      type: "upgrade_creator",
      ctaRoute: "/boloes/creator",
    });
  });

  it("keeps business opportunities focused on campaigns and media kit", () => {
    const opportunities = getOpportunities({
      surface: "negocios",
    });

    expect(opportunities.map((opportunity) => opportunity.type)).toEqual([
      "create_campaign",
      "generate_media_kit",
      "read_news",
    ]);
  });
});
