import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Descobrir from "@/pages/Descobrir";

vi.mock("@/services/boloes/bolao-listing.service", () => ({
  listUserBoloes: vi.fn(async () => ({
    myBoloes: [],
    pendingRequests: [],
    discoverBoloes: [
      {
        id: "bolao-1",
        name: "Bolão Público",
        description: "Disputa aberta para a rodada.",
        invite_code: "PUB123",
        avatar_url: null,
        category: "public",
        is_paid: false,
        status: "open",
      },
    ],
  })),
}));

vi.mock("@/services/commercial/commercial-discovery.service", () => ({
  listDiscoverCommercialCampaigns: vi.fn(async () => [
    {
      id: "campaign-1",
      title: "Rodada do Clássico",
      shareCode: "CLASSICO",
      benefitSummary: "Cupom no balcão.",
      status: "published",
      merchantName: "Arena Bar",
      city: "Fortaleza",
      neighborhood: "Meireles",
    },
  ]),
}));

vi.mock("@/hooks/useRealtimeNews", () => ({
  useRealtimeNews: () => ({
    isLoading: false,
    news: [
      {
        id: "news-1",
        title: "Conteúdo em alta",
        summary: "Resumo curto da notícia.",
        source_name: "Arena News",
        category: "copa",
        published_at: "2026-04-29T10:00:00.000Z",
        url: "https://example.com/news",
      },
    ],
  }),
}));

describe("Descobrir MVP", () => {
  it("renders public pools, campaigns and content from existing data sources", async () => {
    render(
      <MemoryRouter initialEntries={["/descobrir"]}>
        <Descobrir />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Bolão Público")).toBeInTheDocument();
    });

    expect(screen.getByText("Rodada do Clássico")).toBeInTheDocument();
    expect(screen.getByText("Arena Bar")).toBeInTheDocument();
    expect(screen.getAllByText("Conteúdo em alta").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Entrar no bolão Bolão Público/i })).toHaveAttribute(
      "href",
      "/b/PUB123",
    );
    expect(screen.getByRole("link", { name: /Ver campanha Rodada do Clássico/i })).toHaveAttribute(
      "href",
      "/c/CLASSICO",
    );
  });
});
