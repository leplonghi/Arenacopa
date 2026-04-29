import { beforeEach, describe, expect, it, vi } from "vitest";

const getDocsMock = vi.fn();

vi.mock("@/integrations/firebase/client", () => ({
  db: {},
  storage: {},
}));

vi.mock("@/i18n/language", () => ({
  getDefaultProfileName: () => "Usuário",
}));

vi.mock("firebase/storage", () => ({
  getDownloadURL: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ type: "collection", name })),
  doc: vi.fn(),
  documentId: vi.fn(() => "__name__"),
  getDoc: vi.fn(),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  query: vi.fn((...args: unknown[]) => ({ type: "query", args })),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn((...args: unknown[]) => ({ type: "where", args })),
}));

function createProfileDoc(id: string) {
  return {
    id,
    data: () => ({
      name: `Nome ${id}`,
      nickname: `Nick ${id}`,
      avatar_url: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    }),
  };
}

function getQueriedIds() {
  const queryArg = getDocsMock.mock.calls.at(-1)?.[0];
  return queryArg.args[1].args[2] as string[];
}

describe("getPublicProfilesByIds", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getDocsMock.mockImplementation(async (queryArg) => {
      const ids = queryArg.args[1].args[2] as string[];
      return {
        forEach: (callback: (doc: ReturnType<typeof createProfileDoc>) => void) => {
          ids.forEach((id) => callback(createProfileDoc(id)));
        },
      };
    });
  });

  it("reaproveita perfis publicos ja carregados e busca apenas ids ausentes", async () => {
    const { getPublicProfilesByIds } = await import("@/services/profile/profile.service");

    const firstResult = await getPublicProfilesByIds(["user-1", "user-2"]);
    expect(getDocsMock).toHaveBeenCalledTimes(1);
    expect(getQueriedIds()).toEqual(["user-1", "user-2"]);
    expect(firstResult.get("user-1")?.name).toBe("Nome user-1");

    const secondResult = await getPublicProfilesByIds(["user-1", "user-3"]);
    expect(getDocsMock).toHaveBeenCalledTimes(2);
    expect(getQueriedIds()).toEqual(["user-3"]);
    expect(secondResult.get("user-1")?.name).toBe("Nome user-1");
    expect(secondResult.get("user-3")?.name).toBe("Nome user-3");
  });

  it("deduplica chamadas concorrentes para os mesmos perfis", async () => {
    const { getPublicProfilesByIds } = await import("@/services/profile/profile.service");

    const [firstResult, secondResult] = await Promise.all([
      getPublicProfilesByIds(["user-1", "user-2"]),
      getPublicProfilesByIds(["user-1", "user-2"]),
    ]);

    expect(getDocsMock).toHaveBeenCalledTimes(1);
    expect(firstResult.get("user-1")?.name).toBe("Nome user-1");
    expect(secondResult.get("user-2")?.name).toBe("Nome user-2");
  });
});
