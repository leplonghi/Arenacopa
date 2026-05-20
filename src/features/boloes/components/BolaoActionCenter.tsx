import { Trophy, Info, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface BolaoActionCenterProps {
  pendingOverview: {
    totalPending: number;
    summary: string;
    totalOpen: number;
    completed: number;
  };
  completionPercent: number;
  onAction: (tab: "palpites" | "ranking") => void;
}

export function BolaoActionCenter({
  pendingOverview,
  completionPercent,
  onAction,
}: BolaoActionCenterProps) {
  const { t } = useTranslation("bolao");
  const hasPending = pendingOverview.totalPending > 0;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 flex-wrap">
      {/* Status / CTA */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
          {t("bolao_detail.next_play_kicker", { defaultValue: "Próxima jogada" })}
        </p>
        <p className="mt-0.5 text-sm font-black text-white leading-tight">
          {hasPending ? `${pendingOverview.totalPending} jogos para resolver` : "Você está em dia"}
        </p>
      </div>

      {/* Metrics — compact inline chips */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-black text-zinc-300">
          <Trophy className="h-3.5 w-3.5 text-primary" />
          {pendingOverview.completed}/{pendingOverview.totalOpen}
        </span>
        <span className={cn(
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-black",
          hasPending ? "border-amber-500/20 bg-amber-500/10 text-amber-400" : "border-white/10 bg-white/5 text-zinc-300"
        )}>
          <Info className="h-3.5 w-3.5" />
          {pendingOverview.totalPending}
        </span>
        <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-black text-zinc-300">
          {completionPercent}%
        </span>
      </div>

      {/* Action button */}
      <button
        onClick={() => onAction(hasPending ? "palpites" : "ranking")}
        className={cn(
          "shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition",
          hasPending
            ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
            : "bg-primary/15 text-primary hover:bg-primary/25"
        )}
      >
        <Zap className="h-3.5 w-3.5" />
        {hasPending ? "Marcar" : "Ranking"}
      </button>
    </div>
  );
}
