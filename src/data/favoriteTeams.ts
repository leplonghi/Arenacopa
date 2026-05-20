import { teams } from "@/data/mockData";
import { CHAMPIONSHIPS } from "@/data/championships/definitions";

export type FavoriteTeamType = "national" | "club";

export type FavoriteTeamChoice = {
  code: string;
  name: string;
  type: FavoriteTeamType;
  country: string;
  countryName: string;
  category: string;
  championshipId?: string;
  championshipName?: string;
  flagUrl?: string;
};

const CLUB_TEAMS: FavoriteTeamChoice[] = [
  // Brasileirão
  { code: "FLA", name: "Flamengo", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "PAL", name: "Palmeiras", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "COR", name: "Corinthians", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "SAO", name: "São Paulo", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "SAN", name: "Santos", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "VAS", name: "Vasco", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "BOT", name: "Botafogo", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "FLU", name: "Fluminense", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "GRE", name: "Grêmio", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "INT", name: "Internacional", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "CAM", name: "Atlético-MG", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "CRU", name: "Cruzeiro", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "BAH", name: "Bahia", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "FOR", name: "Fortaleza", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },
  { code: "CAP", name: "Athletico-PR", type: "club", country: "BR", countryName: "Brasil", category: "Brasileirão", championshipId: "brasileirao2026" },

  // Libertadores
  { code: "RIV", name: "River Plate", type: "club", country: "AR", countryName: "Argentina", category: "Libertadores", championshipId: "libertadores2026" },
  { code: "BOC", name: "Boca Juniors", type: "club", country: "AR", countryName: "Argentina", category: "Libertadores", championshipId: "libertadores2026" },
  { code: "RAC", name: "Racing", type: "club", country: "AR", countryName: "Argentina", category: "Libertadores", championshipId: "libertadores2026" },
  { code: "IND", name: "Independiente", type: "club", country: "AR", countryName: "Argentina", category: "Libertadores", championshipId: "libertadores2026" },
  { code: "NAC", name: "Club Nacional de Football", type: "club", country: "UY", countryName: "Uruguai", category: "Libertadores", championshipId: "libertadores2026" },
  { code: "PEN", name: "Peñarol", type: "club", country: "UY", countryName: "Uruguai", category: "Libertadores", championshipId: "libertadores2026" },
  { code: "CUD", name: "Club Universitario", type: "club", country: "PE", countryName: "Peru", category: "Libertadores", championshipId: "libertadores2026" },
  { code: "COL", name: "Colo-Colo", type: "club", country: "CL", countryName: "Chile", category: "Libertadores", championshipId: "libertadores2026" },

  // UEFA / major leagues
  { code: "RMA", name: "Real Madrid", type: "club", country: "ES", countryName: "Espanha", category: "Champions/La Liga", championshipId: "ucl2526" },
  { code: "BAR", name: "Barcelona", type: "club", country: "ES", countryName: "Espanha", category: "Champions/La Liga", championshipId: "laliga2526" },
  { code: "ATM", name: "Atlético de Madrid", type: "club", country: "ES", countryName: "Espanha", category: "La Liga", championshipId: "laliga2526" },
  { code: "MCI", name: "Manchester City", type: "club", country: "GB", countryName: "Inglaterra", category: "Champions/Premier", championshipId: "premier2526" },
  { code: "LIV", name: "Liverpool", type: "club", country: "GB", countryName: "Inglaterra", category: "Premier League", championshipId: "premier2526" },
  { code: "ARS", name: "Arsenal", type: "club", country: "GB", countryName: "Inglaterra", category: "Premier League", championshipId: "premier2526" },
  { code: "CHE", name: "Chelsea", type: "club", country: "GB", countryName: "Inglaterra", category: "Premier League", championshipId: "premier2526" },
  { code: "MUN", name: "Manchester United", type: "club", country: "GB", countryName: "Inglaterra", category: "Premier League", championshipId: "premier2526" },
  { code: "BAY", name: "Bayern de Munique", type: "club", country: "DE", countryName: "Alemanha", category: "Bundesliga", championshipId: "bundesliga2526" },
  { code: "BVB", name: "Borussia Dortmund", type: "club", country: "DE", countryName: "Alemanha", category: "Bundesliga", championshipId: "bundesliga2526" },
  { code: "PSG", name: "Paris Saint-Germain", type: "club", country: "FR", countryName: "França", category: "Ligue 1", championshipId: "ligue12526" },
  { code: "OM", name: "Olympique de Marseille", type: "club", country: "FR", countryName: "França", category: "Ligue 1", championshipId: "ligue12526" },

  // MLS / Saudi
  { code: "MIA", name: "Inter Miami", type: "club", country: "US", countryName: "Estados Unidos", category: "MLS", championshipId: "mls2026" },
  { code: "LAF", name: "Los Angeles FC", type: "club", country: "US", countryName: "Estados Unidos", category: "MLS", championshipId: "mls2026" },
  { code: "LAG", name: "LA Galaxy", type: "club", country: "US", countryName: "Estados Unidos", category: "MLS", championshipId: "mls2026" },
  { code: "HIL", name: "Al-Hilal", type: "club", country: "SA", countryName: "Arábia Saudita", category: "Saudi Pro", championshipId: "saudipro2526" },
  { code: "NAS", name: "Al-Nassr", type: "club", country: "SA", countryName: "Arábia Saudita", category: "Saudi Pro", championshipId: "saudipro2526" },
  { code: "ITT", name: "Al-Ittihad", type: "club", country: "SA", countryName: "Arábia Saudita", category: "Saudi Pro", championshipId: "saudipro2526" },
].map((team): FavoriteTeamChoice => ({
  ...team,
  type: team.type as FavoriteTeamType,
  championshipName: CHAMPIONSHIPS.find((championship) => championship.id === team.championshipId)?.shortName || team.category,
}));

export const FAVORITE_TEAM_CHOICES: FavoriteTeamChoice[] = [
  ...teams.map((team) => ({
    code: team.code,
    name: team.name,
    type: "national" as const,
    country: team.code,
    countryName: team.name,
    category: `Grupo ${team.group}`,
    flagUrl: team.flagUrl,
    championshipId: "wc2026",
    championshipName: "Copa 2026",
  })),
  ...CLUB_TEAMS,
];

export function getFavoriteTeamChoice(code: string | null | undefined) {
  if (!code) return undefined;
  return FAVORITE_TEAM_CHOICES.find((team) => team.code.toUpperCase() === code.toUpperCase());
}
