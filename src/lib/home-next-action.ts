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
}: {
  pendingCount: number;
  firstPendingBolaoId?: string;
  poolCount: number;
  hasFeaturedMatch: boolean;
}): HomeNextAction {
  if (pendingCount > 0) {
    return {
      title: "Você tem palpites pendentes antes da rodada começar.",
      description: "Resolva os jogos abertos agora para não perder pontos nos seus bolões.",
      ctaLabel: "Marcar palpites",
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
      description: "Use o contexto do campeonato para voltar aos seus palpites e rankings.",
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
