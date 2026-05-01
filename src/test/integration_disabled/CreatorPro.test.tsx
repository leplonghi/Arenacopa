import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CreatorPro from "@/pages/CreatorPro";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
  }),
}));

vi.mock("@/services/boloes/creator-pro.service", () => ({
  listCreatorBoloes: vi.fn(async () => [
    {
      id: "bolao-1",
      name: "Bolão do Criador",
      description: "Edição semanal.",
      inviteCode: "PRO123",
      avatarUrl: null,
      status: "active",
      category: "public",
      createdAt: "2026-04-29T10:00:00.000Z",
    },
  ]),
}));

describe("CreatorPro", () => {
  it("renders creator tools, created pools and keeps upgrade separate", async () => {
    render(
      <MemoryRouter initialEntries={["/boloes/creator"]}>
        <CreatorPro />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Bolão do Criador")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Creator Pro" })).toBeInTheDocument();
    expect(screen.getByText(/Organize bolões com cara profissional/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Criar bolão/i })[0]).toHaveAttribute("href", "/boloes/criar");
    expect(screen.getByText("Kit de divulgação")).toBeInTheDocument();
    expect(screen.getByText("Sponsor próprio")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Ver upgrade/i })).toHaveAttribute("href", "/premium");
  });
});
