import { describe, expect, it, vi } from "vitest";
import { buildBolaoPalpiteId, buildLegacyBolaoPalpiteId, saveBolaoPalpite } from "@/services/boloes/bolao.service";

const docMock = vi.hoisted(() => vi.fn((_, collectionName: string, id: string) => ({ collectionName, id })));
const setDocMock = vi.hoisted(() => vi.fn(async () => undefined));
const updateDocMock = vi.hoisted(() => vi.fn(async () => undefined));
const batchSetMock = vi.hoisted(() => vi.fn());
const batchUpdateMock = vi.hoisted(() => vi.fn());
const batchCommitMock = vi.hoisted(() => vi.fn(async () => undefined));
const writeBatchMock = vi.hoisted(() =>
  vi.fn(() => ({
    set: batchSetMock,
    update: batchUpdateMock,
    commit: batchCommitMock,
  })),
);
const getDocMock = vi.hoisted(() =>
  vi.fn(async (ref: { id: string }) => ({
    id: ref.id,
    data: () => ({
      bolao_id: "bolao-1",
      user_id: "user-1",
      match_id: "match-1",
      home_score: 2,
      away_score: 1,
      is_power_play: false,
    }),
  })),
);

vi.mock("@/integrations/firebase/client", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_, collectionName: string) => ({ collectionName })),
  doc: docMock,
  getDocs: vi.fn(async () => ({ empty: true, docs: [] })),
  setDoc: setDocMock,
  getDoc: getDocMock,
  limit: vi.fn(),
  query: vi.fn((source) => source),
  updateDoc: updateDocMock,
  where: vi.fn(),
  writeBatch: writeBatchMock,
  serverTimestamp: () => "server-timestamp",
}));

vi.mock("@/services/boloes/bolao-config.service", () => ({
  leaveBolao: vi.fn(),
  updatePoolMemberPaymentStatus: vi.fn(),
}));

describe("bolao palpite ids", () => {
  it("builds canonical and legacy ids explicitly", () => {
    const input = { userId: "user-1", bolaoId: "bolao-1", matchId: "match-1" };

    expect(buildBolaoPalpiteId(input)).toBe("user-1_bolao-1_match-1");
    expect(buildLegacyBolaoPalpiteId(input)).toBe("user-1_match-1_bolao-1");
  });

  it("creates new palpites with the canonical id", async () => {
    await saveBolaoPalpite({
      bolaoId: "bolao-1",
      userId: "user-1",
      matchId: "match-1",
      homeScore: 2,
      awayScore: 1,
      isPowerPlay: false,
    });

    expect(docMock).toHaveBeenCalledWith({}, "bolao_palpites", "user-1_bolao-1_match-1");
    expect(batchSetMock).toHaveBeenCalled();
    expect(batchCommitMock).toHaveBeenCalled();
  });

  it("updates an existing legacy id when read compatibility found one", async () => {
    await saveBolaoPalpite({
      bolaoId: "bolao-1",
      userId: "user-1",
      matchId: "match-1",
      homeScore: 2,
      awayScore: 1,
      isPowerPlay: false,
      existingId: "user-1_match-1_bolao-1",
    });

    expect(docMock).toHaveBeenCalledWith({}, "bolao_palpites", "user-1_match-1_bolao-1");
    expect(batchUpdateMock).toHaveBeenCalled();
    expect(batchCommitMock).toHaveBeenCalled();
  });
});
