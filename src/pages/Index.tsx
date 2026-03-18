import { Link } from "react-router-dom";
import { Flag } from "@/components/Flag";
import { getTeam, formatMatchTime, formatMatchDate, type Match } from "@/data/mockData";
import { Users, Trophy, ChevronRight, AlertTriangle, Dices, Zap, Bell, Crown, Settings, CalendarDays, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchDetailsModal } from "@/components/copa/MatchDetailsModal";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ElitePassModal } from "@/components/ElitePassModal";
import { LiveMatchCard } from "@/components/LiveMatchCard";
import { useMonetization } from "@/contexts/MonetizationContext";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData, type DashboardBolaoSummary } from "@/services/dashboard/dashboard.service";
import { useMatches } from "@/hooks/useMatches";
import { useRealtimeNews } from "@/hooks/useRealtimeNews";
import {
  getStoredFavoriteTeam,
  setStoredFavoriteTeam,
  subscribeToFavoriteTeamUpdates,
} from "@/lib/favorite-team";

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

  const [myBoloes, setMyBoloes] = useState<DashboardBolaoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [profile, setProfile] = useState<{ name: string; avatar?: string } | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isEliteModalOpen, setIsEliteModalOpen] = useState(false);
  const { isPremium } = useMonetization();
  const { news: realtimeNews } = useRealtimeNews({ limitCount: 3 });
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
  );

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setMyBoloes([]);
      setDashboardError(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setDashboardError(null);
        const dashboardData = await getDashboardData(user.id);
        setProfile({
          name: dashboardData.profile?.name || "",
          avatar: dashboardData.profile?.avatar_url || "",
        });
        setMyBoloes(dashboardData.myBoloes);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setDashboardError("Não consegui atualizar seu painel agora. Alguns blocos podem aparecer vazios.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, dashboardRefreshKey]);

  const { data: allMatches } = useMatches();

  const upcomingMatches = useMemo(
    () =>
      (allMatches || [])
        .filter((match) => match.status !== "finished")
        .slice(0, 3),
    [allMatches]
  );

  const displayName = profile?.name || user?.email?.split("@")[0] || "Torcedor";
  const totalPoints = myBoloes.reduce((acc, curr) => acc + (curr.myPoints || 0), 0);
  const bestRank = myBoloes.length > 0 ? Math.min(...myBoloes.map(b => b.myRank || 999).filter(r => r > 0)) : 999;
  const totalPending = myBoloes.reduce((acc, curr) => acc + (curr.pendingCount || 0), 0);


  return (
    <div className="min-h-screen bg-black/70 pb-24 overflow-hidden relative">
      {/* Immersive Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent opacity-40" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <MatchDetailsModal
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />

      <ElitePassModal
        isOpen={isEliteModalOpen}
        onClose={() => setIsEliteModalOpen(false)}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-2xl space-y-10 px-4 pt-8 sm:px-6"
      >
        <LiveMatchCard />

        {dashboardError && (
          <motion.div variants={itemVariants} className="rounded-[28px] border border-amber-500/20 bg-amber-500/10 p-4 backdrop-blur-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.12em] text-amber-300">{t('dashboard_partial.title')}</h2>
                <p className="mt-1 text-sm text-amber-100/80">{dashboardError || t('dashboard_partial.desc')}</p>
              </div>
              <button
                type="button"
                onClick={() => setDashboardRefreshKey((current) => current + 1)}
                className="shrink-0 rounded-xl border border-amber-400/30 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-amber-200 hover:bg-amber-500/10"
              >
                {t('dashboard_partial.retry')}
              </button>
            </div>
          </motion.div>
        )}

        {/* Profile Header HUD */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="p-1 rounded-[24px] bg-gradient-to-br from-primary/40 to-transparent">
                <Avatar className="w-16 h-16 rounded-[22px] border-none bg-black shadow-2xl">
                  <AvatarImage src={profile?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-[10px] bg-primary flex items-center justify-center shadow-lg border-2 border-[#050505]">
                <Zap className="w-4 h-4 text-black" strokeWidth={3} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">{t('hero.kicker')}</span>
                {!isPremium ? (
                  <button
                    onClick={() => setIsEliteModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-[8px] bg-gradient-to-r from-yellow-600 to-yellow-500 px-2.5 py-1 hover:scale-105 transition-transform"
                  >
                    <Crown className="w-2.5 h-2.5 text-black" />
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-black">{t('hero.get_elite')}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-[8px] bg-white/10 px-2.5 py-1">
                    <Crown className="w-2.5 h-2.5 text-yellow-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-yellow-500">{t('hero.elite_member')}</span>
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter leading-none">{displayName}</h1>
            </div>
          </div>
          <Link to="/perfil">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all backdrop-blur-3xl"
            >
              <Settings className="w-6 h-6" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Intelligence / Alerts Bar */}
        {totalPending > 0 && (
          <motion.div variants={itemVariants}>
            <Link to="/boloes" className="group">
              <div className="relative p-7 rounded-[40px] bg-gradient-to-r from-orange-500/20 to-transparent border border-orange-500/30 overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700">
                  <Bell className="w-20 h-20 text-orange-500" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-14 h-14 rounded-[22px] bg-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/50 shrink-0">
                    <AlertTriangle className="w-7 h-7 text-white animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tight">CUIDADO, CAPITÃO!</h2>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] leading-snug text-orange-100/80">
                      Você possui {totalPending} palpite{totalPending > 1 ? "s" : ""} pendente{totalPending > 1 ? "s" : ""}
                    </p>
                  </div>
                  <motion.div
                    whileHover={{ x: 3 }}
                    className="w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center border border-white/10 group-hover:bg-orange-500 group-hover:text-black transition-all"
                  >
                    <ChevronRight className="w-6 h-6 stroke-[3px]" />
                  </motion.div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        <motion.section variants={itemVariants} className="space-y-6">
          <SectionHeader color="bg-primary" title={t('quick_panel.section_title')} rightElement={
            <Link to="/ranking" className="text-[11px] text-gray-400 font-black uppercase tracking-[0.12em] hover:text-white transition-colors">
              {t('quick_panel.view_ranking')} <ChevronRight className="w-3 h-3 inline ml-1" />
            </Link>
          } />

          <Link to="/ranking" className="block group">
            <div className="surface-card-strong rounded-[40px] p-6 transition-all group-hover:border-primary/30">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                    <BarChart3 className="w-4 h-4" />
                    {t('quick_panel.kicker')}
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">{t('quick_panel.title')}</h2>
                  <p className="text-sm text-zinc-400">
                    {t('quick_panel.description')}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 md:min-w-[320px]">
                  <CompactStat label={t('quick_panel.best_rank')} value={bestRank === 999 ? "-" : `${bestRank}º`} />
                  <CompactStat label={t('quick_panel.points')} value={totalPoints} highlight />
                  <CompactStat label={t('quick_panel.pools')} value={myBoloes.length} />
                </div>
              </div>
            </div>
          </Link>
        </motion.section>

        <motion.section variants={itemVariants} className="space-y-6">
          <SectionHeader color="bg-primary" title={t('upcoming.title')} rightElement={
            <Link to="/copa/calendario" className="text-[11px] text-gray-400 font-black uppercase tracking-[0.12em] hover:text-white transition-colors">
              {t('upcoming.view_calendar')} <ChevronRight className="w-3 h-3 inline ml-1" />
            </Link>
          } />

          {upcomingMatches.length === 0 ? (
            <div className="surface-card rounded-[32px] p-6 text-center text-sm text-zinc-400">
              {t('upcoming.empty')}
            </div>
          ) : (
            <div className="grid gap-4">
              {upcomingMatches.map((match) => {
                const isFavoriteMatch = match.homeTeam === favoriteTeamCode || match.awayTeam === favoriteTeamCode;
                const isToday = new Date(match.date).toDateString() === new Date().toDateString();

                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => setSelectedMatch(match)}
                    className={cn(
                      "surface-card-soft w-full rounded-[30px] p-5 text-left transition-all hover:border-white/20 hover:bg-white/[0.06]",
                      isFavoriteMatch && "border-primary/30 bg-primary/[0.08]"
                    )}
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                        <CalendarDays className="w-4 h-4 text-primary" />
                        {isFavoriteMatch && favoriteTeam ? t('upcoming.favorite_team', { team: favoriteTeam.name }) : t('upcoming.next_round')}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                        {isToday ? formatMatchTime(match.date, i18n.language) : formatMatchDate(match.date, i18n.language)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Flag code={match.homeTeam} size="md" className="shadow-md" />
                        <span className="text-sm font-black text-white">{match.homeTeam}</span>
                      </div>
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">vs</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-white">{match.awayTeam}</span>
                        <Flag code={match.awayTeam} size="md" className="shadow-md" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Active Leagues - HUD Style Cards */}
        <motion.section variants={itemVariants} className="space-y-6">
          <SectionHeader color="bg-blue-500" title={t('my_pools.title')} rightElement={
            <Link to="/boloes" className="text-[11px] text-gray-400 font-black uppercase tracking-[0.12em] hover:text-white transition-colors">
              {t('my_pools.manage')} <ChevronRight className="w-3 h-3 inline ml-1" />
            </Link>
          } />

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
                  <div className="p-[1.5px] rounded-[40px] bg-gradient-to-br from-white/10 to-transparent group-hover:from-primary/50 transition-all duration-500 shadow-2xl">
                    <div className="bg-black/70 rounded-[39px] p-6 flex items-center justify-between group-hover:bg-black/80 transition-all backdrop-blur-3xl overflow-hidden relative">
                      {/* Interactive background pulse */}
                      {(bolao.pendingCount ?? 0) > 0 && <div className="absolute inset-0 bg-orange-500/5 animate-pulse pointer-events-none" />}

                      <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-3xl shadow-inner relative group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 border border-white/5">
                          ⚽
                          <AnimatePresence>
                            {(bolao.pendingCount ?? 0) > 0 && (
                              <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-orange-500 rounded-xl text-[11px] font-black text-white flex items-center justify-center shadow-2xl border-2 border-[#0b0b0b]"
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
                              <span className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">{bolao.memberCount} membros</span>
                            </div>
                            {bolao.myRank && bolao.myRank > 0 && (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                <Crown className="w-3 h-3 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-primary">#{bolao.myRank} lugar</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 relative z-10">
                        <div className="text-right">
                          <span className="text-3xl font-black text-white tracking-tighter tabular-nums leading-none block mb-1">{bolao.myPoints}</span>
                          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">Pontos</span>
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

        {/* Global News Section */}
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
        )}

        {/* Floating Strategic CTA */}
        <motion.div
          variants={itemVariants}
          className="pt-4 sticky bottom-8 left-0 right-0"
        >
          <Link
            to="/boloes"
            className="relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-[28px] border border-white/10 bg-white py-6 text-[12px] font-black uppercase tracking-[0.22em] text-black shadow-[0_30px_60px_rgba(0,0,0,0.6)] transition-all hover:scale-[1.02] active:scale-[0.98] group"
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

/* --- Refined UI Components --- */

function CompactStat({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[24px] border p-4 text-center transition-all backdrop-blur-xl",
        highlight
          ? "bg-primary/10 border-primary/30"
          : "bg-white/[0.04] border-white/10"
      )}
    >
      <span className={cn("block text-2xl font-black tracking-tighter leading-none tabular-nums", highlight ? "text-primary" : "text-white")}>{value}</span>
      <span className="mt-2 block text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">{label}</span>
    </div>
  );
}

function SectionHeader({ color, title, rightElement }: { color: string; title: string; rightElement: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2">
      <h2 className="text-sm font-black text-white flex items-center gap-4 tracking-[0.15em] uppercase">
        <div className={cn("w-2.5 h-2.5 rounded-sm rotate-45", color)} />
        {title}
      </h2>
      {rightElement}
    </div>
  );
}

export default Index;
