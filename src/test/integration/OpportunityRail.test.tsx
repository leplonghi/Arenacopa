import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OpportunityRail } from "@/components/opportunities/OpportunityRail";
import type { Opportunity } from "@/hooks/useOpportunities";

const opportunities: Opportunity[] = [
  {
    id: "predict-now",
    type: "predict_now",
    priority: 100,
    title: "Palpites pendentes",
    description: "Resolva os jogos abertos.",
    ctaLabel: "Marcar palpites",
    ctaRoute: "/boloes/bolao-1",
  },
  {
    id: "create-campaign",
    type: "create_campaign",
    priority: 80,
    title: "Ative seu público",
    description: "Crie uma campanha simples.",
    ctaLabel: "Começar campanha",
    ctaRoute: "/negocios/criar",
  },
];

describe("OpportunityRail", () => {
  it("renders local opportunities as internal links", () => {
    render(
      <MemoryRouter>
        <OpportunityRail opportunities={opportunities} title="Oportunidades" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Oportunidades" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Palpites pendentes/i })).toHaveAttribute(
      "href",
      "/boloes/bolao-1",
    );
    expect(screen.getByRole("link", { name: /Ative seu público/i })).toHaveAttribute(
      "href",
      "/negocios/criar",
    );
  });
});
