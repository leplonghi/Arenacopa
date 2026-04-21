import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BolaoEditPanel } from "@/features/boloes/edit/BolaoEditPanel";
import { MemoryRouter } from "react-router-dom";

describe("BolaoEditPanel", () => {
  it("shows section-based editing with duplicate action for locked areas", () => {
    render(
      <MemoryRouter>
        <BolaoEditPanel
          open
          onOpenChange={() => undefined}
          bolao={{
            id: "bolao-1",
            name: "Arena",
            description: "Desc",
            invite_code: "ABC123",
            creator_id: "owner-1",
            created_at: "2026-04-20T00:00:00.000Z",
            category: "private",
            is_paid: false,
            entry_fee: null,
            payment_details: null,
            prize_distribution: null,
            scoring_rules: { exact: 10, winner: 3, draw: 3 },
            avatar_url: "⚽",
            status: "draft",
            format_id: "classic",
            editable_sections: {
              presentation: true,
              context: false,
              access_policy: false,
              competition_rules: false,
              finance_rules: false,
              operation: true,
            },
            integrity: {
              config_version: 1,
            },
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Editar bolão")).toBeInTheDocument();
    expect(screen.getByText("Identidade")).toBeInTheDocument();
    expect(screen.getAllByText(/Duplicar para/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Salvar identidade")).toBeInTheDocument();
  });
});
