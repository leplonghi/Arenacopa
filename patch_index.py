path = r'C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src\pages\Index.tsx'

with open(path, encoding='utf-8') as f:
    src = f.read()

# ── 1. Destructure isLoading from useRealtimeNews ────────────────────────────
old = 'const { news: realtimeNews } = useRealtimeNews({ limitCount: 3 });'
new = 'const { news: realtimeNews, isLoading: newsLoading } = useRealtimeNews({ limitCount: 3 });'
src = src.replace(old, new)

# ── 2. Fix error message in fetchData ────────────────────────────────────────
old = '        setDashboardError("Não consegui atualizar seu painel agora. Alguns blocos podem aparecer vazios.");'
new = '        setDashboardError(true);'
src = src.replace(old, new)

# Also update the state type from string|null to boolean|null
old = "const [dashboardError, setDashboardError] = useState<string | null>(null);"
new = "const [dashboardError, setDashboardError] = useState<boolean>(false);"
src = src.replace(old, new)

# ── 3. Fix "Torcedor" default fallback ──────────────────────────────────────
old = 'const displayName = profile?.name || user?.email?.split("@")[0] || "Torcedor";'
new = 'const displayName = profile?.name || user?.email?.split("@")[0] || t(\'hero.default_name\');'
src = src.replace(old, new)

# ── 4. ActionOfDay – fix hardcoded pending desc ──────────────────────────────
old = '''            <p className="text-sm font-bold text-white leading-snug truncate">
              {totalPending} jogo{s} esperando seu palpite
            </p>'''
new = '''            <p className="text-sm font-bold text-white leading-snug truncate">
              {t('action_of_day.pending_desc', { count: totalPending, s })}
            </p>'''
src = src.replace(old, new)

# ── 5. ActionOfDay – fix no_bolao desc ──────────────────────────────────────
old = '''            <p className="text-sm font-bold text-white leading-snug">
              Dispute com amigos na Copa 2026
            </p>'''
new = '''            <p className="text-sm font-bold text-white leading-snug">
              {t('action_of_day.no_bolao_desc')}
            </p>'''
src = src.replace(old, new)

# ── 6. ActionOfDay – fix today_match desc ────────────────────────────────────
old = '''            <p className="text-sm font-bold text-white leading-snug">
              Já fez seu palpite para hoje?
            </p>'''
new = '''            <p className="text-sm font-bold text-white leading-snug">
              {t('action_of_day.today_match_desc')}
            </p>'''
src = src.replace(old, new)

# ── 7. Compact pending alert text ────────────────────────────────────────────
old = '''                <span className="text-sm font-bold text-orange-200 flex-1">
                  {totalPending} palpite{totalPending > 1 ? "s" : ""} pendente{totalPending > 1 ? "s" : ""}
                </span>'''
new = '''                <span className="text-sm font-bold text-orange-200 flex-1">
                  {t('pending.title', { count: totalPending })}
                </span>'''
src = src.replace(old, new)

# ── 8. Match button aria-label ────────────────────────────────────────────────
old = '                    aria-label={`Ver detalhes: ${match.homeTeam} vs ${match.awayTeam}`}'
new = '                    aria-label={t(\'upcoming.match_aria\', { home: match.homeTeam, away: match.awayTeam })}'
src = src.replace(old, new)

# ── 9. Bolao card "membros" ───────────────────────────────────────────────────
old = '                              <span className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">{bolao.memberCount} membros</span>'
new = '                              <span className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">{t(\'my_pools.members\', { count: bolao.memberCount })}</span>'
src = src.replace(old, new)

# ── 10. Bolao card rank "lugar" ───────────────────────────────────────────────
old = '                                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-primary">#{bolao.myRank} lugar</span>'
new = '                                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-primary">{t(\'my_pools.rank_place\', { rank: bolao.myRank })}</span>'
src = src.replace(old, new)

# ── 11. Bolao card "Pontos" label ─────────────────────────────────────────────
old = '                          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">Pontos</span>'
new = '                          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">{t(\'quick_panel.points\')}</span>'
src = src.replace(old, new)

# ── 12. dashboardError usage (show translated message via t()) ────────────────
# The conditional rendering of error banner uses dashboardError as string; now it's boolean
# Find and replace the old error banner
old = '''        {dashboardError && (
          <motion.div variants={itemVariants}>'''
# Check if this pattern exists; if not the error might be inline somewhere else
# We'll replace only if found — safe fallback: leave as-is

# Actually let's check what uses dashboardError...
# The file may not show an error banner explicitly; let's search
if 'dashboardError &&' in src:
    # Replace any direct string renders of dashboardError
    src = src.replace('{dashboardError}', '{t(\'dashboard_partial.desc\')}')

# ── 13. MOVE NEWS SECTION before bolões ──────────────────────────────────────
# Current structure: upcoming → bolões → news (bottom)
# New structure: upcoming → news → bolões
# Strategy: remove news block from its current position, insert before bolões section

news_block = '''        {/* Global News Section */}
        {miniNews.length > 0 && (
          <motion.section variants={itemVariants} className="space-y-6">
          <SectionHeader color="bg-emerald-400" title={t('news.title')} rightElement={
            <Link to="/copa/noticias" className="text-[11px] text-gray-400 font-black uppercase tracking-[0.12em] hover:text-white transition-colors">
                {t('news.view_all')} <ChevronRight className="w-3 h-3 inline ml-1" />
              </Link>
            } />

            <div className="grid gap-4">
              {miniNews.map((item) => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="group flex gap-6 p-5 rounded-[28px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all backdrop-blur-md shadow-lg">
                  <div className="w-28 h-20 rounded-[20px] overflow-hidden shrink-0 shadow-2xl group-hover:scale-105 transition-transform duration-700 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <img src={item.imageUrl || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400"} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2.5">
                      <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                        {item.category}
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">
                        {new Date(item.publishedAt).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-100 leading-tight line-clamp-2 transition-colors group-hover:text-white tracking-tight">
                      {item.title}
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          </motion.section>
        )}'''

new_news_block = '''        {/* News Section — always visible above pools */}
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

# Remove old news block, then insert before the bolões section
src = src.replace(news_block, '')

# Insert new news block just before "Active Leagues" section
boloes_section_marker = '        {/* Active Leagues - HUD Style Cards */}'
src = src.replace(boloes_section_marker, new_news_block + '\n\n        {/* Active Leagues - HUD Style Cards */}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(src)

print(f'Index.tsx patched. Total lines: {src.count(chr(10))}')
# Verify key replacements
checks = [
    ('newsLoading', 'newsLoading state'),
    ("t('action_of_day.pending_desc'", 'pending_desc key'),
    ("t('action_of_day.no_bolao_desc')", 'no_bolao_desc key'),
    ("t('pending.title'", 'pending.title key'),
    ("t('my_pools.members'", 'my_pools.members key'),
    ("t('my_pools.rank_place'", 'my_pools.rank_place key'),
    ("t('quick_panel.points')", 'points key'),
    ('News Section', 'news section moved'),
    ("t('hero.default_name')", 'default_name key'),
]
for needle, label in checks:
    found = needle in src
    print(f'  {"OK" if found else "MISSING"} {label}')
