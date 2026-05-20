function isActiveMembership(data = {}) {
  const status = String(data.membership_status || "active");
  return !["left", "removed", "withdrawn_by_owner"].includes(status);
}

function isVisibleBolao(data = {}) {
  const lifecycleStatus = String(data.lifecycle?.status || "");
  const status = String(data.status || "");
  return !["deleted"].includes(lifecycleStatus) && status !== "deleted";
}

function toBolaoCard(id, data = {}, fallbackCategory = "private", actorId = null, marketMeta = {}) {
  const lifecycleStatus = String(data.lifecycle?.status || "");
  const status = String(data.status || "open");
  const isPast = Boolean(marketMeta.is_past) || lifecycleStatus === "finished" || status === "finished";
  const isArchived = lifecycleStatus === "archived";

  return {
    id,
    name: String(data.name || data.presentation?.name || "Bolão"),
    description: data.description || data.presentation?.description || null,
    invite_code: String(data.invite_code || ""),
    avatar_url: data.avatar_url || data.presentation?.emoji || null,
    category: data.category || fallbackCategory,
    is_paid: Boolean(data.is_paid || data.finance_rules?.finance_mode === "paid_external"),
    is_creator: Boolean(actorId && data.creator_id === actorId),
    status,
    member_count: Number(data.member_count || 1),
    is_past: isPast,
    is_archived: isArchived,
    latest_match_closes_at: marketMeta.latest_match_closes_at || null,
  };
}

function buildUserBolaoListing({
  memberships = [],
  requests = [],
  boloesById = {},
  publicBoloes = [],
  actorId = null,
  marketMetaByBolaoId = {},
}) {
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

  const myBoloes = [];
  const archivedBoloes = [];

  memberBolaoIds.forEach((bolaoId) => {
    const data = boloesById[bolaoId];
    if (data && isVisibleBolao(data)) {
      const card = toBolaoCard(bolaoId, data, "private", actorId, marketMetaByBolaoId[bolaoId]);
      if (card.is_archived) {
        archivedBoloes.push(card);
      } else {
        myBoloes.push(card);
      }
    }
  });

  myBoloes.sort((left, right) => right.id.localeCompare(left.id));
  archivedBoloes.sort((left, right) => right.id.localeCompare(left.id));

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
    .map((bolao) => toBolaoCard(bolao.id, bolao, "public", actorId, marketMetaByBolaoId[bolao.id]))
    .filter((bolao) => !bolao.is_past && !bolao.is_archived)
    .slice(0, 12);

  return {
    discoverBoloes,
    myBoloes,
    archivedBoloes,
    pendingRequests: pendingRequestCards,
  };
}

module.exports = {
  buildUserBolaoListing,
  isActiveMembership,
  isVisibleBolao,
  toBolaoCard,
};
