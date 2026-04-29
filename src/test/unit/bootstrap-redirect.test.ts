import { describe, expect, it } from "vitest";
import { getBootstrapRedirectTarget } from "@/lib/bootstrap-redirect";

describe("bootstrap redirect", () => {
  it("does not consume the auth page redirect query before React can read it", () => {
    expect(
      getBootstrapRedirectTarget({
        pathname: "/auth",
        search: "?redirect=%2F",
        sessionRedirect: null,
      }),
    ).toBeNull();
  });

  it("still consumes session redirects saved by the SPA fallback", () => {
    expect(
      getBootstrapRedirectTarget({
        pathname: "/",
        search: "",
        sessionRedirect: "boloes",
      }),
    ).toBe("/boloes");
  });

  it("rejects external redirect targets during bootstrap", () => {
    expect(
      getBootstrapRedirectTarget({
        pathname: "/",
        search: "?redirect=https%3A%2F%2Fexample.com",
        sessionRedirect: null,
      }),
    ).toBeNull();
  });
});
