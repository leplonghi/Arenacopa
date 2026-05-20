import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type StepTone = "green" | "gold" | "cyan" | "rose" | "blue" | "orange";

type StepRailItem = {
  number: number;
  label: string;
  tone: StepTone;
};

const toneConfig: Record<StepTone, { active: string; done: string; idle: string }> = {
  green: {
    active: "border-emerald-500/60 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    done: "border-emerald-500/40 bg-emerald-500/15 text-emerald-400",
    idle: "border-emerald-500/25 bg-emerald-500/10 text-emerald-500/80",
  },
  gold: {
    active: "border-amber-400/60 bg-amber-400/20 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]",
    done: "border-amber-400/40 bg-amber-400/15 text-amber-400",
    idle: "border-amber-400/25 bg-amber-400/10 text-amber-400/80",
  },
  cyan: {
    active: "border-cyan-400/60 bg-cyan-400/20 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]",
    done: "border-cyan-400/40 bg-cyan-400/15 text-cyan-400",
    idle: "border-cyan-400/25 bg-cyan-400/10 text-cyan-400/80",
  },
  rose: {
    active: "border-rose-400/60 bg-rose-400/20 text-rose-300 shadow-[0_0_15px_rgba(251,113,133,0.2)]",
    done: "border-rose-400/40 bg-rose-400/15 text-rose-400",
    idle: "border-rose-400/25 bg-rose-400/10 text-rose-400/80",
  },
  blue: {
    active: "border-blue-400/60 bg-blue-400/20 text-blue-300 shadow-[0_0_15px_rgba(96,165,250,0.2)]",
    done: "border-blue-400/40 bg-blue-400/15 text-blue-400",
    idle: "border-blue-400/25 bg-blue-400/10 text-blue-400/80",
  },
  orange: {
    active: "border-orange-400/60 bg-orange-400/20 text-orange-300 shadow-[0_0_15px_rgba(251,146,60,0.2)]",
    done: "border-orange-400/40 bg-orange-400/15 text-orange-400",
    idle: "border-orange-400/25 bg-orange-400/10 text-orange-400/80",
  },
};

export function CreateBolaoStepRail({
  activeStep,
  steps,
  onStepClick,
}: {
  activeStep: number;
  steps?: StepRailItem[];
  onStepClick?: (step: number) => void;
}) {
  const { t } = useTranslation("bolao");
  const resolvedSteps = steps ?? [
    { number: 1, label: t("creation.steps.identity"), tone: "green" },
    { number: 2, label: t("creation.steps.games"), tone: "blue" },
    { number: 3, label: t("creation.steps.context"), tone: "cyan" },
    { number: 4, label: t("creation.steps.rules"), tone: "rose" },
    { number: 5, label: t("creation.steps.access"), tone: "orange" },
    { number: 6, label: t("creation.steps.publish"), tone: "gold" },
  ];

  return (
    <nav
      aria-label={t("creation.steps.aria_label")}
      className="sticky top-0 md:top-[72px] z-[100] flex w-full flex-row items-stretch gap-1.5 border-b border-white/10 bg-[#09090b] p-2 backdrop-blur-2xl shadow-xl shadow-black/40"
    >
      {resolvedSteps.map((step) => {
        const isDone = step.number < activeStep;
        const isActive = step.number === activeStep;
        const cfg = toneConfig[step.tone];

        return (
          <button
            key={step.number}
            type="button"
            onClick={() => {
              if (isDone && onStepClick) {
                onStepClick(step.number);
              }
            }}
            disabled={!isDone && !isActive}
            className={cn(
              "relative flex flex-1 min-w-[60px] flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border py-2 transition-all duration-300 md:min-w-[100px]",
              isActive ? cfg.active : isDone ? cfg.done : cfg.idle,
              isDone && onStepClick ? "cursor-pointer hover:brightness-110" : "cursor-default"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-black md:h-5 md:w-5 md:text-[11px]",
                isActive ? "bg-white text-black" : isDone ? "bg-current/30" : "bg-current/20",
              )}
            >
              {isDone ? <Check className="h-3 w-3 md:h-3.5 md:w-3.5" /> : step.number}
            </span>

            <span className={cn(
              "truncate text-[9px] font-black uppercase tracking-tighter md:text-[10px]",
              isActive ? "text-white" : "opacity-70"
            )}>
              {step.label.split(" ")[0]}
            </span>

            {isActive && (
              <div className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

