import { motion } from "framer-motion";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Radio,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChampionship } from "@/contexts/ChampionshipContext";
import type { Championship, ChampionshipStatus } from "@/types/championship";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useTranslation } from "react-i18next";
import { ArenaAssetSlot } from "@/components/arena/ArenaAssetSlot";
import { getArenaAssetSrc } from "@/lib/arena-assets";
import { useDashboardMatches } from "@/hooks/useDashboardMatches";
import type { MatchFeedItem } from "@/types/match-feed";
import { tStatic } from "@/i18n/staticText";

const COUNTRY_LABELS: Record<string, string> = {
  BR: "Brasil",
  DE: "Alemanha",
  ES: "Espanha",
  FR: "França",
  GB: "Inglaterra",
  SA: "Arábia Saudita",
  US: "EUA",
};

const DISPLAY_NAME_MAP: Record<string, { title: string; subtitle?: string }> = {
  brasileirao2026: { title: "Brasileirão" },
  libertadores2026: { title: "Libertadores" },
  premier2526: { title: "Premier League" },
  ligue12526: { title: "Ligue 1", subtitle: "(França)" },
  laliga2526: { title: "LaLiga", subtitle: "(Espanha)" },
  bundesliga2526: { title: "Bundesliga", subtitle: "(Alemanha)" },
  saudipro2526: { title: "Liga da Arábia" },
  ucl2526: { title: "Champions League" },
  mls2026: { title: "Major League Soccer" },
};

const CHAMPIONSHIP_ORDER = [
  "brasileirao2026",
  "libertadores2026",
  "premier2526",
  "ligue12526",
  "laliga2526",
  "bundesliga2526",
  "saudipro2526",
  "ucl2526",
  "mls2026",
];

const LEAGUE_ASSET_FILENAME_BY_ID: Record<string, string> = {
  brasileirao2026: "brasileirao-logo.png",
  libertadores2026: "libertadores-logo.png",
  premier2526: "premier-league-logo.png",
  ligue12526: "ligue1-logo.png",
  laliga2526: "laliga-logo.png",
  bundesliga2526: "bundesliga-logo.png",
  saudipro2526: "saudi-league-logo.png",
  ucl2526: "champions-league-logo.png",
};

/** Background colors for each championship card — matches the design reference */
const CHAMPIONSHIP_CARD_BG: Record<string, { from: string; to: string; border: string; accent: string }> = {
  brasileirao2026: { from: "#0a1f0a", to: "#0d3d0d", border: "#1a5c1a", accent: "#4ade80" },
  libertadores2026: { from: "#1a0505", to: "#3d0d0d", border: "#5c1a1a", accent: "#f87171" },
  premier2526:     { from: "#1a0a2e", to: "#2d0d4a", border: "#4a1a6e", accent: "#c084fc" },
  ligue12526:      { from: "#0a152e", to: "#0d244a", border: "#1a3a6e", accent: "#60a5fa" },
  laliga2526:      { from: "#2e0a0a", to: "#4a0d0d", border: "#6e1a1a", accent: "#fb923c" },
  bundesliga2526:  { from: "#2e1a0a", to: "#4a2d0d", border: "#6e4a1a", accent: "#fbbf24" },
  saudipro2526:    { from: "#0a1f0a", to: "#0d3d0d", border: "#1a5c1a", accent: "#34d399" },
  ucl2526:         { from: "#0a0a2e", to: "#0d0d4a", border: "#1a1a6e", accent: "#818cf8" },
  mls2026:         { from: "#0a1a2e", to: "#0d2d4a", border: "#1a4a6e", accent: "#22d3ee" },
};

function StatusPill({ status }: { status: ChampionshipStatus }) {
  const { t } = useTranslation("championships");

  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs font-medium tracking-[0.02em] text-white">
        <Radio className="h-3 w-3 text-green-400" />
        {t("status.live")}
      </span>
    );
  }

  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-950/40 px-3 py-1.5 text-xs font-medium tracking-[0.02em] text-amber-300">
        <Clock3 className="h-3 w-3" />
        {t("status.upcoming")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium tracking-[0.02em] text-zinc-400">
      {t("status.finished")}
    </span>
  );
}

function getPoolLabel(count: number, t: ReturnType<typeof useTranslation<"championships">>["t"]) {
  if (count === 0) return t("card.pools_zero");
  if (count === 1) return t("card.pools_one");
  return t("card.pools_other", { count });
}

function getDisplayName(championship: Championship) {
  return DISPLAY_NAME_MAP[championship.id] ?? {
    title: championship.name,
    subtitle: championship.country ? `(${COUNTRY_LABELS[championship.country] ?? championship.country})` : undefined,
  };
}

function FeaturedCompetitionCard({
  championship,
  bolaoCount,
  isSelected,
  onSelect,
  nextMatch,
}: {
  championship: Championship;
  bolaoCount: number;
  isSelected: boolean;
  onSelect: () => void;
  nextMatch?: MatchFeedItem | null;
}) {
  const { t } = useTranslation("championships");

  return (
    <motion.button
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      onClick={onSelect}
      className={cn(
        "group relative w-full overflow-hidden rounded-[24px] border text-left transition-all duration-300",
        isSelected
          ? "border-[#7dff48]/45 shadow-[0_0_0_1px_rgba(125,255,72,0.16)_inset,0_18px_44px_-18px_rgba(0,0,0,0.88)]"
          : "border-[#78ff46]/22 shadow-[0_16px_42px_-20px_rgba(0,0,0,0.88)] hover:border-[#7dff48]/34"
      )}
      style={{
        background: [
          "radial-gradient(circle at 80% 12%, rgba(125,255,72,0.12), transparent 20%)",
          "radial-gradient(circle at 12% 50%, rgba(255,197,77,0.16), transparent 26%)",
          "linear-gradient(135deg, rgba(5,26,10,0.98), rgba(6,52,18,0.94) 54%, rgba(3,18,7,0.98))",
        ].join(","),
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_40%)]" />
      <div className="absolute inset-y-0 left-[34%] hidden w-px bg-gradient-to-b from-transparent via-[#7dff48]/20 to-transparent md:block" />

      <div className="relative z-10 grid min-h-[180px] grid-cols-[minmax(0,1fr)_110px] gap-2 p-3.5 sm:grid-cols-[minmax(0,1fr)_150px] sm:gap-4 sm:p-4">
        <div className="flex min-w-0 flex-col">
          <div className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#ffc54d]/35 bg-[#4d3a0d]/80 px-2.5 py-1 text-[#ffd35c]">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-xs font-medium tracking-[0.02em]">{t("hero.special_event")}</span>
          </div>
          <div className="mb-1 flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-[#89ec5f] sm:text-[0.95rem]">
              {championship.confederation} <span className="text-white/35">•</span> <span className="text-white/68">{championship.season}</span>
            </p>
            <div className="hidden items-center gap-1 text-[#7dff48] md:flex">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="font-sans text-[1.4rem] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-white sm:text-[1.9rem]">
              COPA DO MUNDO
            </p>
            <p className="font-sans text-[1.4rem] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-[#58d84f] sm:text-[1.9rem]">
              2026
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusPill status={championship.status} />
          </div>

          <div className="mt-3 space-y-1 text-zinc-300">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-3.5 w-3.5 text-[#8de65b]" />
              <span className="font-sans font-medium">{t("hero.date_range").split("·")[0].trim()}</span>
            </div>
            {nextMatch ? (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Radio className={cn("h-3.5 w-3.5", nextMatch.status === "live" ? "animate-pulse text-green-400" : "text-[#8de65b]")} />
                <span className="font-sans font-medium">
                  {nextMatch.status === "live" ? "Ao vivo agora:" : "Próximo jogo:"} {nextMatch.homeTeamCode} × {nextMatch.awayTeamCode}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <MapPin className="h-3.5 w-3.5 text-[#8de65b]" />
                <span className="font-sans font-medium">{tStatic("EUA, Canadá e México")}</span>
              </div>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            <div className="flex min-w-0 items-center gap-2 text-[#8de65b]">
              <Trophy className="h-3.5 w-3.5" />
              <span className="truncate font-sans text-xs font-semibold">{t("hero.pools_other", { count: bolaoCount })}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#ffc54d]/45 px-2.5 py-1.5 text-sm font-medium text-[#ffc54d] transition group-hover:border-[#ffe263] group-hover:text-[#ffe263] sm:px-3 sm:text-[1rem]">
              {t("hero.enter")}
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div className="relative flex items-center justify-end overflow-visible">
          <div className="absolute inset-y-0 -right-6 w-[180px] bg-[radial-gradient(circle_at_50%_50%,rgba(255,197,77,0.32),transparent_54%)] blur-xl sm:-right-10 sm:w-[260px]" />
          <ArenaAssetSlot
            name="wc2026-trophy.png"
            label="Troféu Copa do Mundo 2026"
            src={getArenaAssetSrc("wc2026-trophy.png") ?? championship.logoUrl}
            variant="cutout"
            className="relative h-[280px] w-[200px] border-amber-300/20 bg-transparent shadow-none sm:h-[340px] sm:w-[240px]"
            imgClassName="p-0 object-contain drop-shadow-[0_40px_54px_rgba(255,197,77,0.55)] scale-110"
            fallbackClassName="scale-125"
          />
        </div>
      </div>
    </motion.button>
  );
}

function CompetitionTile({
  championship,
  bolaoCount,
  isSelected,
  onSelect,
  index,
  assetName,
  nextMatch,
}: {
  championship: Championship;
  bolaoCount: number;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  assetName?: string;
  nextMatch?: MatchFeedItem | null;
}) {
  const { t } = useTranslation("championships");
  const display = getDisplayName(championship);
  const assetSrc = assetName ? getArenaAssetSrc(assetName) : null;
  const logoSrc = assetSrc ?? championship.logoUrl ?? null;
  const bg = CHAMPIONSHIP_CARD_BG[championship.id] ?? {
    from: championship.gradient[0],
    to: championship.gradient[1],
    border: "rgba(255,255,255,0.12)",
    accent: championship.color,
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.035, duration: 0.3, ease: "easeOut" }}
      onClick={onSelect}
      className={cn(
        "group relative overflow-hidden rounded-[20px] border text-left transition-all duration-300",
        isSelected
          ? "shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_18px_44px_-24px_rgba(0,0,0,0.92)]"
          : "hover:translate-y-[-1px]"
      )}
      style={{
        background: `linear-gradient(135deg, ${bg.from}, ${bg.to})`,
        borderColor: isSelected ? `${bg.accent}55` : `${bg.border}88`,
        boxShadow: isSelected
          ? `0 0 0 1px ${bg.accent}35 inset, 0 16px 34px -20px rgba(0,0,0,0.9)`
          : `0 14px 30px -22px rgba(0,0,0,0.92)`,
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_42%)]" />

      <div className="relative z-10 grid min-h-[136px] grid-cols-[76px_minmax(0,1fr)_20px] items-center gap-3 p-3 sm:grid-cols-[88px_minmax(0,1fr)_20px] sm:gap-3.5 sm:p-3.5">
        <ArenaAssetSlot
          name={assetName ?? `${championship.id}-logo`}
          label={display.title}
          src={logoSrc}
          className="h-[76px] w-[76px] rounded-[18px] border-white/10 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.14),transparent_38%),linear-gradient(145deg,rgba(255,255,255,0.08),rgba(0,0,0,0.18))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_28px_-22px_rgba(0,0,0,0.9)] sm:h-[88px] sm:w-[88px]"
          imgClassName="p-2.5 object-contain drop-shadow-[0_12px_22px_rgba(0,0,0,0.65)]"
          fallbackClassName="scale-75"
        />

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="truncate text-[10px] font-medium text-white/40">
            {(championship.confederation ?? championship.country ?? "").toUpperCase()} <span className="text-white/20">•</span> {championship.season}
          </p>
          <h2 className="mt-1 font-sans text-[1rem] font-bold leading-tight text-white sm:text-[1.12rem]">
            {display.title}
          </h2>
          {display.subtitle ? (
            <p className="mt-0 font-sans text-[0.75rem] font-medium leading-[1.2] text-white/55">
              {display.subtitle}
            </p>
          ) : null}

          {nextMatch && (
            <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
              <div className="flex items-center gap-1 rounded-full bg-black/20 px-1.5 py-0.5 text-[0.65rem] font-bold text-white/70 shadow-inner">
                {nextMatch.status === "live" ? (
                  <Radio className="h-2.5 w-2.5 animate-pulse text-green-400" />
                ) : (
                  <CalendarDays className="h-2.5 w-2.5 text-white/40" />
                )}
                <span className="truncate">
                  {nextMatch.homeTeamCode} <span className="text-white/30">×</span> {nextMatch.awayTeamCode}
                </span>
              </div>
            </div>
          )}

          <div className="mt-1.5 flex items-center gap-1 text-white/50">
            <Users className="h-3 w-3 shrink-0" />
            <span className="truncate font-sans text-[0.75rem] font-medium">{getPoolLabel(bolaoCount, t)}</span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-white/50" />
      </div>
    </motion.button>
  );
}

export default function Campeonatos() {
  const navigate = useNavigate();
  const { current, all, setChampionship } = useChampionship();
  const { user } = useAuth();
  const { t } = useTranslation("championships");

  const copa = all.find((championship) => championship.id === "wc2026");
  const leagueCards = useMemo(() => {
    const others = all.filter((championship) => championship.id !== "wc2026");
    return [...others].sort((left, right) => {
      const leftOrder = CHAMPIONSHIP_ORDER.indexOf(left.id);
      const rightOrder = CHAMPIONSHIP_ORDER.indexOf(right.id);
      const normalizedLeft = leftOrder === -1 ? Number.MAX_SAFE_INTEGER : leftOrder;
      const normalizedRight = rightOrder === -1 ? Number.MAX_SAFE_INTEGER : rightOrder;
      return normalizedLeft - normalizedRight || left.name.localeCompare(right.name);
    });
  }, [all]);

  const { data: allMatches } = useDashboardMatches();

  const getNextMatch = (championshipId: string) => {
    return allMatches.find(
      (m) =>
        m.championshipId === championshipId &&
        (m.status === "live" || m.status === "scheduled")
    );
  };

  const { data: bolaoCountsMap = {} } = useQuery({
    queryKey: ["championship-bolao-counts", user?.id],
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      if (!user) return {};

      const membershipsRef = collection(db, "bolao_members");
      const snap = await getDocs(query(membershipsRef, where("user_id", "==", user.id)));
      const bolaoIds = snap.docs.map((document) => document.data().bolao_id as string);
      if (!bolaoIds.length) return {};

      const chunks: string[][] = [];
      for (let index = 0; index < bolaoIds.length; index += 30) {
        chunks.push(bolaoIds.slice(index, index + 30));
      }

      const counts: Record<string, number> = {};
      await Promise.all(
        chunks.map(async (chunk) => {
          const bolaoDocs = await getDocs(query(collection(db, "boloes"), where("__name__", "in", chunk)));
          bolaoDocs.forEach((document) => {
            const status = document.data().status;
            if (status !== "active" && status !== "open") return;

            const championshipId: string = document.data().championship_id ?? "wc2026";
            counts[championshipId] = (counts[championshipId] ?? 0) + 1;
          });
        }),
      );

      return counts;
    },
  });

  const handleSelect = (championship: Championship) => {
    setChampionship(championship.id);
    navigate(championship.id === "wc2026" ? "/copa" : `/campeonato/${championship.id}`);
  };

  return (
    <div className="arena-screen pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[360px] bg-[radial-gradient(circle_at_50%_-10%,rgba(120,255,70,0.18),transparent_46%),radial-gradient(circle_at_85%_10%,rgba(255,197,77,0.12),transparent_30%)]" />

      <div className="relative z-10">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mb-5"
        >
          <p className="font-display text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            {t("header.kicker")}
          </p>
          <h1 className="mt-0.5 font-display text-[2.4rem] font-semibold uppercase leading-[0.9] tracking-[0.03em] text-white sm:text-[3.2rem]">
            {t("header.title")}
          </h1>
          <p className="mt-1 font-sans text-sm font-medium text-zinc-400">
            Escolha seu campeonato
          </p>
        </motion.section>

        {copa && (
          <FeaturedCompetitionCard
            championship={copa}
            bolaoCount={bolaoCountsMap[copa.id] ?? 0}
            isSelected={current.id === copa.id}
            onSelect={() => handleSelect(copa)}
            nextMatch={getNextMatch(copa.id)}
          />
        )}

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
        >
          {leagueCards.map((championship, index) => (
            <CompetitionTile
              key={championship.id}
              championship={championship}
              bolaoCount={bolaoCountsMap[championship.id] ?? 0}
              isSelected={current.id === championship.id}
              onSelect={() => handleSelect(championship)}
              index={index}
              assetName={LEAGUE_ASSET_FILENAME_BY_ID[championship.id]}
              nextMatch={getNextMatch(championship.id)}
            />
          ))}
        </motion.section>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
          className="mt-6 text-center font-display text-[0.9rem] font-semibold uppercase tracking-[0.2em] text-zinc-600"
        >
          {t("footer_tip")}
        </motion.p>
      </div>
    </div>
  );
}
