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

function StatusPill({ status }: { status: ChampionshipStatus }) {
  const { t } = useTranslation("championships");

  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#78ff46]/35 bg-[#1a351a]/88 px-3 py-2 font-display text-[1.05rem] font-semibold uppercase tracking-[0.06em] text-white shadow-[0_0_18px_rgba(95,255,56,0.12)]">
        <Radio className="h-3.5 w-3.5 text-[#7dff48]" />
        {t("status.live")}
      </span>
    );
  }

  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffc54d]/35 bg-[#34250a]/88 px-3 py-2 font-display text-[1.05rem] font-semibold uppercase tracking-[0.06em] text-[#ffd35c] shadow-[0_0_18px_rgba(255,197,77,0.12)]">
        <Clock3 className="h-3.5 w-3.5" />
        {t("status.upcoming")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-2 font-display text-[1.05rem] font-semibold uppercase tracking-[0.06em] text-zinc-300">
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
}: {
  championship: Championship;
  bolaoCount: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation("championships");
  const [, to] = championship.gradient;

  return (
    <motion.button
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      onClick={onSelect}
      className={cn(
        "group relative w-full overflow-hidden rounded-[32px] border text-left transition-all duration-300",
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

      <div className="relative z-10 flex flex-col gap-5 p-5 md:grid md:grid-cols-[190px_minmax(0,1fr)] md:gap-6 md:p-6">
        <div className="relative flex min-h-[190px] items-end justify-center overflow-hidden rounded-[24px] border border-[#9acb3e]/22 bg-[radial-gradient(circle_at_50%_18%,rgba(255,197,77,0.2),transparent_30%),linear-gradient(180deg,rgba(255,197,77,0.08),rgba(0,0,0,0.04))] p-4">
          <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[#ffc54d]/35 bg-[#4d3a0d]/80 px-3 py-1.5 text-[#ffd35c]">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="font-display text-[1.05rem] font-semibold uppercase tracking-[0.05em]">{t("hero.special_event")}</span>
          </div>
          {championship.logoUrl ? (
            <img
              src={championship.logoUrl}
              alt={championship.name}
              className="h-[150px] w-auto object-contain drop-shadow-[0_18px_26px_rgba(255,197,77,0.3)]"
            />
          ) : (
            <span className="text-8xl">{championship.logo}</span>
          )}
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 border-t border-[#7dff48]/15 bg-black/28 px-4 py-3 text-[#8de65b]">
            <Trophy className="h-4 w-4" />
            <span className="font-sans text-sm font-semibold">{t("hero.pools_other", { count: bolaoCount })}</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="mb-3 flex items-start justify-between gap-4">
            <p className="pt-1 font-display text-[1.55rem] font-semibold uppercase tracking-[0.06em] text-[#89ec5f]">
              {championship.confederation} <span className="text-white/35">•</span> <span className="text-white/68">{championship.season}</span>
            </p>
            <div className="hidden items-center gap-1 text-[#7dff48] md:flex">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="font-sans text-[2.6rem] font-extrabold uppercase leading-[0.92] tracking-[-0.04em] text-white sm:text-[3.2rem]">
              COPA DO MUNDO
            </p>
            <p className="font-sans text-[2.6rem] font-extrabold uppercase leading-[0.92] tracking-[-0.04em] text-[#58d84f] sm:text-[3.2rem]">
              2026
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <StatusPill status={championship.status} />
          </div>

          <div className="mt-5 space-y-2 text-zinc-300">
            <div className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-[#8de65b]" />
              <span className="font-sans font-medium">{t("hero.date_range").split("·")[0].trim()}</span>
            </div>
            <div className="flex items-center gap-2 text-base text-zinc-400">
              <MapPin className="h-4 w-4 text-[#8de65b]" />
              <span className="font-sans font-medium">EUA, Canadá e México</span>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <span className="inline-flex items-center gap-2 rounded-[22px] border border-[#ffc54d]/45 px-5 py-3 font-display text-[1.65rem] font-semibold uppercase tracking-[0.04em] text-[#ffc54d] transition group-hover:border-[#ffe263] group-hover:text-[#ffe263]">
              {t("hero.enter")}
              <ChevronRight className="h-5 w-5" />
            </span>
          </div>
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
}: {
  championship: Championship;
  bolaoCount: number;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const { t } = useTranslation("championships");
  const display = getDisplayName(championship);
  const accent = championship.color;

  return (
    <motion.button
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.035, duration: 0.3, ease: "easeOut" }}
      onClick={onSelect}
      className={cn(
        "group relative min-h-[228px] overflow-hidden rounded-[28px] border text-left transition-all duration-300",
        isSelected
          ? "border-white/28 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_18px_44px_-24px_rgba(0,0,0,0.92)]"
          : "border-white/12 hover:border-white/22 hover:translate-y-[-1px]"
      )}
      style={{
        background: [
          "linear-gradient(180deg, rgba(255,255,255,0.04), transparent 28%)",
          "radial-gradient(circle at 15% 0%, rgba(255,255,255,0.04), transparent 28%)",
          `linear-gradient(135deg, ${championship.gradient[0]}, ${championship.gradient[1]})`,
        ].join(","),
        boxShadow: isSelected
          ? `0 0 0 1px ${accent}35 inset, 0 16px 34px -20px rgba(0,0,0,0.9)`
          : `0 14px 30px -22px rgba(0,0,0,0.92)`,
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_42%)]" />

      <div className="relative z-10 flex h-full flex-col p-4">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex h-[78px] w-[78px] items-center justify-center overflow-hidden rounded-[20px] bg-black/12">
            {championship.logoUrl ? (
              <img
                src={championship.logoUrl}
                alt={championship.name}
                className="h-[58px] w-[58px] object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.28)]"
              />
            ) : (
              <span className="text-5xl">{championship.logo}</span>
            )}
          </div>
          <StatusPill status={championship.status} />
        </div>

        <div className="min-w-0">
          <p className="font-display text-[1.25rem] font-semibold uppercase tracking-[0.06em] text-white/58">
            {(championship.confederation ?? championship.country ?? "").toUpperCase()} <span className="text-white/28">•</span> {championship.season}
          </p>
          <h2 className="mt-2 font-sans text-[2rem] font-extrabold leading-[0.95] tracking-[-0.04em] text-white">
            {display.title}
          </h2>
          {display.subtitle ? (
            <p className="mt-1 font-sans text-[1.05rem] font-semibold leading-none text-white/78">
              {display.subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between pt-6">
          <div className="flex items-center gap-2 text-[1.2rem] text-white/82">
            <Users className="h-4 w-4" />
            <span className="font-sans text-base font-medium">{getPoolLabel(bolaoCount, t)}</span>
          </div>
          <ChevronRight className="h-5 w-5 text-white/48 transition group-hover:translate-x-0.5 group-hover:text-white/78" />
        </div>
      </div>
    </motion.button>
  );
}

export default function Campeonatos() {
  const navigate = useNavigate();
  const { current, all, setChampionship } = useChampionship();
  const { user } = useAuth();
  const { t } = useTranslation("championships");

  const copa = all.find((championship) => championship.id === "wc2026")!;
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
          <p className="font-display text-[1.45rem] font-semibold uppercase tracking-[0.22em] text-primary">
            {t("header.kicker")}
          </p>
          <h1 className="mt-2 font-display text-[4rem] font-semibold uppercase leading-[0.84] tracking-[0.03em] text-white sm:text-[5rem]">
            {t("header.title")}
          </h1>
          <p className="mt-2 font-sans text-[1.3rem] font-medium text-zinc-300">
            Escolha seu campeonato
          </p>
        </motion.section>

        <FeaturedCompetitionCard
          championship={copa}
          bolaoCount={bolaoCountsMap[copa.id] ?? 0}
          isSelected={current.id === copa.id}
          onSelect={() => handleSelect(copa)}
        />

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {leagueCards.map((championship, index) => (
            <CompetitionTile
              key={championship.id}
              championship={championship}
              bolaoCount={bolaoCountsMap[championship.id] ?? 0}
              isSelected={current.id === championship.id}
              onSelect={() => handleSelect(championship)}
              index={index}
            />
          ))}
        </motion.section>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22 }}
          className="mt-6 text-center font-display text-[1rem] font-semibold uppercase tracking-[0.2em] text-zinc-500"
        >
          {t("footer_tip")}
        </motion.p>
      </div>
    </div>
  );
}
