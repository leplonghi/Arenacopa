import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, it, vi, expect } from "vitest";
import CriarBolao from "@/pages/CriarBolao";
import { CreateBolaoReviewStep } from "@/features/boloes/create/CreateBolaoReviewStep";

const createAndPublishBolaoMock = vi.hoisted(() => vi.fn());

vi.mock("@/contexts/ChampionshipContext", () => ({
  useChampionship: () => ({
    current: { id: "wc2026" },
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1" },
    session: { getIdToken: vi.fn(async () => "token-1") },
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

vi.mock("@/services/boloes/bolao-config.service", () => ({
  alterBolaoPresentation: vi.fn(),
  createAndPublishBolao: createAndPublishBolaoMock,
  createDraftBolao: vi.fn(),
  publishBolao: vi.fn(),
  updateBolaoConfiguration: vi.fn(),
}));

vi.mock("@/services/groups/group-access.service", () => ({
  createGroup: vi.fn(),
}));

vi.mock("@/lib/analytics/bolao-config.telemetry", () => ({
  trackBolaoConfigEvent: vi.fn(),
}));

vi.mock("@/lib/analytics/social.telemetry", () => ({
  trackSocialEvent: vi.fn(),
}));

function makeReviewFlow() {
  return {
    step: "review",
    draftId: null,
    draftConfigVersion: null,
    canAdvance: true,
    setStep: vi.fn(),
    setDraftId: vi.fn(),
    setDraftConfigVersion: vi.fn(),
    setSelectedType: vi.fn(),
    setState: vi.fn(),
    state: {
      accessMode: "approval",
      audienceMode: "personal",
      commercialPlanId: "single_match",
      contextMode: "standalone",
      description: "Final de semana",
      emoji: "⚽",
      entryFee: "",
      financeMode: "free",
      formatId: "classic",
      name: "Bolão da firma",
      newGroupAdmissionMode: "approval",
      newGroupDescription: "",
      newGroupEmoji: "👥",
      newGroupName: "",
      newGroupObjective: "friends",
      newGroupVisibility: "private",
      paymentDetails: "",
      prizeDistribution: "",
      scoringMode: "default",
      scoringRules: { exact: 10, winner: 3, draw: 3, participation: 1 },
      selectedGrupoId: "",
      selectedMarketIds: ["match_winner", "exact_score", "champion"],
      selectedTypeId: "rapid",
      socialAudience: "friends",
    },
  };
}

describe("CriarBolao wizard", () => {
  it("starts with a two-step quick setup and asks for the bolao name immediately", () => {
    render(
      <MemoryRouter initialEntries={["/boloes/criar"]}>
        <CriarBolao />
      </MemoryRouter>,
    );

    expect(screen.getByText("Crie o bolão da turma")).toBeInTheDocument();
    expect(screen.getByText("Para quem é o bolão?")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nome do bolao")).toBeInTheDocument();
    expect(screen.queryByText("ArenaCup para Negocios")).not.toBeInTheDocument();
    expect(screen.queryByText("Planos para negocios")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continuar para negocios/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Etapa 3 de 4")).not.toBeInTheDocument();
  });

  it("organizes social selection by audience and explains how pools work", () => {
    render(
      <MemoryRouter initialEntries={["/boloes/criar"]}>
        <CriarBolao />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Para quem: Amigos/família" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Para quem: Comunidade" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Para quem: Aberto por link" })).toBeInTheDocument();
    expect(screen.getByText("Criar bolão")).toBeInTheDocument();
    expect(screen.getByText("Convidar participantes")).toBeInTheDocument();
    expect(screen.getByText("Dar chutes")).toBeInTheDocument();
    expect(screen.getByText("Ver ranking")).toBeInTheDocument();
    expect(screen.getByText(/10 pontos para placar exato/i)).toBeInTheDocument();
  });

  it("keeps essential advanced settings available after simplifying selection", () => {
    render(
      <MemoryRouter initialEntries={["/boloes/criar"]}>
        <CriarBolao />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Ajustar regras e acesso"));

    expect(screen.getByText("Contexto")).toBeInTheDocument();
    expect(screen.getByText("Entrada e visibilidade")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Leve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Equilibrada" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Arriscada" })).toBeInTheDocument();
    expect(screen.getByText("Premiacao simbolica")).toBeInTheDocument();
  });

  it("keeps the public-link objective wired to the review summary", () => {
    render(
      <MemoryRouter initialEntries={["/boloes/criar"]}>
        <CriarBolao />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText("Nome do bolao"), {
      target: { value: "Bolão aberto" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Para quem: Aberto por link" }));
    fireEvent.click(screen.getByRole("button", { name: /Revisar e publicar/i }));

    expect(screen.getByText("Revise e publique")).toBeInTheDocument();
    expect(screen.getByText("Entrada: Público")).toBeInTheDocument();
  });

  it("shows sequential step cards with distinct tones", () => {
    render(
      <MemoryRouter initialEntries={["/boloes/criar"]}>
        <CriarBolao />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Etapa 1: Escolha").dataset.tone).toBe("green");
    expect(screen.getByLabelText("Etapa 2: Publicar").dataset.tone).toBe("gold");
  });

  it("shows a ball loading state while publishing the bolao", async () => {
    createAndPublishBolaoMock.mockImplementationOnce(
      () => new Promise(() => undefined),
    );

    render(
      <MemoryRouter initialEntries={["/boloes/criar"]}>
        <CreateBolaoReviewStep flow={makeReviewFlow() as never} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Publicar bolão" }));

    await waitFor(() => {
      expect(screen.getByRole("status", { name: "Criando bolão" })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Criando bolão/i })).toBeDisabled();
  });
});
