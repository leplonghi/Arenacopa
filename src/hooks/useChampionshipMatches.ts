import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { normalizeMatchDateValue, normalizeMatchFeedStatus } from "@/lib/match-feed";
import { resolveChampionshipId, getChampionshipById } from "@/data/championships/definitions";
import type { MatchFeedItem } from "@/types/match-feed";

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

function mapMatch(docSnapshot: { id: string; data: () => FirestoreMatchRow }): MatchFeedItem {
  const data = docSnapshot.data();
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
}

/**
 * Hook to fetch all matches for a specific championship, 
 * without the restrictive filters of the general dashboard.
 */
export function useChampionshipMatches(championshipId: string | undefined) {
  const [data, setData] = useState<MatchFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!championshipId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "matches"),
      where("championship_id", "==", championshipId),
      orderBy("match_date", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matches = snapshot.docs.map(mapMatch);
        setData(matches);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Error loading matches for championship ${championshipId}:`, err);
        setError(err instanceof Error ? err : new Error("Failed to load matches"));
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [championshipId]);

  return { data, isLoading, error };
}
