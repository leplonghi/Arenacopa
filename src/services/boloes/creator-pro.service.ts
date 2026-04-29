import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export type CreatorBolaoSummary = {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  avatarUrl: string | null;
  status: string;
  category: "public" | "private";
  createdAt: string | null;
};

type CreatorBolaoDoc = {
  name?: string;
  description?: string | null;
  invite_code?: string;
  avatar_url?: string | null;
  status?: string;
  category?: "public" | "private";
  created_at?: string | null;
};

export async function listCreatorBoloes({
  userId,
  limitCount = 8,
}: {
  userId: string;
  limitCount?: number;
}) {
  const snapshot = await getDocs(
    query(collection(db, "boloes"), where("creator_id", "==", userId), limit(limitCount)),
  );

  return snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data() as CreatorBolaoDoc;

    return {
      id: docSnapshot.id,
      name: data.name || "Bolão",
      description: data.description || null,
      inviteCode: data.invite_code || "",
      avatarUrl: data.avatar_url || null,
      status: data.status || "active",
      category: data.category === "public" ? "public" : "private",
      createdAt: data.created_at || null,
    } satisfies CreatorBolaoSummary;
  });
}
