import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
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
  it("offers free personal presets and a separate business path", () => {
    render(
      <MemoryRouter>
        <CreateBolaoQuickStep flow={buildFlow()} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Bolao da Turma/i)).toBeInTheDocument();
    expect(screen.getByText(/ArenaCup para Negocios/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Rapido/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Completo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Comunidade/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Publico por link/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Ilimitado/i)).not.toBeInTheDocument();
  });

  it("keeps the personal path free when choosing a preset", () => {
    const flow = buildFlow();
    render(
      <MemoryRouter>
        <CreateBolaoQuickStep flow={flow} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Completo/i }));

    expect(flow.setState).toHaveBeenCalled();
    expect(flow.setSelectedType).toHaveBeenCalledWith("complete");
  });
});
