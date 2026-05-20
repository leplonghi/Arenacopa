import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useDashboardMatches } from "@/hooks/useDashboardMatches";

const onSnapshotMock = vi.fn();
const unsubscribeMock = vi.fn();

vi.mock("@/integrations/firebase/client", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn((...args: unknown[]) => ({ type: "collection", args })),
  limit: vi.fn((...args: unknown[]) => ({ type: "limit", args })),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  orderBy: vi.fn((...args: unknown[]) => ({ type: "orderBy", args })),
  query: vi.fn((...args: unknown[]) => ({ type: "query", args })),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({ type: "timestamp", date })),
  },
  where: vi.fn((...args: unknown[]) => ({ type: "where", args })),
}));

function DashboardConsumer() {
  useDashboardMatches();
  return null;
}

describe("useDashboardMatches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unsubscribeMock.mockClear();
    onSnapshotMock.mockReturnValue(unsubscribeMock);
  });

  it("compartilha uma unica assinatura Firestore entre consumidores simultaneos", async () => {
    const view = render(
      <>
        <DashboardConsumer />
        <DashboardConsumer />
      </>,
    );

    await waitFor(() => {
      expect(onSnapshotMock).toHaveBeenCalledTimes(1);
    });

    view.unmount();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });
});
