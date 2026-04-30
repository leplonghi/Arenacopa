import { useState, useEffect } from "react";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

export type GroupSummary = {
  id: string;
  name: string;
};

/**
 * Hook to fetch groups where the current user is a member.
 * Optimized with cleanup and loading state.
 */
export function useUserGroups(enabled: boolean = true) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id || !enabled) {
      setGroups([]);
      return;
    }

    let mounted = true;
    setIsLoading(true);

    const fetchGroups = async () => {
      try {
        // 1. Get memberships
        const membershipSnap = await getDocs(
          query(collection(db, "grupo_members"), where("user_id", "==", user.id))
        );
        
        const grupoIds = Array.from(
          new Set(
            membershipSnap.docs
              .map((doc) => doc.data().grupo_id as string | undefined)
              .filter(Boolean)
          )
        );

        if (grupoIds.length === 0) {
          if (mounted) {
            setGroups([]);
            setIsLoading(false);
          }
          return;
        }

        // 2. Get group details (In chunks if needed, but for now we assume reasonable amount)
        const grupos = await Promise.all(
          grupoIds.map(async (grupoId) => {
            const snapshot = await getDocs(
              query(collection(db, "grupos"), where("__name__", "==", grupoId))
            );
            const match = snapshot.docs[0];
            return match ? { id: match.id, name: String(match.data().name || "Grupo") } : null;
          })
        );

        if (mounted) {
          setGroups(grupos.filter(Boolean) as GroupSummary[]);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching user groups:", err);
        if (mounted) {
          setError(err as Error);
          setGroups([]);
          setIsLoading(false);
        }
      }
    };

    void fetchGroups();

    return () => {
      mounted = false;
    };
  }, [user?.id, enabled]);

  return { groups, isLoading, error };
}
