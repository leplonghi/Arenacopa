path = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src\pages\Index.tsx'

with open(path, encoding='utf-8') as f:
    src = f.read()

# ── Step 1: Replace the single useRealtimeNews call with two listeners ────────
old_hook = '''  const { news: realtimeNews, isLoading: newsLoading } = useRealtimeNews({ limitCount: 3 });
  const miniNews = useMemo(
    () =>
      realtimeNews.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.source_name || item.category || "Geral",
        publishedAt: item.published_at,
        imageUrl: item.url_to_image || null,
        url: item.url,
      })),
    [realtimeNews]
  );'''

new_hook = '''  const [newsTab, setNewsTab] = useState<"copa" | "team">("copa");

  // Copa 2026 general news — real-time listener
  const { news: copaNewsRaw, isLoading: copaNewsLoading } = useRealtimeNews({ limitCount: 4 });
  // Favourite-team news — real-time listener (separate Firestore query)
  const { news: teamNewsRaw, isLoading: teamNewsLoading } = useRealtimeNews({
    limitCount: 4,
    countryFilter: favoriteTeamCode || null,
  });

  const newsLoading = newsTab === "copa" ? copaNewsLoading : teamNewsLoading;

  const mapNews = (items: typeof copaNewsRaw) =>
    items.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.source_name || item.category || "Geral",
      publishedAt: item.published_at,
      imageUrl: item.url_to_image || null,
      url: item.url,
    }));

  const miniNews = useMemo(() => mapNews(copaNewsRaw), [copaNewsRaw]);
  const teamNews  = useMemo(() => mapNews(teamNewsRaw),  [teamNewsRaw]);'''

src = src.replace(old_hook, new_hook)

# ── Step 2: Replace the news section JSX with tabbed version ─────────────────
old_news_section = '''        {/* News Section — always visible above pools */}
        <motion.section variants={itemVariants} className="space-y-4">
          <SectionHeader color="bg-emerald-400" title={t('news.title')} rightElement={
            <Link to="/copa/noticias" className="text-[11px] text-gray-400 font-black uppercase tracking-[0.12em] hover:text-white transition-colors">
              {t('news.view_all')} <ChevronRight className="w-3 h-3 inline ml-1" />
            </Link>
          } />

          {newsLoading ? (
            <div className="grid gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-[28px] border border-white/5 bg-white/[0.02]" />
              ))}
            </div>
          ) : miniNews.length === 0 ? null : (
            <div className="grid gap-3">
              {miniNews.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-5 p-4 rounded-[24px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all backdrop-blur-md shadow-lg"
                >
                  <div className="w-24 h-16 rounded-[16px] overflow-hidden shrink-0 shadow-xl group-hover:scale-105 transition-transform duration-700 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                        {item.category}
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-500">
                        {new Date(item.publishedAt).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-200 leading-snug line-clamp-2 group-hover:text-white transition-colors tracking-tight">
                      {item.title}
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          )}
        </motion.section>'''

new_news_section = '''        {/* Real-time News — tabbed Copa 2026 / Meu Time */}
        <motion.section variants={itemVariants} className="space-y-4">
          <SectionHeader color="bg-emerald-400" title={t('news.title')} rightElement={
            <Link to="/copa/noticias" className="text-[11px] text-gray-400 font-black uppercase tracking-[0.12em] hover:text-white transition-colors">
              {t('news.view_all')} <ChevronRight className="w-3 h-3 inline ml-1" />
            </Link>
          } />

          {/* Tab pills */}
          <div className="flex gap-2">
            <button
              onClick={() => setNewsTab("copa")}
              className={cn(
                "rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] transition-all",
                newsTab === "copa"
                  ? "bg-emerald-400 text-black"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              )}
            >
              {t('news.tab_copa')}
            </button>
            <button
              onClick={() => setNewsTab("team")}
              className={cn(
                "rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] transition-all flex items-center gap-1.5",
                newsTab === "team"
                  ? "bg-primary text-black"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              )}
            >
              {favoriteTeam ? favoriteTeam.flag : "🏳"} {favoriteTeam ? favoriteTeam.name : t('news.tab_team')}
            </button>
          </div>

          {/* Content */}
          {newsLoading ? (
            <div className="grid gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-[24px] border border-white/5 bg-white/[0.02]" />
              ))}
            </div>
          ) : newsTab === "team" && !favoriteTeamCode ? (
            <p className="text-center text-xs text-zinc-500 py-6">{t('news.team_no_fav')}</p>
          ) : newsTab === "team" && teamNews.length === 0 ? (
            <p className="text-center text-xs text-zinc-500 py-6">
              {t('news.team_empty', { team: favoriteTeam?.name || favoriteTeamCode })}
            </p>
          ) : (
            <div className="grid gap-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={newsTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="grid gap-3"
                >
                  {(newsTab === "copa" ? miniNews : teamNews).map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex gap-4 p-4 rounded-[22px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all backdrop-blur-md"
                    >
                      <div className="w-20 h-14 rounded-[14px] overflow-hidden shrink-0 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                        <img
                          src={item.imageUrl || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=300"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col justify-center flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]",
                            newsTab === "team"
                              ? "bg-primary/15 border border-primary/25 text-primary"
                              : "bg-emerald-400/10 border border-emerald-400/20 text-emerald-400"
                          )}>
                            {item.category}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-bold">
                            {new Date(item.publishedAt).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                          {item.title}
                        </h3>
                      </div>
                    </a>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </motion.section>'''

src = src.replace(old_news_section, new_news_section)

# ── Step 3: Add useState import for newsTab (already imported, just verify) ──
# useState is already imported so no change needed

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

lines = src.count('\n')
print(f'Index.tsx updated ({lines} lines)')

checks = [
    ('newsTab', 'newsTab state'),
    ('countryFilter: favoriteTeamCode', 'team listener with filter'),
    ("tab_copa", 'tab_copa key'),
    ("tab_team", 'tab_team key'),
    ("team_empty", 'team_empty key'),
    ('AnimatePresence mode="wait"', 'tab transition animation'),
    ('teamNews', 'teamNews array'),
]
for needle, label in checks:
    print(f'  {"OK" if needle in src else "MISSING"} {label}')
