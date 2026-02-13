import { getTeam, formatMatchTime, getStadium, type Match } from "@/data/mockData";
import { StatusBadge } from "./StatusBadge";
import { Flag } from "./Flag";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface MatchCardProps {
  match: Match;
  compact?: boolean;
  className?: string;
  index?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export function MatchCard({ match, compact = false, className, index = 0 }: MatchCardProps) {
  const home = getTeam(match.homeTeam);
  const away = getTeam(match.awayTeam);
  const stadium = getStadium(match.stadium);

  if (compact) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        whileTap={{ scale: 0.98 }}
        className={cn("glass-card p-3 flex items-center gap-3", className)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Flag code={home.code} size="sm" />
          <span className="text-xs font-bold truncate">{home.name}</span>
        </div>
        <div className="flex flex-col items-center shrink-0">
          {match.status === "finished" || match.status === "live" ? (
            <span className="text-sm font-black">{match.homeScore} - {match.awayScore}</span>
          ) : (
            <span className="text-xs font-bold text-muted-foreground">{formatMatchTime(match.date)}</span>
          )}
          <StatusBadge status={match.status} minute={match.minute} />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-xs font-bold truncate">{away.name}</span>
          <Flag code={away.code} size="sm" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "glass-card p-4 border-l-2",
        match.status === "live" ? "border-l-copa-live" : "border-l-copa-green",
        className
      )}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <StatusBadge status={match.status} minute={match.minute} />
          <span>• {match.group ? `Grupo ${match.group}` : match.phase}</span>
        </div>
        {match.status === "live" && match.minute && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary"
          >
            {match.minute}' 1º Tempo
          </motion.span>
        )}
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <Flag code={home.code} size="lg" className="border border-border/50" />
          <span className="text-xs font-black">{home.name}</span>
        </div>

        <div className="flex flex-col items-center px-3">
          {match.status === "finished" || match.status === "live" ? (
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black">{match.homeScore}</span>
              <span className="text-muted-foreground text-lg font-bold">:</span>
              <span className="text-3xl font-black">{match.awayScore}</span>
            </div>
          ) : (
            <>
              <span className="text-2xl font-black">{formatMatchTime(match.date)}</span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Horário Local</span>
            </>
          )}
          {match.group && (
            <span className="text-[10px] text-muted-foreground mt-1">Grupo {match.group}</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1">
          <Flag code={away.code} size="lg" className="border border-border/50" />
          <span className="text-xs font-black">{away.name}</span>
        </div>
      </div>

      {/* Stadium */}
      {stadium && (
        <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-center gap-1.5">
          <MapPin className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{stadium.name}</span>
        </div>
      )}
    </motion.div>
  );
}
