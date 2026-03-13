import { supabase } from "@/services/supabase/client";
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
  const profilePromise = getProfile(userId);
  const membershipsPromise = supabase
    .from("bolao_members")
    .select("bolao_id")
    .eq("user_id", userId);
  const newsPromise = supabase
    .from("copa_news")
    .select("id, title, source_name, published_at, url_to_image, url")
    .order("published_at", { ascending: false })
    .limit(3);
  const scheduledMatchesPromise = supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("status", "scheduled");

  const [{ data: membershipRows, error: membershipsError }, { data: newsRows, error: newsError }, { count: scheduledMatchesCount, error: scheduledMatchesError }, profile] =
    await Promise.all([membershipsPromise, newsPromise, scheduledMatchesPromise, profilePromise]);

  if (membershipsError) throw membershipsError;
  if (newsError) throw newsError;
  if (scheduledMatchesError) throw scheduledMatchesError;

  const bolaoIds = (membershipRows || []).map((row) => row.bolao_id);

  if (!bolaoIds.length) {
    return {
      profile,
      favoriteTeam: profile?.favorite_team || null,
      myBoloes: [] as DashboardBolaoSummary[],
      news: (newsRows || []).map((item) => ({
        id: item.id,
        title: item.title,
        category: item.source_name || "Geral",
        publishedAt: item.published_at,
        imageUrl: item.url_to_image,
        url: item.url,
      })),
      scheduledMatchesCount: scheduledMatchesCount || 0,
    };
  }

  const [boloesResponse, rankingsResponse, palpitesResponse] = await Promise.all([
    supabase
      .from("boloes")
      .select("id, name, bolao_members(count)")
      .in("id", bolaoIds),
    supabase
      .from("bolao_rankings")
      .select("bolao_id, total_points")
      .eq("user_id", userId)
      .in("bolao_id", bolaoIds),
    supabase
      .from("bolao_palpites")
      .select("bolao_id, match_id")
      .eq("user_id", userId)
      .in("bolao_id", bolaoIds),
  ]);

  if (boloesResponse.error) throw boloesResponse.error;
  if (rankingsResponse.error) throw rankingsResponse.error;
  if (palpitesResponse.error) throw palpitesResponse.error;

  // Calculate actual ranks for each bolao
  const rankPromises = (rankingsResponse.data || []).map(r => 
    supabase
      .from("bolao_rankings")
      .select("*", { count: "exact", head: true })
      .eq("bolao_id", r.bolao_id)
      .gt("total_points", r.total_points || 0)
  );
  
  const rankResults = await Promise.all(rankPromises);
  const ranksMap = new Map((rankingsResponse.data || []).map((r, i) => [r.bolao_id, (rankResults[i].count || 0) + 1]));

  const rankingsPointsMap = new Map(
    (rankingsResponse.data || []).map((row) => [row.bolao_id, row.total_points || 0])
  );

  const palpitesByBolao = new Map<string, Set<string>>();
  (palpitesResponse.data || []).forEach((row) => {
    if (!palpitesByBolao.has(row.bolao_id)) {
      palpitesByBolao.set(row.bolao_id, new Set());
    }
    palpitesByBolao.get(row.bolao_id)?.add(row.match_id);
  });

  const myBoloes = (boloesResponse.data || []).map((bolao) => {
    const totalPredictions = palpitesByBolao.get(bolao.id)?.size || 0;
    return {
      id: bolao.id,
      name: bolao.name,
      memberCount: bolao.bolao_members?.[0]?.count ?? 0,
      myPoints: rankingsPointsMap.get(bolao.id) || 0,
      myRank: ranksMap.get(bolao.id) || 0,
      pendingCount: Math.max((scheduledMatchesCount || 0) - totalPredictions, 0),
    };
  });

  return {
    profile,
    favoriteTeam: profile?.favorite_team || null,
    myBoloes,
    news: (newsRows || []).map((item) => ({
      id: item.id,
      title: item.title,
      category: item.source_name || "Geral",
      publishedAt: item.published_at,
      imageUrl: item.url_to_image,
      url: item.url,
    })),
    scheduledMatchesCount: scheduledMatchesCount || 0,
  };
}
