import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePendingPredictions } from "@/hooks/usePendingPredictions";

const getDocsMock = vi.fn();
const onSnapshotMock = vi.fn();
const unsubscribeMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
  }),
}));

vi.mock("@/integrations/firebase/client", () => ({
  db: {},
}));

vi.mock("@/hooks/useDashboardMatches", () => ({
  useDashboardMatches: () => ({
    data: [],
    error: null,
    isLoading: false,
  }),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ type: "collection", name })),
  documentId: vi.fn(() => "__name__"),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  orderBy: vi.fn((...args: unknown[]) => ({ type: "orderBy", args })),
  query: vi.fn((...args: unknown[]) => ({ type: "query", args })),
  where: vi.fn((...args: unknown[]) => ({ type: "where", args })),
}));

function PendingPredictionsConsumer() {
  usePendingPredictions();
  return null;
}

function getSnapshotCollectionNames() {
  return onSnapshotMock.mock.calls.map(([queryArg]) => queryArg.args[0].name);
}

describe("usePendingPredictions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unsubscribeMock.mockClear();
    onSnapshotMock.mockReturnValue(unsubscribeMock);
    getDocsMock.mockResolvedValue({ docs: [] });
  });

  it("nao abre assinatura propria para matches", async () => {
    const view = render(<PendingPredictionsConsumer />);

    await waitFor(() => {
      expect(onSnapshotMock).toHaveBeenCalled();
    });

    expect(getSnapshotCollectionNames()).not.toContain("matches");

    view.unmount();
  });
});
