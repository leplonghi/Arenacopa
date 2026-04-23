import { Link } from "react-router-dom";
import { getTeam } from "@/data/mockData";
import { Users, Trophy, ChevronRight, Dices, Crown, SlidersHorizontal, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { sanitizeExternalUrl } from "@/lib/security";
import { ElitePassModal } from "@/components/ElitePassModal";
import { LiveMatchCard } from "@/components/LiveMatchCard";
import { useMonetization } from "@/contexts/MonetizationContext";
import { useQuery } from "@tanstack/react-query";
import { usePendingPredictions } from "@/hooks/usePendingPredictions";
import { getDashboardData, type DashboardBolaoSummary } from "@/services/dashboard/dashboard.service";
import { useRealtimeNews } from "@/hooks/useRealtimeNews";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { getArenaLevel } from "@/lib/profile-level";
import {
  getStoredFavoriteTeam,
  setStoredFavoriteTeam,
  subscribeToFavoriteTeamUpdates,
} from "@/lib/favorite-team";
import { useDashboardMatches } from "@/hooks/useDashboardMatches";
import { HeroPalpites } from "@/components/home/HeroPalpites";
import { ProfileSummary } from "@/components/home/ProfileSummary";
import { DailyChallengeCard } from "@/components/home/DailyChallengeCard";
import { MatchListItem } from "@/components/home/MatchListItem";
import { HomeFeaturedMatch } from "@/components/home/HomeFeaturedMatch";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

const Index = () => {
  const { user } = useAuth();
  const { i18n, t } = useTranslation('home');

  const { data: dbFavoriteTeamCode } = useQuery({
    queryKey: ['favoriteTeam', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const { db } = await import("@/integrations/firebase/client");
        const docRef = doc(db, "profiles", user.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          return data.favorite_team || null;
        }
        return null;
      } catch (error) {
        console.error("Error fetching favorite team from Firestore:", error);
        return null;
      }
    },
    enabled: !!user?.id,
  });

  const [favoriteTeamOverride, setFavoriteTeamOverride] = useState<string | null>(null);

  useEffect(() => {
    return subscribeToFavoriteTeamUpdates((teamCode) => {
      setFavoriteTeamOverride(teamCode);
    });
  }, []);

  useEffect(() => {
    if (dbFavoriteTeamCode && dbFavoriteTeamCode !== getStoredFavoriteTeam()) {
      setStoredFavoriteTeam(dbFavoriteTeamCode);
    }
  }, [dbFavoriteTeamCode]);

  const favoriteTeamCode = favoriteTeamOverride || dbFavoriteTeamCode || getStoredFavoriteTeam() || "BRA";
  const favoriteTeam = getTeam(favoriteTeamCode);
  const pendingPredictionItems = usePendingPredictions();

  const [myBoloes, setMyBoloes] = useState<DashboardBolaoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; avatar?: string } | null>(null);
  const [isEliteModalOpen, setIsEliteModalOpen] = useState(false);
  const { isPremium } = useMonetization();
  const [newsTab, setNewsTab] = useState<"copa" | "team">("copa");
  const [showNewsPrefPanel, setShowNewsPrefPanel] = useState(false);

  // Shared news categories & preferences (synced with /noticias page prefs)
  const NEWS_CATEGORIES = [
    { id: "copa",    label: "Copa 2026", emoji: "🏆" },
    { id: "teams",   label: "Seleções",  emoji: "🌍" },
    { id: "general", label: "Futebol",   emoji: "⚽" },
    { id: "matches", label: "Partidas",  emoji: "🎯" },
    { id: "travel",  label: "Viagem",    emoji: "✈️" },
    { id: "tickets", label: "Ingressos", emoji: "🎟️" },
  ];
  const HOME_PREFS_KEY = "arenacopa_home_news_prefs";
  const [homeNewsPrefs, setHomeNewsPrefs] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HOME_PREFS_KEY) || '["copa","teams"]'); }
    catch { return ["copa", "teams"]; }
  });
  const toggleNewsPref = (id: string) => {
    setHomeNewsPrefs(prev => {
      const next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id];
      localStorage.setItem(HOME_PREFS_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Copa 2026 general news — real-time listener
  const { news: copaNewsRaw, isLoading: copaNewsLoading } = useRealtimeNews({
    limitCount: 8,
    championshipId: "wc2026",
  });
  // Favourite-team news — real-time listener (separate Firestore query)
  const { news: teamNewsRaw, isLoading: teamNewsLoading } = useRealtimeNews({
    limitCount: 8,
    countryFilter: favoriteTeamCode || null,
  });

  const newsLoading = newsTab === "copa" ? copaNewsLoading : teamNewsLoading;

  const mapNews = useCallback(
    (items: typeof copaNewsRaw) =>
      items.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category || "general",
        label: item.source_name || item.source_country || item.category || "Geral",
        publishedAt: item.published_at,
        imageUrl: item.image_url || item.url_to_image || null,
        url: item.url,
      })),
    []
  );

  const formatNewsDate = useCallback(
    (value?: string) => {
      if (!value) return t('news.recent', 'Recente');
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return t('news.recent', 'Recente');
      return parsed.toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' });
    },
    [i18n.language, t]
  );

  // Copa tab: filter by user prefs (if any), else show all; limit to 4
  const miniNews = useMemo(() => {
    const all = mapNews(copaNewsRaw);
    if (homeNewsPrefs.length === 0) return all.slice(0, 4);
    const filtered = all.filter(item => homeNewsPrefs.some(p => item.category?.toLowerCase().includes(p)));
    return (filtered.length > 0 ? filtered : all).slice(0, 4);
  }, [copaNewsRaw, homeNewsPrefs, mapNews]);

  // "Para você" tab: team-specific news first, then pref-filtered; limit to 4
  const teamNews = useMemo(() => {
    const all = mapNews(teamNewsRaw);
    return all.slice(0, 4);
  }, [mapNews, teamNewsRaw]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setMyBoloes([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardData = await getDashboardData(user.id);
        setProfile({
          name: dashboardData.profile?.name || "",
          avatar: dashboardData.profile?.avatar_url || "",
        });
        setMyBoloes(dashboardData.myBoloes);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const { data: allMatches = [] } = useDashboardMatches();

  const displayName = profile?.name || user?.email?.split("@")[0] || t('hero.default_name');
  const totalPoints = myBoloes.reduce((acc, curr) => acc + (curr.myPoints || 0), 0);
  const bestRank = myBoloes.length > 0 ? Math.min(...myBoloes.map(b => b.myRank || 999).filter(r => r > 0)) : 999;
  const pendingMatchCount = pendingPredictionItems.length;
  const firstBolaoWithPending = pendingPredictionItems[0]?.bolaoIds[0];
  const levelInfo = getArenaLevel(totalPoints);
  const featuredMatch =
    allMatches.find((match) => match.status === "live") ??
    allMatches.find((match) => match.status === "scheduled") ??
    null;
  const todayMatches = allMatches
    .filter((match) => match.status !== "finished")
    .slice(0, 4);


  return (
    <div className="min-h-screen pb-24 overflow-hidden relative">
      {/* Immersive Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent opacity-40" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <ElitePassModal
        isOpen={isEliteModalOpen}
        onClose={() => setIsEliteModalOpen(false)}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-2xl space-y-4 px-4 pt-6 sm:px-6"
      >
        {featuredMatch ? null : <LiveMatchCard />}

        <motion.section variants={itemVariants}>
          <HeroPalpites
            pendingCount={pendingMatchCount}
            ctaTo={firstBolaoWithPending ? `/boloes/${firstBolaoWithPending}` : "/boloes"}
            isPremium={isPremium}
            onOpenElite={() => setIsEliteModalOpen(true)}
          />
        </motion.section>

        {featuredMatch ? (
          <motion.section variants={itemVariants}>
            <HomeFeaturedMatch match={featuredMatch} locale={i18n.language} />
          </motion.section>
        ) : null}

        <motion.section variants={itemVariants} className="grid gap-4 sm:grid-cols-[1.15fr,0.85fr]">
          <ProfileSummary
            displayName={displayName}
            avatarUrl={profile?.avatar}
            levelInfo={levelInfo}
            bestRank={bestRank}
            totalPoints={totalPoints}
            poolCount={myBoloes.length}
          />

          <DailyChallengeCard
            progress={Math.min(5, Math.max(1, pendingMatchCount > 0 ? 5 - Math.min(4, pendingMatchCount) : 3))}
          />
        </motion.section>

        <motion.section variants={itemVariants}>
          <ArenaPanel className="p-5">
            <ArenaSectionHeader
              title="Jogos de hoje"
              eyebrow="Agenda"
              action={
                <Link to="/campeonatos" className="font-display text-xl font-black uppercase text-primary">
                  Ver todos
                </Link>
              }
            />

            {todayMatches.length === 0 ? (
              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-zinc-400">
                {t('upcoming.empty')}
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {todayMatches.map((match, index) => (
                  <MatchListItem
                    key={match.id}
                    match={match}
                    locale={i18n.language}
                    href={match.championshipId ? `/campeonato/${match.championshipId}` : "/campeonatos"}
                    audienceCount={12400 - index * 1900}
                  />
                ))}
              </div>
            )}
          </ArenaPanel>
        </motion.section>

        {/* Real-time News — tabbed Copa 2026 / Meu Time */}
        <motion.section variants={itemVariants} className="space-y-4">
          <ArenaSectionHeader
            title={t('news.title')}
            eyebrow="Radar"
            action={
              <Link to="/noticias" className="text-[11px] text-gray-400 font-black uppercase tracking-[0.12em] hover:text-white transition-colors">
                {t('news.view_all')} <ChevronRight className="w-3 h-3 inline ml-1" />
              </Link>
            }
          />

          {/* Tab pills + preferences button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setNewsTab("copa")}
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] transition-all",
                newsTab === "copa"
                  ? "bg-copa-green text-white"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              )}
            >
              {t('news.tab_copa')}
            </button>
            <button
              onClick={() => setNewsTab("team")}
              className={cn(
                "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] transition-all flex items-center gap-1.5",
                newsTab === "team"
                  ? "bg-primary text-black"
                  : "border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
              )}
            >
              {favoriteTeam ? favoriteTeam.flag : "🏳"} Para você
            </button>
            <button
              onClick={() => setShowNewsPrefPanel(v => !v)}
              className={cn(
                "ml-auto rounded-full p-1.5 transition-all",
                showNewsPrefPanel
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-white/5 text-zinc-500 border border-white/10 hover:text-white"
              )}
              title="Personalizar notícias"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* News preferences panel */}
          <AnimatePresence>
            {showNewsPrefPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-[20px] border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                      Categorias preferidas na Home
                    </p>
                    <button onClick={() => setShowNewsPrefPanel(false)} className="rounded-full p-1 hover:bg-white/10">
                      <X className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {NEWS_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => toggleNewsPref(cat.id)}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition-all",
                          homeNewsPrefs.includes(cat.id)
                            ? "bg-primary text-black"
                            : "border border-white/10 bg-white/5 text-zinc-400"
                        )}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                        {homeNewsPrefs.includes(cat.id) && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-zinc-600">
                    Também aplicado à aba "Para Você" na tela de Notícias.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          {newsLoading ? (
            <div className="grid gap-2.5">
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
                  className="grid gap-2.5"
                >
                  {(newsTab === "copa" ? miniNews : teamNews).map((item) => {
                    const safeUrl = sanitizeExternalUrl(item.url);
                    const Wrapper = safeUrl ? "a" : "article";

                    return (
                      <Wrapper
                        key={item.id}
                        {...(safeUrl
                          ? {
                              href: safeUrl,
                              target: "_blank",
                              rel: "noopener noreferrer",
                            }
                          : {})}
                        className="group flex gap-3 p-3 rounded-[18px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all backdrop-blur-md"
                      >
                        <div className="w-16 h-12 rounded-[12px] overflow-hidden shrink-0 relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                          <img
                            src={item.imageUrl || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=300"}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        </div>
                        <div className="flex flex-col justify-center flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={cn(
                              "rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em]",
                              newsTab === "team"
                                ? "bg-primary/15 border border-primary/25 text-primary"
                                : "bg-copa-green/10 border border-copa-green/20 text-copa-green-light"
                            )}>
                              {item.label}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-bold">
                              {formatNewsDate(item.publishedAt)}
                            </span>
                          </div>
                          <h3 className="text-[13px] font-bold text-gray-200 leading-snug line-clamp-2 group-hover:text-white transition-colors">
                            {item.title}
                          </h3>
                        </div>
                      </Wrapper>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </motion.section>

        {/* Active Leagues - HUD Style Cards */}
        <motion.section variants={itemVariants} className="space-y-6">
          <ArenaSectionHeader
            title={t('my_pools.title')}
            eyebrow="Seus bolões"
            action={
              <Link to="/boloes" className="text-[11px] text-gray-400 font-black uppercase tracking-[0.12em] hover:text-white transition-colors">
                {t('my_pools.manage')} <ChevronRight className="w-3 h-3 inline ml-1" />
              </Link>
            }
          />

          {loading ? (
            <div className="grid gap-4">
              <Skeleton className="h-32 w-full rounded-[40px] bg-white/5" />
              <Skeleton className="h-32 w-full rounded-[40px] bg-white/5" />
            </div>
          ) : myBoloes.length === 0 ? (
            <Link to="/boloes/criar" className="group block">
              <div className="rounded-[48px] border-2 border-dashed border-white/10 p-12 flex flex-col items-center text-center gap-8 hover:border-primary/50 hover:bg-primary/5 transition-all backdrop-blur-3xl shadow-2xl">
                <div className="w-24 h-24 rounded-[32px] bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-2xl border border-primary/20">
                  <Trophy className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t('my_pools.join_title')}</h3>
                  <p className="text-sm text-gray-500 font-medium max-w-[280px] leading-relaxed mx-auto">{t('my_pools.join_desc')}</p>
                </div>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-12 py-5 rounded-[24px] bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl"
                >
                  {t('my_pools.start_now')}
                </motion.span>
              </div>
            </Link>
          ) : (
            <div className="grid gap-5">
              {myBoloes.map((bolao) => (
                <Link key={bolao.id} to={`/boloes/${bolao.id}`} className="group relative">
            <div className="p-[1.5px] rounded-[32px] bg-gradient-to-br from-white/10 to-transparent group-hover:from-primary/50 transition-all duration-500 shadow-2xl">
                    <div className="bg-white/[0.04] backdrop-blur-xl rounded-[31px] p-6 flex items-center justify-between group-hover:bg-white/[0.07] transition-all overflow-hidden relative border border-white/[0.06]">
                      {/* Interactive background pulse */}
                      {(bolao.pendingCount ?? 0) > 0 && <div className="absolute inset-0 bg-copa-orange/10 animate-pulse pointer-events-none" />}

                      <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-3xl shadow-inner relative group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 border border-white/5">
                          ⚽
                          <AnimatePresence>
                            {(bolao.pendingCount ?? 0) > 0 && (
                              <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-copa-orange rounded-xl text-[11px] font-black text-white flex items-center justify-center shadow-2xl border-2 border-[#0b0b0b]"
                              >
                                {bolao.pendingCount}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white tracking-tight leading-none group-hover:text-primary transition-colors">{bolao.name}</h3>
                          <div className="flex items-center gap-5 mt-2.5">
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-gray-600" />
                              <span className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">{t('my_pools.members', { count: bolao.memberCount })}</span>
                            </div>
                            {bolao.myRank && bolao.myRank > 0 && (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                <Crown className="w-3 h-3 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-primary">{t('my_pools.rank_place', { rank: bolao.myRank })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 relative z-10">
                        <div className="text-right">
                          <span className="text-3xl font-black text-white tracking-tighter tabular-nums leading-none block mb-1">{bolao.myPoints}</span>
                          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">{t('quick_panel.points')}</span>
                        </div>
                        <div className="w-12 h-12 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-black transition-all shadow-xl">
                          <ChevronRight className="w-6 h-6 stroke-[2.5px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.section>



        {/* Floating Strategic CTA */}
        <motion.div
          variants={itemVariants}
          className="pt-4 sticky bottom-[calc(5rem+var(--safe-area-bottom,0px))] md:bottom-8 left-0 right-0 z-20"
        >
          <Link
            to="/boloes"
            className="relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-white/95 to-white py-6 text-[12px] font-black uppercase tracking-[0.22em] text-black shadow-[0_30px_60px_rgba(0,0,0,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Dices className="w-6 h-6 stroke-[2.5px]" />
            {t('cta_predict')}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
