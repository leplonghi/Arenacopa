const test = require("node:test");
const assert = require("node:assert/strict");
const { buildUserBolaoListing } = require("../bolao-listing/mapper");
const { computeMarketMeta, computeMatchMeta } = require("../bolao-listing/repository");

test("buildUserBolaoListing filters removed and deleted pools without failing the whole page", () => {
  const result = buildUserBolaoListing({
    memberships: [
      { bolao_id: "bolao-1", membership_status: "active" },
      { bolao_id: "bolao-2", membership_status: "removed" },
      { bolao_id: "bolao-3", membership_status: "active" },
    ],
    requests: [
      { id: "request-1", bolao_id: "bolao-4", request_status: "pending", updated_at: "2026-04-27" },
      { id: "request-2", bolao_id: "bolao-3", request_status: "pending" },
    ],
    boloesById: {
      "bolao-1": { name: "Ativo", status: "open" },
      "bolao-3": { name: "Apagado", lifecycle: { status: "deleted" } },
      "bolao-4": { name: "Aguardando", status: "open" },
    },
    publicBoloes: [
      { id: "bolao-1", name: "Meu público", category: "public" },
      { id: "bolao-5", name: "Descoberta", category: "public" },
      { id: "bolao-6", name: "Arquivado", category: "public", lifecycle: { status: "archived" } },
    ],
    marketMetaByBolaoId: {
      "bolao-5": { is_past: false },
    },
  });

  assert.deepEqual(result.myBoloes.map((bolao) => bolao.id), ["bolao-1"]);
  assert.deepEqual(result.pendingRequests.map((request) => request.bolaoId), ["bolao-4"]);
  assert.deepEqual(result.discoverBoloes.map((bolao) => bolao.id), ["bolao-5"]);
});

test("buildUserBolaoListing keeps past pools out of discovery but available to owner", () => {
  const result = buildUserBolaoListing({
    memberships: [{ bolao_id: "bolao-1", membership_status: "active" }],
    boloesById: {
      "bolao-1": { name: "Finalizado", status: "open" },
    },
    publicBoloes: [
      { id: "bolao-2", name: "Público antigo", category: "public" },
      { id: "bolao-3", name: "Público atual", category: "public" },
    ],
    marketMetaByBolaoId: {
      "bolao-1": { is_past: true, latest_match_closes_at: "2026-04-20T21:00:00.000Z" },
      "bolao-2": { is_past: true },
      "bolao-3": { is_past: false },
    },
  });

  assert.equal(result.myBoloes[0].is_past, true);
  assert.deepEqual(result.discoverBoloes.map((bolao) => bolao.id), ["bolao-3"]);
});

test("computeMarketMeta marks a pool as past after every selected match closes", () => {
  const meta = computeMarketMeta(
    [
      { scope: "match", status: "open", closes_at: "2026-04-20T19:00:00.000Z" },
      { scope: "match", status: "closed", closes_at: "2026-04-21T19:00:00.000Z" },
      { scope: "tournament", status: "open", closes_at: "2026-06-01T19:00:00.000Z" },
    ],
    Date.parse("2026-04-22T00:00:00.000Z"),
  );

  assert.equal(meta.is_past, true);
  assert.equal(meta.latest_match_closes_at, "2026-04-21T19:00:00.000Z");
});

test("computeMarketMeta keeps a pool current while any selected match is still open", () => {
  const meta = computeMarketMeta(
    [
      { scope: "match", status: "closed", closes_at: "2026-04-20T19:00:00.000Z" },
      { scope: "match", status: "open", closes_at: "2026-04-23T19:00:00.000Z" },
    ],
    Date.parse("2026-04-22T00:00:00.000Z"),
  );

  assert.equal(meta.is_past, false);
});

test("computeMarketMeta keeps a pool current within 3h of the last kickoff (match still in progress)", () => {
  const kickoff = "2026-04-22T19:00:00.000Z";
  const meta = computeMarketMeta(
    [{ scope: "match", status: "open", closes_at: kickoff }],
    Date.parse("2026-04-22T20:30:00.000Z"), // 1h30 após o kickoff — jogo ainda rolando
  );
  assert.equal(meta.is_past, false);
});

test("computeMatchMeta (legacy fallback) marks past once all matches are over by date + buffer", () => {
  const meta = computeMatchMeta(
    [
      { match_date: "2026-04-20T19:00:00.000Z", status: "scheduled" },
      { match_date: "2026-04-21T21:00:00.000Z", status: "scheduled" },
    ],
    Date.parse("2026-04-22T00:00:00.000Z"),
  );
  assert.equal(meta.is_past, true);
  assert.equal(meta.latest_match_closes_at, "2026-04-21T21:00:00.000Z");
});

test("computeMatchMeta keeps current while any match is still upcoming", () => {
  const meta = computeMatchMeta(
    [
      { match_date: "2026-04-20T19:00:00.000Z", status: "scheduled" },
      { match_date: "2026-04-25T19:00:00.000Z", status: "scheduled" },
    ],
    Date.parse("2026-04-22T00:00:00.000Z"),
  );
  assert.equal(meta.is_past, false);
});

test("computeMatchMeta treats FINISHED status as past regardless of date", () => {
  const meta = computeMatchMeta(
    [{ match_date: "2026-12-01T19:00:00.000Z", status: "FINISHED" }],
    Date.parse("2026-04-22T00:00:00.000Z"),
  );
  assert.equal(meta.is_past, true);
});

test("computeMatchMeta returns not-past when there are no matches to evaluate", () => {
  const meta = computeMatchMeta([], Date.parse("2026-04-22T00:00:00.000Z"));
  assert.equal(meta.is_past, false);
  assert.equal(meta.latest_match_closes_at, null);
});
