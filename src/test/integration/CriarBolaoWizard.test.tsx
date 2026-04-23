import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, vi, expect } from "vitest";
import CriarBolao from "@/pages/CriarBolao";

vi.mock("@/contexts/ChampionshipContext", () => ({
  useChampionship: () => ({
    current: { id: "wc2026" },
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
  }),
}));

vi.mock("@/integrations/firebase/client", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(async () => ({ exists: () => false })),
  getDocs: vi.fn(async () => ({ docs: [] })),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("CriarBolao wizard", () => {
  it("starts with structural choices before naming the bolao", () => {
    render(
      <MemoryRouter initialEntries={["/boloes/criar"]}>
        <CriarBolao />
      </MemoryRouter>,
    );

    expect(screen.getByText("Onde esse bolão vai viver?")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Nome do bolão")).not.toBeInTheDocument();
  });
});
