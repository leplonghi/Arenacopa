import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BolaoRapido from "@/pages/BolaoRapido";

const createBolaoMock = vi.hoisted(() =>
  vi.fn(async () => ({
    bolaoId: "bolao-1",
    inviteCode: "ABC123",
  })),
);

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
  }),
}));

vi.mock("@/contexts/ChampionshipContext", () => ({
  useChampionship: () => ({
    current: { id: "wc2026" },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/hooks/useCreateBolao", () => ({
  useCreateBolao: () => ({
    createBolao: createBolaoMock,
    creating: false,
  }),
}));

vi.mock("@/integrations/firebase/client", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  getDocs: vi.fn(async () => ({
    docs: [
      {
        id: "match-1",
        data: () => ({
          home_team_code: "BRA",
          away_team_code: "ARG",
          match_date: "2026-04-29T18:00:00.000Z",
          status: "scheduled",
          stage: "group",
          group_id: "A",
        }),
      },
    ],
  })),
  orderBy: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock("@capacitor/share", () => ({
  Share: {
    share: vi.fn(),
  },
}));

describe("BolaoRapido", () => {
  afterEach(() => {
    createBolaoMock.mockClear();
  });

  it("creates quick pools with exact_score instead of the legacy score market", async () => {
    render(
      <MemoryRouter initialEntries={["/boloes/rapido"]}>
        <BolaoRapido />
      </MemoryRouter>,
    );

    const versus = await screen.findByText("express.versus");
    const matchButton = versus.closest("button");
    expect(matchButton).not.toBeNull();
    fireEvent.click(matchButton as HTMLButtonElement);

    fireEvent.click(screen.getByRole("button", { name: /express.create_and_share/i }));

    await waitFor(() => {
      expect(createBolaoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          formatId: "classic",
          matchId: "match-1",
          selectedMarketIds: ["exact_score"],
        }),
      );
    });
  });
});
