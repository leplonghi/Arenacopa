import { cn } from "@/lib/utils";
import { Flag } from "@/components/Flag";
import { getTeam } from "@/data/mockData";
import { Trophy, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  type KnockoutData, type KnockoutMatchFull,
  ROUND_LABELS, getMatchWinner,
} from "@/utils/knockoutBracket";

// ─── Mini team cell for the bracket ───
function BracketTeam({
  code,
  isWinner,
  score,
}: {
  code: string | null;
  isWinner: boolean;
  score: number | null;
}) {
  if (!code) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 min-w-0">
        <div className="w-5 h-5 rounded-full bg-secondary/60 border border-border/30 flex items-center justify-center shrink-0">
          <HelpCircle className="w-3 h-3 text-muted-foreground/40" />
        </div>
        <span className="text-[10px] text-muted-foreground/40 truncate">TBD</span>
        <span className="ml-auto text-[10px] text-muted-foreground/30 font-mono">–</span>
      </div>
    );
  }

  const team = getTeam(code);
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1.5 min-w-0 transition-colors",
      isWinner && "bg-copa-green/10"
    )}>
      <Flag code={team.code} size="sm" className="w-5 h-5 shrink-0" />
      <span className={cn(
        "text-[10px] font-bold truncate",
        isWinner ? "text-foreground" : "text-muted-foreground"
      )}>
        {team.name}
      </span>
      <span className={cn(
        "ml-auto text-xs font-black font-mono shrink-0",
        isWinner ? "text-foreground" : "text-muted-foreground/60"
      )}>
        {score !== null ? score : "–"}
      </span>
    </div>
  );
}

// ─── Single bracket match card ───
function BracketMatch({ match, compact }: { match: KnockoutMatchFull; compact?: boolean }) {
  const winner = getMatchWinner(match);

  return (
    <div className={cn(
      "rounded-lg border border-border/40 bg-card/80 overflow-hidden backdrop-blur-sm",
      compact ? "w-[140px]" : "w-[160px]",
      winner && "ring-1 ring-copa-green/30"
    )}>
      <BracketTeam
        code={match.home}
        isWinner={winner === match.home}
        score={match.score.homeScore}
      />
      <div className="border-t border-border/20" />
      <BracketTeam
        code={match.away}
        isWinner={winner === match.away}
        score={match.score.awayScore}
      />
      {/* Penalty indicator */}
      {match.score.homePenalty !== null && match.score.awayPenalty !== null && (
        <div className="border-t border-border/20 px-2 py-0.5 text-center">
          <span className="text-[8px] font-bold text-muted-foreground">
            PEN {match.score.homePenalty}-{match.score.awayPenalty}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Connector lines between rounds ───
function Connector({ matchCount, compact }: { matchCount: number; compact?: boolean }) {
  const matchHeight = compact ? 56 : 60; // approx height of a match card
  const gap = 8;

  return (
    <div className="flex flex-col justify-around shrink-0" style={{ width: 20 }}>
      {Array.from({ length: matchCount / 2 }).map((_, i) => {
        const pairHeight = matchHeight * 2 + gap;
        return (
          <svg
            key={i}
            width={20}
            height={pairHeight}
            className="shrink-0"
            style={{ marginBottom: i < matchCount / 2 - 1 ? gap : 0 }}
          >
            {/* Top match → merge point */}
            <line
              x1={0} y1={matchHeight / 2}
              x2={10} y2={matchHeight / 2}
              stroke="hsl(var(--border))" strokeWidth={1.5}
            />
            {/* Bottom match → merge point */}
            <line
              x1={0} y1={matchHeight + gap + matchHeight / 2}
              x2={10} y2={matchHeight + gap + matchHeight / 2}
              stroke="hsl(var(--border))" strokeWidth={1.5}
            />
            {/* Vertical connecting line */}
            <line
              x1={10} y1={matchHeight / 2}
              x2={10} y2={matchHeight + gap + matchHeight / 2}
              stroke="hsl(var(--border))" strokeWidth={1.5}
            />
            {/* Merge → next round */}
            <line
              x1={10} y1={pairHeight / 2}
              x2={20} y2={pairHeight / 2}
              stroke="hsl(var(--border))" strokeWidth={1.5}
            />
          </svg>
        );
      })}
    </div>
  );
}

// ─── Round column ───
function RoundColumn({
  label,
  matches,
  isFirst,
  compact,
}: {
  label: string;
  matches: KnockoutMatchFull[];
  isFirst?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-col shrink-0">
      <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center mb-2 whitespace-nowrap">
        {label}
      </div>
      <div className="flex flex-col justify-around flex-1 gap-2">
        {matches.map((m, i) => (
          <BracketMatch key={i} match={m} compact={compact} />
        ))}
      </div>
    </div>
  );
}

// ─── Champion display ───
function ChampionBanner({ data }: { data: KnockoutData }) {
  const champion = getMatchWinner(data.final[0]);
  const thirdPlace = getMatchWinner(data.third[0]);

  if (!champion) return null;

  const champTeam = getTeam(champion);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4 flex items-center justify-center gap-3 border-primary/30"
    >
      <Trophy className="w-6 h-6 text-primary" />
      <div className="text-center">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Campeão</p>
        <div className="flex items-center gap-2 mt-1">
          <Flag code={champTeam.code} size="md" />
          <span className="text-lg font-black">{champTeam.name}</span>
        </div>
      </div>
      <Trophy className="w-6 h-6 text-primary" />
    </motion.div>
  );
}

// ─── Main Bracket View ───
export function BracketView({ data }: { data: KnockoutData }) {
  // Build the bracket structure: left half → final ← right half
  // For 32 teams: R32(16) → R16(8) → QF(4) → SF(2) → Final(1)
  // We split into upper (first 8 R32) and lower (last 8 R32)
  // But for simplicity on mobile, show as a horizontal scroll

  const rounds: { label: string; matches: KnockoutMatchFull[] }[] = [
    { label: ROUND_LABELS.r32, matches: data.r32 },
    { label: ROUND_LABELS.r16, matches: data.r16 },
    { label: ROUND_LABELS.quarter, matches: data.quarter },
    { label: ROUND_LABELS.semi, matches: data.semi },
    { label: ROUND_LABELS.final, matches: data.final },
  ];

  return (
    <div className="space-y-4">
      <ChampionBanner data={data} />

      {/* Bracket scroll container */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex items-stretch gap-0 pb-4" style={{ minWidth: "fit-content" }}>
          {rounds.map((round, rIdx) => (
            <div key={rIdx} className="flex items-stretch">
              <RoundColumn
                label={round.label}
                matches={round.matches}
                isFirst={rIdx === 0}
                compact={rIdx === 0}
              />
              {rIdx < rounds.length - 1 && (
                <Connector matchCount={round.matches.length} compact={rIdx === 0} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3rd place match */}
      {data.third[0] && (data.third[0].home || data.third[0].away) && (
        <div className="space-y-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground text-center">
            {ROUND_LABELS.third}
          </div>
          <div className="flex justify-center">
            <BracketMatch match={data.third[0]} />
          </div>
        </div>
      )}
    </div>
  );
}
