import { cn } from "@/lib/utils";
import { Flag } from "@/components/Flag";
import { getTeam } from "@/data/mockData";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";
import { Trophy, HelpCircle } from "lucide-react";
import { useSimulacao } from "@/contexts/SimulacaoContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type KnockoutRound, type KnockoutMatchFull, type KnockoutScore,
  KNOCKOUT_ROUNDS, ROUND_LABELS, ROUND_FULL_LABELS,
  isDrawRegulation, getMatchWinner,
} from "@/utils/knockoutBracket";

function KOScoreInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      value={value ?? ""}
      onChange={e => {
        const v = e.target.value;
        onChange(v === "" ? null : Math.max(0, Math.min(20, parseInt(v) || 0)));
      }}
      className="w-10 h-10 rounded-lg bg-secondary border border-border text-center text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      placeholder="–"
    />
  );
}

function TeamSlot({ code, side }: { code: string | null; side: "home" | "away" }) {
  const navigate = useNavigate();
  if (!code) {
    return (
      <div className={cn("flex items-center gap-1.5", side === "home" ? "flex-1 justify-end" : "flex-1")}>
        <div className={cn("flex items-center gap-1.5", side === "away" && "flex-row-reverse")}>
          <div className="w-8 h-8 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-muted-foreground/50" />
          </div>
          <span className="text-xs font-medium text-muted-foreground/50">TBD</span>
        </div>
      </div>
    );
  }

  const team = getTeam(code);
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 cursor-pointer hover:underline",
        side === "home" ? "flex-1 justify-end" : "flex-1"
      )}
      onClick={() => navigate(`/team/${team.code}`)}
    >
      {side === "home" && <span className="text-xs font-bold truncate max-w-[60px]">{team.name}</span>}
      <Flag code={team.code} size="sm" />
      {side === "away" && <span className="text-xs font-bold truncate max-w-[60px]">{team.name}</span>}
    </div>
  );
}

function KnockoutMatchCard({
  match, round, matchIdx,
}: {
  match: KnockoutMatchFull;
  round: KnockoutRound;
  matchIdx: number;
}) {
  const { updateKnockoutScore } = useSimulacao();
  const canEdit = !!match.home && !!match.away;
  const isDraw = isDrawRegulation(match.score);
  const winner = getMatchWinner(match);

  const update = (field: keyof KnockoutScore, v: number | null) => {
    updateKnockoutScore(round, matchIdx, field, v);
  };

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        "glass-card p-4 space-y-2",
        !canEdit && "opacity-50"
      )}
    >
      {/* Teams and score */}
      <div className="flex items-center gap-2">
        <TeamSlot code={match.home} side="home" />
        <div className="flex items-center gap-1.5 shrink-0">
          <KOScoreInput
            value={match.score.homeScore}
            onChange={v => canEdit && update("homeScore", v)}
          />
          <span className="text-xs font-bold text-muted-foreground">×</span>
          <KOScoreInput
            value={match.score.awayScore}
            onChange={v => canEdit && update("awayScore", v)}
          />
        </div>
        <TeamSlot code={match.away} side="away" />
      </div>

      {/* Penalties (only show if regulation draw) */}
      {isDraw && round !== "third" && (
        <div className="flex items-center justify-center gap-3 pt-1 border-t border-border/20">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pênaltis</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              max={20}
              value={match.score.homePenalty ?? ""}
              onChange={e => {
                const v = e.target.value;
                update("homePenalty", v === "" ? null : Math.max(0, parseInt(v) || 0));
              }}
              className="w-8 h-8 rounded-md bg-primary/10 border border-primary/30 text-center text-xs font-black focus:outline-none focus:ring-1 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="–"
            />
            <span className="text-xs text-muted-foreground">-</span>
            <input
              type="number"
              min={0}
              max={20}
              value={match.score.awayPenalty ?? ""}
              onChange={e => {
                const v = e.target.value;
                update("awayPenalty", v === "" ? null : Math.max(0, parseInt(v) || 0));
              }}
              className="w-8 h-8 rounded-md bg-primary/10 border border-primary/30 text-center text-xs font-black focus:outline-none focus:ring-1 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="–"
            />
          </div>
        </div>
      )}

      {/* Winner indicator */}
      {winner && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <Trophy className="w-3 h-3 text-copa-success" />
          <span className="text-[10px] font-bold text-copa-success">
            {getTeam(winner).name} avança
          </span>
        </div>
      )}
    </motion.div>
  );
}

export function KnockoutPhase() {
  const { knockoutData, isGroupsComplete } = useSimulacao();
  const [selectedRound, setSelectedRound] = useState<KnockoutRound>("r32");

  if (!isGroupsComplete) {
    return (
      <div className="glass-card p-6 text-center">
        <span className="text-3xl mb-2 block">🏟️</span>
        <p className="text-sm font-bold">Fase de Grupos incompleta</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Preencha todos os jogos dos 12 grupos para desbloquear as eliminatórias
        </p>
      </div>
    );
  }

  if (!knockoutData) return null;

  const roundMatches = knockoutData[selectedRound];
  const filledInRound = roundMatches.filter(m => getMatchWinner(m) !== null).length;
  const totalInRound = roundMatches.length;

  // Visible rounds (skip semi since quarter already shows as "Semifinais" issue - let me keep all)
  const visibleRounds: KnockoutRound[] = ["r32", "r16", "quarter", "semi", "third", "final"];

  return (
    <div className="space-y-4">
      {/* Round selector */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {visibleRounds.map(r => (
          <button
            key={r}
            onClick={() => setSelectedRound(r)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors shrink-0",
              selectedRound === r
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {ROUND_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Round header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black">{ROUND_FULL_LABELS[selectedRound]}</h3>
          <p className="text-[10px] text-muted-foreground">
            {filledInRound}/{totalInRound} {totalInRound === 1 ? "jogo definido" : "jogos definidos"}
          </p>
        </div>
      </div>

      {/* Matches */}
      <motion.div
        key={selectedRound}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4"
      >
        {roundMatches.map((match, i) => (
          <KnockoutMatchCard
            key={`${selectedRound}-${i}`}
            match={match}
            round={selectedRound}
            matchIdx={i}
          />
        ))}
      </motion.div>
    </div>
  );
}
