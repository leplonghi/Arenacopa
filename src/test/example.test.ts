import { describe, it, expect } from "vitest";

describe("test setup", () => {
  it("carrega o ambiente do vitest", () => {
    expect(window).toBeDefined();
  });
});
