import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { sanitizeExternalUrl } from "@/lib/security";

export type RealtimeNewsItem = {
  id: string;
  summary?: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  image_url?: string;
  url_to_image?: string;
  source_country?: string;
  country_filter?: string;
  published_at: string;
  source_name: string;
  championship_ids?: string[];
  language?: string;
  status?: string;
  category?: string;
  views?: number;
};

type UseRealtimeNewsOptions = {
  limitCount?: number;
  /** Returns normalized articles linked to a specific championship */
  championshipId?: string | null;
  /** Filters normalized articles by source country */
  sourceCountry?: string | null;
  /** When set, only returns news whose country_filter matches this team code */
  countryFilter?: string | null;
};

function normalizePublishedAt(value: unknown): string {
  if (!value) return new Date(0).toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date(0).toISOString();
}

function mapLegacyNewsDoc(id: string, data: Record<string, unknown>): RealtimeNewsItem {
  return {
    id,
    title: typeof data.title === "string" ? data.title : "Sem titulo",
    description: typeof data.description === "string" ? data.description : undefined,
    content: typeof data.content === "string" ? data.content : undefined,
    url: sanitizeExternalUrl(typeof data.url === "string" ? data.url : null) ?? "#",
    url_to_image: typeof data.url_to_image === "string" ? data.url_to_image : undefined,
    country_filter: typeof data.country_filter === "string" ? data.country_filter : undefined,
    published_at: normalizePublishedAt(data.published_at),
    source_name: typeof data.source_name === "string" ? data.source_name : "Fonte externa",
    category: typeof data.category === "string" ? data.category : undefined,
    views: typeof data.views === "number" ? data.views : undefined,
  };
}

function mapNormalizedNewsDoc(id: string, data: Record<string, unknown>): RealtimeNewsItem {
  const summary = typeof data.summary === "string" ? data.summary : undefined;
  const content = typeof data.content === "string" ? data.content : summary;
  const championshipIds = Array.isArray(data.championship_ids)
    ? data.championship_ids.filter((value): value is string => typeof value === "string")
    : undefined;
  const category =
    typeof data.category === "string"
      ? data.category
      : championshipIds?.includes("wc2026")
        ? "copa"
        : "general";

  return {
    id,
    title: typeof data.title === "string" ? data.title : "Sem titulo",
    summary,
    description: summary,
    content,
    url: sanitizeExternalUrl(typeof data.url === "string" ? data.url : null) ?? "#",
    image_url: typeof data.image_url === "string" ? data.image_url : undefined,
    url_to_image: typeof data.image_url === "string" ? data.image_url : undefined,
    source_country: typeof data.source_country === "string" ? data.source_country : undefined,
    published_at: normalizePublishedAt(data.published_at),
    source_name: typeof data.source_name === "string" ? data.source_name : "Fonte externa",
    championship_ids: championshipIds,
    language: typeof data.language === "string" ? data.language : undefined,
    status: typeof data.status === "string" ? data.status : undefined,
    category,
  };
}

export function useRealtimeNews(options: UseRealtimeNewsOptions = {}) {
  const { limitCount = 30, championshipId, sourceCountry, countryFilter } = options;
  const [news, setNews] = useState<RealtimeNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const shouldUseLegacyFeed = !!countryFilter && !championshipId && !sourceCountry;
    const newsRef = collection(db, shouldUseLegacyFeed ? "copa_news" : "news_articles");

    const newsQuery = shouldUseLegacyFeed
      ? query(
          newsRef,
          where("country_filter", "==", countryFilter),
          orderBy("published_at", "desc"),
          limit(limitCount)
        )
      : championshipId
        ? query(newsRef, where("championship_ids", "array-contains", championshipId))
        : sourceCountry
          ? query(newsRef, where("source_country", "==", sourceCountry))
          : query(newsRef, orderBy("published_at", "desc"), limit(limitCount));

    const unsubscribe = onSnapshot(
      newsQuery,
      (snapshot) => {
        const items = snapshot.docs
          .map((item) => {
            const data = item.data() as Record<string, unknown>;
            return shouldUseLegacyFeed
              ? mapLegacyNewsDoc(item.id, data)
              : mapNormalizedNewsDoc(item.id, data);
          })
          .filter((item) => shouldUseLegacyFeed || (item.status || "published") === "published")
          .sort(
            (left, right) =>
              new Date(right.published_at).getTime() - new Date(left.published_at).getTime()
          )
          .slice(0, limitCount);

        setNews(items);
        setIsLoading(false);
      },
      (error) => {
        console.error("Erro ao ouvir noticias em tempo real:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [championshipId, countryFilter, limitCount, sourceCountry]);

  return { news, isLoading };
}
