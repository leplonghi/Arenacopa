import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ArenaPanel({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "strong";
}) {
  return (
    <section className={cn(tone === "strong" ? "arena-panel-strong" : "arena-panel", "min-w-0", className)}>
      {children}
    </section>
  );
}

export function ArenaSectionHeader({
  title,
  eyebrow,
  action,
  hint,
  className,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <div className="flex min-w-0 items-center gap-2">
            <p className="arena-kicker min-w-0 break-words text-primary">{eyebrow}</p>
            {hint ? <ArenaHint label={`Sobre ${title}`}>{hint}</ArenaHint> : null}
          </div>
        ) : hint ? (
          <ArenaHint label={`Sobre ${title}`}>{hint}</ArenaHint>
        ) : null}
        <h2 className="mt-1 break-words text-xl font-bold leading-[1.15] tracking-[0.01em] text-white [overflow-wrap:anywhere] sm:text-2xl">
          {title}
        </h2>
      </div>
      {action ? (
        <div data-testid="arena-section-actions" className="w-full min-w-0 sm:w-auto sm:shrink-0">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function ArenaHint({
  children,
  label = "Ver detalhe",
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary transition hover:border-primary/45 hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
            className,
          )}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[270px] rounded-2xl border border-primary/20 bg-[#06110d] px-4 py-3 text-left text-xs leading-relaxed text-zinc-200 shadow-[0_18px_50px_rgba(0,0,0,0.65)]">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

export function ArenaMetric({
  label,
  value,
  accent = false,
  icon,
  className,
  compact = false,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
  icon?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border backdrop-blur-xl",
        compact ? "px-3 py-2.5" : "px-4 py-3",
        accent ? "border-primary/30 bg-primary/[0.08]" : "border-[#8d8158]/30 bg-[#061510]/70",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("break-words font-semibold leading-tight tracking-[0.02em]", compact ? "text-[11px] text-zinc-400" : "text-sm text-zinc-400", accent ? "text-[#44df62]" : "text-primary")}>
            {label}
          </p>
          <div
            className={cn(
              "break-words font-bold leading-tight tracking-normal text-white",
              compact ? "mt-0.5 text-xl" : "mt-1 text-2xl",
            )}
          >
            {value}
          </div>
        </div>
        {icon ? <div className={cn("shrink-0 text-primary", compact && "scale-75")}>{icon}</div> : null}
      </div>
    </div>
  );
}

export function ArenaTabPill({
  active,
  children,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex min-w-0 items-center justify-center whitespace-normal rounded-[18px] border px-4 py-2 text-center text-sm font-semibold leading-tight tracking-[0.02em] transition",
        active
          ? "border-primary/50 bg-primary/15 text-primary shadow-[0_0_22px_rgba(145,255,59,0.18)]"
          : "border-white/10 bg-white/[0.04] text-zinc-400",
        className,
      )}
    >
      {children}
    </div>
  );
}
