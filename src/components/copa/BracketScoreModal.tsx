import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flag } from "@/components/Flag";
import { getTeam } from "@/data/mockData";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KnockoutMatchFull, KnockoutRound, KnockoutScore } from "@/utils/knockoutBracket";
import { ROUND_FULL_LABELS } from "@/utils/knockoutBracket";
import { useTranslation } from "react-i18next";

interface BracketScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: KnockoutMatchFull | null;
  round: KnockoutRound | null;
  matchIdx: number;
  onSave: (round: KnockoutRound, matchIdx: number, score: KnockoutScore) => void;
}

function ScoreInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
        >
          <Minus className="w-3 h-3" />
        </Button>
        <span className="w-8 text-center text-lg font-black tabular-nums">{value}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(Math.min(20, value + 1))}
          disabled={value >= 20}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export function BracketScoreModal({ open, onOpenChange, match, round, matchIdx, onSave }: BracketScoreModalProps) {
  const { t } = useTranslation("copa");
  const [homeScore, setHomeScore] = useState(0);
  const navigate = useNavigate();
  const [awayScore, setAwayScore] = useState(0);
  const [homePenalty, setHomePenalty] = useState(0);
  const [awayPenalty, setAwayPenalty] = useState(0);

  useEffect(() => {
    if (match && open) {
      setHomeScore(match.score.homeScore ?? 0);
      setAwayScore(match.score.awayScore ?? 0);
      setHomePenalty(match.score.homePenalty ?? 0);
      setAwayPenalty(match.score.awayPenalty ?? 0);
    }
  }, [match, open]);

  if (!match?.home || !match?.away || !round) return null;

  const homeTeam = getTeam(match.home);
  const awayTeam = getTeam(match.away);
  const isDraw = homeScore === awayScore;

  const handleSave = () => {
    onSave(round, matchIdx, {
      homeScore,
      awayScore,
      homePenalty: isDraw ? homePenalty : null,
      awayPenalty: isDraw ? awayPenalty : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-sm">
            {round ? ROUND_FULL_LABELS[round] : t("bracket_modal.edit_score")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Teams + Scores */}
          <div className="flex items-center justify-between gap-2">
            {/* Home */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/team/${homeTeam.code}`)}
              >
                <Flag code={homeTeam.code} size="lg" />
                <span className="text-xs font-bold text-center leading-tight hover:underline">{homeTeam.name}</span>
              </div>
              <ScoreInput value={homeScore} onChange={setHomeScore} label={t("bracket_modal.goals_label")} />
            </div>

            <span className="text-lg font-black text-muted-foreground">×</span>

            {/* Away */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div
                className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/team/${awayTeam.code}`)}
              >
                <Flag code={awayTeam.code} size="lg" />
                <span className="text-xs font-bold text-center leading-tight hover:underline">{awayTeam.name}</span>
              </div>
              <ScoreInput value={awayScore} onChange={setAwayScore} label={t("bracket_modal.goals_label")} />
            </div>
          </div>

          {/* Penalties */}
          {isDraw && (
            <div className="border-t border-border/30 pt-3">
              <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-wider mb-3">
                {t("bracket_modal.penalties_title")}
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 flex justify-center">
                  <ScoreInput value={homePenalty} onChange={setHomePenalty} label={homeTeam.code} />
                </div>
                <span className="text-sm font-black text-muted-foreground">×</span>
                <div className="flex-1 flex justify-center">
                  <ScoreInput value={awayPenalty} onChange={setAwayPenalty} label={awayTeam.code} />
                </div>
              </div>
              {isDraw && homePenalty === awayPenalty && (
                <p className="text-[9px] text-destructive text-center mt-2">
                  {t("bracket_modal.penalties_error")}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            className="w-full"
            disabled={isDraw && homePenalty === awayPenalty}
          >
            {t("bracket_modal.save_score")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
