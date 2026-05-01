import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CriarCampanhaBar from "@/pages/CriarCampanhaBar";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    session: { getIdToken: vi.fn(async () => "token-1") },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/hooks/useDashboardMatches", () => ({
  useDashboardMatches: () => ({
    isLoading: false,
    data: [
      {
        id: "match-1",
        championshipId: "brasileirao2026",
        championship: null,
        homeTeamId: "fortaleza",
        awayTeamId: "ceara",
        homeTeamCode: "FOR",
        awayTeamCode: "CEA",
        homeTeamName: "Fortaleza",
        awayTeamName: "Ceará",
        homeCrest: null,
        awayCrest: null,
        homeScore: null,
        awayScore: null,
        matchDate: "2099-05-01T19:00:00.000Z",
        status: "scheduled",
        stage: null,
        round: null,
        groupId: null,
      },
    ],
  }),
}));

vi.mock("@/services/commercial/commercial-campaign.service", () => ({
  createCommercialCampaignDraft: vi.fn(async () => ({ id: "campaign-1" })),
  listManagedMerchants: vi.fn(async () => []),
}));

describe("CriarCampanhaBar guided wizard", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ cep: "60160-120", localidade: "Fortaleza", bairro: "Meireles" }),
      })),
    );
  });

  it("shows campaign price before asking for merchant data", () => {
    render(
      <MemoryRouter>
        <CriarCampanhaBar />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Plano da campanha/i)).toBeInTheDocument();
    expect(screen.getAllByText(/R\$29,90/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ate 100 participantes/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Ate 1.000 participantes/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Ilimitado/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Tipo de ativação/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Física/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Virtual/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Híbrida/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nome do negócio/i)).not.toBeInTheDocument();
  });

  it("falls back to an active plan when a legacy unlimited plan is requested", () => {
    render(
      <MemoryRouter initialEntries={["/campanhas/criar?plan=unlimited_monthly"]}>
        <CriarCampanhaBar />
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/R\$29,90/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Ilimitado/i)).not.toBeInTheDocument();
  });

  it("fills city and neighborhood from CEP and blocks invalid WhatsApp inline", async () => {
    render(
      <MemoryRouter>
        <CriarCampanhaBar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Campanha por jogo/i }));
    fireEvent.click(screen.getByRole("button", { name: /Continuar/i }));

    fireEvent.change(screen.getByLabelText(/CEP/i), { target: { value: "60160120" } });

    await waitFor(() => expect(screen.getByLabelText(/Cidade/i)).toHaveValue("Fortaleza"));
    expect(screen.getByLabelText(/Bairro/i)).toHaveValue("Meireles");

    fireEvent.change(screen.getByLabelText(/WhatsApp/i), { target: { value: "9999" } });
    await waitFor(() => expect(screen.getByText(/Informe um WhatsApp com DDD/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Continuar/i })).toBeDisabled();
  });
});
