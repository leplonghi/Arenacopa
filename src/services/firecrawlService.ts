// ===== Firecrawl scraping integration =====
// Used to scrape football news directly from Brazilian & international sites
// when NewsAPI returns insufficient results or user prefers local sources.
//
// To enable: add VITE_FIRECRAWL_API_KEY to your .env file
// Get a key at: https://firecrawl.dev

const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY as string;
const FIRECRAWL_URL = "https://api.firecrawl.dev/v1";

export interface FirecrawlArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { id: null; name: string };
  author: null;
  content: null;
}

// Curated Copa 2026 news sources (Portuguese-first, then English)
export const COPA_NEWS_SOURCES: Array<{ url: string; name: string }> = [
  { url: "https://ge.globo.com/futebol/copa-do-mundo/", name: "Ge Globo" },
  { url: "https://www.espn.com.br/futebol/", name: "ESPN Brasil" },
  { url: "https://www.uol.com.br/esporte/futebol/copa-do-mundo/", name: "UOL Esporte" },
  { url: "https://trivela.com.br/", name: "Trivela" },
  { url: "https://www.goal.com/br/copa-do-mundo", name: "Goal Brasil" },
];

interface FirecrawlScrapeResponse {
  success: boolean;
  data?: {
    markdown?: string;
    metadata?: {
      title?: string;
      description?: string;
      ogImage?: string;
      sourceURL?: string;
    };
  };
}

/** Scrape a single URL via Firecrawl and return structured article data */
async function scrapeOne(url: string, sourceName: string): Promise<FirecrawlArticle | null> {
  if (!FIRECRAWL_API_KEY) return null;

  try {
    const res = await fetch(`${FIRECRAWL_URL}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!res.ok) return null;

    const data: FirecrawlScrapeResponse = await res.json();
    if (!data.success || !data.data?.metadata) return null;

    const meta = data.data.metadata;
    return {
      title: meta.title || sourceName,
      description: meta.description || "",
      url,
      urlToImage: meta.ogImage || null,
      publishedAt: new Date().toISOString(),
      source: { id: null, name: sourceName },
      author: null,
      content: null,
    };
  } catch {
    return null;
  }
}

/**
 * Scrape Copa 2026 news from curated Brazilian football sites.
 * Returns articles even when NewsAPI quota is exhausted.
 * Requires VITE_FIRECRAWL_API_KEY to be set.
 */
export async function scrapeCopaNews(limit = 4): Promise<FirecrawlArticle[]> {
  if (!FIRECRAWL_API_KEY) return [];

  const sources = COPA_NEWS_SOURCES.slice(0, limit);
  const results = await Promise.allSettled(
    sources.map((s) => scrapeOne(s.url, s.name))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<FirecrawlArticle | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((a): a is FirecrawlArticle => a !== null);
}

/** Whether Firecrawl is configured */
export const isFirecrawlEnabled = () => Boolean(FIRECRAWL_API_KEY);
