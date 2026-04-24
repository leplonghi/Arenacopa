import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArenaAssetSlot } from "@/components/arena/ArenaAssetSlot";

describe("ArenaAssetSlot", () => {
  it("renders the expected asset name when the slot is waiting for a PNG", () => {
    render(
      <ArenaAssetSlot
        name="wc2026-trophy.png"
        label="Troféu da Copa"
        className="h-32 w-32"
      />,
    );

    expect(screen.getByText("Troféu da Copa")).toBeInTheDocument();
    expect(screen.getByText("wc2026-trophy.png")).toBeInTheDocument();
  });

  it("renders an image when src is provided", () => {
    render(
      <ArenaAssetSlot
        name="premier-league-logo.png"
        label="Premier League"
        src="/assets/arena/premier-league-logo.png"
      />,
    );

    expect(screen.getByRole("img", { name: "Premier League" })).toHaveAttribute(
      "src",
      "/assets/arena/premier-league-logo.png",
    );
  });
});
