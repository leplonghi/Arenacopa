import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { STALE_5M, GC_10M } from "@/lib/query-config";

export type GroupSummary = {
  id: string;
  name: string;
};

async function fetchUserGroups(userId: string): Promise<GroupSummary[]> {
  const membershipSnap = await getDocs(
    query(collection(db, "grupo_members"), where("user_id", "==", userId))
  );

  const grupoIds = Array.from(
    new Set(
      membershipSnap.docs
        .map((doc) => doc.data().grupo_id as string | undefined)
        .filter(Boolean) as string[]
    )
  );

  if (grupoIds.length === 0) return [];

  const grupos = await Promise.all(
    grupoIds.map(async (grupoId) => {
      const snapshot = await getDocs(
        query(collection(db, "grupos"), where("__name__", "==", grupoId))
      );
      const match = snapshot.docs[0];
      return match ? { id: match.id, name: String(match.data().name || "Grupo") } : null;
    })
  );

  return grupos.filter(Boolean) as GroupSummary[];
}

/**
 * Hook to fetch groups where the current user is a member.
 * Uses TanStack Query for automatic caching and deduplication.
 */
export function useUserGroups(enabled: boolean = true) {
  const { user } = useAuth();

  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ["user-groups", user?.id],
    queryFn: () => fetchUserGroups(user!.id),
    enabled: !!user?.id && enabled,
    staleTime: STALE_5M,
    gcTime: GC_10M,
  });

  return { groups, isLoading, error: error as Error | null };
}
