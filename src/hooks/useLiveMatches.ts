import { useQuery } from "@tanstack/react-query";
import { isBzzoiroEnabled, bzzoiroFetchLiveMatches } from "@/services/bzzoiroService";
import { fetchLiveMatches, isSportsOddsEnabled, type LiveMatch } from "@/services/sportsOddsService";

/**
 * Fetches live match data.
 * Priority: Bzzoiro Sports API → SportsGamesOdds API → empty array
 * Auto-refreshes every 30 seconds when Copa is live.
 */
async function loadLiveMatches(): Promise<LiveMatch[]> {
  // 1. Try Bzzoiro (primary)
  if (isBzzoiroEnabled()) {
    const matches = await bzzoiroFetchLiveMatches();
    if (matches.length > 0) return matches;
    // If Bzzoiro returned empty (possible off-season), don't fall through —
    // an empty valid response is still a valid response
    return matches;
  }

  // 2. Fall back to SportsGamesOdds
  if (isSportsOddsEnabled()) {
    return fetchLiveMatches();
  }

  return [];
}

export function useLiveMatches() {
  return useQuery<LiveMatch[]>({
    queryKey: ["liveMatches"],
    queryFn: loadLiveMatches,
    enabled: isBzzoiroEnabled() || isSportsOddsEnabled(),
    staleTime: 30 * 1000,       // data is fresh for 30 seconds
    refetchInterval: 30 * 1000, // poll every 30s during Copa
    gcTime: 5 * 60 * 1000,
    retry: 1,
    placeholderData: [],
  });
}

/** True if any match is currently live (used to boost poll rate) */
export function useHasLiveMatch(): boolean {
  const { data } = useLiveMatches();
  return (data ?? []).some((m) => m.status === "live");
}
