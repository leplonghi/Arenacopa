import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  NextActionCard,
  TodayArenaCard,
} from "@/components/home/HomeProactiveCards";
import { getHomeNextAction } from "@/lib/home-next-action";

describe("Home proactive cards", () => {
  it("prioritizes pending predictions as the next action", () => {
    expect(
      getHomeNextAction({
        pendingCount: 3,
        firstPendingBolaoId: "bolao-1",
        poolCount: 2,
        hasFeaturedMatch: true,
      }),
    ).toMatchObject({
      ctaLabel: "Marcar palpites",
      ctaRoute: "/boloes/bolao-1",
    });
  });

  it("renders Hoje na Arena metrics and next action links", () => {
    render(
      <MemoryRouter>
        <TodayArenaCard pendingCount={2} matchCount={1} poolCount={4} />
        <NextActionCard
          pendingCount={2}
          firstPendingBolaoId="bolao-1"
          poolCount={4}
          hasFeaturedMatch
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Hoje na Arena" })).toBeInTheDocument();
    expect(screen.getByText("O que importa agora nos seus campeonatos, bolões e rankings.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Marcar palpites/i })).toHaveAttribute(
      "href",
      "/boloes/bolao-1",
    );
    expect(screen.getByRole("link", { name: "Descobrir" })).toHaveAttribute("href", "/descobrir");
  });
});
