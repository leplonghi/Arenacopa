import type {
  CommercialCampaignBillingMode,
  CommercialCampaignPricingPlan,
} from "@/types/commercial-campaign";

export type CommercialPlanDefinition = {
  id: CommercialCampaignPricingPlan;
  title: string;
  shortTitle: string;
  description: string;
  priceLabel: string;
  billingMode: CommercialCampaignBillingMode;
  includedGames: number | null;
  participantLimit: number;
};

export const commercialPlanCatalog: Record<CommercialCampaignPricingPlan, CommercialPlanDefinition> = {
  single_match: {
    id: "single_match",
    title: "Por jogo",
    shortTitle: "Ate 100 participantes",
    description: "Ate 100 participantes em uma ativacao para uma partida especifica.",
    priceLabel: "R$29,90",
    billingMode: "one_time",
    includedGames: 1,
    participantLimit: 100,
  },
  five_matches: {
    id: "five_matches",
    title: "Pacote de jogos",
    shortTitle: "Ate 250 participantes",
    description: "Ate 250 participantes e ate 5 jogos para manter a campanha ativa.",
    priceLabel: "R$99,90",
    billingMode: "one_time",
    includedGames: 5,
    participantLimit: 250,
  },
  short_championship: {
    id: "short_championship",
    title: "Campeonato",
    shortTitle: "Ate 500 participantes",
    description: "Ate 500 participantes para campeonato, temporada curta ou evento interno.",
    priceLabel: "R$149,90",
    billingMode: "one_time",
    includedGames: 12,
    participantLimit: 500,
  },
  full_cup: {
    id: "full_cup",
    title: "Copa completa",
    shortTitle: "Ate 1.000 participantes",
    description: "Ate 1.000 participantes para copa ou temporada completa.",
    priceLabel: "R$249,90",
    billingMode: "one_time",
    includedGames: 32,
    participantLimit: 1000,
  },
};

export const commercialPlanOrder: CommercialCampaignPricingPlan[] = [
  "single_match",
  "five_matches",
  "short_championship",
  "full_cup",
];

export const commercialPrimaryPlans: CommercialCampaignPricingPlan[] = [
  "single_match",
  "five_matches",
  "short_championship",
  "full_cup",
];

export function getCommercialPlanDefinition(planId: CommercialCampaignPricingPlan) {
  return commercialPlanCatalog[planId];
}
