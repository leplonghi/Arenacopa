import { db } from "@/integrations/firebase/client";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  getCountFromServer
} from "firebase/firestore";
import { getProfile } from "@/services/profile/profile.service";
import type { BolaoData } from "@/types/bolao";

/** Shape of the ranking document stored at bolao_rankings/{userId}_{bolaoId} */
interface BolaoRankingDoc {
  total_points?: number;
  rank?: number;
}

export interface DashboardBolaoSummary {
  id: string;
  name: string;
  memberCount: number;
  myPoints: number;
  myRank: number;
  pendingCount: number;
}

export interface DashboardNewsItem {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  imageUrl: string | null;
  url: string;
}

/**
 * Count how many of the given scheduled match IDs the user has already
 * predicted in a specific bolão.
 *
 * Firestore `in` queries are capped at 30 items, so we batch the IDs and run
 * the sub-queries in parallel, then sum the counts.
 */
async function countPredictedScheduledMatches(
  userId: string,
  bolaoId: string,
  scheduledMatchIds: string[]
): Promise<number> {
  if (scheduledMatchIds.length === 0) return 0;

  const CHUNK = 30;
  const batches: string[][] = [];
  for (let i = 0; i < scheduledMatchIds.length; i += CHUNK) {
    batches.push(scheduledMatchIds.slice(i, i + CHUNK));
  }

  const counts = await Promise.all(
    batches.map((batch) =>
      getCountFromServer(
        query(
          collection(db, "bolao_palpites"),
          where("user_id", "==", userId),
          where("bolao_id", "==", bolaoId),
          where("match_id", "in", batch)
        )
      )
    )
  );

  return counts.reduce((sum, snap) => sum + snap.data().count, 0);
}

export async function getDashboardData(userId: string) {
  try {
    const profilePromise = getProfile(userId);

    // 1. Get user memberships
    const membershipsQuery = query(
      collection(db, "bolao_members"),
      where("user_id", "==", userId)
    );
    const membershipsPromise = getDocs(membershipsQuery);

    // 2. Get scheduled matches — fetch docs (not just count) so we have IDs
    //    for accurate per-bolão pending prediction counting.
    const matchesQuery = query(
      collection(db, "matches"),
      where("status", "==", "scheduled")
    );
    const scheduledMatchesPromise = getDocs(matchesQuery);

    const [membershipsSnap, scheduledMatchesSnap, profile] = await Promise.all([
      membershipsPromise,
      scheduledMatchesPromise,
      profilePromise,
    ]);

    const bolaoIds = membershipsSnap.docs.map((d) => d.data().bolao_id);
    // IDs of every match still waiting to be played
    const scheduledMatchIds = scheduledMatchesSnap.docs.map((d) => d.id);
    const scheduledMatchesCount = scheduledMatchIds.length;

    if (!bolaoIds.length) {
      return {
        profile,
        favoriteTeam: profile?.favorite_team || null,
        myBoloes: [] as DashboardBolaoSummary[],
        scheduledMatchesCount,
      };
    }

    // 3. Fetch details for each bolão the user is in.
    //    All sub-queries per bolão run in parallel to avoid N+1 roundtrips.
    const myBoloes = await Promise.all(
      bolaoIds.map(async (bolaoId) => {
        const [bolaoDoc, membersCountSnap, rankingDoc, predictedCount] =
          await Promise.all([
            getDoc(doc(db, "boloes", bolaoId)),
            getCountFromServer(
              query(
                collection(db, "bolao_members"),
                where("bolao_id", "==", bolaoId)
              )
            ),
            getDoc(doc(db, "bolao_rankings", `${userId}_${bolaoId}`)),
            // Count only predictions for STILL-SCHEDULED matches.
            // This fixes the bug where predictions for finished matches were
            // subtracted from scheduledMatchesCount, causing pendingCount to
            // be underestimated as the Copa progressed.
            countPredictedScheduledMatches(userId, bolaoId, scheduledMatchIds),
          ]);

        const bolaoData = bolaoDoc.data() as BolaoData | undefined;
        const rankingData = rankingDoc.data() as BolaoRankingDoc | undefined;

        return {
          id: bolaoId,
          name: bolaoData?.name || "Bolão",
          memberCount: membersCountSnap.data().count,
          myPoints: rankingData?.total_points || 0,
          myRank: rankingData?.rank || 0,
          pendingCount: Math.max(scheduledMatchesCount - predictedCount, 0),
        };
      })
    );

    return {
      profile,
      favoriteTeam: profile?.favorite_team || null,
      myBoloes,
      scheduledMatchesCount,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
}
