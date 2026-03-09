// ===== NewsAPI.org integration =====
// Developer plan: works from localhost and Capacitor native apps
// For web production, proxy requests through a Supabase Edge Function

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY as string;
const BASE_URL = "https://newsapi.org/v2";

export interface NewsArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

// Map ArenaCopa team codes → search terms in PT and EN
const TEAM_SEARCH: Record<string, { pt: string; en: string }> = {
  BRA: { pt: "Brasil seleção Copa", en: "Brazil World Cup" },
  ARG: { pt: "Argentina seleção Copa", en: "Argentina World Cup" },
  GER: { pt: "Alemanha seleção Copa", en: "Germany World Cup" },
  FRA: { pt: "França seleção Copa", en: "France World Cup" },
  ESP: { pt: "Espanha seleção Copa", en: "Spain World Cup" },
  ENG: { pt: "Inglaterra seleção Copa", en: "England World Cup" },
  POR: { pt: "Portugal seleção Copa", en: "Portugal World Cup" },
  MEX: { pt: "México seleção Copa", en: "Mexico World Cup" },
  USA: { pt: "Estados Unidos seleção Copa", en: "USA national team World Cup" },
  URU: { pt: "Uruguai seleção Copa", en: "Uruguay World Cup" },
  COL: { pt: "Colômbia seleção Copa", en: "Colombia World Cup" },
  BEL: { pt: "Bélgica seleção Copa", en: "Belgium World Cup" },
  NED: { pt: "Holanda seleção Copa", en: "Netherlands World Cup" },
  NOR: { pt: "Noruega seleção Copa", en: "Norway Erling Haaland World Cup" },
  JPN: { pt: "Japão seleção Copa", en: "Japan World Cup" },
  SEN: { pt: "Senegal seleção Copa", en: "Senegal World Cup" },
  MAR: { pt: "Marrocos seleção Copa", en: "Morocco World Cup" },
  AUS: { pt: "Austrália seleção Copa", en: "Australia World Cup" },
  KOR: { pt: "Coreia do Sul seleção Copa", en: "South Korea World Cup" },
  CRO: { pt: "Croácia seleção Copa", en: "Croatia World Cup" },
  ECU: { pt: "Equador seleção Copa", en: "Ecuador World Cup" },
  CAN: { pt: "Canadá seleção Copa", en: "Canada World Cup" },
  SUI: { pt: "Suíça seleção Copa", en: "Switzerland World Cup" },
  AUT: { pt: "Áustria seleção Copa", en: "Austria World Cup" },
  EGY: { pt: "Egito seleção Copa", en: "Egypt World Cup" },
  IRN: { pt: "Irã seleção Copa", en: "Iran World Cup" },
  ALG: { pt: "Argélia seleção Copa", en: "Algeria World Cup" },
  PAR: { pt: "Paraguai seleção Copa", en: "Paraguay World Cup" },
  QAT: { pt: "Catar seleção Copa", en: "Qatar World Cup" },
  SAU: { pt: "Arábia Saudita seleção Copa", en: "Saudi Arabia World Cup" },
  CPV: { pt: "Cabo Verde seleção Copa", en: "Cape Verde World Cup" },
  HAI: { pt: "Haiti seleção Copa", en: "Haiti World Cup" },
  SCO: { pt: "Escócia seleção Copa", en: "Scotland World Cup" },
  CIV: { pt: "Costa do Marfim seleção Copa", en: "Ivory Coast World Cup" },
  TUN: { pt: "Tunísia seleção Copa", en: "Tunisia World Cup" },
  GHA: { pt: "Gana seleção Copa", en: "Ghana World Cup" },
  PAN: { pt: "Panamá seleção Copa", en: "Panama World Cup" },
  NZL: { pt: "Nova Zelândia seleção Copa", en: "New Zealand World Cup" },
  CUR: { pt: "Curaçao seleção Copa", en: "Curacao World Cup" },
  JOR: { pt: "Jordânia seleção Copa", en: "Jordan World Cup" },
  RSA: { pt: "África do Sul seleção Copa", en: "South Africa World Cup" },
  UZB: { pt: "Uzbequistão seleção Copa", en: "Uzbekistan World Cup" },
};

async function fetchNews(query: string, language: string, pageSize = 8): Promise<NewsArticle[]> {
  const params = new URLSearchParams({
    q: query,
    language,
    sortBy: "publishedAt",
    pageSize: String(pageSize),
    apiKey: NEWS_API_KEY,
  });
  const res = await fetch(`${BASE_URL}/everything?${params}`);
  if (!res.ok) throw new Error(`NewsAPI ${res.status}`);
  const data = await res.json();
  if (data.status !== "ok") throw new Error(data.message || "NewsAPI error");
  return (data.articles as NewsArticle[]).filter(
    (a) => a.title && a.title !== "[Removed]" && a.url
  );
}

/**
 * Fetch Copa 2026 news, optionally filtered by user's favorite team.
 * Falls back to English if no Portuguese results.
 */
export async function fetchWorldCupNews(teamCode?: string): Promise<NewsArticle[]> {
  const teamTerms = teamCode ? TEAM_SEARCH[teamCode] : null;

  // Build query combining team + Copa 2026
  const ptQuery = teamTerms
    ? `"${teamTerms.pt}" OR "Copa do Mundo 2026"`
    : '"Copa do Mundo 2026" OR "Copa 2026 FIFA"';

  const enQuery = teamTerms
    ? `"${teamTerms.en}" OR "World Cup 2026"`
    : '"FIFA World Cup 2026" OR "World Cup 2026"';

  try {
    const ptArticles = await fetchNews(ptQuery, "pt");
    if (ptArticles.length >= 4) return ptArticles;

    // Complement with English articles
    const enArticles = await fetchNews(enQuery, "en");
    const combined = [...ptArticles, ...enArticles];
    // Deduplicate by URL
    const seen = new Set<string>();
    return combined.filter((a) => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    });
  } catch {
    // Last resort: generic English World Cup news
    try {
      return await fetchNews(enQuery, "en");
    } catch {
      return [];
    }
  }
}

/** Utility: format publishedAt into "X min atrás / Xh atrás / Xd atrás" */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}
