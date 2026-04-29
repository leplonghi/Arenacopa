import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Descobrir from "@/pages/Descobrir";

vi.mock("@/services/boloes/bolao-listing.service", () => ({
  listUserBoloes: vi.fn(async () => ({
    myBoloes: [],
    pendingRequests: [],
    discoverBoloes: [],
  })),
}));

vi.mock("@/services/commercial/commercial-discovery.service", () => ({
  listDiscoverCommercialCampaigns: vi.fn(async () => []),
}));

vi.mock("@/hooks/useRealtimeNews", () => ({
  useRealtimeNews: () => ({
    isLoading: false,
    news: [],
  }),
}));

describe("Descobrir", () => {
  it("renders the base exploration sections with stable internal links", async () => {
    render(
      <MemoryRouter>
        <Descobrir />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Descobrir" })).toBeInTheDocument();
    expect(screen.getAllByText("Para você").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Explorar bolões/i })).toHaveAttribute(
      "href",
      "/descobrir/boloes",
    );
    expect(screen.getByRole("link", { name: /Ver campanhas/i })).toHaveAttribute(
      "href",
      "/descobrir/campanhas",
    );
    expect(screen.getByRole("heading", { name: "Bolões" })).toHaveClass("break-words");
    expect(screen.getByRole("link", { name: /Explorar bolões/i })).toHaveClass("whitespace-normal");
    await waitFor(() => {
      expect(screen.getByText("Nenhum bolão público disponível agora")).toBeInTheDocument();
    });
  });
});
