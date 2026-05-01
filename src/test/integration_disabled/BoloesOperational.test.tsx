import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Boloes from "@/pages/Boloes";

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

vi.mock("@/services/boloes/bolao-listing.service", () => ({
  listUserBoloes: vi.fn(async () => ({
    myBoloes: [],
    pendingRequests: [],
    discoverBoloes: [],
  })),
}));

vi.mock("@/components/opportunities/OpportunityRail", () => ({
  OpportunityRail: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("@/services/groups/group-access.service", () => ({
  joinViaInvite: vi.fn(),
}));

vi.mock("@/lib/analytics/social.telemetry", () => ({
  trackSocialEvent: vi.fn(),
}));

describe("Boloes operational area", () => {
  it("separates social pool creation, business pools, and operational status", async () => {
    render(
      <MemoryRouter initialEntries={["/boloes"]}>
        <Boloes />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Você ainda não participa de nenhum bolão")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /Criar bolão da turma/i })).toHaveAttribute(
      "href",
      "/boloes/criar",
    );
    expect(screen.getByRole("button", { name: /Sobre bolão da turma/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bolões para negócios/i })).toHaveAttribute(
      "href",
      "/negocios",
    );
    expect(screen.getByRole("button", { name: /Sobre bolões para negócios/i })).toBeInTheDocument();
    expect(screen.getByText("Status dos bolões")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Código do bolão")).toBeInTheDocument();
    expect(screen.getByText("Quer encontrar novos bolões?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explorar bolões/i })).toHaveAttribute(
      "href",
      "/descobrir/boloes",
    );
    expect(screen.getByRole("link", { name: /Comunidades/i })).toHaveAttribute(
      "href",
      "/comunidades",
    );
    expect(screen.getByRole("link", { name: /Creator Pro/i })).toHaveAttribute(
      "href",
      "/boloes/creator",
    );
  });
});
