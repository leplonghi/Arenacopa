import { describe, expect, it } from "vitest";
import { mapExclusiveScoreLocks } from "@/services/boloes/bolao-exclusive-locks.service";

describe("bolao exclusive score locks", () => {
  it("maps lock documents into occupied seats grouped by match", () => {
    const locks = mapExclusiveScoreLocks([
      {
        id: "bolao-1_match-1_2_1",
        data: {
          bolao_id: "bolao-1",
          match_id: "match-1",
          home_score: 2,
          away_score: 1,
          user_id: "user-2",
        },
      },
      {
        id: "bolao-1_match-2_0_0",
        data: {
          bolao_id: "bolao-1",
          match_id: "match-2",
          home_score: "0",
          away_score: 0,
          user_id: "user-3",
        },
      },
    ]);

    expect(locks).toEqual({
      "match-1": [{ home: 2, away: 1, userId: "user-2" }],
      "match-2": [{ home: 0, away: 0, userId: "user-3" }],
    });
  });

  it("ignores malformed lock documents", () => {
    const locks = mapExclusiveScoreLocks([
      {
        id: "missing-score",
        data: {
          bolao_id: "bolao-1",
          match_id: "match-1",
          home_score: 1,
          user_id: "user-2",
        },
      },
      {
        id: "missing-user",
        data: {
          bolao_id: "bolao-1",
          match_id: "match-1",
          home_score: 1,
          away_score: 0,
        },
      },
    ]);

    expect(locks).toEqual({});
  });
});
