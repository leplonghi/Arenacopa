import { describe, expect, it } from "vitest";
import { getBootstrapRedirectTarget, getLocalAuthHostRedirectUrl } from "@/lib/bootstrap-redirect";

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

  it("normalizes local 127 auth URLs to localhost in development for Firebase OAuth", () => {
    expect(
      getLocalAuthHostRedirectUrl({
        href: "http://127.0.0.1:8080/auth?redirect=%2Fboloes#google",
        isDev: true,
      }),
    ).toBe("http://localhost:8080/auth?redirect=%2Fboloes#google");
  });

  it("does not rewrite local hosts outside development", () => {
    expect(
      getLocalAuthHostRedirectUrl({
        href: "http://127.0.0.1:8080/auth?redirect=%2F",
        isDev: false,
      }),
    ).toBeNull();
  });
});
