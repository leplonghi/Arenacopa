import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
    <section className={cn(tone === "strong" ? "arena-panel-strong" : "arena-panel", className)}>
      {children}
    </section>
  );
}

export function ArenaSectionHeader({
  title,
  eyebrow,
  action,
  className,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="arena-kicker text-primary">{eyebrow}</p> : null}
        <h2 className="mt-1 font-display text-[2.2rem] font-semibold uppercase leading-[0.88] tracking-[0.025em] text-white sm:text-[2.45rem]">
          {title}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
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
        "rounded-[22px] border px-4 py-4 backdrop-blur-xl",
        accent ? "border-primary/35 bg-primary/10" : "border-white/10 bg-white/[0.04]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-display font-black uppercase tracking-[0.14em] text-zinc-400">
            {label}
          </p>
          <div
            className={cn(
              "mt-2 font-display text-[2rem] font-black uppercase leading-none tracking-[0.02em]",
              accent ? "text-primary" : "text-white",
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
        "inline-flex items-center justify-center rounded-[18px] border px-4 py-2 font-display text-base font-bold uppercase tracking-[0.08em] transition",
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
