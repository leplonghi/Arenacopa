
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProfileStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile-stats", userId],
    queryFn: async () => {
      if (!userId) return null;

      // 1. Get average points and total points from all rankings
      const { data: rankings, error: rankingsError } = await supabase
        .from("bolao_rankings")
        .select("bolao_id, total_points, exact_matches")
        .eq("user_id", userId);

      if (rankingsError) throw rankingsError;

      const totalPoints = rankings?.reduce((acc, curr) => acc + (curr.total_points || 0), 0) || 0;
      const totalExacts = rankings?.reduce((acc, curr) => acc + (curr.exact_matches || 0), 0) || 0;

      // 2. Titles calculation (Boloes where user is #1)
      let titlesCount = 0;
      if (rankings && rankings.length > 0) {
        for (const r of rankings) {
          const { data: others, error: othersError } = await supabase
            .from("bolao_rankings")
            .select("total_points")
            .eq("bolao_id", r.bolao_id)
            .gt("total_points", r.total_points)
            .limit(1);
          
          if (!othersError && others?.length === 0) {
            titlesCount++;
          }
        }
      }

      // 3. Get total predictions
      const { count: totalPredictions } = await supabase
        .from("bolao_palpites")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // 4. Get created boloes count
      const { count: createdCount } = await supabase
        .from("boloes")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", userId);

      return {
        points: totalPoints,
        exactScores: totalExacts,
        titles: titlesCount,
        efficiency: totalPredictions ? Math.round((totalPoints / (totalPredictions * 3)) * 100) : 0,
        createdBoloes: createdCount || 0,
        totalPredictions: totalPredictions || 0,
      };
    },
    enabled: !!userId,
  });
}
