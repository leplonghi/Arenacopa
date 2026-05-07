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
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMonetization } from "@/contexts/MonetizationContext";
import { logger } from "@/lib/logger";
import { STALE_5M, GC_10M } from "@/lib/query-config";

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

  const { data: adminGroupCount = 0, isLoading: loadingLimits } = useQuery({
    queryKey: ["plan-limits-group-count", user?.id, isPremium],
    queryFn: async () => {
      const snap = await getCountFromServer(
        query(collection(db, "grupos"), where("creator_id", "==", user!.id))
      );
      return snap.data().count;
    },
    enabled: !!user,
    staleTime: STALE_5M,
    gcTime: GC_10M,
    meta: { onError: (e: unknown) => logger.error("[usePlanLimits] Failed to fetch group count", { userId: user?.id, error: e }) },
  });

  const canCreateGrupo = isPremium || adminGroupCount < FREE_GRUPO_LIMIT;
  const canCreateBolao = true; // bolões are unlimited in the new free tier

  return { canCreateGrupo, canCreateBolao, adminGroupCount, loadingLimits };
}
