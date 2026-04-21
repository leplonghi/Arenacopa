import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, vi, expect } from "vitest";
import CriarBolao from "@/pages/CriarBolao";

vi.mock("@/hooks/useCreateBolao", () => ({
  useCreateBolao: () => ({
    createBolao: vi.fn(),
    creating: false,
  }),
}));

vi.mock("@/contexts/ChampionshipContext", () => ({
  useChampionship: () => ({
    current: { id: "wc2026" },
  }),
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

    expect(screen.getByText("wizard.context_step.title")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("wizard.name_step.name_placeholder")).not.toBeInTheDocument();
  });
});
