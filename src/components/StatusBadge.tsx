import { cn } from "@/lib/utils";

type StatusType = "live" | "scheduled" | "finished";

import { useTranslation } from "react-i18next";

export function StatusBadge({ status, minute, className }: { status: StatusType; minute?: number; className?: string }) {
  const { t } = useTranslation('common');

  const statusConfig: Record<StatusType, { label: string; className: string }> = {
    live: { label: t('status.live').toUpperCase(), className: "bg-copa-live text-destructive-foreground animate-pulse-live" },
    scheduled: { label: t('status.scheduled').toUpperCase(), className: "bg-secondary text-secondary-foreground" },
    finished: { label: t('status.finished').toUpperCase(), className: "bg-muted text-muted-foreground" },
  };

  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", config.className, className)}>
      {status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {status === "live" && minute ? `${minute}'` : config.label}
    </span>
  );
}
