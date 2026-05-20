import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where, limit, Timestamp } from "firebase/firestore";
import { getChampionshipById, resolveChampionshipId } from "@/data/championships/definitions";
import { db } from "@/integrations/firebase/client";
import { normalizeMatchDateValue, normalizeMatchFeedStatus } from "@/lib/match-feed";
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

function mapDashboardMatch(docSnapshot: { id: string; data: () => FirestoreMatchRow }) {
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

export function useDashboardMatches() {
  const [snapshot, setSnapshot] = useState(dashboardMatchesSnapshot);

  useEffect(() => {
    return subscribeDashboardMatches(() => {
      setSnapshot(dashboardMatchesSnapshot);
    });
  }, []);

  return snapshot;
}

type DashboardMatchesSnapshot = {
  data: MatchFeedItem[];
  isLoading: boolean;
  error: Error | null;
};

let dashboardMatchesSnapshot: DashboardMatchesSnapshot = {
  data: [],
  isLoading: true,
  error: null,
};
const dashboardMatchesListeners = new Set<() => void>();
let unsubscribeDashboardMatches: (() => void) | null = null;

function emitDashboardMatchesSnapshot(nextSnapshot: DashboardMatchesSnapshot) {
  dashboardMatchesSnapshot = nextSnapshot;
  dashboardMatchesListeners.forEach((listener) => listener());
}

function startDashboardMatchesSubscription() {
  if (unsubscribeDashboardMatches) return;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Tenta com filtro de data (Timestamp) primeiro. Se falhar por índice, faz fallback sem filtro.
  const filteredQuery = query(
    collection(db, "matches"),
    where("match_date", ">=", sevenDaysAgo.toISOString()),
    orderBy("match_date", "asc"),
    limit(100)
  );

  const fallbackQuery = query(
    collection(db, "matches"),
    orderBy("match_date", "asc"),
    limit(100)
  );

  let usedFallback = false;

  unsubscribeDashboardMatches = onSnapshot(
    filteredQuery,
    (snapshot) => {
      const matches = (snapshot.docs || [])
        .map(mapDashboardMatch)
        .sort((first, second) => new Date(first.matchDate).getTime() - new Date(second.matchDate).getTime());

      emitDashboardMatchesSnapshot({
        data: matches,
        error: null,
        isLoading: false,
      });
    },
    (snapshotError) => {
      // Índice ou tipo de campo incompatível – tenta sem filtro de data
      if (!usedFallback) {
        usedFallback = true;
        console.warn("Dashboard matches filtered query failed, retrying without date filter:", snapshotError);

        if (unsubscribeDashboardMatches) {
          unsubscribeDashboardMatches();
        }
        unsubscribeDashboardMatches = onSnapshot(
          fallbackQuery,
          (snapshot) => {
            const cutoffMs = sevenDaysAgo.getTime();
            const matches = (snapshot.docs || [])
              .map(mapDashboardMatch)
              .filter((m) => new Date(m.matchDate).getTime() >= cutoffMs)
              .sort((first, second) => new Date(first.matchDate).getTime() - new Date(second.matchDate).getTime());

            emitDashboardMatchesSnapshot({
              data: matches,
              error: null,
              isLoading: false,
            });
          },
          (fallbackError) => {
            console.error("Error loading dashboard matches (fallback):", fallbackError);
            emitDashboardMatchesSnapshot({
              data: [],
              error: fallbackError instanceof Error ? fallbackError : new Error("Failed to load matches"),
              isLoading: false,
            });
          }
        );
        return;
      }

      console.error("Error loading dashboard matches:", snapshotError);
      emitDashboardMatchesSnapshot({
        data: [],
        error: snapshotError instanceof Error ? snapshotError : new Error("Failed to load matches"),
        isLoading: false,
      });
    }
  );
}

function subscribeDashboardMatches(listener: () => void) {
  dashboardMatchesListeners.add(listener);
  startDashboardMatchesSubscription();

  return () => {
    dashboardMatchesListeners.delete(listener);
    if (dashboardMatchesListeners.size === 0 && unsubscribeDashboardMatches) {
      unsubscribeDashboardMatches();
      unsubscribeDashboardMatches = null;
    }
  };
}
