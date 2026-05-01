export type HomeNextAction = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaRoute: string;
};

export function getHomeNextAction({
  pendingCount,
  firstPendingBolaoId,
  poolCount,
  hasFeaturedMatch,
  pendingJoinRequestCount = 0,
  firstPendingRequestBolaoId,
}: {
  pendingCount: number;
  firstPendingBolaoId?: string;
  poolCount: number;
  hasFeaturedMatch: boolean;
  /** Total pending join requests waiting for creator approval */
  pendingJoinRequestCount?: number;
  /** First bolão with a pending join request, for direct CTA routing */
  firstPendingRequestBolaoId?: string | null;
}): HomeNextAction {
  // Highest priority: someone is waiting for the creator to approve their entry.
  // This is blocking for another person, so it trumps even pending predictions.
  if (pendingJoinRequestCount > 0) {
    const route = firstPendingRequestBolaoId
      ? `/boloes/${firstPendingRequestBolaoId}?tab=turma`
      : "/boloes";
    const plural = pendingJoinRequestCount > 1;
    return {
      title: plural
        ? `${pendingJoinRequestCount} pessoas esperando sua aprovação.`
        : "Alguém quer entrar no seu bolão.",
      description: plural
        ? `Você tem ${pendingJoinRequestCount} solicitações de entrada pendentes. Aprove ou recuse para desbloqueá-las.`
        : "Uma pessoa solicitou entrada. Aprove ou recuse agora para não deixá-la esperando.",
      ctaLabel: "Ver solicitações",
      ctaRoute: route,
    };
  }

  if (pendingCount > 0) {
    return {
      title: "Você tem chutes pendentes antes da rodada começar.",
      description: "Resolva os jogos abertos agora para não perder pontos nos seus bolões.",
      ctaLabel: "Marcar chutes",
      ctaRoute: firstPendingBolaoId ? `/boloes/${firstPendingBolaoId}` : "/boloes",
    };
  }

  if (poolCount === 0) {
    return {
      title: "Crie ou entre em um bolão para começar sua disputa.",
      description: "A Home fica mais útil quando você tem uma turma, ranking e rodada para acompanhar.",
      ctaLabel: "Abrir bolões",
      ctaRoute: "/boloes",
    };
  }

  if (hasFeaturedMatch) {
    return {
      title: "Acompanhe o jogo em destaque da rodada.",
      description: "Use o contexto do campeonato para voltar aos seus chutes e rankings.",
      ctaLabel: "Ver campeonatos",
      ctaRoute: "/campeonatos",
    };
  }

  return {
    title: "Explore novos bolões e campanhas para a próxima rodada.",
    description: "Descobrir reúne disputas abertas, conteúdo e ativações sem tirar seus bolões do lugar.",
    ctaLabel: "Ir para Descobrir",
    ctaRoute: "/descobrir/boloes",
  };
}
