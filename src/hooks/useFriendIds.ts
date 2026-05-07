import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { STALE_5M, GC_10M } from "@/lib/query-config";

async function fetchFriendIds(userId: string): Promise<Set<string>> {
  const myGroupsSnap = await getDocs(
    query(collection(db, "grupo_members"), where("user_id", "==", userId))
  );

  const grupoIds = myGroupsSnap.docs.map((d) => d.data().grupo_id as string);

  const ids = new Set<string>();
  ids.add(userId);

  if (grupoIds.length === 0) return ids;

  for (let i = 0; i < grupoIds.length; i += 30) {
    const chunk = grupoIds.slice(i, i + 30);
    const membersSnap = await getDocs(
      query(collection(db, "grupo_members"), where("grupo_id", "in", chunk))
    );
    membersSnap.docs.forEach((d) => {
      const uid = d.data().user_id;
      if (uid) ids.add(uid);
    });
  }

  return ids;
}

/**
 * Hook to fetch IDs of users who share at least one group with the current user.
 * Uses TanStack Query for automatic caching and deduplication.
 */
export function useFriendIds() {
  const { user } = useAuth();

  const { data: friendIds = new Set<string>(), isLoading } = useQuery({
    queryKey: ["friend-ids", user?.id],
    queryFn: () => fetchFriendIds(user!.id),
    enabled: !!user?.id,
    staleTime: STALE_5M,
    gcTime: GC_10M,
  });

  return { friendIds, isLoading };
}
