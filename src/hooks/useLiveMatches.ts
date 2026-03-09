import { useQuery } from "@tanstack/react-query";
import { fetchLiveMatches, isSportsOddsEnabled, type LiveMatch } from "@/services/sportsOddsService";

/**
 * Polls live match data from SportsGamesOdds API.
 * Auto-refreshes every 30 seconds when a match is live.
 * Falls back gracefully when API is not configured.
 */
export function useLiveMatches() {
  return useQuery<LiveMatch[]>({
    queryKey: ["liveMatches"],
    queryFn: fetchLiveMatches,
    enabled: isSportsOddsEnabled(),
    staleTime: 30 * 1000,      // data is fresh for 30 seconds
    refetchInterval: 30 * 1000, // re-fetch every 30s during Copa
    gcTime: 5 * 60 * 1000,
    retry: 1,
    placeholderData: [],
  });
}

/**
 * Check if any match is currently live (used to boost poll rate)
 */
export function useHasLiveMatch(): boolean {
  const { data } = useLiveMatches();
  return (data ?? []).some((m) => m.status === "live");
}
