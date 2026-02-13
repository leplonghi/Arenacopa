import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Flag } from "@/components/Flag";
import { getTeam } from "@/data/mockData";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";
import { useSimulacao } from "@/contexts/SimulacaoContext";
import { Trophy, LayoutGrid, GitBranch } from "lucide-react";
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
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black">Chaves</h2>
          <p className="text-[11px] text-muted-foreground">
            {filledCount > 0
              ? "Complete todos os jogos dos 12 grupos para ver o chaveamento"
              : "Preencha placares na aba Simulação para ver os confrontos"}
          </p>
        </div>
        <div className="glass-card p-6 text-center">
          <span className="text-3xl mb-2 block">🏟️</span>
          <p className="text-sm font-bold">Fase de Grupos incompleta</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Preencha todos os jogos dos 12 grupos para desbloquear o chaveamento visual
          </p>
        </div>
      </div>
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
          <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("bracket")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "bracket" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
            title="Chaveamento"
          >
            <GitBranch className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
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
        <ListView data={knockoutData} />
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

// ─── Legacy list view (simplified from original) ───
function ListView({ data }: { data: KnockoutData }) {
  const rounds = [
    { label: "32 avos de Final", matches: data.r32 },
    { label: "Oitavas de Final", matches: data.r16 },
    { label: "Quartas de Final", matches: data.quarter },
    { label: "Semifinais", matches: data.semi },
    { label: "Disputa de 3º Lugar", matches: data.third },
    { label: "Grande Final", matches: data.final },
  ] as const;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {rounds.map((round) => (
        <div key={round.label} className="space-y-2">
          <div className="text-sm font-black uppercase tracking-widest text-muted-foreground text-center">
            {round.label}
          </div>
          <div className="space-y-2">
            {round.matches.map((m, idx) => {
              const home = m.home ? getTeam(m.home) : null;
              const away = m.away ? getTeam(m.away) : null;
              const isBrasil = m.home === "BRA" || m.away === "BRA";

              return (
                <motion.div
                  key={idx}
                  variants={staggerItem}
                  className={cn(
                    "glass-card overflow-hidden border-l-2",
                    isBrasil ? "border-l-primary" : "border-l-copa-green"
                  )}
                >
                  <div className={cn("flex items-center gap-3 px-4 py-3", isBrasil && m.home === "BRA" && "bg-primary/5")}>
                    {home ? (
                      <>
                        <Flag code={home.code} size="sm" />
                        <span className="text-sm font-bold flex-1">{home.name}</span>
                        {m.score.homeScore !== null && <span className="text-sm font-black">{m.score.homeScore}</span>}
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-secondary border border-dashed border-border/50" />
                        <span className="text-sm font-medium text-muted-foreground flex-1">A definir</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center px-4">
                    <div className="flex-1 border-t border-border/30" />
                    <span className="text-[9px] font-bold text-muted-foreground px-2 uppercase">vs</span>
                    <div className="flex-1 border-t border-border/30" />
                  </div>
                  <div className={cn("flex items-center gap-3 px-4 py-3", isBrasil && m.away === "BRA" && "bg-primary/5")}>
                    {away ? (
                      <>
                        <Flag code={away.code} size="sm" />
                        <span className="text-sm font-bold flex-1">{away.name}</span>
                        {m.score.awayScore !== null && <span className="text-sm font-black">{m.score.awayScore}</span>}
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-secondary border border-dashed border-border/50" />
                        <span className="text-sm font-medium text-muted-foreground flex-1">A definir</span>
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
