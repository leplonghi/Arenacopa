import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, type Mock, vi } from "vitest";
import { CreateBolaoQuickStep } from "@/features/boloes/create/CreateBolaoQuickStep";
import type { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

function buildFlow(): Flow {
  return {
    canAdvance: true,
    draftId: null,
    draftConfigVersion: null,
    setDraftId: vi.fn(),
    setDraftConfigVersion: vi.fn(),
    setSelectedType: vi.fn(),
    setStep: vi.fn(),
    setState: vi.fn(),
    step: "quick",
    state: {
      contextMode: "standalone",
      audienceMode: "personal",
      commercialPlanId: "single_match",
      socialAudience: "friends",
      selectedGrupoId: null,
      accessMode: "approval",
      financeMode: "free",
      entryFee: "",
      paymentDetails: "",
      prizeDistribution: "",
      selectedTypeId: "rapid",
      formatId: "classic",
      selectedMarketIds: ["match_winner"],
      scoringRules: { exact: 10, winner: 3, draw: 3, participation: 1 },
      scoringMode: "default",
      name: "Bolão da firma",
      description: "",
      emoji: "⚽",
      newGroupName: "",
      newGroupDescription: "",
      newGroupEmoji: "👥",
      newGroupObjective: "friends",
      newGroupVisibility: "private",
      newGroupAdmissionMode: "approval",
    },
  } as Flow;
}

describe("CreateBolaoQuickStep social presets", () => {
  it("offers social audience presets and removes the business path", () => {
    render(
      <MemoryRouter>
        <CreateBolaoQuickStep flow={buildFlow()} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Crie o bolão da turma/i)).toBeInTheDocument();
    expect(screen.getByText(/Para quem é o bolão/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Para quem: Amigos\/família/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Para quem: Comunidade/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Para quem: Aberto por link/i })).toBeInTheDocument();
    expect(screen.queryByText(/ArenaCup para Negocios/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continuar para negocios/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Ilimitado/i)).not.toBeInTheDocument();
  });

  it("keeps the personal path free when choosing a preset", () => {
    const flow = buildFlow();
    render(
      <MemoryRouter>
        <CreateBolaoQuickStep flow={flow} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Para quem: Aberto por link/i }));

    expect(flow.setState).toHaveBeenCalled();
    expect(flow.setSelectedType).toHaveBeenCalledWith("rapid");

    const updateState = (flow.setState as Mock).mock.calls[0][0];
    const nextState = updateState(flow.state);
    expect(nextState.accessMode).toBe("public");
    expect(nextState.audienceMode).toBe("personal");
    expect(nextState.financeMode).toBe("free");
  });
});
