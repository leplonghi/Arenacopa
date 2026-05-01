import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";

describe("ArenaSectionHeader", () => {
  it("stacks actions below long titles on mobile instead of overlapping them", () => {
    render(
      <ArenaSectionHeader
        eyebrow="Bolões"
        title="Seu jogo, sua turma"
        action={<button>Campanhas</button>}
      />,
    );

    const actionRegion = screen.getByTestId("arena-section-actions");
    expect(actionRegion.className).toContain("w-full");
    expect(actionRegion.className).toContain("sm:w-auto");
  });
});
