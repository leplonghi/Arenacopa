import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export type ExclusiveScoreSeat = {
  home: number;
  away: number;
  userId: string;
};

type LockDocumentLike = {
  id: string;
  data: Record<string, unknown>;
};

export function mapExclusiveScoreLocks(
  docs: LockDocumentLike[],
): Record<string, ExclusiveScoreSeat[]> {
  return docs.reduce<Record<string, ExclusiveScoreSeat[]>>((accumulator, doc) => {
    const matchId = typeof doc.data.match_id === "string" ? doc.data.match_id : "";
    const userId = typeof doc.data.user_id === "string" ? doc.data.user_id : "";
    const homeScore = Number(doc.data.home_score);
    const awayScore = Number(doc.data.away_score);

    if (!matchId || !userId || !Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
      return accumulator;
    }

    if (!accumulator[matchId]) {
      accumulator[matchId] = [];
    }
    accumulator[matchId].push({ home: homeScore, away: awayScore, userId });

    return accumulator;
  }, {});
}

export function subscribeBolaoExclusiveScoreLocks(
  bolaoId: string,
  onChange: (locksByMatchId: Record<string, ExclusiveScoreSeat[]>) => void,
) {
  const locksRef = collection(db, "bolao_exclusive_score_locks");
  const locksQuery = query(locksRef, where("bolao_id", "==", bolaoId));

  return onSnapshot(locksQuery, (snapshot) => {
    onChange(
      mapExclusiveScoreLocks(
        snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          data: docSnapshot.data(),
        })),
      ),
    );
  });
}
