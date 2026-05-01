import { describe, expect, it, vi } from "vitest";
import { trackBolaoConfigEvent } from "@/lib/analytics/bolao-config.telemetry";

describe("trackBolaoConfigEvent", () => {
  it("forwards approved rollout metrics to plausible", () => {
    const plausible = vi.fn();
    (window as Window & { plausible: typeof plausible }).plausible = plausible;

    trackBolaoConfigEvent("member_removal_blocked", { source: "edit_panel" });

    expect(plausible).toHaveBeenCalledWith("member_removal_blocked", {
      props: { source: "edit_panel" },
    });
  });
});
