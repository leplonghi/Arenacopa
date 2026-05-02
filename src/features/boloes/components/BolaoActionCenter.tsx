import { Trophy, Users, Info } from "lucide-react";
import { ArenaMetric, ArenaPanel } from "@/components/arena/ArenaPrimitives";
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
  const { t } = useTranslation('bolao');

  return (
    <div className="mb-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
      <ArenaPanel className="p-4">
        <p className="arena-kicker text-primary">
          {t("bolao_detail.next_play_kicker", { defaultValue: "Próxima jogada" })}
        </p>
        <h2 className="mt-1 arena-title-lg">
          {pendingOverview.totalPending > 0
            ? `${pendingOverview.totalPending} jogos para resolver`
            : "Você está em dia"}
        </h2>
        <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-400">
          {pendingOverview.totalPending > 0
            ? pendingOverview.summary || "Abra os jogos e salve seus resultados antes do prazo."
            : "Acompanhe ranking, participantes e escolhas já fechadas."}
        </p>
        <div className="mt-3">
          <button
            onClick={() => onAction(pendingOverview.totalPending > 0 ? "palpites" : "ranking")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] transition",
              pendingOverview.totalPending > 0
                ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                : "bg-primary/15 text-primary hover:bg-primary/25"
            )}
          >
            {pendingOverview.totalPending > 0 ? "Marcar agora" : "Ver ranking"}
          </button>
        </div>
      </ArenaPanel>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <ArenaMetric
          label={t("bolao_detail.progress_label", { defaultValue: "Progresso" })}
          value={pendingOverview.totalOpen > 0 ? `${pendingOverview.completed}/${pendingOverview.totalOpen}` : "0/0"}
          accent
          icon={<Trophy className="h-5 w-5" />}
        />
        <ArenaMetric
          label="Pendências"
          value={pendingOverview.totalPending}
          icon={<Info className="h-5 w-5" />}
        />
        <ArenaMetric
          label="Cobertura"
          value={`${completionPercent}%`}
          icon={<Users className="h-5 w-5" />}
          className="sm:col-span-3 lg:col-span-1"
        />
      </div>
    </div>
  );
}
