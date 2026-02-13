import { getTeam, formatMatchTime, getStadium, type Match } from "@/data/mockData";
import { StatusBadge } from "./StatusBadge";
import { Flag } from "./Flag";
import { cn } from "@/lib/utils";
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

  // Live match — hero card
  if (match.status === "live") {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        whileTap={{ scale: 0.98 }}
        className={cn("glass-card overflow-hidden border border-copa-green/30", className)}
      >
        {/* Live badge */}
        <div className="flex justify-center pt-3 pb-1">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[11px] font-black px-3 py-1 rounded-full bg-copa-live text-white uppercase tracking-wider"
          >
            Ao Vivo • {match.minute}'
          </motion.span>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-center gap-4 px-4 py-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 rounded-full bg-secondary/80 border-2 border-border/50 flex items-center justify-center overflow-hidden">
              <Flag code={home.code} size="xl" className="w-14 h-14" />
            </div>
            <span className="text-sm font-black">{home.code}</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black">{match.homeScore}</span>
              <span className="text-2xl font-bold text-muted-foreground">-</span>
              <span className="text-4xl font-black">{match.awayScore}</span>
            </div>
            {match.group && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                Grupo {match.group}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-16 h-16 rounded-full bg-secondary/80 border-2 border-border/50 flex items-center justify-center overflow-hidden">
              <Flag code={away.code} size="xl" className="w-14 h-14" />
            </div>
            <span className="text-sm font-black">{away.code}</span>
          </div>
        </div>

        {/* Seu palpite */}
        <div className="border-t border-border/30 px-4 py-3 flex items-center justify-between bg-secondary/30">
          <span className="text-xs text-muted-foreground">
            Seu palpite: <span className="font-black text-foreground ml-1">2 - 0</span>
          </span>
          <button className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-copa-green/20 text-copa-green-light border border-copa-green/30">
            Editar
          </button>
        </div>
      </motion.div>
    );
  }

  // Scheduled / finished — compact row style
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      whileTap={{ scale: 0.98 }}
      className={cn("glass-card p-4 flex items-center gap-3", className)}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
          <Flag code={home.code} size="md" className="w-8 h-8" />
        </div>
        <span className="text-sm font-black">{home.code}</span>
      </div>

      <div className="flex flex-col items-center shrink-0 min-w-[52px]">
        {match.status === "finished" ? (
          <span className="text-base font-black">{match.homeScore} - {match.awayScore}</span>
        ) : (
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-secondary border border-border/50 text-foreground">
            {formatMatchTime(match.date)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
        <span className="text-sm font-black">{away.code}</span>
        <div className="w-10 h-10 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
          <Flag code={away.code} size="md" className="w-8 h-8" />
        </div>
      </div>
    </motion.div>
  );
}
