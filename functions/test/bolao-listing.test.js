const test = require("node:test");
const assert = require("node:assert/strict");
const { buildUserBolaoListing } = require("../bolao-listing/mapper");

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
  });

  assert.deepEqual(result.myBoloes.map((bolao) => bolao.id), ["bolao-1"]);
  assert.deepEqual(result.pendingRequests.map((request) => request.bolaoId), ["bolao-4"]);
  assert.deepEqual(result.discoverBoloes.map((bolao) => bolao.id), ["bolao-5"]);
});
