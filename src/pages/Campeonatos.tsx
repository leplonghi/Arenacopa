import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Trophy, Radio, Clock, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChampionship } from "@/contexts/ChampionshipContext";
import type { Championship, ChampionshipStatus } from "@/types/championship";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useTranslation } from "react-i18next";

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
              where("__name__", "in", chunk),
              where("status", "in", ["active", "open"])
            )
          );
          bolaoDocs.forEach((doc) => {
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

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#03100a]/80 backdrop-blur-xl border-b border-white/[0.08] px-4 pt-[calc(var(--safe-area-top,0px)+0.75rem)] pb-3">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            {t("header.kicker")}
          </p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none">
            {t("header.title")}
          </h1>
        </motion.div>
      </div>

      <div className="px-4 pt-5 space-y-6">
        {/* ── Copa do Mundo: hero card full-width ── */}
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/70">
            ⭐ {t("sections.world_cup")}
          </p>
          <CopaHeroCard
            championship={copa}
            isSelected={current.id === copa.id}
            bolaoCount={bolaoCountsMap[copa.id] ?? 0}
            onSelect={() => handleSelect(copa)}
          />
        </div>

        {/* ── Ligas & Torneios ── */}
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            {t("sections.leagues")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {leagues.map((champ, i) => (
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
      </div>

      {/* Footer tip */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 px-6 text-center text-[11px] text-zinc-600"
      >
        {t("footer_tip")}
      </motion.p>
    </div>
  );
}
