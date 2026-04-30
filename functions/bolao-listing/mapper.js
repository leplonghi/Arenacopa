function isActiveMembership(data = {}) {
  const status = String(data.membership_status || "active");
  return !["left", "removed", "withdrawn_by_owner"].includes(status);
}

function isVisibleBolao(data = {}) {
  const lifecycleStatus = String(data.lifecycle?.status || "");
  const status = String(data.status || "");
  return !["deleted", "archived"].includes(lifecycleStatus) && status !== "deleted";
}

function toBolaoCard(id, data = {}, fallbackCategory = "private") {
  return {
    id,
    name: String(data.name || data.presentation?.name || "Bolão"),
    description: data.description || data.presentation?.description || null,
    invite_code: String(data.invite_code || ""),
    avatar_url: data.avatar_url || data.presentation?.emoji || null,
    category: data.category || fallbackCategory,
    is_paid: Boolean(data.is_paid || data.finance_rules?.finance_mode === "paid_external"),
    status: String(data.status || "open"),
    member_count: Number(data.member_count || 1),
  };
}

function buildUserBolaoListing({ memberships = [], requests = [], boloesById = {}, publicBoloes = [] }) {
  const memberBolaoIds = Array.from(
    new Set(
      memberships
        .filter((membership) => isActiveMembership(membership))
        .map((membership) => String(membership.bolao_id || "").trim())
        .filter(Boolean),
    ),
  );
  const pendingRequests = requests.filter(
    (request) => String(request.request_status || "pending") === "pending",
  );

  const myBoloes = memberBolaoIds
    .map((bolaoId) => {
      const data = boloesById[bolaoId];
      return data && isVisibleBolao(data) ? toBolaoCard(bolaoId, data) : null;
    })
    .filter(Boolean)
    .sort((left, right) => right.id.localeCompare(left.id));

  const pendingRequestCards = pendingRequests
    .map((request) => {
      const bolaoId = String(request.bolao_id || "");
      const bolao = boloesById[bolaoId];
      if (bolao && !isVisibleBolao(bolao)) {
        return null;
      }

      return {
        id: String(request.id || `${bolaoId}_${request.user_id || "request"}`),
        bolaoId,
        bolaoName: bolao ? String(bolao.name || bolao.presentation?.name || "Bolão") : "Bolão",
        requestStatus: String(request.request_status || "pending"),
        updatedAt: request.updated_at || null,
      };
    })
    .filter(Boolean);

  const memberBolaoSet = new Set(memberBolaoIds);
  const discoverBoloes = publicBoloes
    .filter((bolao) => bolao?.id && !memberBolaoSet.has(bolao.id))
    .filter((bolao) => isVisibleBolao(bolao))
    .map((bolao) => toBolaoCard(bolao.id, bolao, "public"))
    .slice(0, 12);

  return {
    discoverBoloes,
    myBoloes,
    pendingRequests: pendingRequestCards,
  };
}

module.exports = {
  buildUserBolaoListing,
  isActiveMembership,
  isVisibleBolao,
  toBolaoCard,
};
