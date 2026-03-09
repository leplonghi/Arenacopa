import { useQuery } from "@tanstack/react-query";
import { fetchWorldCupNews, type NewsArticle } from "@/services/newsService";
import { scrapeCopaNews, type FirecrawlArticle } from "@/services/firecrawlService";

export type UnifiedArticle = NewsArticle | FirecrawlArticle;

async function loadNews(teamCode?: string): Promise<UnifiedArticle[]> {
  const apiArticles = await fetchWorldCupNews(teamCode);

  // Supplement with Firecrawl if we got fewer than 4 articles
  if (apiArticles.length < 4) {
    const scraped = await scrapeCopaNews(4 - apiArticles.length);
    return [...apiArticles, ...scraped];
  }

  return apiArticles;
}

export function useWorldCupNews(teamCode?: string, enabled = true) {
  return useQuery<UnifiedArticle[]>({
    queryKey: ["worldCupNews", teamCode ?? "general"],
    queryFn: () => loadNews(teamCode),
    enabled,
    staleTime: 10 * 60 * 1000,   // re-use cache for 10 minutes
    gcTime: 30 * 60 * 1000,       // keep in memory for 30 minutes
    retry: 1,
    placeholderData: [],
  });
}
