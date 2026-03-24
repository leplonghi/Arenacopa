import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  Globe,
  Newspaper,
  Radio,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStoredFavoriteTeam, subscribeToFavoriteTeamUpdates } from "@/lib/favorite-team";
import { useRealtimeNews, RealtimeNewsItem } from "@/hooks/useRealtimeNews";
import { useExternalNews } from "@/hooks/useExternalNews";
import { useTranslation } from "react-i18next";

// ── Category definitions ──────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all",       label: "Todos",     emoji: "📰" },
  { id: "copa",      label: "Copa 2026", emoji: "🏆" },
  { id: "teams",     label: "Seleções",  emoji: "🌍" },
  { id: "general",   label: "Futebol",   emoji: "⚽" },
  { id: "matches",   label: "Partidas",  emoji: "🎯" },
  { id: "travel",    label: "Viagem",    emoji: "✈️" },
  { id: "tickets",   label: "Ingressos", emoji: "🎟️" },
];

const HOME_PREFS_KEY = "arenacopa_home_news_prefs";
const ONBOARDING_KEY = "arenacopa_news_onboarded";

// ── Normalised article used in UI ─────────────────────────────────────────────
type NewsItem = {
  id: string;
  title: string;
  summary?: string;
  category: string;
  externalUrl?: string;
  imageUrl?: string;
  teams: string[];
  publishedAt?: string;
  sourceName?: string;
};

function toNewsItem(raw: RealtimeNewsItem): NewsItem {
  return {
    id: raw.id,
    title: raw.title,
    summary: raw.description || raw.content || undefined,
    category: raw.category || (raw.country_filter ? "teams" : "general"),
    externalUrl: raw.url !== "#" ? raw.url : undefined,
    imageUrl: raw.url_to_image || undefined,
    teams: raw.country_filter ? [raw.country_filter] : [],
    publishedAt: raw.published_at,
    sourceName: raw.source_name,
  };
}

// ── Helper: format date compactly ─────────────────────────────────────────────
function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Noticias() {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  // Firestore real-time feed (manually curated / admin-pushed articles)
  const { news: firestoreNews, isLoading: firestoreLoading } = useRealtimeNews({ limitCount: 60 });

  // External RSS feeds (BBC, Guardian, ESPN, UOL, Globo, Sky Sports, Marca)
  const {
    news: externalNews,
    isLoading: externalLoading,
    feedsLoaded,
    totalFeeds,
  } = useExternalNews();

  const [activeCategory, setActiveCategory] = useState("all");
  const [favoriteTeam, setFavoriteTeam] = useState<string | null>(
    () => getStoredFavoriteTeam()
  );
  const [homePrefs, setHomePrefs] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(HOME_PREFS_KEY) || '["copa","teams"]');
    } catch {
      return ["copa", "teams"];
    }
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_KEY)
  );

  const dismissOnboarding = (selectedPrefs?: string[]) => {
    if (selectedPrefs) {
      setHomePrefs(selectedPrefs);
      localStorage.setItem(HOME_PREFS_KEY, JSON.stringify(selectedPrefs));
    }
    localStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
  };

  useEffect(() => {
    setFavoriteTeam(getStoredFavoriteTeam());
    return subscribeToFavoriteTeamUpdates(setFavoriteTeam);
  }, [user?.id]);

  // ── Merge + deduplicate both sources ────────────────────────────────────────
  const news = useMemo<NewsItem[]>(() => {
    const seen = new Map<string, NewsItem>();

    // Firestore first (highest priority — admin curated)
    firestoreNews.forEach((raw) => {
      const item = toNewsItem(raw);
      seen.set(item.externalUrl || item.id, item);
    });

    // External RSS (may overlap with Firestore by URL — deduped)
    externalNews.forEach((raw) => {
      const item = toNewsItem(raw);
      const key = item.externalUrl || item.id;
      if (!seen.has(key)) seen.set(key, item);
    });

    // Sort newest first
    return [...seen.values()].sort((a, b) => {
      const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [firestoreNews, externalNews]);

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filteredNews = useMemo(() => {
    const normalizedFav = favoriteTeam?.toUpperCase() ?? null;
    const base =
      activeCategory === "all"
        ? news
        : news.filter((item) => item.category === activeCategory);

    // Bubble up favourite-team articles
    return [...base].sort((a, b) => {
      const aFav =
        normalizedFav && a.teams.map((t) => t.toUpperCase()).includes(normalizedFav) ? 1 : 0;
      const bFav =
        normalizedFav && b.teams.map((t) => t.toUpperCase()).includes(normalizedFav) ? 1 : 0;
      return bFav - aFav;
    });
  }, [activeCategory, favoriteTeam, news]);

  // ── Personalised (favourite team) highlight ──────────────────────────────────
  const personalizedNews = useMemo(
    () =>
      favoriteTeam
        ? filteredNews.filter((item) =>
            item.teams.map((t) => t.toUpperCase()).includes(favoriteTeam.toUpperCase())
          )
        : [],
    [favoriteTeam, filteredNews]
  );

  const toggleHomePref = (cat: string) => {
    setHomePrefs((prev) => {
      const next = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat];
      localStorage.setItem(HOME_PREFS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isLoading = firestoreLoading && externalLoading && news.length === 0;
  const allFeedsLoaded = feedsLoaded >= totalFeeds;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl px-0 pb-28 pt-4 text-white">

      {/* ── First-visit onboarding overlay ──────────────────────────────────── */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-4 pb-6">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-zinc-900 p-6 shadow-2xl">
            {/* Top icon + title */}
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 ring-2 ring-primary/30">
                <span className="text-3xl">📰</span>
              </div>
              <h2 className="text-2xl font-black">Notícias ao Vivo</h2>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                Acompanhe a Copa 2026 com notícias em tempo real de{" "}
                <strong className="text-white">7 fontes mundiais</strong> — BBC Sport,
                ESPN, The Guardian, Globo Esporte, Sky Sports, Marca e UOL.
              </p>
            </div>

            {/* Source chips */}
            <div className="mb-5 flex flex-wrap justify-center gap-2">
              {["BBC Sport","ESPN","The Guardian","Globo Esporte","Sky Sports","Marca","UOL"].map((src) => (
                <span key={src} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-zinc-300">
                  {src}
                </span>
              ))}
            </div>

            {/* Quick category pick */}
            <p className="mb-3 text-center text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              Quais categorias na sua Home?
            </p>
            <OnboardingCategoryPicker
              initial={homePrefs}
              onConfirm={(selected) => dismissOnboarding(selected)}
            />

            {/* Skip */}
            <button
              onClick={() => dismissOnboarding()}
              className="mt-3 w-full py-2.5 text-center text-[11px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Pular por agora
            </button>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-start justify-between gap-4 px-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              Ao vivo · Tempo real
            </p>
          </div>
          <h1 className="text-3xl font-black">Notícias</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Copa 2026 e futebol mundial
          </p>
        </div>

        {/* Home personalisation toggle */}
        <button
          onClick={() => setShowFilterPanel((v) => !v)}
          className={`mt-1 flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
            showFilterPanel
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-white/10 bg-white/5 hover:bg-white/10"
          }`}
        >
          <Star className="h-4 w-4" />
          Home
        </button>
      </div>

      {/* ── Feed loading progress bar ────────────────────────────────────────── */}
      {!allFeedsLoaded && (
        <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                Carregando fontes
              </p>
            </div>
            <p className="text-[11px] font-black text-zinc-500">
              {feedsLoaded}/{totalFeeds}
            </p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(feedsLoaded / totalFeeds) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Home personalisation panel ───────────────────────────────────────── */}
      {showFilterPanel && (
        <div className="mx-4 mb-5 rounded-[24px] border border-primary/25 bg-primary/8 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                Personalizar tela inicial
              </p>
            </div>
            <button
              onClick={() => setShowFilterPanel(false)}
              className="rounded-full p-1 hover:bg-white/10"
            >
              <X className="h-4 w-4 text-zinc-500" />
            </button>
          </div>
          <p className="mb-4 text-sm text-zinc-400">
            Escolha quais categorias aparecem na sua tela inicial:
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleHomePref(cat.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
                  homePrefs.includes(cat.id)
                    ? "bg-primary text-black shadow-md shadow-primary/25"
                    : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                {homePrefs.includes(cat.id) && (
                  <span className="ml-0.5 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            {homePrefs.length === 0
              ? "Nenhuma categoria ativa na Home"
              : `${homePrefs.length} ${homePrefs.length === 1 ? "categoria ativa" : "categorias ativas"} na tela inicial`}
          </p>
        </div>
      )}

      {/* ── Favourite-team highlight ─────────────────────────────────────────── */}
      {favoriteTeam && personalizedNews.length > 0 && (
        <div className="mx-4 mb-5 overflow-hidden rounded-[28px] border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5">
          {personalizedNews[0].imageUrl && (
            <div className="h-36 w-full overflow-hidden">
              <img
                src={personalizedNews[0].imageUrl}
                alt={personalizedNews[0].title}
                className="h-full w-full object-cover opacity-70"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                Para você · {favoriteTeam}
              </p>
            </div>
            <h2 className="text-xl font-black leading-snug">
              {personalizedNews[0].title}
            </h2>
            {personalizedNews[0].summary && (
              <p className="mt-2 text-sm text-zinc-300 line-clamp-2">
                {personalizedNews[0].summary}
              </p>
            )}
            {personalizedNews[0].externalUrl && (
              <a
                href={personalizedNews[0].externalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-90"
              >
                Ler notícia completa
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Category pills ────────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap gap-2 px-4 pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
              activeCategory === cat.id
                ? "bg-primary text-black shadow-md shadow-primary/25"
                : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────────── */}
      {!isLoading && filteredNews.length > 0 && (
        <div className="mb-4 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500">
              {filteredNews.length} notícias
            </p>
          </div>
          {allFeedsLoaded && (
            <p className="text-[10px] text-zinc-600">
              {totalFeeds} fontes · cache 15 min
            </p>
          )}
        </div>
      )}

      {/* ── News list ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4 px-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-3xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="mx-4 rounded-[28px] border border-white/10 bg-white/5 p-10 text-center">
          <Newspaper className="mx-auto mb-4 h-12 w-12 text-zinc-700" />
          <p className="font-black text-zinc-400">Nenhuma notícia nesta categoria</p>
          <p className="mt-2 text-sm text-zinc-600">
            Novas notícias são adicionadas automaticamente em tempo real
          </p>
        </div>
      ) : (
        <div className="grid gap-4 px-4">
          {filteredNews.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 transition-colors hover:border-white/20 hover:bg-white/[0.08]"
            >
              {item.imageUrl && (
                <div className="h-44 w-full overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="p-5">
                {/* Category badge + source */}
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300">
                    <span>
                      {CATEGORIES.find((c) => c.id === item.category)?.emoji ?? "📰"}
                    </span>
                    <span>
                      {CATEGORIES.find((c) => c.id === item.category)?.label ??
                        item.category.toUpperCase()}
                    </span>
                  </span>
                  {item.sourceName && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Globe className="h-3 w-3" />
                      {item.sourceName}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-black leading-snug">{item.title}</h3>
                {item.summary && (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                    {item.summary}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-zinc-600">
                    {formatDate(item.publishedAt)}
                  </span>
                  {item.externalUrl && (
                    <a
                      href={item.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/15 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/25"
                    >
                      Ler mais
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Onboarding category picker ────────────────────────────────────────────────
function OnboardingCategoryPicker({
  initial,
  onConfirm,
}: {
  initial: string[];
  onConfirm: (selected: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  return (
    <>
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
          <button
            key={cat.id}
            onClick={() => toggle(cat.id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${
              selected.includes(cat.id)
                ? "bg-primary text-black shadow-md shadow-primary/25"
                : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
            {selected.includes(cat.id) && <span className="ml-0.5 text-xs">✓</span>}
          </button>
        ))}
      </div>
      <button
        onClick={() => onConfirm(selected)}
        disabled={selected.length === 0}
        className="w-full rounded-2xl bg-primary py-4 text-[12px] font-black uppercase tracking-[0.18em] text-black transition-opacity disabled:opacity-40 hover:opacity-90"
      >
        Confirmar e Entrar
      </button>
    </>
  );
}
