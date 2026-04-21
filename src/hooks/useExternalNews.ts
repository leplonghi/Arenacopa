/**
 * useExternalNews
 *
 * Fetches football / Copa 2026 news from multiple reputable RSS feeds using the
 * free RSS2JSON proxy (api.rss2json.com). No API key required for the free tier.
 *
 * Features
 * ─────────
 * • Fetches up to 7 international + Brazilian sources in parallel
 * • 15-minute in-memory cache per feed to stay well within free-tier limits
 * • Deduplicates articles by URL across all feeds
 * • Auto-categorises articles by keyword scanning (copa / teams / matches / travel / tickets / general)
 * • Graceful per-feed error handling — one dead feed never breaks the rest
 */

import { useEffect, useState } from "react";
import { RealtimeNewsItem } from "./useRealtimeNews";
import { sanitizeExternalUrl } from "@/lib/security";

// ── Cache ─────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min — keeps us well under free limits

type CacheEntry = { items: RealtimeNewsItem[]; expiresAt: number };
const _feedCache = new Map<string, CacheEntry>();

// ── Feed definitions ──────────────────────────────────────────────────────────
type FeedConfig = {
  rssUrl: string;
  source: string;
};

/**
 * Reputable worldwide football / sports sources with working RSS feeds.
 * Add or remove feeds here without touching the rest of the code.
 */
export const EXTERNAL_FEEDS: FeedConfig[] = [
  // International (English)
  {
    rssUrl: "https://feeds.bbci.co.uk/sport/football/rss.xml",
    source: "BBC Sport",
  },
  {
    rssUrl: "https://www.theguardian.com/football/rss",
    source: "The Guardian",
  },
  {
    rssUrl: "https://www.skysports.com/rss/12040",
    source: "Sky Sports",
  },
  {
    rssUrl: "https://www.espn.com/espn/rss/soccer/news",
    source: "ESPN FC",
  },
  // Spanish
  {
    rssUrl: "https://www.marca.com/rss/futbol.xml",
    source: "Marca",
  },
  // Brazilian Portuguese
  {
    rssUrl: "https://rss.uol.com.br/feed/esportes.xml",
    source: "UOL Esportes",
  },
  {
    rssUrl: "https://ge.globo.com/rss/ge/",
    source: "Globo Esporte",
  },
];

// ── Keyword-based category detection ─────────────────────────────────────────
const COPA_RE = /copa|world cup|mundial|2026|copa do mundo|wc2026/i;
const TICKETS_RE = /ingresso|ticket|bilhete|entry pass|ingressos/i;
const TRAVEL_RE = /viagem|travel|host city|sede|cidade-sede|turismo|tourism/i;
const TEAMS_RE = /seleç|national team|squad|convocaç|lineup|escalação|selecionado/i;
const MATCHES_RE = /partida|jogo\b|match|resultado|gol\b|goal|score|tabela|standings|placar/i;

function detectCategory(title: string, description: string): string {
  const text = `${title} ${description}`;
  if (COPA_RE.test(text)) return "copa";
  if (TICKETS_RE.test(text)) return "tickets";
  if (TRAVEL_RE.test(text)) return "travel";
  if (TEAMS_RE.test(text)) return "teams";
  if (MATCHES_RE.test(text)) return "matches";
  return "general";
}

// ── RSS2JSON item shape ───────────────────────────────────────────────────────
type Rss2JsonItem = {
  title?: string;
  description?: string;
  content?: string;
  link?: string;
  enclosure?: { link?: string; type?: string };
  thumbnail?: string;
  pubDate?: string;
  guid?: string;
  author?: string;
};

function mapRssItem(item: Rss2JsonItem, source: string): RealtimeNewsItem {
  const title = (item.title || "Sem título").trim();
  // Strip HTML tags from description
  const description = (item.description || item.content || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);

  const category = detectCategory(title, description);

  // Best-effort image extraction
  const imageUrl =
    item.thumbnail ||
    (item.enclosure?.type?.startsWith("image/") ? item.enclosure.link : undefined) ||
    undefined;

  const publishedAt = item.pubDate
    ? new Date(item.pubDate).toISOString()
    : new Date().toISOString();
  const safeUrl = sanitizeExternalUrl(item.link || null);
  const fallbackId = `${source}-${publishedAt}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    id: item.guid || safeUrl || fallbackId,
    title,
    description: description || undefined,
    url: safeUrl ?? "#",
    url_to_image: imageUrl,
    published_at: publishedAt,
    source_name: source,
    category,
  };
}

// ── Per-feed fetch with cache ─────────────────────────────────────────────────
const RSS2JSON_API = "https://api.rss2json.com/v1/api.json";

async function fetchFeed(cfg: FeedConfig): Promise<RealtimeNewsItem[]> {
  const cached = _feedCache.get(cfg.rssUrl);
  if (cached && Date.now() < cached.expiresAt) return cached.items;

  const url = `${RSS2JSON_API}?rss_url=${encodeURIComponent(cfg.rssUrl)}&count=15`;

  // Manual timeout via AbortController for broader compatibility
  const controller = new AbortController();
  const tid = window.setTimeout(() => controller.abort(), 9000);

  let items: RealtimeNewsItem[] = [];
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json: { status: string; items?: Rss2JsonItem[] } = await res.json();
    if (json.status !== "ok" || !Array.isArray(json.items)) {
      throw new Error("Unexpected RSS2JSON response");
    }
    items = json.items.map((it) => mapRssItem(it, cfg.source));
    _feedCache.set(cfg.rssUrl, { items, expiresAt: Date.now() + CACHE_TTL_MS });
  } catch (error) {
    if (cached) {
      return cached.items;
    }
    throw error;
  } finally {
    window.clearTimeout(tid);
  }

  return items;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export type ExternalNewsState = {
  /** Merged, deduplicated, date-sorted news from all feeds */
  news: RealtimeNewsItem[];
  /** True until ALL feeds have either resolved or rejected */
  isLoading: boolean;
  /** Number of feeds that have completed (success or error) */
  feedsLoaded: number;
  /** Total number of feeds being fetched */
  totalFeeds: number;
};

export function useExternalNews(): ExternalNewsState {
  const [news, setNews] = useState<RealtimeNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedsLoaded, setFeedsLoaded] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Deduplicate across feeds by article URL
    const seen = new Map<string, RealtimeNewsItem>();

    setIsLoading(true);
    setFeedsLoaded(0);
    setNews([]);

    const promises = EXTERNAL_FEEDS.map((feed) =>
      fetchFeed(feed)
        .then((items) => {
          if (cancelled) return;
          items.forEach((item) => {
            if (!seen.has(item.url)) seen.set(item.url, item);
          });
          // Re-sort after every feed resolves so UI updates incrementally
          const sorted = [...seen.values()].sort(
            (a, b) =>
              new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
          );
          setNews(sorted);
        })
        .catch((err) => {
          if (!cancelled) {
            console.warn(`[ExternalNews] ${feed.source} failed:`, (err as Error).message);
          }
        })
        .finally(() => {
          if (!cancelled) setFeedsLoaded((n) => n + 1);
        })
    );

    Promise.allSettled(promises).then(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { news, isLoading, feedsLoaded, totalFeeds: EXTERNAL_FEEDS.length };
}
