import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getCountFromServer,
  limit
} from "firebase/firestore";

export function useProfileStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile-stats", userId],
    queryFn: async () => {
      if (!userId) return null;

      try {
        // 1. Get average points and total points from all rankings
        const rankingsRef = collection(db, "bolao_rankings");
        const rankingsQuery = query(rankingsRef, where("user_id", "==", userId));
        const rankingsSnapshot = await getDocs(rankingsQuery);
        
        const rankings = rankingsSnapshot.docs.map(doc => doc.data());

        const totalPoints = rankings.reduce((acc, curr) => acc + (curr.total_points || 0), 0) || 0;
        const totalExacts = rankings.reduce((acc, curr) => acc + (curr.exact_matches || 0), 0) || 0;

        // 2. Titles calculation (Boloes where user is #1)
        let titlesCount = 0;
        if (rankings.length > 0) {
          const titlesPromises = rankings.map(async (r) => {
            const othersQuery = query(
              rankingsRef, 
              where("bolao_id", "==", r.bolao_id),
              where("total_points", ">", r.total_points),
              limit(1)
            );
            const othersSnapshot = await getDocs(othersQuery);
            return othersSnapshot.empty ? 1 : 0;
          });
          const titleResults = await Promise.all(titlesPromises);
          titlesCount = titleResults.reduce((acc, val) => acc + val, 0);
        }

        // 3. Get total predictions
        const predictionsRef = collection(db, "bolao_palpites");
        const predictionsQuery = query(predictionsRef, where("user_id", "==", userId));
        const predictionsCountSnapshot = await getCountFromServer(predictionsQuery);
        const totalPredictions = predictionsCountSnapshot.data().count;

        // 4. Get created boloes count
        const boloesRef = collection(db, "boloes");
        const createdQuery = query(boloesRef, where("creator_id", "==", userId));
        const createdCountSnapshot = await getCountFromServer(createdQuery);
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
        console.error("Error fetching profile stats from Firestore:", error);
        throw error;
      }
    },
    enabled: !!userId,
  });
}
