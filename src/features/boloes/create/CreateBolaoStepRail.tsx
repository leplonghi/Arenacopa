import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type StepTone = "green" | "gold" | "cyan" | "rose";

type StepRailItem = {
  number: number;
  label: string;
  tone: StepTone;
};

const toneConfig: Record<StepTone, { active: string; done: string; idle: string }> = {
  green: {
    active: "border-primary/50 bg-primary/15 text-primary shadow-[0_0_20px_rgba(145,255,59,0.14)]",
    done: "border-primary/30 bg-primary/8 text-primary/70",
    idle: "border-white/8 bg-white/[0.03] text-zinc-600",
  },
  gold: {
    active: "border-amber-400/50 bg-amber-400/15 text-amber-300 shadow-[0_0_20px_rgba(255,197,77,0.14)]",
    done: "border-amber-400/25 bg-amber-400/8 text-amber-500",
    idle: "border-white/8 bg-white/[0.03] text-zinc-600",
  },
  cyan: {
    active: "border-cyan-300/45 bg-cyan-300/12 text-cyan-200 shadow-[0_0_20px_rgba(103,232,249,0.12)]",
    done: "border-cyan-300/20 bg-cyan-300/6 text-cyan-600",
    idle: "border-white/8 bg-white/[0.03] text-zinc-600",
  },
  rose: {
    active: "border-rose-300/45 bg-rose-300/12 text-rose-200 shadow-[0_0_20px_rgba(253,164,175,0.12)]",
    done: "border-rose-300/20 bg-rose-300/6 text-rose-600",
    idle: "border-white/8 bg-white/[0.03] text-zinc-600",
  },
};

export function CreateBolaoStepRail({
  activeStep,
  steps,
}: {
  activeStep: number;
  steps?: StepRailItem[];
}) {
  const { t } = useTranslation("bolao");
  const resolvedSteps = steps ?? [
    { number: 1, label: t("creation.steps.identity"), tone: "green" },
    { number: 2, label: t("creation.steps.games"), tone: "gold" },
    { number: 3, label: t("creation.steps.context"), tone: "cyan" },
    { number: 4, label: t("creation.steps.rules"), tone: "rose" },
    { number: 5, label: t("creation.steps.access"), tone: "gold" },
    { number: 6, label: t("creation.steps.publish"), tone: "green" },
  ];

  return (
    <nav
      aria-label={t("creation.steps.aria_label")}
      className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-6"
    >
      {resolvedSteps.map((step) => {
        const isDone = step.number < activeStep;
        const isActive = step.number === activeStep;
        const cfg = toneConfig[step.tone];

        return (
          <div
            key={step.number}
            aria-label={t("creation.steps.item_aria", {
              number: step.number,
              label: step.label,
              status: isDone ? t("creation.steps.completed") : isActive ? t("creation.steps.current") : "",
            })}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "relative overflow-hidden rounded-[18px] border px-3 py-3 transition-all duration-300",
              isActive ? cfg.active : isDone ? cfg.done : cfg.idle,
            )}
          >
            {/* Connector line (except last) */}
            {step.number < steps.length && (
              <div className="absolute right-0 top-1/2 hidden h-px w-2 -translate-y-1/2 bg-white/10 sm:block" />
            )}

            {/* Step indicator */}
            <div className="mb-1.5 flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black",
                  isActive ? "bg-current/20 text-inherit" : isDone ? "bg-current/15 text-inherit" : "bg-white/5 text-zinc-600",
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : step.number}
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.16em] opacity-70">
                {isDone ? t("creation.steps.done") : isActive ? t("creation.steps.current_short") : t("creation.steps.step", { number: step.number })}
              </span>
            </div>

            <p className={cn(
              "text-xs font-black leading-tight",
              isActive ? "text-white" : isDone ? "text-zinc-300" : "text-zinc-600",
            )}>
              {step.label}
            </p>

            {/* Active glow bar */}
            {isActive && (
              <div className="absolute inset-x-0 bottom-0 h-[2px] rounded-b-[18px] bg-current opacity-60" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
