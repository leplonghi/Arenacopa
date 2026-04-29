import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Grupos from "@/pages/Grupos";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("@/integrations/firebase/client", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(async () => ({ docs: [] })),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock("@/services/groups/group-access.service", () => ({
  joinViaInvite: vi.fn(),
}));

vi.mock("@/lib/analytics/social.telemetry", () => ({
  trackSocialEvent: vi.fn(),
}));

describe("Comunidades positioning", () => {
  it("presents groups as communities without changing the old backend concepts", async () => {
    render(
      <MemoryRouter initialEntries={["/comunidades"]}>
        <Grupos />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Você ainda não participa de nenhuma comunidade")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Criar comunidade/i })).toHaveAttribute(
      "href",
      "/comunidades/criar",
    );
    expect(screen.getByText(/Comunidade é sua base recorrente/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Código da comunidade")).toBeInTheDocument();
  });
});
