import { Link } from "react-router-dom";
import {
  Trophy,
  ChevronRight,
  Target,
  CalendarDays,
  Users,
  BarChart3,
  Zap,
  ArrowRight,
  Newspaper,
  Radio,
  Plus,
  Flame,
  Shield,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { ElitePassModal } from "@/components/ElitePassModal";
import { usePendingPredictions } from "@/hooks/usePendingPredictions";
import { usePendingJoinRequests } from "@/hooks/usePendingJoinRequests";
import { getDashboardData, type DashboardBolaoSummary } from "@/services/dashboard/dashboard.service";
import { getArenaLevel } from "@/lib/profile-level";
import { useDashboardMatches } from "@/hooks/useDashboardMatches";
import { SpotlightMatchCard } from "@/components/home/SpotlightMatchCard";
import { cn } from "@/lib/utils";
import { getArenaAssetSrc } from "@/lib/arena-assets";

/* ─── Animation variants ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 360, damping: 28 } },
};

function isCurrentOrUpcomingMatch(matchDate: string) {
  const ts = new Date(matchDate).getTime();
  return Number.isFinite(ts) && ts >= Date.now() - 90 * 60 * 1000;
}

/* ─── Zone Label ─── */
function ZoneLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-600">
      {children}
    </p>
  );
}

/* ─── Pending CTA Banner ─── */
function PendingBanner({ count, ctaTo }: { count: number; ctaTo: string }) {
  const { t } = useTranslation("home");

  return (
    <Link
      to={ctaTo}
      className="group relative flex items-center gap-4 overflow-hidden rounded-[22px] border border-primary/40 bg-primary/[0.08] p-4 transition-all hover:bg-primary/[0.13]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-primary/30 bg-primary/15">
        <Target className="h-6 w-6 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">{t("pending_banner.kicker")}</p>
        <p className="mt-0.5 text-base font-black text-white">
          {t("pending_banner.title", { count })}
        </p>
        <p className="text-[11px] text-zinc-500">{t("pending_banner.desc")}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-primary transition group-hover:translate-x-1" />
    </Link>
  );
}

/* ─── Join Request Banner ─── */
function JoinRequestBanner({ count, bolaoId }: { count: number; bolaoId: string | null }) {
  const { t } = useTranslation("home");

  return (
    <Link
      to={bolaoId ? `/boloes/${bolaoId}` : "/boloes"}
      className="group flex items-center gap-3 rounded-[18px] border border-amber-500/25 bg-amber-500/[0.06] p-3.5 transition hover:bg-amber-500/[0.1]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-amber-500/15">
        <Users className="h-5 w-5 text-amber-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-amber-300">
          {t("join_requests.title", { count })}
        </p>
        <p className="text-[11px] text-zinc-500">{t("join_requests.desc")}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-amber-400" />
    </Link>
  );
}

/* ─── Quick Stats Row ─── */
function QuickStats({
  pending,
  todayCount,
  poolCount,
}: {
  pending: number;
  todayCount: number;
  poolCount: number;
}) {
  const { t } = useTranslation("home");
  const stats = [
    { icon: Target, value: pending, label: t("quick_stats.pending"), to: "/boloes", accent: pending > 0 },
    { icon: CalendarDays, value: todayCount, label: t("quick_stats.today"), to: "/campeonatos", accent: false },
    { icon: Trophy, value: poolCount, label: t("quick_stats.pools"), to: "/boloes", accent: poolCount > 0 },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map(({ icon: Icon, value, label, to, accent }) => (
        <motion.div key={label} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            to={to}
            className={cn(
              "flex flex-col gap-1.5 rounded-[18px] border p-3 h-full transition",
              accent
                ? "border-primary/30 bg-primary/[0.07] hover:bg-primary/[0.11]"
                : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]"
            )}
          >
            <Icon className={cn("h-4 w-4", accent ? "text-primary" : "text-zinc-500")} />
            <p className={cn("text-2xl font-black leading-none", accent ? "text-primary" : "text-white")}>
              {value}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 leading-tight">
              {label}
            </p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── My Pool Row ─── */
function MyPoolRow({ bolao }: { bolao: DashboardBolaoSummary }) {
  const { t } = useTranslation("home");
  const hasPending = (bolao.pendingCount ?? 0) > 0;
  return (
    <Link
      to={`/boloes/${bolao.id}`}
      className="group flex items-center gap-3 rounded-[16px] border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-primary/20 hover:bg-white/[0.04]"
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border border-white/8 bg-white/5 text-xl">
        ⚽
        {hasPending && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-black">
            {bolao.pendingCount}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{bolao.name}</p>
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span>{t("pool_row.members", { count: bolao.memberCount ?? 0 })}</span>
          <span>·</span>
          <span className={cn(hasPending && "font-bold text-primary")}>
            {hasPending ? t("pool_row.pending", { count: bolao.pendingCount }) : `${t("pool_row.up_to_date")} ✓`}
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700 transition group-hover:text-zinc-400" />
    </Link>
  );
}

/* ─── Discover Tile ─── */
function DiscoverTile({
  icon: Icon,
  label,
  description,
  to,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  to: string;
  color: string;
}) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Link
        to={to}
        className={cn(
          "group flex flex-col gap-2.5 rounded-[18px] border p-3.5 transition hover:-translate-y-0.5",
          color
        )}
      >
        <Icon className="h-5 w-5" />
        <div>
          <p className="text-sm font-black text-white">{label}</p>
          <p className="text-[11px] text-zinc-500 leading-snug mt-0.5">{description}</p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-current opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
      </Link>
    </motion.div>
  );
}

/* ─── Main Component ─── */
const Index = () => {
  const { user } = useAuth();
  const { i18n, t } = useTranslation("home");
  const pendingPredictionItems = usePendingPredictions();
  const pendingJoinInfo = usePendingJoinRequests(user?.id);

  const [myBoloes, setMyBoloes] = useState<DashboardBolaoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; avatar?: string } | null>(null);
  const [isEliteModalOpen, setIsEliteModalOpen] = useState(false);

  useEffect(() => {
    if (!user) { setProfile(null); setMyBoloes([]); setLoading(false); return; }
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardData(user.id);
        setProfile({ name: data.profile?.name || "", avatar: data.profile?.avatar_url || "" });
        setMyBoloes(data.myBoloes);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const { data: allMatches = [] } = useDashboardMatches();

  const displayName = profile?.name || user?.email?.split("@")[0] || t("hero.default_name");
  const totalPoints = myBoloes.reduce((acc, b) => acc + (b.myPoints || 0), 0);
  const bestRank = myBoloes.length > 0
    ? Math.min(...myBoloes.map((b) => b.myRank || 999).filter((r) => r > 0))
    : 999;
  const pendingMatchCount = pendingPredictionItems.length;
  const firstBolaoWithPending = pendingPredictionItems[0]?.bolaoIds[0];
  const levelInfo = getArenaLevel(totalPoints);

  const liveMatch = allMatches.find((m) => m.status === "live");
  const nextMatch = allMatches.find((m) => m.status === "scheduled" && isCurrentOrUpcomingMatch(m.matchDate));
  const featuredMatch = liveMatch ?? nextMatch ?? null;
  const todayMatches = allMatches
    .filter((m) => m.status === "live" || (m.status === "scheduled" && isCurrentOrUpcomingMatch(m.matchDate)))
    .slice(0, 4);

  const hasBoloes = myBoloes.length > 0;
  const hasPending = pendingMatchCount > 0;
  const hasJoinRequests = pendingJoinInfo.totalCount > 0;

  const headerBgSrc = getArenaAssetSrc("fundo-hero.png");

  return (
    <div className="relative min-h-screen overflow-hidden pb-28">
      <ElitePassModal isOpen={isEliteModalOpen} onClose={() => setIsEliteModalOpen(false)} />

      {/* ─── HERO STRIP ─── */}
      <section
        className="relative -mx-4 -mt-[calc(4.6rem+var(--safe-area-top,0px))] overflow-hidden sm:-mx-6"
        style={{
          backgroundImage: headerBgSrc
            ? `linear-gradient(90deg,rgba(1,7,5,0.97) 0%,rgba(1,7,5,0.80) 44%,rgba(1,7,5,0.22) 100%),url(${headerBgSrc})`
            : "linear-gradient(135deg,#020c06,#061a10)",
          backgroundPosition: "right center",
          backgroundSize: "cover",
          minHeight: 220,
        }}
      >
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="relative z-10 flex min-h-[220px] max-w-[600px] flex-col justify-end px-5 pb-6 pt-[calc(6rem+var(--safe-area-top,0px))] sm:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">
            Olá, {displayName.split(" ")[0]}
          </p>
          <h1 className="mt-1 font-display text-[2.4rem] font-extrabold uppercase leading-[0.9] tracking-tight text-white sm:text-[3rem]">
            {hasPending
              ? "Hora de palpitar!"
              : hasBoloes
              ? "Tudo em dia 🎯"
              : "Bem-vindo à Arena"}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400 leading-snug max-w-xs">
            {hasPending
              ? `${pendingMatchCount} jogo${pendingMatchCount > 1 ? "s" : ""} esperando seu palpite.`
              : hasBoloes
              ? "Nenhum chute pendente por enquanto."
              : "Crie ou entre em um bolão para começar."}
          </p>
        </div>
      </section>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-2xl space-y-5 px-4 pt-5 sm:px-6"
      >
        {/* ─── ZONA 1: AGORA ─── */}
        <motion.div variants={itemVariants} className="space-y-3">
          <ZoneLabel>⚡ {t("zones.now")}</ZoneLabel>

          {/* Stats rápidos */}
          <QuickStats
            pending={pendingMatchCount}
            todayCount={todayMatches.length}
            poolCount={myBoloes.length}
          />

          {/* Palpites urgentes */}
          {hasPending && (
            <PendingBanner
              count={pendingMatchCount}
              ctaTo={firstBolaoWithPending ? `/boloes/${firstBolaoWithPending}` : "/boloes"}
            />
          )}

          {/* Solicitações de entrada */}
          {hasJoinRequests && (
            <JoinRequestBanner
              count={pendingJoinInfo.totalCount}
              bolaoId={pendingJoinInfo.firstBolaoId ?? null}
            />
          )}

          {/* Jogo em destaque */}
          {featuredMatch && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                {liveMatch ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    <Radio className="h-3 w-3 animate-pulse" />
                    Ao vivo agora
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Próximo jogo
                  </span>
                )}
                <Link to="/campeonatos" className="ml-auto text-[10px] font-black uppercase tracking-wider text-primary hover:underline">
                  Ver todos
                </Link>
              </div>
              <SpotlightMatchCard
                match={featuredMatch}
                href={featuredMatch.championshipId ? `/campeonato/${featuredMatch.championshipId}` : "/campeonatos"}
                locale={i18n.language}
              />
            </div>
          )}
        </motion.div>

        {/* ─── ZONA 2: MEUS BOLÕES ─── */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <ZoneLabel>🏆 {t("zones.my_pools")}</ZoneLabel>
            {hasBoloes && (
              <Link to="/boloes" className="mb-3 text-[10px] font-black uppercase tracking-wider text-primary hover:underline">
                {t("my_pools.manage")}
              </Link>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-[16px] bg-white/5" />
              <Skeleton className="h-16 w-full rounded-[16px] bg-white/5" />
            </div>
          ) : myBoloes.length === 0 ? (
            <div className="space-y-2">
              {/* Explicação didática para novo usuário */}
              <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t("empty_pools.title")}</p>
                <p className="mt-1 text-sm font-bold text-white">{t("empty_pools.desc")}</p>
                <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                  {t("empty_pools.body")}
                </p>
              </div>
              {/* CTA criar ou entrar */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/boloes/criar"
                  className="group flex flex-col items-start gap-2 rounded-[18px] border border-primary/30 bg-primary/[0.07] p-3.5 transition hover:bg-primary/[0.12]"
                >
                  <Plus className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-black text-white">{t("empty_pools.create")}</p>
                    <p className="text-[10px] text-zinc-500">{t("empty_pools.create_desc")}</p>
                  </div>
                </Link>
                <Link
                  to="/descobrir"
                  className="group flex flex-col items-start gap-2 rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
                >
                  <Flame className="h-5 w-5 text-zinc-400" />
                  <div>
                    <p className="text-sm font-black text-white">{t("empty_pools.explore")}</p>
                    <p className="text-[10px] text-zinc-500">{t("empty_pools.explore_desc")}</p>
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {myBoloes.slice(0, 3).map((b) => (
                <MyPoolRow key={b.id} bolao={b} />
              ))}
              {myBoloes.length > 3 && (
                <Link to="/boloes" className="block text-center text-[10px] font-bold uppercase tracking-wider text-zinc-500 py-1 hover:text-zinc-300 transition">
                  {t("pool_actions.remaining", { count: myBoloes.length - 3 })}
                </Link>
              )}
              {/* CTA criar novo */}
              <Link
                to="/boloes/criar"
                className="flex items-center gap-2 rounded-[16px] border border-dashed border-white/10 bg-white/[0.02] px-3 py-2.5 text-[11px] font-bold text-zinc-500 transition hover:border-primary/25 hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("pool_actions.create_another")}
              </Link>
            </div>
          )}
        </motion.div>

        {/* ─── ZONA 3: DESCOBRIR ─── */}
        <motion.div variants={itemVariants} className="space-y-3">
          <ZoneLabel>🌍 {t("zones.discover")}</ZoneLabel>

          {/* Grid de atalhos */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DiscoverTile
              icon={CalendarDays}
              label={t("discover.championships")}
              description={t("discover.championships_desc")}
              to="/campeonatos"
              color="border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-400 hover:border-emerald-500/35 hover:bg-emerald-500/[0.08]"
            />
            <DiscoverTile
              icon={Newspaper}
              label={t("discover.news")}
              description={t("discover.news_desc")}
              to="/noticias"
              color="border-blue-500/20 bg-blue-500/[0.04] text-blue-400 hover:border-blue-500/35 hover:bg-blue-500/[0.08]"
            />
            <DiscoverTile
              icon={BarChart3}
              label={t("discover.ranking")}
              description={t("discover.ranking_desc")}
              to="/ranking"
              color="border-amber-500/20 bg-amber-500/[0.04] text-amber-400 hover:border-amber-500/35 hover:bg-amber-500/[0.08]"
            />
            <DiscoverTile
              icon={Users}
              label={t("discover.communities")}
              description={t("discover.communities_desc")}
              to="/grupos"
              color="border-zinc-500/20 bg-zinc-500/[0.04] text-zinc-400 hover:border-zinc-500/35 hover:bg-zinc-500/[0.08]"
            />
          </div>

          {/* Mais jogos hoje */}
          {todayMatches.length > 1 && (
            <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t("today_more.title")}</p>
                <Link to="/campeonatos" className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline">
                  {t("today_more.view_all")}
                </Link>
              </div>
              <div className="space-y-2">
                {todayMatches.slice(1, 3).map((match) => (
                  <SpotlightMatchCard
                    key={match.id}
                    match={match}
                    href={match.championshipId ? `/campeonato/${match.championshipId}` : "/campeonatos"}
                    locale={i18n.language}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Perfil rápido + Ranking */}
          <div className="grid grid-cols-2 gap-2">
            {/* Nível */}
            <div className="flex flex-col gap-2 rounded-[18px] border border-amber-500/15 bg-amber-500/[0.04] p-3.5">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{t("profile_card.level")}</p>
              </div>
              <p className="text-2xl font-black text-amber-300">{levelInfo.level}</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${Math.min(100, levelInfo.ratio * 100)}%` }}
                />
              </div>
              <Link to="/perfil" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition">
                {t("profile_card.view_profile")} →
              </Link>
            </div>

            {/* Ranking */}
            <div className="flex flex-col gap-2 rounded-[18px] border border-primary/15 bg-primary/[0.04] p-3.5">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{t("profile_card.ranking")}</p>
              </div>
              <p className="text-2xl font-black text-white">
                {bestRank !== 999 ? `#${bestRank}` : "—"}
              </p>
              <p className="text-[10px] text-zinc-500">
                {totalPoints > 0 ? `${totalPoints.toLocaleString(i18n.language)} ${t("my_pools.pts")}` : t("profile_card.no_points")}
              </p>
              <Link to="/ranking" className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline transition">
                {t("quick_panel.view_ranking")} →
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
