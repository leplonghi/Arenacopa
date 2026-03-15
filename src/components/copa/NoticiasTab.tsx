
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Newspaper, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

type NewsItem = {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  external_url?: string;
  image_url?: string;
  teams?: string[];
  published_at?: string;
  source_name?: string;
};

const categories = ["all", "general", "matches", "teams", "travel", "tickets"];

interface NewsDocument {
  title: string;
  description?: string;
  url: string;
  url_to_image?: string;
  country_filter?: string;
  published_at: string;
  source_name: string;
}

export function NoticiasTab() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(null);

  useEffect(() => {
    setFavoriteTeam(localStorage.getItem("favorite_team"));
  }, [user?.id]);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      try {
        const newsRef = collection(db, "copa_news");
        const q = query(newsRef, orderBy("published_at", "desc"), limit(30));
        const querySnapshot = await getDocs(q);

        const items = querySnapshot.docs.map(docSnapshot => {
            const item = docSnapshot.data() as NewsDocument;
            return {
              id: docSnapshot.id,
              title: item.title,
              summary: item.description || undefined,
              category: item.country_filter ? "teams" : "general",
              external_url: item.url,
              image_url: item.url_to_image || undefined,
              teams: item.country_filter ? [item.country_filter] : [],
              published_at: item.published_at,
              source_name: item.source_name,
            };
        }) satisfies NewsItem[];

        setNews(items);
      } catch (error) {
        console.error("Erro ao carregar notícias", error);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  const prioritizedNews = useMemo(() => {
    const normalizedFav = favoriteTeam?.toUpperCase() || null;
    const filtered =
      activeCategory === "all"
        ? news
        : news.filter((item) => (item.category || "general").toLowerCase() === activeCategory);

    return [...filtered].sort((a, b) => {
      const aFav = normalizedFav && (a.teams || []).map((t) => t.toUpperCase()).includes(normalizedFav) ? 1 : 0;
      const bFav = normalizedFav && (b.teams || []).map((t) => t.toUpperCase()).includes(normalizedFav) ? 1 : 0;
      return bFav - aFav;
    });
  }, [activeCategory, favoriteTeam, news]);

  const topPersonalized = useMemo(
    () =>
      prioritizedNews.filter((item) =>
        favoriteTeam ? (item.teams || []).map((t) => t.toUpperCase()).includes(favoriteTeam.toUpperCase()) : false
      ),
    [favoriteTeam, prioritizedNews]
  );

  if (loading) {
    return (
      <div className="space-y-4 text-white">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      {favoriteTeam && topPersonalized.length > 0 && (
        <div className="rounded-[28px] border border-primary/30 bg-primary/10 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              Prioridade do seu time
            </p>
          </div>
          <h2 className="text-xl font-black">{topPersonalized[0].title}</h2>
          <p className="mt-2 text-sm text-zinc-300">{topPersonalized[0].summary || "Notícia destacada para o seu time favorito."}</p>
          {topPersonalized[0].external_url && (
            <a
              href={topPersonalized[0].external_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black"
            >
              Abrir fonte
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] ${
              activeCategory === category
                ? "bg-primary text-black"
                : "border border-white/10 bg-white/5 text-zinc-300"
            }`}
          >
            {category === "all" ? "Todas" : category}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {prioritizedNews.map((item) => (
          <article key={item.id} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300">
                <Newspaper className="h-3.5 w-3.5" />
                {(item.category || "general").toUpperCase()}
              </div>
              {item.source_name && (
                <span className="text-xs text-zinc-500">{item.source_name}</span>
              )}
            </div>

            <h3 className="text-xl font-black">{item.title}</h3>
            <p className="mt-2 text-sm text-zinc-400">
              {item.summary || "Notícia disponível na fonte original."}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-zinc-500">
                {item.published_at
                  ? new Date(item.published_at).toLocaleString("pt-BR")
                  : "Data não informada"}
              </div>

              {item.external_url && (
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/15 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-primary"
                >
                  Ler na fonte
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
