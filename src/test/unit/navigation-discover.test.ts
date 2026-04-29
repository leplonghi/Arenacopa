import { describe, expect, it } from "vitest";
import { appFeatureFlags, isFeatureEnabled } from "@/config/features";
import { appNavigationItems, isNavigationItemActive } from "@/config/navigation";

describe("discover navigation rollout", () => {
    it("keeps discover behind an enabled feature flag", () => {
      expect(appFeatureFlags.discoverEnabled).toBe(true);
      expect(appFeatureFlags.communitiesLabelEnabled).toBe(true);
      expect(appFeatureFlags.businessRenameEnabled).toBe(true);
      expect(appFeatureFlags.creatorProEnabled).toBe(false);
      expect(isFeatureEnabled("discoverEnabled")).toBe(true);
    });

  it("uses Discover as the fourth mobile tab while keeping Groups out of the bottom nav", () => {
    const mobilePaths = appNavigationItems
      .filter((item) => item.mobile)
      .map((item) => item.path);

    expect(mobilePaths).toEqual(["/", "/campeonatos", "/boloes", "/descobrir", "#menu"]);
    expect(appNavigationItems.find((item) => item.path === "/grupos")?.mobile).not.toBe(true);
  });

  it("marks discover subroutes as active for the Discover nav item", () => {
    const discoverItem = appNavigationItems.find((item) => item.path === "/descobrir");

    expect(discoverItem).toBeDefined();
    expect(isNavigationItemActive("/descobrir/campanhas", discoverItem!)).toBe(true);
  });
});
