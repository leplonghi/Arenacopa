import { useMemo } from "react";

export type OpportunityType =
  | "predict_now"
  | "join_pool"
  | "create_pool"
  | "read_news"
  | "view_stat"
  | "share_ranking"
  | "discover_local_offer"
  | "upgrade_creator"
  | "generate_media_kit"
  | "create_campaign";

export type Opportunity = {
  id: string;
  type: OpportunityType;
  priority: number;
  title: string;
  description: string;
  ctaLabel: string;
  ctaRoute: string;
};

export type OpportunitySurface = "home" | "boloes" | "descobrir" | "creator_pro" | "negocios";

type PendingPredictionLike = {
  bolaoIds?: string[];
};

type MatchLike = {
  matchDate?: string | null;
  status?: string | null;
};

type CampaignLike = {
  city?: string | null;
  status?: string | null;
};

export type OpportunitiesInput = {
  user?: unknown | null;
  profile?: unknown | null;
  pendingPredictions?: readonly PendingPredictionLike[];
  activeBoloes?: readonly unknown[];
  createdBoloes?: readonly unknown[];
  upcomingMatches?: readonly MatchLike[];
  campaigns?: readonly CampaignLike[];
  favoriteChampionships?: readonly string[];
  city?: string | null;
  rankingChanged?: boolean;
  surface?: OpportunitySurface;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function hasUpcomingMatchIn24h(matches: readonly MatchLike[] = []) {
  const now = Date.now();

  return matches.some((match) => {
    if (match.status && match.status !== "scheduled" && match.status !== "live") {
      return false;
    }

    const timestamp = new Date(match.matchDate || "").getTime();
    return Number.isFinite(timestamp) && timestamp >= now && timestamp <= now + DAY_IN_MS;
  });
}

function hasLocalCampaign(campaigns: readonly CampaignLike[] = [], city?: string | null) {
  if (!campaigns.length) {
    return false;
  }

  const normalizedCity = city?.trim().toLowerCase();
  const activeCampaigns = campaigns.filter((campaign) => campaign.status !== "draft" && campaign.status !== "archived");

  if (!normalizedCity) {
    return activeCampaigns.length > 0;
  }

  return activeCampaigns.some((campaign) => campaign.city?.trim().toLowerCase() === normalizedCity);
}

function uniqueByType(opportunities: Opportunity[]) {
  const seen = new Set<OpportunityType>();

  return opportunities.filter((opportunity) => {
    if (seen.has(opportunity.type)) {
      return false;
    }

    seen.add(opportunity.type);
    return true;
  });
}

export function getOpportunities(input: OpportunitiesInput): Opportunity[] {
  const pendingPredictions = input.pendingPredictions ?? [];
  const activeBoloes = input.activeBoloes ?? [];
  const createdBoloes = input.createdBoloes ?? [];
  const upcomingMatches = input.upcomingMatches ?? [];
  const campaigns = input.campaigns ?? [];
  const favoriteChampionships = input.favoriteChampionships ?? [];
  const opportunities: Opportunity[] = [];
  const firstPendingBolaoId = pendingPredictions[0]?.bolaoIds?.[0];

  if (pendingPredictions.length > 0) {
    opportunities.push({
      id: "predict-now",
      type: "predict_now",
      priority: 100,
      title: "Palpites pendentes",
      description: "Resolva os jogos abertos antes da rodada para continuar competitivo nos seus bolões.",
      ctaLabel: "Marcar palpites",
      ctaRoute: firstPendingBolaoId ? `/boloes/${firstPendingBolaoId}` : "/boloes",
    });
  }

  if (hasLocalCampaign(campaigns, input.city)) {
    opportunities.push({
      id: "discover-local-offer",
      type: "discover_local_offer",
      priority: 88,
      title: input.city ? `Campanhas em ${input.city}` : "Campanhas ativas",
      description: "Confira ativações publicadas por negócios parceiros para dias de jogo.",
      ctaLabel: "Ver campanhas",
      ctaRoute: "/descobrir/campanhas",
    });
  }

  if (createdBoloes.length >= 2) {
    opportunities.push({
      id: "upgrade-creator",
      type: "upgrade_creator",
      priority: 82,
      title: "Você já tem ritmo de criador",
      description: "Use o Creator Pro para organizar divulgação, comunidade e materiais dos seus bolões.",
      ctaLabel: "Abrir Creator Pro",
      ctaRoute: "/boloes/creator",
    });
  }

  if (input.rankingChanged) {
    opportunities.push({
      id: "share-ranking",
      type: "share_ranking",
      priority: 78,
      title: "Ranking em movimento",
      description: "Veja sua posição e compartilhe o avanço com a turma.",
      ctaLabel: "Abrir ranking",
      ctaRoute: "/ranking",
    });
  }

  if (activeBoloes.length === 0 && input.surface !== "negocios") {
    opportunities.push({
      id: "join-pool",
      type: "join_pool",
      priority: input.user ? 74 : 64,
      title: "Encontre uma disputa para entrar",
      description: "Explore bolões públicos, convites e campanhas antes de criar uma nova mesa.",
      ctaLabel: "Abrir Descobrir",
      ctaRoute: "/descobrir",
    });
  }

  if (hasUpcomingMatchIn24h(upcomingMatches)) {
    opportunities.push({
      id: "create-pool",
      type: "create_pool",
      priority: activeBoloes.length > 0 ? 70 : 68,
      title: "Jogo forte nas próximas 24h",
      description: "Crie um bolão rápido para aproveitar a rodada com sua turma.",
      ctaLabel: "Criar bolão",
      ctaRoute: "/boloes/criar",
    });
  }

  if (input.surface === "negocios") {
    opportunities.push({
      id: "create-campaign",
      type: "create_campaign",
      priority: 76,
      title: "Ative seu público no próximo jogo",
      description: "Crie uma campanha com link, QR e benefício simples sem mudar regras do app.",
      ctaLabel: "Começar campanha",
      ctaRoute: "/negocios/criar",
    });
  }

  if (input.surface === "creator_pro" || input.surface === "negocios") {
    opportunities.push({
      id: "generate-media-kit",
      type: "generate_media_kit",
      priority: 66,
      title: "Prepare materiais de divulgação",
      description: "Use links, QR e textos prontos para chamar participantes com menos trabalho manual.",
      ctaLabel: "Ver materiais",
      ctaRoute: input.surface === "negocios" ? "/negocios" : "/boloes/creator",
    });
  }

  if (favoriteChampionships.length > 0) {
    opportunities.push({
      id: "view-stat",
      type: "view_stat",
      priority: 58,
      title: "Acompanhe seus campeonatos",
      description: "Veja jogos, contexto e estatísticas antes de voltar para os palpites.",
      ctaLabel: "Ver campeonatos",
      ctaRoute: "/campeonatos",
    });
  }

  opportunities.push({
    id: "read-news",
    type: "read_news",
    priority: 42,
    title: "Conteúdo para voltar com contexto",
    description: "Notícias e informações mantêm a Arena útil mesmo fora do horário de palpitar.",
    ctaLabel: "Ler notícias",
    ctaRoute: "/noticias",
  });

  return uniqueByType(opportunities).sort((left, right) => right.priority - left.priority);
}

export function useOpportunities(input: OpportunitiesInput) {
  return useMemo(() => getOpportunities(input), [input]);
}
