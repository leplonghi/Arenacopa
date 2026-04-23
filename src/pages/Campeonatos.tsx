import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy, Radio, Clock, ChevronRight, Star, CalendarDays, Sparkles, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChampionship } from "@/contexts/ChampionshipContext";
import type { Championship, ChampionshipStatus } from "@/types/championship";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useTranslation } from "react-i18next";
import { ArenaMetric, ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";

// ─── Status badge ────────────────────────────────────────────
function StatusBadge({ status }: { status: ChampionshipStatus }) {
  const { t } = useTranslation("championships");
  if (status === "live") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
        <Radio className="w-2.5 h-2.5 animate-pulse" />
        {t("status.live")}
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
        <Clock className="w-2.5 h-2.5" />
        {t("status.upcoming")}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-2 py-0.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
      {t("status.finished")}
    </span>
  );
}

// ─── Copa Hero Card (WC2026 only) ─────────────────────────────
function CopaHeroCard({
  championship,
  isSelected,
  bolaoCount,
  onSelect,
}: {
  championship: Championship;
  isSelected: boolean;
  bolaoCount: number;
  onSelect: () => void;
}) {
  const { t } = useTranslation("championships");
  const [from, to] = championship.gradient;
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      onClick={onSelect}
      className={cn(
        "relative w-full text-left rounded-3xl overflow-hidden border-2 transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
        isSelected
          ? "border-amber-300/60 shadow-[0_0_40px_rgba(250,204,21,0.16)]"
          : "border-emerald-200/10 hover:border-amber-300/35 hover:shadow-[0_8px_40px_rgba(16,185,129,0.14)]"
      )}
      style={{
        background: `radial-gradient(circle at top right, rgba(250,204,21,0.12), transparent 30%), linear-gradient(135deg, ${from}f5, ${to}ee)`,
      }}
    >
      {/* Gold shimmer overlay */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          background:
            "linear-gradient(130deg, rgba(251,191,36,0.9) 0%, transparent 55%)",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.18),transparent_38%)]" />

      {/* Stars decoration */}
      <div className="absolute top-3 right-4 flex gap-1 opacity-30">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
        ))}
      </div>

      <div className="relative z-10 p-5">
        {/* COPA label */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 px-3 py-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
            {t("hero.special_event")}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          {/* Logo */}
          <div className="w-[94px] h-[94px] flex items-center justify-center shrink-0">
            {championship.logoUrl ? (
              <img
                src={championship.logoUrl}
                alt={championship.shortName}
                className="w-full h-full object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.30)]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (e.currentTarget.nextSibling as HTMLElement)?.removeAttribute("style");
                }}
              />
            ) : null}
            <span
              className="text-5xl drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)]"
              style={championship.logoUrl ? { display: "none" } : {}}
            >
              {championship.logo}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-amber-100/55 uppercase tracking-widest mb-0.5">
              {championship.confederation} · {championship.season}
            </p>
            <h2 className="text-2xl font-black text-white leading-tight">
              {championship.name}
            </h2>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusBadge status={championship.status} />
            </div>
          </div>
        </div>

        {/* Date range */}
        <p className="text-xs text-emerald-100/50 mb-3">
          {t("hero.date_range")}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-300/70" />
            <span className="text-xs text-white/50">
              {bolaoCount === 0
                ? t("hero.pools_zero")
                : bolaoCount === 1
                ? t("hero.pools_one")
                : t("hero.pools_other", { count: bolaoCount })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-amber-300/12 border border-amber-300/20 px-3 py-1.5">
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
              {t("hero.enter")}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─── League / Club Championship Card ────────────────────────
function ChampionshipCard({
  championship,
  isSelected,
  bolaoCount,
  onSelect,
  index,
}: {
  championship: Championship;
  isSelected: boolean;
  bolaoCount: number;
  onSelect: () => void;
  index: number;
}) {
  const { t } = useTranslation("championships");
  const [from, to] = championship.gradient;

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.07, duration: 0.35, ease: "easeOut" }}
      onClick={onSelect}
      className={cn(
        "relative w-full min-h-[176px] text-left rounded-2xl overflow-hidden border transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        isSelected
          ? "border-white/30 shadow-[0_0_24px_rgba(255,255,255,0.12)]"
          : "border-white/[0.08] hover:border-white/20 hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      )}
      style={{
        background: `linear-gradient(135deg, ${from}ee, ${to}dd)`,
      }}
    >
      {/* Subtle shine overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          background:
            "linear-gradient(130deg, rgba(255,255,255,0.9) 0%, transparent 60%)",
        }}
      />

      {/* Selected ring */}
      {isSelected && (
        <motion.div
          layoutId="championshipSelected"
          className="absolute inset-0 rounded-2xl"
          style={{
            boxShadow: `0 0 0 2px ${championship.color}`,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      <div className="relative z-10 p-4">
        {/* Top row: logo + status */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-[68px] h-[68px] flex items-center justify-center shrink-0">
            {championship.logoUrl ? (
              <img
                src={championship.logoUrl}
                alt={championship.shortName}
                className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.30)]"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (e.currentTarget.nextSibling as HTMLElement)?.removeAttribute("style");
                }}
              />
            ) : null}
            <span
              className="text-3xl drop-shadow-[0_6px_14px_rgba(0,0,0,0.25)]"
              style={championship.logoUrl ? { display: "none" } : {}}
            >
              {championship.logo}
            </span>
          </div>
          <StatusBadge status={championship.status} />
        </div>

        {/* Names */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest leading-none mb-1">
            {championship.confederation ?? championship.country}
            {" · "}{championship.season}
          </p>
          <h3 className="text-sm font-extrabold text-white leading-tight">
            {championship.shortName}
          </h3>
        </div>

        {/* Bottom row: bolão count + arrow */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-2.5">
          <div className="flex items-center gap-1">
            <Trophy className="w-3 h-3 text-white/40" />
            <span className="text-[10px] text-white/50">
              {bolaoCount === 0
                ? t("card.pools_zero")
                : bolaoCount === 1
                ? t("card.pools_one")
                : t("card.pools_other", { count: bolaoCount })}
            </span>
          </div>
          <ChevronRight
            className={cn(
              "w-3.5 h-3.5 transition-transform",
              isSelected ? "text-white translate-x-0.5" : "text-white/30"
            )}
          />
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function Campeonatos() {
  const navigate = useNavigate();
  const { current, all, setChampionship } = useChampionship();
  const { user } = useAuth();
  const { t } = useTranslation("championships");

  const copa = all.find((c) => c.id === "wc2026")!;
  const leagues = all.filter((c) => c.id !== "wc2026");

  // Fetch active bolão counts per championship
  const { data: bolaoCountsMap = {} } = useQuery({
    queryKey: ["championship-bolao-counts", user?.id],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      if (!user) return {};
      const membershipsRef = collection(db, "bolao_members");
      const snap = await getDocs(
        query(membershipsRef, where("user_id", "==", user.id))
      );
      const bolaoIds = snap.docs.map((d) => d.data().bolao_id as string);
      if (!bolaoIds.length) return {};

      const chunks: string[][] = [];
      for (let i = 0; i < bolaoIds.length; i += 30) {
        chunks.push(bolaoIds.slice(i, i + 30));
      }

      const counts: Record<string, number> = {};
      await Promise.all(
        chunks.map(async (chunk) => {
          const bolaoDocs = await getDocs(
            query(
              collection(db, "boloes"),
              where("__name__", "in", chunk)
            )
          );
          bolaoDocs.forEach((doc) => {
            const status = doc.data().status;
            if (status !== "active" && status !== "open") {
              return;
            }
            const champId: string = doc.data().championship_id ?? "wc2026";
            counts[champId] = (counts[champId] ?? 0) + 1;
          });
        })
      );
      return counts;
    },
  });

  const handleSelect = (championship: Championship) => {
    setChampionship(championship.id);
    if (championship.id === "wc2026") {
      navigate("/copa");
    } else {
      navigate(`/campeonato/${championship.id}`);
    }
  };

  const totalPools = Object.values(bolaoCountsMap).reduce((sum, value) => sum + value, 0);
  const liveChampionships = leagues.filter((championship) => championship.status === "live");
  const upcomingChampionships = leagues.filter((championship) => championship.status === "upcoming");
  const finishedChampionships = leagues.filter((championship) => championship.status === "finished");
  const featuredLive = liveChampionships[0] ?? leagues[0];

  return (
    <div className="arena-screen pb-28">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <ArenaPanel tone="strong" className="overflow-hidden p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="relative">
                <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-primary/12 blur-3xl" />
                <p className="arena-kicker">Centro de campeonatos</p>
                <h1 className="mt-2 max-w-xl font-display text-[3.2rem] font-black uppercase leading-[0.88] tracking-[0.02em] text-white sm:text-[4.4rem]">
                  Escolha a competição e entre no contexto certo.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                  A Home aponta a próxima ação. Aqui você escolhe o palco: evento principal, ligas ao vivo e torneios em preparação, cada um com sua própria entrada.
                </p>

                {featuredLive ? (
                  <button
                    onClick={() => handleSelect(featuredLive)}
                    className="mt-6 flex w-full max-w-xl items-center gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:bg-white/[0.07]"
                  >
                    <div
                      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-white/10 bg-black/20"
                      style={{
                        boxShadow: `0 0 0 1px ${featuredLive.color}22 inset`,
                      }}
                    >
                      {featuredLive.logoUrl ? (
                        <img
                          src={featuredLive.logoUrl}
                          alt={featuredLive.shortName}
                          className="h-10 w-10 object-contain"
                        />
                      ) : (
                        <span className="text-3xl">{featuredLive.logo}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-display font-black uppercase tracking-[0.18em] text-primary">
                        Em destaque agora
                      </p>
                      <p className="mt-1 truncate font-display text-2xl font-black uppercase text-white">
                        {featuredLive.name}
                      </p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {featuredLive.confederation ?? featuredLive.country} · {featuredLive.season}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-white/50" />
                  </button>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="arena-badge bg-primary/12 border-primary/30 text-primary">
                    <Flame className="h-3.5 w-3.5" />
                    {liveChampionships.length} ao vivo
                  </span>
                  <span className="arena-badge">
                    <Trophy className="h-3.5 w-3.5" />
                    {totalPools} bolões ativos
                  </span>
                  <span className="arena-badge">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Copa 2026 em destaque
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <ArenaMetric
                  label="Ao vivo"
                  value={liveChampionships.length}
                  accent
                  icon={<Flame className="h-5 w-5" />}
                />
                <ArenaMetric
                  label="Bolões ativos"
                  value={totalPools}
                  icon={<Trophy className="h-5 w-5" />}
                />
                <ArenaMetric
                  label="Próximo grande evento"
                  value="Copa 2026"
                  icon={<CalendarDays className="h-5 w-5" />}
                  className="sm:col-span-3 lg:col-span-1"
                />
              </div>
            </div>
          </ArenaPanel>
        </motion.div>

        <div className="mt-6 space-y-6">
          <div>
            <ArenaSectionHeader
              eyebrow={`⭐ ${t("sections.world_cup")}`}
              title="Evento principal"
              action={<div className="arena-badge"><Sparkles className="h-3.5 w-3.5" /> prioridade máxima</div>}
            />
            <div className="mt-3">
              <CopaHeroCard
                championship={copa}
                isSelected={current.id === copa.id}
                bolaoCount={bolaoCountsMap[copa.id] ?? 0}
                onSelect={() => handleSelect(copa)}
              />
            </div>
          </div>

          {liveChampionships.length > 0 ? (
            <div>
              <ArenaSectionHeader
                eyebrow="Em jogo"
                title="Ligas ao vivo"
                action={<div className="arena-badge bg-emerald-500/15 border-emerald-500/30 text-emerald-400">{liveChampionships.length} agora</div>}
              />
              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
                {liveChampionships.map((champ, i) => (
                  <ChampionshipCard
                    key={champ.id}
                    championship={champ}
                    isSelected={current.id === champ.id}
                    bolaoCount={bolaoCountsMap[champ.id] ?? 0}
                    onSelect={() => handleSelect(champ)}
                    index={i}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {upcomingChampionships.length > 0 ? (
            <div>
              <ArenaSectionHeader
                eyebrow="Na agenda"
                title="Em breve"
                action={<div className="arena-badge">{upcomingChampionships.length} abrindo</div>}
              />
              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
                {upcomingChampionships.map((champ, i) => (
                  <ChampionshipCard
                    key={champ.id}
                    championship={champ}
                    isSelected={current.id === champ.id}
                    bolaoCount={bolaoCountsMap[champ.id] ?? 0}
                    onSelect={() => handleSelect(champ)}
                    index={i + liveChampionships.length}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {finishedChampionships.length > 0 ? (
            <div>
              <ArenaSectionHeader
                eyebrow={t("sections.leagues")}
                title="Encerrados"
                action={<div className="arena-badge">{finishedChampionships.length} finalizados</div>}
              />
              <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
                {finishedChampionships.map((champ, i) => (
                  <ChampionshipCard
                    key={champ.id}
                    championship={champ}
                    isSelected={current.id === champ.id}
                    bolaoCount={bolaoCountsMap[champ.id] ?? 0}
                    onSelect={() => handleSelect(champ)}
                    index={i + liveChampionships.length + upcomingChampionships.length}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 px-2 text-center text-[11px] uppercase tracking-[0.18em] text-zinc-500"
        >
          {t("footer_tip")}
        </motion.p>
      </div>
    </div>
  );
}
