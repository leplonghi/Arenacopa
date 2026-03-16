import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export type RealtimeNewsItem = {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  url_to_image?: string;
  country_filter?: string;
  published_at: string;
  source_name: string;
  category?: string;
  views?: number;
};

type UseRealtimeNewsOptions = {
  limitCount?: number;
};

export function useRealtimeNews(options: UseRealtimeNewsOptions = {}) {
  const { limitCount = 30 } = options;
  const [news, setNews] = useState<RealtimeNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const newsRef = collection(db, "copa_news");
    const newsQuery = query(newsRef, orderBy("published_at", "desc"), limit(limitCount));

    const unsubscribe = onSnapshot(
      newsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();

          return {
            id: docSnapshot.id,
            title: data.title || "Sem titulo",
            description: data.description || undefined,
            content: data.content || undefined,
            url: data.url || "#",
            url_to_image: data.url_to_image || undefined,
            country_filter: data.country_filter || undefined,
            published_at: data.published_at || new Date(0).toISOString(),
            source_name: data.source_name || "Fonte externa",
            category: data.category || undefined,
            views: typeof data.views === "number" ? data.views : undefined,
          } satisfies RealtimeNewsItem;
        });

        setNews(items);
        setIsLoading(false);
      },
      (error) => {
        console.error("Erro ao ouvir noticias em tempo real:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [limitCount]);

  return {
    news,
    isLoading,
  };
}
