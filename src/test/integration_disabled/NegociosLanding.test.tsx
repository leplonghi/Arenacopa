import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BaresLanding from "@/pages/BaresLanding";

describe("Negocios landing", () => {
  it("positions the commercial area as Negócios while preserving campaign entry points", () => {
    render(
      <MemoryRouter initialEntries={["/negocios"]}>
        <BaresLanding />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "ArenaCup para Negócios" })).toBeInTheDocument();
    expect(screen.getByText(/Ative seu público em dias de jogo/i)).toBeInTheDocument();
    expect(screen.getByText("Perfil comercial")).toBeInTheDocument();
    expect(screen.getByText("Kit de divulgação")).toBeInTheDocument();
    expect(screen.getByText("Sponsors")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Card quadrado")).toBeInTheDocument();
    expect(screen.getByText("Story")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Criar campanha/i })).toHaveAttribute(
      "href",
      "/negocios/criar",
    );
    expect(screen.getByRole("link", { name: /Creator Pro/i })).toHaveAttribute(
      "href",
      "/boloes/creator",
    );
  });
});
