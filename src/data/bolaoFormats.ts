import type { BolaoFormatDefinition } from "@/types/bolao";

export const bolaoFormats: BolaoFormatDefinition[] = [
    {
        id: "classic",
        name: "Clássico",
        description: "Palpites rápidos por jogo com campeão e desempate simples.",
        recommendedFor: "Casual",
        icon: "🏆",
        isEnabled: true,
        defaultMarketIds: ["match_winner", "exact_score", "champion"],
        defaultTiebreakers: ["final_goals"],
    },
    {
        id: "detailed",
        name: "Detalhado",
        description: "Mais mercados por partida e extras do torneio para quem quer estratégia.",
        recommendedFor: "Engajado",
        icon: "🎯",
        isEnabled: true,
        defaultMarketIds: [
            "match_winner",
            "exact_score",
            "home_goals",
            "away_goals",
            "total_goals",
            "both_score",
            "first_team_to_score",
            "champion",
            "top_scorer",
        ],
        defaultTiebreakers: ["total_tournament_goals"],
    },
    {
        id: "knockout",
        name: "Mata-Mata",
        description: "Foco em classificados por fase, finalistas e pressão nas eliminatórias.",
        recommendedFor: "Knockout",
        icon: "🔥",
        isEnabled: true,
        defaultMarketIds: ["qualified_teams", "semifinalists", "finalists", "champion", "exact_score"],
        defaultTiebreakers: ["final_goals"],
    },
    {
        id: "tournament",
        name: "Campeonato",
        description: "Predições amplas do torneio inteiro para usuários mais hardcore.",
        recommendedFor: "Hardcore",
        icon: "🌎",
        isEnabled: false,
        defaultMarketIds: [
            "group_winner",
            "group_runner_up",
            "qualified_teams",
            "semifinalists",
            "finalists",
            "champion",
            "top_scorer",
            "best_defense",
            "surprise_team",
            "tournament_total_goals",
        ],
        defaultTiebreakers: ["champion_goals", "total_tournament_goals"],
    },
    {
        id: "strategic",
        name: "Estratégico",
        description: "Formato para quem quer menos volume e mais tomada de decisão.",
        recommendedFor: "Competitivo",
        icon: "⚡",
        isEnabled: false,
        defaultMarketIds: ["match_winner", "power_play", "confidence_pick", "survivor_pick", "champion"],
        defaultTiebreakers: ["final_goals"],
    },
];

export function getBolaoFormatById(formatId: string | null | undefined) {
    return bolaoFormats.find((format) => format.id === formatId) ?? null;
}

export function getEnabledBolaoFormats() {
    return bolaoFormats.filter((format) => format.isEnabled);
}
