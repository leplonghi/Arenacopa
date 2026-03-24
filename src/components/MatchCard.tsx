import { getTeam, formatMatchTime, getStadium, type Match } from "@/data/mockData";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";
import { Flag } from "./Flag";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MatchCardProps {
  match: Match;
  prediction?: { homeScore: number; awayScore: number };
  compact?: boolean;
  variant?: "default" | "broadcast";
  className?: string;
  index?: number;
  onClick?: () => void;
}


const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
      mass: 1
    },
  }),
};

export function MatchCard({ match, prediction, compact = false, variant = "default", className, index = 0, onClick }: MatchCardProps) {
  const home = getTeam(match.homeTeam);
  const away = getTeam(match.awayTeam);
  const stadium = getStadium(match.stadium);
  const navigate = useNavigate();
  const { t } = useTranslation('copa');

  const handleTeamClick = (code: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/team/${code}`);
  };

  // BROADCAST VARIANT (Featured Hero)
  if (variant === "broadcast") {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl group cursor-pointer",
          className
        )}
        style={{ height: '320px' }}
      >
        {/* Split Background with Team Colors */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="w-1/2 h-full relative overflow-hidden">
            {/* Fallback colors needed if API fails, but MockData implies standard colors not in object yet? 
                 We will use a generic gradient if no hex is available, or infer from flag/UI? 
                 Actually mockData doesn't have hex colors. We'll use a blurred version of the flag or standard gradients. 
                 For now, standard dark gradients with subtle difference. */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-blue-900/40 mix-blend-overlay opacity-50" /> {/* Home tint placeholder */}
            {/* Giant Faded Flag Background */}
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-20 scale-150 blur-sm">
              <Flag code={home.code} size="xl" className="w-64 h-64" />
            </div>
          </div>
          <div className="w-1/2 h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-bl from-black/80 via-black/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-red-900/40 mix-blend-overlay opacity-50" /> {/* Away tint placeholder */}
            <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-20 scale-150 blur-sm">
              <Flag code={away.code} size="xl" className="w-64 h-64" />
            </div>
          </div>
        </div>

        {/* Content Layer */}
        <div className="absolute inset-0 z-20 flex flex-col justify-between p-6">
          {/* Top Bar: Stadium & Phase */}
          <div className="flex justify-between items-start text-[10px] font-black uppercase tracking-widest text-white/60 pointer-events-none">
            <span className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-copa-live animate-pulse" />
              {match.status === "live" ? t('match_card.live') : t('match_card.next_game')}
            </span>
            <span className="text-right">{stadium?.city} • {formatMatchTime(match.date)}</span>
          </div>

          {/* Center: VS & Score */}
          <div className="flex items-center justify-center gap-8 translate-y-2">
            <div
              className="flex flex-col items-center gap-3 cursor-pointer hover:scale-105 transition-transform"
              onClick={handleTeamClick(home.code)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <Flag code={home.code} size="xl" className="w-24 h-24 drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]" />
                {/* Reflection effect */}
                <div className="absolute -bottom-4 left-0 w-full h-4 bg-gradient-to-b from-white/10 to-transparent opacity-30 skew-x-12 blur-md" />
              </motion.div>
              <span className="text-3xl font-black text-white tracking-tighter drop-shadow-md">{home.code}</span>
            </div>

            <div className="flex flex-col items-center justify-center pt-2 group-hover:scale-105 transition-transform">
              {match.status !== "scheduled" ? (
                <div className="text-7xl font-black text-white leading-none tracking-tighter tabular-nums flex gap-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  <span>{match.homeScore}</span>
                  <span className="text-white/20">:</span>
                  <span>{match.awayScore}</span>
                </div>
              ) : (
                <span className="text-5xl font-black text-white/20 italic">VS</span>
              )}
              {match.minute && <span className="text-copa-live font-bold animate-pulse mt-2 text-sm">{match.minute}'</span>}
            </div>

            <div
              className="flex flex-col items-center gap-3 cursor-pointer hover:scale-105 transition-transform"
              onClick={handleTeamClick(away.code)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="relative"
              >
                <Flag code={away.code} size="xl" className="w-24 h-24 drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]" />
              </motion.div>
              <span className="text-3xl font-black text-white tracking-tighter drop-shadow-md">{away.code}</span>
            </div>
          </div>

          {/* Bottom Bar: CTA */}
          <div className="flex justify-center pointer-events-none">
            <button className="glass-button px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors pointer-events-auto">
              {t('match_card.details_cta')}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Live match — standard card (Keep existing logic but wrap in variant check implicit by else)
  if (match.status === "live") {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={index}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={cn(
          "glass-card-premium overflow-hidden border border-copa-gold/30 animate-glow-live",
          onClick && "cursor-pointer hover:bg-secondary/10 transition-colors",
          className
        )}
      >
        {/* Live badge */}
        <div className="flex justify-center pt-3 pb-1">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[11px] font-black px-3 py-1 rounded-full bg-copa-live text-white uppercase tracking-wider"
          >
            {t('match_card.live_badge')} • {match.minute}'
          </motion.span>
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-center gap-4 px-4 py-4">
          <div
            className="flex flex-col items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleTeamClick(home.code)}
          >
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
                {t('match_card.group', { group: match.group })}
              </span>
            )}
          </div>

          <div
            className="flex flex-col items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleTeamClick(away.code)}
          >
            <div className="w-16 h-16 rounded-full bg-secondary/80 border-2 border-border/50 flex items-center justify-center overflow-hidden">
              <Flag code={away.code} size="xl" className="w-14 h-14" />
            </div>
            <span className="text-sm font-black">{away.code}</span>
          </div>
        </div>

        {/* Seu palpite */}
        {prediction && (
          <div className="border-t border-border/30 px-4 py-3 flex items-center justify-between bg-secondary/30">
            <span className="text-xs text-muted-foreground">
              {t('match_card.my_prediction')} <span className="font-black text-foreground ml-1">{prediction.homeScore} - {prediction.awayScore}</span>
            </span>
            <button className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-copa-green/20 text-copa-green-light border border-copa-green/30">
              {t('match_card.edit')}
            </button>
          </div>
        )}
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
      onClick={onClick}
      className={cn(
        "glass-card p-4 flex items-center gap-3",
        onClick && "cursor-pointer hover:bg-secondary/40 transition-colors",
        className
      )}
    >
      <div
        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer hover:underline"
        onClick={handleTeamClick(home.code)}
      >
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

      <div
        className="flex items-center gap-2.5 flex-1 min-w-0 justify-end cursor-pointer hover:underline"
        onClick={handleTeamClick(away.code)}
      >
        <span className="text-sm font-black">{away.code}</span>
        <div className="w-10 h-10 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
          <Flag code={away.code} size="md" className="w-8 h-8" />
        </div>
      </div>
    </motion.div>
  );
}
