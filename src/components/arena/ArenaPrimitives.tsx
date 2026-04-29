import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
        <h2 className="mt-1 break-words font-display text-[1.75rem] font-bold uppercase leading-[1.02] tracking-[0.02em] text-white [overflow-wrap:anywhere] sm:text-[2.3rem]">
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
    <TooltipProvider delayDuration={120}>
      <Tooltip>
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
    </TooltipProvider>
  );
}

export function ArenaMetric({
  label,
  value,
  accent = false,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[18px] border px-4 py-4 backdrop-blur-xl",
        accent ? "border-primary/30 bg-primary/[0.08]" : "border-[#8d8158]/30 bg-[#061510]/70",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("break-words font-display text-[0.92rem] font-bold uppercase leading-tight tracking-[0.08em]", accent ? "text-[#44df62]" : "text-primary")}>
            {label}
          </p>
          <div
            className={cn(
              "mt-2 break-words font-display text-[2.15rem] font-bold uppercase leading-tight tracking-[0.02em]",
              "text-white",
            )}
          >
            {value}
          </div>
        </div>
        {icon ? <div className="shrink-0 text-primary">{icon}</div> : null}
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
        "inline-flex min-w-0 items-center justify-center whitespace-normal rounded-[18px] border px-4 py-2 text-center font-display text-base font-bold uppercase leading-tight tracking-[0.06em] transition",
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
