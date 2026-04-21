import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { getChampionshipById, resolveChampionshipId } from "@/data/championships/definitions";
import { db } from "@/integrations/firebase/client";
import { normalizeMatchDateValue, normalizeMatchFeedStatus } from "@/lib/match-feed";
import type { MatchFeedItem, MatchFeedStatus } from "@/types/match-feed";

type FirestoreMatchRow = {
  championship_id?: string | null;
  home_team_id?: string | null;
  away_team_id?: string | null;
  home_team_code?: string | null;
  away_team_code?: string | null;
  home_team_name?: string | null;
  away_team_name?: string | null;
  home_crest?: string | null;
  away_crest?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  match_date?: string | { toDate?: () => Date } | null;
  status?: string | null;
  stage?: string | null;
  round?: number | null;
  group_id?: string | null;
};

async function fetchDashboardMatches(): Promise<MatchFeedItem[]> {
  try {
    const matchesQuery = query(collection(db, "matches"), orderBy("match_date", "asc"));
    const snapshot = await getDocs(matchesQuery);

    return snapshot.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data() as FirestoreMatchRow;
        const rawChampionshipId =
          typeof data.championship_id === "string" && data.championship_id.trim()
            ? data.championship_id
            : null;
        const championshipId = resolveChampionshipId(rawChampionshipId);
        const matchDate = normalizeMatchDateValue(data.match_date);

        return {
          id: docSnapshot.id,
          championshipId,
          championship: championshipId ? getChampionshipById(championshipId) ?? null : null,
          homeTeamId: data.home_team_id ?? null,
          awayTeamId: data.away_team_id ?? null,
          homeTeamCode: (data.home_team_code || "---").toUpperCase(),
          awayTeamCode: (data.away_team_code || "---").toUpperCase(),
          homeTeamName: data.home_team_name || data.home_team_code || "---",
          awayTeamName: data.away_team_name || data.away_team_code || "---",
          homeCrest: data.home_crest || null,
          awayCrest: data.away_crest || null,
          homeScore: data.home_score ?? null,
          awayScore: data.away_score ?? null,
          matchDate,
          status: normalizeMatchFeedStatus({
            status: data.status,
            matchDate,
            homeScore: data.home_score ?? null,
            awayScore: data.away_score ?? null,
          }),
          stage: data.stage ?? null,
          round: typeof data.round === "number" ? data.round : null,
          groupId: data.group_id ?? null,
        } satisfies MatchFeedItem;
      })
      .sort((first, second) => new Date(first.matchDate).getTime() - new Date(second.matchDate).getTime());
  } catch (error) {
    console.error("Error loading dashboard matches:", error);
    return [];
  }
}

export function useDashboardMatches() {
  return useQuery({
    queryKey: ["dashboard-matches-feed"],
    queryFn: fetchDashboardMatches,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}
