import { cn } from "@/lib/utils";

type StatusType = "live" | "scheduled" | "finished";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  live: { label: "AO VIVO", className: "bg-copa-live text-destructive-foreground animate-pulse-live" },
  scheduled: { label: "EM BREVE", className: "bg-secondary text-secondary-foreground" },
  finished: { label: "ENCERRADO", className: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status, minute, className }: { status: StatusType; minute?: number; className?: string }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", config.className, className)}>
      {status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {status === "live" && minute ? `${minute}'` : config.label}
    </span>
  );
}
