import { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Flag } from "@/components/Flag";
import { useNavigate } from "react-router-dom";
import { getTeam } from "@/data/mockData";
import { Trophy, HelpCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  type KnockoutData, type KnockoutMatchFull, type KnockoutRound,
  ROUND_LABELS, getMatchWinner,
} from "@/utils/knockoutBracket";

// ─── Animations & 3D Config ───
const cardSpring = {
  type: "spring" as const,
  stiffness: 120,
  damping: 18,
  mass: 0.8,
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const staggerCard = {
  hidden: { opacity: 0, y: 30, scale: 0.9, rotateX: -15 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: cardSpring,
  },
};

// ─── Team row inside a match card ───
function BracketTeamRow({
  code,
  isWinner,
  score,
  position,
}: {
  code: string | null;
  isWinner: boolean;
  score: number | null;
  position: "top" | "bottom";
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('copa');

  if (!code) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2.5 min-w-0 bg-black/20",
        position === "top" ? "rounded-t-[6px]" : "rounded-b-[6px]",
      )}>
        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          <HelpCircle className="w-3.5 h-3.5 text-white/20" />
        </div>
        <span className="text-[11px] text-white/20 font-medium tracking-wide">{t('bracket.tbd')}</span>
        <span className="ml-auto text-[11px] text-white/15 font-mono font-bold">–</span>
      </div>
    );
  }

  const team = getTeam(code);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 min-w-0 transition-all duration-300 cursor-pointer group/team relative",
        position === "top" ? "rounded-t-[6px]" : "rounded-b-[6px]",
        isWinner
          ? "bg-gradient-to-r from-[hsl(145_40%_25%/0.4)] to-transparent"
          : "hover:bg-white/[0.04]"
      )}
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/team/${team.code}`);
      }}
    >
      {/* Winner glow indicator */}
      {isWinner && (
        <motion.div
          layoutId={`winner-glow-${code}`}
          className={cn(
            "absolute left-0 w-[3px] bg-gradient-to-b from-[hsl(var(--copa-gold))] to-[hsl(var(--copa-green-light))]",
            position === "top" ? "top-0 bottom-0 rounded-tl-[6px]" : "top-0 bottom-0 rounded-bl-[6px]"
          )}
        />
      )}

      <Flag code={team.code} size="sm" className={cn(
        "w-6 h-6 shrink-0 transition-transform duration-300",
        isWinner ? "grayscale-0 scale-105" : "grayscale-[0.3] group-hover/team:grayscale-0 group-hover/team:scale-110"
      )} />

      <span className={cn(
        "text-[11px] font-bold truncate transition-colors duration-300",
        isWinner
          ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
          : "text-white/50 group-hover/team:text-white/80"
      )}>
        {team.code}
      </span>

      <div className="ml-auto flex items-center justify-end min-w-[20px]">
        <span className={cn(
          "text-sm font-black font-mono shrink-0 tabular-nums text-center transition-all duration-300",
          isWinner
            ? "text-[hsl(var(--copa-gold))] drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] scale-110"
            : "text-white/30"
        )}>
          {score !== null ? score : "–"}
        </span>
      </div>
    </div>
  );
}

// ─── 3D Match Match Card ───
function MatchCard({
  match,
  compact,
  onClick,
  delay = 0,
}: {
  match: KnockoutMatchFull;
  compact?: boolean;
  onClick?: () => void;
  delay?: number;
}) {
  const winner = getMatchWinner(match);
  const isClickable = !!(onClick && match.home && match.away);
  const isDecided = !!winner;

  // Mouse hover 'shine' effect
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);
  };

  const shineBackground = useTransform(
    [x, y],
    ([latestX, latestY]) => `radial-gradient(circle at ${latestX}px ${latestY}px, rgba(255,255,255,0.1) 0%, transparent 60%)`
  );

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      variants={staggerCard}
      className={cn(
        "relative overflow-hidden transition-all duration-300 group/card",
        compact ? "w-[160px]" : "w-[180px]",
        "rounded-[8px]",
        // Glassmorphism base
        "backdrop-blur-xl bg-white/[0.03]",
        "border border-white/[0.08]",
        isDecided
          // Completed match glow
          ? "shadow-[0_4px_30px_-8px_rgba(0,0,0,0.5)] border-[hsl(var(--copa-green-light)/0.2)]"
          : "",
        isClickable && "cursor-pointer"
      )}
      style={{
        transformStyle: "preserve-3d",
      }}
      whileHover={isClickable ? {
        scale: 1.05,
        z: 30, // Lift up towards user
        boxShadow: "0 20px 40px -10px rgba(0,0,0,0.6), 0 0 20px rgba(74, 222, 128, 0.1)"
      } : undefined}
      whileTap={isClickable ? { scale: 0.98, z: 10 } : undefined}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Dynamic gradient background */}
      <div className={cn(
        "absolute inset-0 opacity-80",
        "bg-gradient-to-b from-[#0a1f14] to-[#050f0a]",
        isDecided && "to-[#0c2e1d]"
      )} />

      {/* Shine effect on hover */}
      {isClickable && (
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"
          style={{
            background: shineBackground
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-[1px] bg-black/10 p-[2px]">
        <BracketTeamRow
          code={match.home}
          isWinner={winner === match.home}
          score={match.score.homeScore}
          position="top"
        />

        {/* Divider with status */}
        <div className="relative h-[2px] bg-black/40 flex items-center justify-center">
          {/* Glowing line for decided matches */}
          {isDecided && (
            <div className="absolute inset-x-0 h-full bg-gradient-to-r from-transparent via-[hsl(var(--copa-green-light)/0.5)] to-transparent shadow-[0_0_10px_hsl(var(--copa-green-light)/0.5)]" />
          )}
        </div>

        <BracketTeamRow
          code={match.away}
          isWinner={winner === match.away}
          score={match.score.awayScore}
          position="bottom"
        />
      </div>

      {/* Penalty / Status Badge */}
      {match.score.homePenalty !== null && match.score.awayPenalty !== null && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-[hsl(var(--copa-gold)/0.3)] shadow-lg z-20">
          <span className="text-[8px] font-black text-[hsl(var(--copa-gold))] whitespace-nowrap tracking-wider">
            PEN {match.score.homePenalty}-{match.score.awayPenalty}
          </span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Glowing SVG Connector ───
function Connector({ matchCount, compact }: { matchCount: number; compact?: boolean }) {
  const matchHeight = compact ? 72 : 76; // Adjusted including margins
  const gap = 12;
  const connectorWidth = 32;

  // We need distinct gradient IDs for each connector to avoid conflicts if needed, 
  // but using one shared def is fine for performance if they look the same.
  // We'll put the defs in a single shared SVG or repeated here. 
  // Repeated here ensures self-containment for this component.

  return (
    <div className="flex flex-col justify-around shrink-0 relative z-0" style={{ width: connectorWidth }}>
      {Array.from({ length: matchCount / 2 }).map((_, i) => {
        const pairHeight = matchHeight * 2 + gap;
        const midTop = matchHeight / 2;
        const midBottom = matchHeight + gap + matchHeight / 2;
        const center = pairHeight / 2;
        const uniqueId = `conn-${matchCount}-${i}-${Math.random().toString(36).substr(2, 9)}`;

        return (
          <svg
            key={i}
            width={connectorWidth}
            height={pairHeight}
            className="shrink-0 drop-shadow-[0_0_6px_rgba(74,222,128,0.2)]"
            style={{ marginBottom: i < matchCount / 2 - 1 ? gap : 0 }}
          >
            <defs>
              <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path
              d={`
                M 0 ${midTop} 
                L ${connectorWidth * 0.4} ${midTop}
                Q ${connectorWidth * 0.6} ${midTop} ${connectorWidth * 0.6} ${(midTop + center) / 2}
                L ${connectorWidth * 0.6} ${(midBottom + center) / 2}
                Q ${connectorWidth * 0.6} ${midBottom} ${connectorWidth * 0.4} ${midBottom}
                L 0 ${midBottom}
                
                M ${connectorWidth * 0.6} ${center}
                L ${connectorWidth} ${center}
              `}
              fill="none"
              stroke={`url(#${uniqueId})`}
              strokeWidth="2"
              strokeLinecap="round"
              className="opacity-40"
            />

            {/* Connection Node */}
            <circle cx={connectorWidth * 0.6} cy={center} r="3" fill="#10b981" className="opacity-80 shadow-[0_0_10px_#10b981]" />
          </svg>
        );
      })}
    </div>
  );
}

// ─── Round Column ───
function RoundColumn({
  label,
  matches,
  compact,
  onMatchClick,
}: {
  label: string;
  matches: KnockoutMatchFull[];
  compact?: boolean;
  onMatchClick?: (matchIdx: number, match: KnockoutMatchFull) => void;
}) {
  return (
    <motion.div
      className="flex flex-col shrink-0"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* 3D Title Label */}
      <div className="relative text-center mb-6 h-8 flex items-center justify-center translate-z-[20px]">
        <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative z-10 bg-[#050f0a] border border-[hsl(var(--copa-gold)/0.3)] px-4 py-1 rounded-full shadow-[0_0_15px_-5px_hsl(var(--copa-gold)/0.3)]">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[hsl(var(--copa-gold))]">
            {label}
          </span>
        </div>
      </div>

      {/* Match cards */}
      <div className="flex flex-col justify-around flex-1 gap-3">
        {matches.map((m, i) => (
          <MatchCard
            key={i}
            match={m}
            compact={compact}
            onClick={onMatchClick ? () => onMatchClick(i, m) : undefined}
            delay={i * 0.06}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Champion 3D Spotlight ───
function ChampionBanner({ data }: { data: KnockoutData }) {
  const { t } = useTranslation('copa');
  const navigate = useNavigate();
  const champion = getMatchWinner(data.final[0]);

  // Floating animation
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-10, 10], [5, -5]);

  if (!champion) return null;
  const champTeam = getTeam(champion);

  return (
    <div className="perspective-[1000px] flex justify-center py-8">
      <motion.div
        initial={{ opacity: 0, rotateX: 45, y: 50 }}
        animate={{ opacity: 1, rotateX: 0, y: 0 }}
        transition={{ type: "spring", bounce: 0.4 }}
        style={{ rotateX }}
        className={cn(
          "relative rounded-2xl p-0.5 cursor-pointer group",
          "bg-gradient-to-br from-[hsl(var(--copa-gold))] via-[#f59e0b] to-transparent",
          "shadow-[0_20px_50px_-12px_rgba(234,179,8,0.3)]"
        )}
        onClick={() => navigate(`/team/${champTeam.code}`)}
      >
        <div className="relative rounded-[14px] bg-black/90 backdrop-blur-2xl p-8 overflow-hidden">
          {/* Internal Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-[hsl(var(--copa-gold))] shadow-[0_0_30px_5px_hsl(var(--copa-gold))]" />

          <div className="relative z-10 flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 text-[hsl(var(--copa-gold))] mb-2">
              <Trophy className="w-6 h-6 animate-pulse" />
              <span className="text-xs font-black tracking-[0.3em] uppercase">{t('bracket.champion_label')}</span>
              <Trophy className="w-6 h-6 animate-pulse" />
            </div>

            <div className="flex items-center gap-6">
              <Flag code={champTeam.code} size="xl" className="shadow-2xl shadow-black/50" />
              <div>
                <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-[hsl(var(--copa-gold))] to-white drop-shadow-sm">
                  {champTeam.name}
                </h1>
                <p className="text-white/40 text-sm font-mono mt-1 tracking-widest">{t('bracket.champion_sub')}</p>
              </div>
            </div>
          </div>

          {/* Confetti Particles Effect (Simulated) */}
          <div className="absolute inset-0 z-0 opacity-30 mix-blend-screen bg-[url('/noise.svg')] pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
}

// ─── Parallax Container ───
function useParallaxTilt() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-300, 300], [5, -5]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-300, 300], [-5, 5]), { stiffness: 100, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    x.set(e.clientX - cx);
    y.set(e.clientY - cy);
  };

  return { handleMouseMove, rotateX, rotateY };
}

// ─── Mobile Helpers ───
// Placed before main export to avoid undefined issues if hoisting acts up (though function declarations hoist)

function MobileTeamSide({ code, isWinner, side }: { code: string | null; isWinner: boolean; side: "left" | "right" }) {
  const { t } = useTranslation('copa');
  if (!code) {
    return (
      <div className={cn("flex flex-1 items-center gap-2", side === "right" && "flex-row-reverse")}>
        <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
        <span className="text-xs text-white/30 font-medium">{t('bracket.tbd')}</span>
      </div>
    )
  }
  const team = getTeam(code);
  return (
    <div className={cn("flex flex-1 items-center gap-3 min-w-0", side === "right" && "flex-row-reverse")}>
      <Flag code={team.code} size="md" className={cn("shadow-lg rounded-full", isWinner ? "ring-2 ring-[hsl(var(--copa-gold))]" : "")} />
      <div className={cn("flex flex-col min-w-0", side === "right" && "items-end")}>
        <span className={cn("text-xs font-black truncate leading-tight", isWinner ? "text-[hsl(var(--copa-gold))]" : "text-white/80")}>{team.code}</span>
      </div>
    </div>
  )
}

function MobileMatchCard({
  match,
  onClick,
}: {
  match: KnockoutMatchFull;
  onClick?: () => void;
}) {
  // const navigate = useNavigate(); // Removed unused
  const winner = getMatchWinner(match);
  const isClickable = !!(onClick && match.home && match.away);
  const isDecided = !!winner;

  return (
    <motion.div
      initial={{ rotateX: -20, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all duration-300",
        isDecided
          ? "bg-gradient-to-br from-[#0a291b] to-[#050f0a] border-[hsl(var(--copa-green-light)/0.3)] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.5)]"
          : "bg-white/5 border-white/10",
        isClickable && "active:scale-95"
      )}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="flex items-center p-4 gap-3">
        <MobileTeamSide code={match.home} isWinner={winner === match.home} side="left" />

        <div className="flex flex-col items-center shrink-0 min-w-[50px]">
          <div className="font-mono text-xl font-black text-white/90 tabular-nums tracking-widest bg-black/20 px-3 py-1 rounded-lg border border-white/5">
            {match.score.homeScore ?? "-"}
            <span className="text-white/20 mx-1">:</span>
            {match.score.awayScore ?? "-"}
          </div>
          {match.score.homePenalty !== null && (
            <span className="text-[9px] font-bold text-[hsl(var(--copa-gold))] mt-1">
              ({match.score.homePenalty}-{match.score.awayPenalty})
            </span>
          )}
        </div>

        <MobileTeamSide code={match.away} isWinner={winner === match.away} side="right" />
      </div>
    </motion.div>
  );
}

function MobileRoundView({
  matches,
  roundKey,
  onMatchClick,
}: {
  matches: KnockoutMatchFull[];
  roundKey: KnockoutRound;
  onMatchClick?: (matchIdx: number, match: KnockoutMatchFull) => void;
}) {
  return (
    <motion.div
      key={roundKey}
      initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="grid grid-cols-1 gap-3 perspective-[800px]"
    >
      {matches.map((m, i) => (
        <MobileMatchCard
          key={i}
          match={m}
          onClick={onMatchClick ? () => onMatchClick(i, m) : undefined}
        />
      ))}
    </motion.div>
  );
}

function MobileRoundNav({
  rounds,
  activeRound,
  onSelect,
}: {
  rounds: { key: KnockoutRound; label: string; count: number }[];
  activeRound: number;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 px-2 mask-linear-gradient">
      {rounds.map((r, i) => (
        <button
          key={r.key}
          onClick={() => onSelect(i)}
          className={cn(
            "shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border backdrop-blur-md",
            i === activeRound
              ? "bg-[hsl(var(--copa-gold)/0.15)] text-[hsl(var(--copa-gold))] border-[hsl(var(--copa-gold)/0.4)] shadow-[0_0_15px_-3px_hsl(var(--copa-gold)/0.2)]"
              : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main View Export ───
export function BracketView({
  data,
  onMatchClick,
}: {
  data: KnockoutData;
  onMatchClick?: (round: KnockoutRound, matchIdx: number, match: KnockoutMatchFull) => void;
}) {
  const { t } = useTranslation('copa');
  const ROUND_KEYS: KnockoutRound[] = ["r32", "r16", "quarter", "semi", "final"];
  const [mobileRound, setMobileRound] = useState(0);
  const { handleMouseMove, rotateX, rotateY } = useParallaxTilt();

  const rounds = useMemo(() => [
    { key: "r32" as KnockoutRound, label: t('bracket.rounds.r32'), matches: data.r32 },
    { key: "r16" as KnockoutRound, label: t('bracket.rounds.r16'), matches: data.r16 },
    { key: "quarter" as KnockoutRound, label: t('bracket.rounds.quarter'), matches: data.quarter },
    { key: "semi" as KnockoutRound, label: t('bracket.rounds.semi'), matches: data.semi },
    { key: "final" as KnockoutRound, label: t('bracket.rounds.final'), matches: data.final },
  ], [data, t]);

  const mobileRoundsWithThird = useMemo(() => {
    const base = [...rounds];
    if (data.third[0] && (data.third[0].home || data.third[0].away)) {
      base.push({ key: "third" as KnockoutRound, label: t('bracket.rounds.third'), matches: data.third });
    }
    return base;
  }, [rounds, data.third, t]);

  return (
    <div className="space-y-4" onMouseMove={handleMouseMove}>
      <ChampionBanner data={data} />

      {/* ─── Desktop 3D Bracket ─── */}
      <div className="hidden md:flex justify-center perspective-[1200px] overflow-hidden py-10 my-4">
        <motion.div
          className="flex items-stretch gap-0 origin-center transform-3d"
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d"
          }}
        >
          {rounds.map((round, rIdx) => (
            <div key={rIdx} className="flex items-stretch relative z-10" style={{ transformStyle: "preserve-3d", transform: `translateZ(${rIdx * 10}px)` }}>
              <RoundColumn
                label={round.label}
                matches={round.matches}
                compact={rIdx === 0}
                onMatchClick={
                  onMatchClick
                    ? (idx, m) => onMatchClick(ROUND_KEYS[rIdx], idx, m)
                    : undefined
                }
              />
              {rIdx < rounds.length - 1 && (
                <Connector matchCount={round.matches.length} compact={rIdx === 0} />
              )}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Desktop 3rd place */}
      <div className="hidden md:block">
        {data.third[0] && (data.third[0].home || data.third[0].away) && (
          <div className="space-y-2 mt-4 max-w-md mx-auto relative perspective-[800px]">
            <motion.div
              className="transform-3d"
              style={{ rotateX: rotateX }}
            >
              <div className="relative text-center mb-4">
                <span className="inline-block px-3 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/50 bg-[hsl(var(--copa-green-dark))] rounded-full border border-white/10">
                  {t('bracket.rounds.third')}
                </span>
              </div>
              <div className="flex justify-center">
                <MatchCard
                  match={data.third[0]}
                  onClick={onMatchClick ? () => onMatchClick("third", 0, data.third[0]) : undefined}
                />
              </div>
            </motion.div>
          </div>
        )}
      </div>


      {/* ─── Mobile View (Simplified but Styled) ─── */}
      <div className="md:hidden space-y-4 px-2">
        <MobileRoundNav
          rounds={mobileRoundsWithThird.map(r => ({ key: r.key, label: r.label, count: r.matches.length }))}
          activeRound={mobileRound}
          onSelect={setMobileRound}
        />

        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => setMobileRound(prev => Math.max(0, prev - 1))}
            disabled={mobileRound === 0}
            className="p-2 rounded-full border border-white/10 active:scale-95 transition-transform disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <h3 className="text-sm font-black uppercase tracking-widest text-[hsl(var(--copa-gold))] drop-shadow-md">
            {mobileRoundsWithThird[mobileRound]?.label}
          </h3>

          <button
            onClick={() => setMobileRound(prev => Math.min(mobileRoundsWithThird.length - 1, prev + 1))}
            disabled={mobileRound === mobileRoundsWithThird.length - 1}
            className="p-2 rounded-full border border-white/10 active:scale-95 transition-transform disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        <AnimatePresence mode="popLayout" custom={mobileRound}>
          {mobileRoundsWithThird[mobileRound] && (
            <MobileRoundView
              matches={mobileRoundsWithThird[mobileRound].matches}
              roundKey={mobileRoundsWithThird[mobileRound].key}
              onMatchClick={
                onMatchClick
                  ? (idx, m) => onMatchClick(mobileRoundsWithThird[mobileRound].key, idx, m)
                  : undefined
              }
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
