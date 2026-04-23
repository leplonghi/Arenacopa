import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CriarGrupo from "@/pages/CriarGrupo";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("CriarGrupo flow", () => {
  it("starts by defining purpose and privacy before identity", () => {
    render(
      <MemoryRouter initialEntries={["/grupos/criar"]}>
        <CriarGrupo />
      </MemoryRouter>,
    );

    expect(screen.getByText("Qual é o papel desse grupo?")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Nome do grupo")).not.toBeInTheDocument();
  });
});
