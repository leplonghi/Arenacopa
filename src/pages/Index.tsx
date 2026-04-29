import { Link } from "react-router-dom";
import { Trophy, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { ElitePassModal } from "@/components/ElitePassModal";
import { LiveMatchCard } from "@/components/LiveMatchCard";
import { useMonetization } from "@/contexts/MonetizationContext";
import { usePendingPredictions } from "@/hooks/usePendingPredictions";
import { getDashboardData, type DashboardBolaoSummary } from "@/services/dashboard/dashboard.service";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { getArenaLevel } from "@/lib/profile-level";
import { useDashboardMatches } from "@/hooks/useDashboardMatches";
import { HeroPalpites } from "@/components/home/HeroPalpites";
import { ProfileSummary } from "@/components/home/ProfileSummary";
import { HomeFeaturedMatch } from "@/components/home/HomeFeaturedMatch";
import { SpotlightMatchCard } from "@/components/home/SpotlightMatchCard";
import {
  CuriosityCard,
  NextActionCard,
  RankingHighlightCard,
  TodayArenaCard,
} from "@/components/home/HomeProactiveCards";
import { OpportunityRail } from "@/components/opportunities/OpportunityRail";
import { useOpportunities } from "@/hooks/useOpportunities";

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

function isCurrentOrUpcomingMatch(matchDate: string) {
  const timestamp = new Date(matchDate).getTime();
  return Number.isFinite(timestamp) && timestamp >= Date.now() - 90 * 60 * 1000;
}

const Index = () => {
  const { user } = useAuth();
  const { i18n, t } = useTranslation('home');
  const pendingPredictionItems = usePendingPredictions();

  const [myBoloes, setMyBoloes] = useState<DashboardBolaoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; avatar?: string } | null>(null);
  const [isEliteModalOpen, setIsEliteModalOpen] = useState(false);
  const { isPremium } = useMonetization();

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
    allMatches.find((match) => match.status === "scheduled" && isCurrentOrUpcomingMatch(match.matchDate)) ??
    null;
  const todayMatches = allMatches
    .filter((match) => match.status === "live" || (match.status === "scheduled" && isCurrentOrUpcomingMatch(match.matchDate)))
    .slice(0, 4);
  const opportunities = useOpportunities({
    user,
    pendingPredictions: pendingPredictionItems,
    activeBoloes: myBoloes,
    upcomingMatches: allMatches,
    rankingChanged: bestRank !== 999,
    surface: "home",
  });


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
        className="arena-screen relative z-10 max-w-5xl space-y-4"
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

        <motion.section variants={itemVariants}>
          <TodayArenaCard
            pendingCount={pendingMatchCount}
            matchCount={todayMatches.length}
            poolCount={myBoloes.length}
          />
        </motion.section>

        <motion.section variants={itemVariants}>
          <NextActionCard
            pendingCount={pendingMatchCount}
            firstPendingBolaoId={firstBolaoWithPending}
            poolCount={myBoloes.length}
            hasFeaturedMatch={Boolean(featuredMatch)}
          />
        </motion.section>

        <motion.section variants={itemVariants}>
          <OpportunityRail opportunities={opportunities} title="Oportunidades" />
        </motion.section>

        {featuredMatch ? (
          <motion.section variants={itemVariants}>
            <HomeFeaturedMatch match={featuredMatch} locale={i18n.language} />
          </motion.section>
        ) : null}

        <motion.section variants={itemVariants}>
          <ProfileSummary
            displayName={displayName}
            avatarUrl={profile?.avatar}
            levelInfo={levelInfo}
            bestRank={bestRank}
            totalPoints={totalPoints}
            poolCount={myBoloes.length}
          />
        </motion.section>

        <motion.section variants={itemVariants} className="grid gap-4 md:grid-cols-2">
          <RankingHighlightCard bestRank={bestRank} totalPoints={totalPoints} />
          <CuriosityCard match={featuredMatch} />
        </motion.section>

        <motion.section variants={itemVariants}>
          <ArenaPanel className="p-4 sm:p-5">
            <ArenaSectionHeader
              title="Jogos em destaque"
              eyebrow="Rodada"
              hint="Mostramos o próximo jogo aberto ou uma partida ao vivo. Datas antigas saem automaticamente."
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
              <div className="mt-4">
                <SpotlightMatchCard
                  match={todayMatches[0]}
                  href={todayMatches[0].championshipId ? `/campeonato/${todayMatches[0].championshipId}` : "/campeonatos"}
                  locale={i18n.language}
                />
              </div>
            )}
          </ArenaPanel>
        </motion.section>

        <motion.section variants={itemVariants}>
          <ArenaPanel className="p-4 sm:p-5">
            <ArenaSectionHeader
              title={t('my_pools.title')}
              eyebrow="Sua turma"
              hint="Atalhos para os bolões em que você participa. Convites e criação ficam na aba Bolões."
              action={
                <Link to="/boloes" className="text-[11px] text-gray-400 font-black uppercase tracking-[0.12em] hover:text-white transition-colors">
                  {t('my_pools.manage')} <ChevronRight className="w-3 h-3 inline ml-1" />
                </Link>
              }
            />

            {loading ? (
              <div className="mt-3 grid gap-3">
                <Skeleton className="h-32 w-full rounded-[32px] bg-white/5" />
                <Skeleton className="h-32 w-full rounded-[32px] bg-white/5" />
              </div>
            ) : myBoloes.length === 0 ? (
              <Link to="/boloes/criar" className="group mt-3 block">
                <div className="rounded-[32px] border border-dashed border-white/12 bg-white/[0.03] p-8 text-center transition-all hover:border-primary/45 hover:bg-primary/5">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-primary/20 bg-primary/10 text-primary transition-all duration-500 group-hover:scale-105 group-hover:rotate-6">
                    <Trophy className="h-10 w-10" />
                  </div>
                  <h3 className="mt-5 font-display text-[2rem] font-semibold uppercase text-white">{t('my_pools.join_title')}</h3>
                  <p className="mx-auto mt-2 max-w-[320px] text-sm leading-6 text-gray-500">Monte uma disputa com sua turma, equipe ou comunidade.</p>
                  <span className="arena-button-gold mt-6 inline-flex">{t('my_pools.start_now')}</span>
                </div>
              </Link>
            ) : (
              <div className="mt-3 grid gap-3">
                {myBoloes.map((bolao) => (
                  <Link key={bolao.id} to={`/boloes/${bolao.id}`} className="group relative">
                    <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 transition-all hover:border-primary/30 hover:bg-white/[0.06]">
                      {(bolao.pendingCount ?? 0) > 0 && <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-copa-orange/10 animate-pulse" />}

                      <div className="relative z-10 flex items-center justify-between gap-5">
                        <div className="flex items-center gap-6">
                          <div className="relative flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/10 bg-white/5 shadow-inner">
                            <span className="text-3xl">⚽</span>
                            <AnimatePresence>
                              {(bolao.pendingCount ?? 0) > 0 && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -45 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0 }}
                                  className="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-black text-black shadow-[0_0_18px_rgba(255,193,7,0.42)]"
                                >
                                  {bolao.pendingCount}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                              {bolao.pendingCount ? "Rodada aberta" : "Em dia"}
                            </p>
                            <h3 className="mt-2 truncate font-display text-[2rem] font-semibold uppercase text-white">
                              {bolao.name}
                            </h3>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500">
                              <span>{bolao.memberCount ?? 0} participantes</span>
                              <span>•</span>
                              <span>{(bolao.myPoints ?? 0).toLocaleString("pt-BR")} pts</span>
                              <span>•</span>
                              <span>rank #{bolao.myRank ?? "-"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="hidden items-center gap-3 sm:flex">
                          <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">Seu rank</p>
                            <p className="mt-1 font-display text-[1.9rem] font-semibold text-primary">#{bolao.myRank ?? "-"}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-white/45 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </ArenaPanel>
        </motion.section>
      </motion.div>
    </div>
  );
};

export default Index;
