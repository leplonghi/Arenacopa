import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export type PendingJoinRequest = {
  id: string;
  bolao_id: string;
  user_id: string;
  display_name: string;
  created_at: string | null;
};

type UsePendingJoinRequestsResult = {
  /** Flat list of pending requests across all created bolões */
  requests: PendingJoinRequest[];
  /** Map of bolao_id → pending count for badge rendering */
  countByBolao: Record<string, number>;
  /** Total pending requests across all bolões */
  totalCount: number;
  /** Bolão ID with the most recent pending request (for home CTA) */
  firstBolaoId: string | null;
};

/**
 * Real-time listener for pending join requests on bolões created by the given user.
 * Only queries when `creatorId` is provided. Automatically cleans up the listener on unmount.
 */
export function usePendingJoinRequests(creatorId: string | null | undefined): UsePendingJoinRequestsResult {
  const [requests, setRequests] = useState<PendingJoinRequest[]>([]);

  useEffect(() => {
    if (!creatorId) {
      setRequests([]);
      return;
    }

    const q = query(
      collection(db, "bolao_join_requests"),
      where("creator_id", "==", creatorId),
      where("request_status", "==", "pending"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const rows: PendingJoinRequest[] = snapshot.docs.map((d) => ({
          id: d.id,
          bolao_id: String(d.data().bolao_id ?? ""),
          user_id: String(d.data().user_id ?? ""),
          display_name: String(d.data().display_name ?? d.data().user_id ?? ""),
          created_at: (d.data().created_at as string | null) ?? null,
        }));
        setRequests(rows);
      },
      (error) => {
        console.warn("usePendingJoinRequests listener error:", error);
      },
    );

    return unsubscribe;
  }, [creatorId]);

  const countByBolao = requests.reduce<Record<string, number>>((acc, req) => {
    acc[req.bolao_id] = (acc[req.bolao_id] ?? 0) + 1;
    return acc;
  }, {});

  // Sort by most recent first; use the bolão with the oldest unreviewed request as the most urgent
  const firstBolaoId = requests.length > 0 ? (requests[0]?.bolao_id ?? null) : null;

  return {
    requests,
    countByBolao,
    totalCount: requests.length,
    firstBolaoId,
  };
}
