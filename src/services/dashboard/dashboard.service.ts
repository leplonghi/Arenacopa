import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  doc, 
  getDoc,
  getCountFromServer
} from "firebase/firestore";
import { getProfile } from "@/services/profile/profile.service";

export interface DashboardBolaoSummary {
  id: string;
  name: string;
  memberCount: number;
  myPoints: number;
  myRank: number;
  pendingCount: number;
}

export interface DashboardNewsItem {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  imageUrl: string | null;
  url: string;
}

export async function getDashboardData(userId: string) {
  try {
    const profilePromise = getProfile(userId);
    
    // 1. Get user memberships
    const membershipsQuery = query(collection(db, "bolao_members"), where("user_id", "==", userId));
    const membershipsPromise = getDocs(membershipsQuery);
    
    // 2. Get latest news
    const newsQuery = query(
      collection(db, "copa_news"), 
      orderBy("published_at", "desc"), 
      limit(3)
    );
    const newsPromise = getDocs(newsQuery);
    
    // 3. Get scheduled matches count
    const matchesQuery = query(collection(db, "matches"), where("status", "==", "scheduled"));
    const scheduledMatchesPromise = getCountFromServer(matchesQuery);

    const [membershipsSnap, newsSnap, scheduledMatchesSnap, profile] = await Promise.all([
      membershipsPromise,
      newsPromise,
      scheduledMatchesPromise,
      profilePromise
    ]);

    const bolaoIds = membershipsSnap.docs.map(doc => doc.data().bolao_id);
    const scheduledMatchesCount = scheduledMatchesSnap.data().count;

    const news = newsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        category: data.source_name || "Geral",
        publishedAt: data.published_at,
        imageUrl: data.url_to_image,
        url: data.url,
      } as DashboardNewsItem;
    });

    if (!bolaoIds.length) {
      return {
        profile,
        favoriteTeam: profile?.favorite_team || null,
        myBoloes: [] as DashboardBolaoSummary[],
        news,
        scheduledMatchesCount,
      };
    }

    // 4. Fetch details for each bolao the user is in
    const myBoloes = await Promise.all(bolaoIds.map(async (bolaoId) => {
      // Get Bolao info
      const bolaoDoc = await getDoc(doc(db, "boloes", bolaoId));
      const bolaoData = bolaoDoc.data();
      
      // Get member count
      const membersCountSnap = await getCountFromServer(query(collection(db, "bolao_members"), where("bolao_id", "==", bolaoId)));
      
      // Get my ranking/points
      // Firestore doesn't support easy 'my rank' without fetching all or using a separate 'rankings' collection
      // I'll look for a document in bolao_rankings with ID 'userId_bolaoId'
      const rankingDoc = await getDoc(doc(db, "bolao_rankings", `${userId}_${bolaoId}`));
      const rankingData = rankingDoc.data();
      
      // Get my predictions for this bolao to calculate pending
      const predictionsSnap = await getCountFromServer(query(
        collection(db, "bolao_palpites"), 
        where("user_id", "==", userId),
        where("bolao_id", "==", bolaoId)
      ));

      return {
        id: bolaoId,
        name: bolaoData?.name || "Bolão",
        memberCount: membersCountSnap.data().count,
        myPoints: rankingData?.total_points || 0,
        myRank: rankingData?.rank || 0, // Assuming rank is pre-calculated/updated by a cloud function or similar
        pendingCount: Math.max(scheduledMatchesCount - predictionsSnap.data().count, 0),
      };
    }));

    return {
      profile,
      favoriteTeam: profile?.favorite_team || null,
      myBoloes,
      news,
      scheduledMatchesCount,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
}

