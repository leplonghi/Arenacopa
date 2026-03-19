/**
 * usePlanLimits
 * Centralizes Copa Pass gating logic for the entire app.
 *
 * Free plan limits:
 *   - Groups created (admin): 1
 *   - Bolões created: unlimited  ← changed in Frente 6
 *
 * Usage:
 *   const { canCreateGrupo, loadingLimits } = usePlanLimits();
 */
import { useEffect, useState } from "react";
import {
  collection, query, where, getCountFromServer,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMonetization } from "@/contexts/MonetizationContext";

export const FREE_GRUPO_LIMIT = 1;

interface PlanLimits {
  /** True when the user is allowed to create another group */
  canCreateGrupo: boolean;
  /** True when the user is allowed to create another bolão (always true — free tier unlimited) */
  canCreateBolao: boolean;
  /** Number of groups the user admins */
  adminGroupCount: number;
  /** Loading state — limits may not be accurate until false */
  loadingLimits: boolean;
}

export function usePlanLimits(): PlanLimits {
  const { user } = useAuth();
  const { isPremium } = useMonetization();

  const [adminGroupCount, setAdminGroupCount] = useState(0);
  const [loadingLimits, setLoadingLimits] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingLimits(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      setLoadingLimits(true);
      try {
        const snap = await getCountFromServer(
          query(
            collection(db, "grupo_members"),
            where("user_id", "==", user.id),
            where("role", "==", "admin"),
          ),
        );
        if (!cancelled) setAdminGroupCount(snap.data().count);
      } catch (e) {
        console.error("[usePlanLimits] Failed to fetch group count:", e);
      } finally {
        if (!cancelled) setLoadingLimits(false);
      }
    };

    check();
    return () => { cancelled = true; };
  }, [user, isPremium]);

  const canCreateGrupo = isPremium || adminGroupCount < FREE_GRUPO_LIMIT;
  const canCreateBolao = true; // bolões are unlimited in the new free tier

  return { canCreateGrupo, canCreateBolao, adminGroupCount, loadingLimits };
}
