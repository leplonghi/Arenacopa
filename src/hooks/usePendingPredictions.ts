import { useCallback, useEffect, useState } from "react";
import {
  collection,
  documentId,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { DEFAULT_CHAMPIONSHIP_ID, resolveChampionshipId } from "@/data/championships/definitions";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/client";
import { normalizeMatchDateValue, normalizeMatchFeedStatus } from "@/lib/match-feed";

export type PendingMatch = {
  id: string;
  championship_id: string | null;
  stage: string | null;
  home_team_code: string | null;
  away_team_code: string | null;
  match_date: string;
};

export type PendingPredictionItem = {
  match: PendingMatch;
  bolaoIds: string[];
};

type MembershipRow = {
  bolao_id: string;
};

type BolaoRow = {
  championship_id?: string | null;
};

type PredictionRow = {
  match_id: string;
  bolao_id: string;
};

type FirestoreMatchRow = {
  championship_id?: string | null;
  stage?: string | null;
  home_team_code?: string | null;
  away_team_code?: string | null;
  match_date?: string | { toDate?: () => Date } | null;
  status?: string | null;
  home_score?: number | null;
  away_score?: number | null;
};

function chunkValues<T>(values: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

function resolveBolaoChampionshipId(value?: string | null) {
  return resolveChampionshipId(value || DEFAULT_CHAMPIONSHIP_ID) || DEFAULT_CHAMPIONSHIP_ID;
}

function resolveMatchChampionshipId(value?: string | null) {
  return resolveChampionshipId(value || DEFAULT_CHAMPIONSHIP_ID) || DEFAULT_CHAMPIONSHIP_ID;
}

export function usePendingPredictions() {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState<PendingPredictionItem[]>([]);

  const fetchPending = useCallback(async () => {
    if (!user?.id) {
      setPendingItems([]);
      return;
    }

    try {
      const membershipsSnapshot = await getDocs(
        query(collection(db, "bolao_members"), where("user_id", "==", user.id))
      );

      const uniqueBolaoIds = Array.from(
        new Set(
          membershipsSnapshot.docs
            .map((docSnapshot) => (docSnapshot.data() as MembershipRow).bolao_id)
            .filter(Boolean)
        )
      );

      if (!uniqueBolaoIds.length) {
        setPendingItems([]);
        return;
      }

      const bolaoDocs = await Promise.all(
        chunkValues(uniqueBolaoIds, 30).map(async (ids) => {
          const snapshot = await getDocs(
            query(collection(db, "boloes"), where(documentId(), "in", ids))
          );
          return snapshot.docs;
        })
      );

      const bolaoChampionshipMap = new Map<string, string>();
      bolaoDocs.flat().forEach((docSnapshot) => {
        const data = docSnapshot.data() as BolaoRow;
        bolaoChampionshipMap.set(
          docSnapshot.id,
          resolveBolaoChampionshipId(data.championship_id)
        );
      });

      const championshipIds = new Set(
        uniqueBolaoIds.map((bolaoId) => bolaoChampionshipMap.get(bolaoId) || DEFAULT_CHAMPIONSHIP_ID)
      );

      const [matchesSnapshot, predictionsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "matches"), orderBy("match_date", "asc"))),
        getDocs(query(collection(db, "bolao_palpites"), where("user_id", "==", user.id))),
      ]);

      const now = Date.now();
      const upcomingMatches = matchesSnapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data() as FirestoreMatchRow;
          const matchDate = normalizeMatchDateValue(data.match_date);
          const championshipId = resolveMatchChampionshipId(data.championship_id);
          return {
            id: docSnapshot.id,
            championship_id: championshipId,
            stage: data.stage || null,
            home_team_code: data.home_team_code || null,
            away_team_code: data.away_team_code || null,
            match_date: matchDate,
            status: normalizeMatchFeedStatus({
              status: data.status,
              matchDate,
              homeScore: data.home_score ?? null,
              awayScore: data.away_score ?? null,
            }),
          };
        })
        .filter((match) => championshipIds.has(match.championship_id || DEFAULT_CHAMPIONSHIP_ID))
        .filter((match) => match.status === "scheduled")
        .filter((match) => new Date(match.match_date).getTime() >= now)
        .slice(0, 20);

      if (!upcomingMatches.length) {
        setPendingItems([]);
        return;
      }

      const matchIds = new Set(upcomingMatches.map((match) => match.id));
      const predictionsIndex = new Map<string, Set<string>>();

      predictionsSnapshot.docs
        .map((docSnapshot) => docSnapshot.data() as PredictionRow)
        .filter((row) => uniqueBolaoIds.includes(row.bolao_id) && matchIds.has(row.match_id))
        .forEach((row) => {
          if (!predictionsIndex.has(row.match_id)) {
            predictionsIndex.set(row.match_id, new Set());
          }
          predictionsIndex.get(row.match_id)?.add(row.bolao_id);
        });

      const pending = upcomingMatches
        .map((match) => {
          const relevantBolaoIds = uniqueBolaoIds.filter(
            (bolaoId) =>
              (bolaoChampionshipMap.get(bolaoId) || DEFAULT_CHAMPIONSHIP_ID) ===
              (match.championship_id || DEFAULT_CHAMPIONSHIP_ID)
          );
          const predictedIn = predictionsIndex.get(match.id) || new Set<string>();
          const missingFor = relevantBolaoIds.filter((bolaoId) => !predictedIn.has(bolaoId));

          if (!missingFor.length) {
            return null;
          }

          return {
            match,
            bolaoIds: missingFor,
          } satisfies PendingPredictionItem;
        })
        .filter(Boolean) as PendingPredictionItem[];

      setPendingItems(pending);
    } catch (error) {
      console.error("Error loading pending predictions:", error);
      setPendingItems([]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setPendingItems([]);
      return;
    }

    void fetchPending();

    const membershipQuery = query(collection(db, "bolao_members"), where("user_id", "==", user.id));
    const predictionsQuery = query(collection(db, "bolao_palpites"), where("user_id", "==", user.id));
    const matchesQuery = query(collection(db, "matches"), orderBy("match_date", "asc"));

    const unsubscribeMemberships = onSnapshot(membershipQuery, () => {
      void fetchPending();
    });
    const unsubscribePredictions = onSnapshot(predictionsQuery, () => {
      void fetchPending();
    });
    const unsubscribeMatches = onSnapshot(matchesQuery, () => {
      void fetchPending();
    });

    const intervalId = window.setInterval(() => {
      void fetchPending();
    }, 30000);

    return () => {
      unsubscribeMemberships();
      unsubscribePredictions();
      unsubscribeMatches();
      window.clearInterval(intervalId);
    };
  }, [fetchPending, user?.id]);

  return pendingItems;
}
