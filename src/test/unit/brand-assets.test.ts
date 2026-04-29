import { describe, expect, it } from "vitest";
import { BRAND_MARK_SRC } from "@/lib/brand-assets";

describe("brand assets", () => {
  it("usa o icone atual do app como marca principal da interface", () => {
    expect(BRAND_MARK_SRC).toBe("/icon-512x512.png");
  });
});
