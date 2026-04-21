import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMatchStageLabel,
  normalizeMatchFeedStatus,
} from "@/lib/match-feed";

describe("normalizeMatchFeedStatus", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rebaixa jogo marcado como live quando o kickoff ainda esta no futuro", () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-19T15:00:00.000Z").getTime());

    expect(
      normalizeMatchFeedStatus({
        status: "live",
        matchDate: "2026-04-19T16:30:00.000Z",
      })
    ).toBe("scheduled");
  });

  it("fecha jogo live muito antigo quando ja existe placar final", () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-19T18:00:00.000Z").getTime());

    expect(
      normalizeMatchFeedStatus({
        status: "live",
        matchDate: "2026-04-19T10:00:00.000Z",
        homeScore: 2,
        awayScore: 1,
      })
    ).toBe("finished");
  });

  it("promove placar antigo com status upcoming para finished", () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-19T18:00:00.000Z").getTime());

    expect(
      normalizeMatchFeedStatus({
        status: "upcoming",
        matchDate: "2026-04-19T14:00:00.000Z",
        homeScore: 1,
        awayScore: 1,
      })
    ).toBe("finished");
  });

  it("mantem live quando o jogo esta dentro da janela esperada", () => {
    vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-19T18:00:00.000Z").getTime());

    expect(
      normalizeMatchFeedStatus({
        status: "paused",
        matchDate: "2026-04-19T16:30:00.000Z",
      })
    ).toBe("live");
  });
});

describe("getMatchStageLabel", () => {
  it("normaliza grupos vindos como GROUP_A", () => {
    expect(
      getMatchStageLabel(
        {
          groupId: "GROUP_A",
        },
        "pt-BR"
      )
    ).toBe("Grupo A");
  });

  it("mantem o prefixo traduzido em ingles", () => {
    expect(
      getMatchStageLabel(
        {
          groupId: "grupo b",
        },
        "en-US"
      )
    ).toBe("Group B");
  });
});
