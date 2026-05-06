import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const routePaths = new Set(
  Array.from(appSource.matchAll(/<Route\s+path="([^"]+)"/g)).map((match) => match[1]),
);

describe("app route regression checklist", () => {
  it("keeps the Etapa 14 smoke-test routes registered", () => {
    expect(Array.from(routePaths).sort()).toEqual(
      expect.arrayContaining([
        "/auth",
        "/",
        "/campeonatos",
        "/copa",
        "/boloes",
        "/boloes/criar",
        "/boloes/rapido",
        "/boloes/:id",
        "/b/:inviteCode",
        "/grupos",
        "/comunidades",
        "/negocios",
        "/c/:shareCode",
        "/ranking",
        "/noticias",
        "/perfil",
        "/menu",
      ]),
    );
  });

  it("keeps legacy route aliases registered", () => {
    expect(Array.from(routePaths).sort()).toEqual(
      expect.arrayContaining([
        "/grupos",
        "/grupos/criar",
        "/grupos/:grupoId",
        "/pools",
        "/pools/create",
        "/pools/:id",
        "/criar-bolao",
      ]),
    );
  });
});
