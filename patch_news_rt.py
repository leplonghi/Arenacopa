import json, os

# ─────────────────────────────────────────────────────────────────────────────
# 1. useRealtimeNews.ts — add optional countryFilter param
# ─────────────────────────────────────────────────────────────────────────────
hook_path = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src\hooks\useRealtimeNews.ts'

new_hook = '''\
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
  /** When set, only returns news whose country_filter matches this team code */
  countryFilter?: string | null;
};

export function useRealtimeNews(options: UseRealtimeNewsOptions = {}) {
  const { limitCount = 30, countryFilter } = options;
  const [news, setNews] = useState<RealtimeNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const newsRef = collection(db, "copa_news");

    // Build query: if countryFilter is set → filter by country_filter field
    const newsQuery = countryFilter
      ? query(
          newsRef,
          where("country_filter", "==", countryFilter),
          orderBy("published_at", "desc"),
          limit(limitCount)
        )
      : query(newsRef, orderBy("published_at", "desc"), limit(limitCount));

    const unsubscribe = onSnapshot(
      newsQuery,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
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
  }, [limitCount, countryFilter]);

  return { news, isLoading };
}
'''

with open(hook_path, 'w', encoding='utf-8') as f:
    f.write(new_hook)
print(f'useRealtimeNews.ts rewritten ({new_hook.count(chr(10))} lines)')

# ─────────────────────────────────────────────────────────────────────────────
# 2. home.json — add news tab keys for all 3 languages
# ─────────────────────────────────────────────────────────────────────────────
base = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\public\locales'

news_tab_keys = {
    'pt-BR': {
        "tab_copa": "Copa 2026",
        "tab_team": "Meu Time",
        "team_empty": "Sem notícias recentes sobre {{team}}",
        "team_no_fav": "Defina seu time no perfil para ver notícias personalizadas",
        "live_badge": "Ao vivo",
    },
    'en': {
        "tab_copa": "Copa 2026",
        "tab_team": "My Team",
        "team_empty": "No recent news about {{team}}",
        "team_no_fav": "Set your team in your profile to see personalized news",
        "live_badge": "Live",
    },
    'es': {
        "tab_copa": "Copa 2026",
        "tab_team": "Mi Equipo",
        "team_empty": "Sin noticias recientes sobre {{team}}",
        "team_no_fav": "Configura tu equipo en el perfil para ver noticias personalizadas",
        "live_badge": "En vivo",
    },
}

for lang, keys in news_tab_keys.items():
    p = os.path.join(base, lang, 'home.json')
    with open(p, encoding='utf-8') as f:
        home = json.load(f)
    # Merge into home.news
    if 'news' not in home:
        home['news'] = {}
    home['news'].update(keys)
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(home, f, ensure_ascii=False, indent=2)
    print(f'home.json [{lang}] — news tab keys added')

print('Done.')
