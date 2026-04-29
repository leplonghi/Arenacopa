import { describe, expect, it } from "vitest";
import { collectBolaoLookupIds } from "@/features/boloes/listing/bolaoListing";
import { getBolaoCardShellClass } from "@/features/boloes/listing/bolaoCardVisuals";

describe("bolao listing helpers", () => {
  it("deduplicates member and pending-request bolao ids before Firestore lookup", () => {
    expect(
      collectBolaoLookupIds({
        memberBolaoIds: ["bolao-1", "bolao-2", "bolao-1", ""],
        pendingRequestBolaoIds: ["bolao-2", "bolao-3"],
      }),
    ).toEqual(["bolao-1", "bolao-2", "bolao-3"]);
  });

  it("uses different visual affordances for clickable cards and informational cards", () => {
    const actionClass = getBolaoCardShellClass("action");
    const infoClass = getBolaoCardShellClass("info");

    expect(actionClass).toContain("cursor-pointer");
    expect(actionClass).toContain("border-primary");
    expect(infoClass).toContain("cursor-default");
    expect(infoClass).toContain("border-white/10");
    expect(infoClass).not.toEqual(actionClass);
  });
});
