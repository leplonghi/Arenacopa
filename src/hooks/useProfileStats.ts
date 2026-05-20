import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { logger } from "@/lib/logger";

export function useProfileStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile-stats", userId],
    queryFn: async () => {
      if (!userId) return null;

      try {
        const rankingsRef = collection(db, "bolao_rankings");
        const rankingsQuery = query(rankingsRef, where("user_id", "==", userId));
        const predictionsRef = collection(db, "bolao_palpites");
        const predictionsQuery = query(predictionsRef, where("user_id", "==", userId));
        const boloesRef = collection(db, "boloes");
        const createdQuery = query(boloesRef, where("creator_id", "==", userId));

        const [rankingsSnapshot, predictionsCountSnapshot, createdCountSnapshot] = await Promise.all([
          getDocs(rankingsQuery),
          getCountFromServer(predictionsQuery),
          getCountFromServer(createdQuery),
        ]);
        
        const rankings = rankingsSnapshot.docs.map(doc => doc.data());

        const totalPoints = rankings.reduce((acc, curr) => acc + (curr.total_points || 0), 0) || 0;
        const totalExacts = rankings.reduce((acc, curr) => acc + (curr.exact_matches || 0), 0) || 0;

        // Titles: client-side calculation from the `position` field already in each ranking row.
        // Avoids a composite query (bolao_id + total_points) that would require a Firestore index.
        const titlesCount = rankings.filter(r => (r.position ?? 999) === 1).length;

        const totalPredictions = predictionsCountSnapshot.data().count;

        const createdCount = createdCountSnapshot.data().count;

        return {
          points: totalPoints,
          exactScores: totalExacts,
          titles: titlesCount,
          efficiency: totalPredictions ? Math.round((totalPoints / (totalPredictions * 3)) * 100) : 0,
          createdBoloes: createdCount || 0,
          totalPredictions: totalPredictions || 0,
        };
      } catch (error) {
        logger.error("Error fetching profile stats from Firestore", { userId, error });
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1_000,  // stats change only after games end
    gcTime: 10 * 60 * 1_000,
  });
}
