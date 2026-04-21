import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BolaoEntryGuidance } from "@/features/boloes/shared/BolaoEntryGuidance";

describe("BolaoEntryGuidance", () => {
  it("shows clear actions for creating without group and inside a group", () => {
    render(
      <MemoryRouter>
        <BolaoEntryGuidance groupId="grupo-1" groupName="Injeção" />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Este grupo \(Injeção\) pode descobrir ou controlar a entrada/)).toBeInTheDocument();
    expect(screen.getByText("Criar sem grupo")).toBeInTheDocument();
    expect(screen.getByText("Criar neste grupo")).toBeInTheDocument();
  });
});
