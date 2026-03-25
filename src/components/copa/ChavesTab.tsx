import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Flag } from "@/components/Flag";
import { getTeam } from "@/data/mockData";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";
import { useSimulacao } from "@/contexts/SimulacaoContext";
import { LayoutGrid, GitBranch, Lock } from "lucide-react";
import { BracketView } from "./BracketView";
import { ShareBracket } from "./ShareBracket";
import { BracketScoreModal } from "./BracketScoreModal";
import type { KnockoutData, KnockoutMatchFull, KnockoutRound, KnockoutScore } from "@/utils/knockoutBracket";

type ViewMode = "bracket" | "list";

export function ChavesTab() {
  const { knockoutData, isGroupsComplete, filledCount, updateKnockoutScore } = useSimulacao();
  const [viewMode, setViewMode] = useState<ViewMode>("bracket");
  const bracketRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<{ match: KnockoutMatchFull; round: KnockoutRound; idx: number } | null>(null);

  const handleMatchClick = useCallback((round: KnockoutRound, matchIdx: number, match: KnockoutMatchFull) => {
    if (!match.home || !match.away) return;
    setSelectedMatch({ match, round, idx: matchIdx });
    setModalOpen(true);
  }, []);

  const handleSaveScore = useCallback((round: KnockoutRound, matchIdx: number, score: KnockoutScore) => {
    updateKnockoutScore(round, matchIdx, "homeScore", score.homeScore);
    updateKnockoutScore(round, matchIdx, "awayScore", score.awayScore);
    updateKnockoutScore(round, matchIdx, "homePenalty", score.homePenalty);
    updateKnockoutScore(round, matchIdx, "awayPenalty", score.awayPenalty);
  }, [updateKnockoutScore]);

  if (!isGroupsComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="space-y-4"
      >
        <div>
          <h2 className="text-lg font-black">Chaves</h2>
          <p className="text-[11px] text-muted-foreground">
            {filledCount > 0
              ? "Complete todos os jogos dos 12 grupos para ver o chaveamento"
              : "Preencha placares na aba Simulação para ver os confrontos"}
          </p>
        </div>

        {/* Locked state card */}
        <div className={cn(
          "relative overflow-hidden rounded-[4px] p-8 text-center",
          "bg-gradient-to-b from-[hsl(155_30%_14%/0.9)] to-[hsl(155_35%_10%/0.95)]",
          "border border-white/[0.1]",
          "backdrop-blur-lg"
        )}>
          {/* Decorative bracket lines in background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Simplified bracket silhouette */}
              <line x1="40" y1="40" x2="120" y2="40" stroke="white" strokeWidth="2" />
              <line x1="40" y1="80" x2="120" y2="80" stroke="white" strokeWidth="2" />
              <line x1="120" y1="40" x2="120" y2="80" stroke="white" strokeWidth="2" />
              <line x1="120" y1="60" x2="200" y2="60" stroke="white" strokeWidth="2" />
              <line x1="40" y1="120" x2="120" y2="120" stroke="white" strokeWidth="2" />
              <line x1="40" y1="160" x2="120" y2="160" stroke="white" strokeWidth="2" />
              <line x1="120" y1="120" x2="120" y2="160" stroke="white" strokeWidth="2" />
              <line x1="120" y1="140" x2="200" y2="140" stroke="white" strokeWidth="2" />
              <line x1="200" y1="60" x2="200" y2="140" stroke="white" strokeWidth="2" />
              <line x1="200" y1="100" x2="280" y2="100" stroke="white" strokeWidth="2" />
              {/* Mirror side */}
              <line x1="360" y1="40" x2="280" y2="40" stroke="white" strokeWidth="2" />
              <line x1="360" y1="80" x2="280" y2="80" stroke="white" strokeWidth="2" />
              <line x1="280" y1="40" x2="280" y2="80" stroke="white" strokeWidth="2" />
              <line x1="360" y1="120" x2="280" y2="120" stroke="white" strokeWidth="2" />
              <line x1="360" y1="160" x2="280" y2="160" stroke="white" strokeWidth="2" />
              <line x1="280" y1="120" x2="280" y2="160" stroke="white" strokeWidth="2" />
            </svg>
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          >
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] mb-4">
              <Lock className="w-7 h-7 text-white/30" />
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[hsl(var(--copa-gold)/0.15)] border border-[hsl(var(--copa-gold)/0.3)] flex items-center justify-center">
                <span className="text-[8px] font-black text-[hsl(var(--copa-gold))]">!</span>
              </div>
            </div>
          </motion.div>

          <p className="text-sm font-black text-white/80 mb-1">Fase de Grupos incompleta</p>
          <p className="text-[11px] text-white/40 max-w-xs mx-auto leading-relaxed">
            Preencha todos os jogos dos 12 grupos na aba <span className="text-[hsl(var(--copa-gold))] font-bold">Simulação</span> para desbloquear o chaveamento visual
          </p>

          {/* Progress hint */}
          {filledCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--copa-gold))] animate-pulse" />
              <span className="text-[10px] font-bold text-white/50">
                Progresso em andamento...
              </span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (!knockoutData) return null;

  return (
    <div className="space-y-4">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">Chaves</h2>
          <p className="text-[11px] text-muted-foreground">Baseado na sua simulação</p>
        </div>
        <div className="flex items-center gap-2">
          <ShareBracket bracketRef={bracketRef} />
          <div className="flex gap-0.5 bg-white/[0.04] rounded-[4px] p-0.5 border border-white/[0.08]">
            <button
              onClick={() => setViewMode("bracket")}
              className={cn(
                "p-1.5 rounded-[3px] transition-all duration-200",
                viewMode === "bracket"
                  ? "bg-[hsl(var(--copa-gold)/0.15)] text-[hsl(var(--copa-gold))] shadow-[0_0_8px_-2px_hsl(44_80%_46%/0.2)]"
                  : "text-white/40 hover:text-white/60"
              )}
              title="Chaveamento"
            >
              <GitBranch className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-[3px] transition-all duration-200",
                viewMode === "list"
                  ? "bg-[hsl(var(--copa-gold)/0.15)] text-[hsl(var(--copa-gold))] shadow-[0_0_8px_-2px_hsl(44_80%_46%/0.2)]"
                  : "text-white/40 hover:text-white/60"
              )}
              title="Lista"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "bracket" ? (
        <div ref={bracketRef}>
          <BracketView data={knockoutData} onMatchClick={handleMatchClick} />
        </div>
      ) : (
        <ListView data={knockoutData} onMatchClick={handleMatchClick} />
      )}

      <BracketScoreModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        match={selectedMatch?.match ?? null}
        round={selectedMatch?.round ?? null}
        matchIdx={selectedMatch?.idx ?? 0}
        onSave={handleSaveScore}
      />
    </div>
  );
}

// ─── List view (redesigned) ───
function ListView({
  data,
  onMatchClick,
}: {
  data: KnockoutData;
  onMatchClick?: (round: KnockoutRound, matchIdx: number, match: KnockoutMatchFull) => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('copa');
  const rounds = [
    { key: "r32" as KnockoutRound, label: "32 avos de Final", matches: data.r32 },
    { key: "r16" as KnockoutRound, label: "Oitavas de Final", matches: data.r16 },
    { key: "quarter" as KnockoutRound, label: "Quartas de Final", matches: data.quarter },
    { key: "semi" as KnockoutRound, label: "Semifinais", matches: data.semi },
    { key: "third" as KnockoutRound, label: t('bracket.third_place'), matches: data.third },
    { key: "final" as KnockoutRound, label: "Grande Final", matches: data.final },
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {rounds.map((round) => (
        <div key={round.label} className="space-y-2">
          {/* Round label */}
          <div className="relative text-center">
            <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            <span className="relative z-10 inline-block px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-[hsl(var(--copa-gold)/0.8)] bg-[hsl(155_35%_10%)] rounded-full border border-[hsl(var(--copa-gold)/0.12)]">
              {round.label}
            </span>
          </div>

          <div className="space-y-2">
            {round.matches.map((m, idx) => {
              const home = m.home ? getTeam(m.home) : null;
              const away = m.away ? getTeam(m.away) : null;
              const isBrasil = m.home === "BRA" || m.away === "BRA";
              const winner = m.home && m.away && m.score.homeScore !== null ?
                (m.score.homeScore > (m.score.awayScore ?? 0) ? m.home :
                  m.score.homeScore < (m.score.awayScore ?? 0) ? m.away : null) : null;
              const isClickable = !!(m.home && m.away && onMatchClick);

              return (
                <motion.div
                  key={idx}
                  variants={staggerItem}
                  className={cn(
                    "relative overflow-hidden rounded-[4px] border transition-all duration-300",
                    "bg-gradient-to-b from-[hsl(155_30%_14%/0.85)] to-[hsl(155_35%_10%/0.9)]",
                    "backdrop-blur-lg",
                    isBrasil
                      ? "border-[hsl(var(--copa-gold)/0.25)]"
                      : winner
                        ? "border-[hsl(var(--copa-green-light)/0.25)]"
                        : "border-white/[0.1]",
                    isClickable && "cursor-pointer hover:border-[hsl(var(--copa-gold)/0.3)] hover:shadow-[0_4px_20px_-4px_hsl(44_80%_46%/0.1)]"
                  )}
                  onClick={isClickable ? () => onMatchClick?.(round.key, idx, m) : undefined}
                >
                  {/* Brasil indicator */}
                  {isBrasil && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[hsl(var(--copa-gold))] to-[hsl(var(--copa-green-light))]" />
                  )}

                  <div className={cn("flex items-center gap-3 px-4 py-3", isBrasil && m.home === "BRA" && "bg-[hsl(var(--copa-gold)/0.03)]")}>
                    {home ? (
                      <div
                        className="flex-1 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); navigate(`/team/${home.code}`); }}
                      >
                        <Flag code={home.code} size="sm" />
                        <span className="text-sm font-bold flex-1">{home.name}</span>
                        {m.score.homeScore !== null && (
                          <span className={cn(
                            "text-sm font-black tabular-nums",
                            winner === m.home ? "text-[hsl(var(--copa-gold))]" : ""
                          )}>
                            {m.score.homeScore}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-dashed border-white/[0.1]" />
                        <span className="text-sm font-medium text-white/30 flex-1">A definir</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center px-4">
                    <div className="flex-1 border-t border-white/[0.06]" />
                    <span className="text-[9px] font-bold text-white/20 px-2 uppercase">vs</span>
                    <div className="flex-1 border-t border-white/[0.06]" />
                  </div>

                  <div className={cn("flex items-center gap-3 px-4 py-3", isBrasil && m.away === "BRA" && "bg-[hsl(var(--copa-gold)/0.03)]")}>
                    {away ? (
                      <div
                        className="flex-1 flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); navigate(`/team/${away.code}`); }}
                      >
                        <Flag code={away.code} size="sm" />
                        <span className="text-sm font-bold flex-1">{away.name}</span>
                        {m.score.awayScore !== null && (
                          <span className={cn(
                            "text-sm font-black tabular-nums",
                            winner === m.away ? "text-[hsl(var(--copa-gold))]" : ""
                          )}>
                            {m.score.awayScore}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-dashed border-white/[0.1]" />
                        <span className="text-sm font-medium text-white/30 flex-1">A definir</span>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
