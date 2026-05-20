import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ArenaImage = {
  src?: string | null;
  alt?: string;
  position?: string;
  eager?: boolean;
};

export function ArenaPageHeader({
  eyebrow,
  title,
  description,
  image,
  actions,
  metrics,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  image?: ArenaImage;
  actions?: ReactNode;
  metrics?: Array<{ label: string; value: ReactNode; accent?: boolean }>;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-[28px] border border-[#8d8158]/30 bg-[#04140f] p-5 text-white shadow-[0_22px_58px_-28px_rgba(0,0,0,0.9)] sm:p-6 lg:p-7",
        className,
      )}
    >
      {image?.src ? (
        <img
          src={image.src}
          alt={image.alt || ""}
          loading={image.eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-48"
          style={{ objectPosition: image.position || "center" }}
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(1,8,6,0.96)_0%,rgba(1,8,6,0.82)_48%,rgba(1,8,6,0.38)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_12%,rgba(145,255,59,0.16),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(255,198,45,0.18),transparent_24%)]" />
      <div className="relative z-10 grid min-h-[220px] gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-2xl">
          {eyebrow ? <p className="arena-kicker text-primary">{eyebrow}</p> : null}
          <h1 className="mt-2 font-display text-[2.7rem] font-black uppercase leading-[0.86] tracking-[0.01em] text-white sm:text-[3.6rem]">
            {title}
          </h1>
          {description ? <div className="mt-3 max-w-xl text-sm font-semibold leading-6 text-zinc-300">{description}</div> : null}
          {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {metrics?.length ? (
          <div className="grid grid-cols-3 gap-2 lg:min-w-[330px]">
            {metrics.map((metric) => (
              <div
                key={String(metric.label)}
                className={cn(
                  "rounded-2xl border px-3 py-3 backdrop-blur-xl",
                  metric.accent ? "border-primary/35 bg-primary/[0.12]" : "border-white/10 bg-black/35",
                )}
              >
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">{metric.label}</p>
                <div className={cn("mt-1 text-2xl font-black leading-none", metric.accent ? "text-primary" : "text-white")}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ArenaCommandPanel({
  children,
  className,
  image,
}: {
  children: ReactNode;
  className?: string;
  image?: ArenaImage;
}) {
  return (
    <section className={cn("relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl", className)}>
      {image?.src ? (
        <>
          <img
            src={image.src}
            alt={image.alt || ""}
            loading={image.eager ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-y-0 right-0 hidden h-full w-[46%] object-cover opacity-38 md:block"
            style={{ objectPosition: image.position || "center" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,10,8,0.98)_0%,rgba(2,10,8,0.9)_58%,rgba(2,10,8,0.25)_100%)]" />
        </>
      ) : null}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

export function ArenaActionDock({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sticky bottom-[calc(6.5rem+var(--safe-area-bottom,0px))] z-20 rounded-[24px] border border-primary/25 bg-[#03120d]/92 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:bottom-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ArenaSegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: Array<{ value: T; label: ReactNode; count?: number; icon?: LucideIcon; alert?: boolean }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto scrollbar-none", className)}>
      <div className="flex min-w-max gap-1 rounded-[22px] border border-white/10 bg-black/28 p-1 backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={cn(
                "relative inline-flex items-center gap-2 rounded-[17px] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.13em] transition",
                active ? "bg-primary text-black shadow-[0_0_24px_rgba(145,255,59,0.18)]" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
              {item.label}
              {typeof item.count === "number" && item.count > 0 ? (
                <span className={cn("rounded-full px-1.5 py-0.5 text-[8px]", active ? "bg-black/15 text-black" : "bg-white/8 text-zinc-300")}>
                  {item.count}
                </span>
              ) : null}
              {item.alert && !active ? <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ArenaStateBlock({
  title,
  description,
  image,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  image?: ArenaImage;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[26px] border border-dashed border-white/12 bg-white/[0.035] px-5 py-8 text-center",
        className,
      )}
    >
      {image?.src ? (
        <img
          src={image.src}
          alt={image.alt || ""}
          loading={image.eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-36"
          style={{ objectPosition: image.position || "center" }}
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(1,8,6,0.64),rgba(1,8,6,0.94))]" />
      <div className="mx-auto flex max-w-md flex-col items-center">
        {icon ? <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/12 text-primary">{icon}</div> : null}
        <h3 className="text-xl font-black leading-tight text-white">{title}</h3>
        {description ? <p className="mt-2 text-sm font-medium leading-6 text-zinc-400">{description}</p> : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

export function ArenaImageButton({
  to,
  onClick,
  icon: Icon = ArrowRight,
  children,
  variant = "gold",
}: {
  to?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  children: ReactNode;
  variant?: "gold" | "ghost";
}) {
  const className = cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.12em] transition active:scale-[0.98]",
    variant === "gold" ? "bg-primary text-black hover:brightness-110" : "border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]",
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {children}
        <Icon className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
      <Icon className="h-4 w-4" />
    </button>
  );
}
