import { useState, useEffect } from "react";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to fetch IDs of users who share at least one group with the current user.
 * These are considered "Friends" or "Circle" in the current simplified social model.
 */
export function useFriendIds() {
  const { user } = useAuth();
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setFriendIds(new Set());
      return;
    }

    let mounted = true;
    setIsLoading(true);

    const fetchFriends = async () => {
      try {
        // 1. Get user's groups
        const myGroupsSnap = await getDocs(
          query(collection(db, "grupo_members"), where("user_id", "==", user.id))
        );
        
        const grupoIds = myGroupsSnap.docs.map(d => d.data().grupo_id as string);

        if (grupoIds.length === 0) {
          if (mounted) {
            setFriendIds(new Set());
            setIsLoading(false);
          }
          return;
        }

        // 2. Get all members of those groups
        // Firestore 'in' query supports up to 30 elements
        const ids = new Set<string>();
        ids.add(user.id);

        for (let i = 0; i < grupoIds.length; i += 30) {
          const chunk = grupoIds.slice(i, i + 30);
          const membersSnap = await getDocs(
            query(collection(db, "grupo_members"), where("grupo_id", "in", chunk))
          );
          membersSnap.docs.forEach(d => {
            const uid = d.data().user_id;
            if (uid) ids.add(uid);
          });
        }

        if (mounted) {
          setFriendIds(ids);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching friend IDs:", err);
        if (mounted) setIsLoading(false);
      }
    };

    void fetchFriends();
    return () => { mounted = false; };
  }, [user?.id]);

  return { friendIds, isLoading };
}
