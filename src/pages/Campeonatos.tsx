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

// ─── Status badge ────────────────────────────────────────────
function StatusBadge({ status }: { status: ChampionshipStatus }) {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
        <Radio className="w-2.5 h-2.5 animate-pulse" />
        Ao Vivo
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
        <Clock className="w-2.5 h-2.5" />
        Em Breve
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-2 py-0.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
      Encerrado
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
          ? "border-amber-400/60 shadow-[0_0_40px_rgba(251,191,36,0.2)]"
          : "border-amber-400/20 hover:border-amber-400/40 hover:shadow-[0_8px_40px_rgba(251,191,36,0.12)]"
      )}
      style={{
        background: "linear-gradient(135deg, #1a0a00ee, #3d1a00dd)",
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
            Evento Especial
          </span>
        </div>

        <div className="flex items-center gap-4 mb-4">
          {/* Logo */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            {championship.logoUrl ? (
              <img
                src={championship.logoUrl}
                alt={championship.shortName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (e.currentTarget.nextSibling as HTMLElement)?.removeAttribute("style");
                }}
              />
            ) : null}
            <span
              className="text-4xl"
              style={championship.logoUrl ? { display: "none" } : {}}
            >
              {championship.logo}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-amber-400/60 uppercase tracking-widest mb-0.5">
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
        <p className="text-xs text-amber-400/50 mb-3">
          11 Jun – 19 Jul 2026 · EUA, Canadá e México
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400/60" />
            <span className="text-xs text-white/50">
              {bolaoCount === 0
                ? "Nenhum bolão"
                : bolaoCount === 1
                ? "1 bolão ativo"
                : `${bolaoCount} bolões ativos`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400/15 border border-amber-400/25 px-3 py-1.5">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
              Entrar
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
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
  const [from, to] = championship.gradient;

  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.07, duration: 0.35, ease: "easeOut" }}
      onClick={onSelect}
      className={cn(
        "relative w-full text-left rounded-2xl overflow-hidden border transition-all duration-300",
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
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden"
            style={{ background: "rgba(0,0,0,0.25)" }}
          >
            {championship.logoUrl ? (
              <img
                src={championship.logoUrl}
                alt={championship.shortName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (e.currentTarget.nextSibling as HTMLElement)?.removeAttribute("style");
                }}
              />
            ) : null}
            <span
              className="text-2xl"
              style={championship.logoUrl ? { display: "none" } : {}}
            >
              {championship.logo}
            </span>
          </div>
          <StatusBadge status={championship.status} />
        </div>

        {/* Names */}
        <div className="mb-3">
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
              {bolaoCount === 0 ? "Sem bolões" : `${bolaoCount} bolão${bolaoCount > 1 ? "ões" : ""}`}
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
            ArenaCopa
          </p>
          <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none">
            Campeonatos
          </h1>
        </motion.div>
      </div>

      <div className="px-4 pt-5 space-y-6">
        {/* ── Copa do Mundo: hero card full-width ── */}
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/70">
            ⭐ Copa do Mundo
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
            Ligas & Torneios
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
        Toque para ver calendário, tabela e criar bolões.
      </motion.p>
    </div>
  );
}
