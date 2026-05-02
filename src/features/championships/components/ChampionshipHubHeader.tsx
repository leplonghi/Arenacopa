import { motion } from "framer-motion";
import { ArrowLeft, Radio, Clock, Calendar, Users, TrendingUp, CalendarDays, Trophy } from "lucide-react";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";
import { cn } from "@/lib/utils";
import type { getChampionshipById } from "@/data/championships/definitions";

interface ChampionshipHubHeaderProps {
  championship: NonNullable<ReturnType<typeof getChampionshipById>>;
  onBack: () => void;
  onSetTab: (tab: any) => void;
  statusLabel: string;
  statusColor: string;
  formatLabel: string;
  countdownDays: number;
  timelineLabel: string;
}

export function ChampionshipHubHeader({
  championship,
  onBack,
  onSetTab,
  statusLabel,
  statusColor,
  formatLabel,
  countdownDays,
  timelineLabel,
}: ChampionshipHubHeaderProps) {
  const { color, gradient } = championship;
  const [from] = gradient;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <ArenaPanel tone="strong" className="overflow-hidden p-4 sm:p-5">
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            background: `radial-gradient(circle at 78% 24%, ${color}55, transparent 22%), linear-gradient(135deg, ${from}88, transparent 50%)`,
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="surface-card-soft flex h-9 w-9 items-center justify-center rounded-xl"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", statusColor)}>
              {championship.status === "live" && <Radio className="w-2.5 h-2.5 animate-pulse" />}
              {championship.status === "upcoming" && <Clock className="w-2.5 h-2.5" />}
              {statusLabel}
            </span>
            <div className="ml-auto hidden items-center gap-3 lg:flex">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span className="font-bold text-white">{championship.status === "upcoming" ? `${countdownDays}d` : timelineLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="font-bold text-white">{championship.maxTeams}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="font-bold text-white">{formatLabel}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-start gap-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
              {championship.logoUrl ? (
                <img src={championship.logoUrl} alt={championship.shortName} className="h-10 w-10 object-contain" />
              ) : (
                <span className="text-3xl">{championship.logo}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="arena-kicker" style={{ color }}>
                {championship.confederation ?? championship.country} · {championship.season}
              </p>
              <h1 className="mt-0.5 arena-title-xl">
                {championship.name}
              </h1>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-400">
                {championship.status === "upcoming"
                  ? "Tudo preparado para a abertura. Veja formato, calendário, notícias e crie seu bolão."
                  : "Acompanhe jogos, classificação, notícias e bolões deste campeonato."}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  onClick={() => onSetTab("jogos")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-primary transition hover:bg-primary/25"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Jogos
                </button>
                <button
                  onClick={() => onSetTab("boloes")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-amber-400 transition hover:bg-amber-500/25"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Bolões
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
            <span className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              <Calendar className="h-3 w-3" />
              {championship.status === "upcoming" ? `${countdownDays} dias` : timelineLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <Users className="h-3 w-3" />
              {championship.maxTeams} times
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <TrendingUp className="h-3 w-3" />
              {formatLabel}
            </span>
          </div>
        </div>
      </ArenaPanel>
    </motion.div>
  );
}
