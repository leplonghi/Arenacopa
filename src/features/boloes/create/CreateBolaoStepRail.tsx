import { cn } from "@/lib/utils";

type StepTone = "green" | "gold" | "cyan" | "rose";

type StepRailItem = {
  number: number;
  label: string;
  tone: StepTone;
};

const toneClasses: Record<StepTone, string> = {
  green: "border-primary/40 bg-primary/[0.12] text-primary shadow-[0_0_18px_rgba(145,255,59,0.12)]",
  gold: "border-[#ffc54d]/40 bg-[#ffc54d]/[0.12] text-[#ffc54d] shadow-[0_0_18px_rgba(255,197,77,0.12)]",
  cyan: "border-cyan-300/35 bg-cyan-300/[0.10] text-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.10)]",
  rose: "border-rose-300/35 bg-rose-300/[0.10] text-rose-200 shadow-[0_0_18px_rgba(253,164,175,0.10)]",
};

export function CreateBolaoStepRail({
  activeStep,
  steps = [
    { number: 1, label: "Escolha", tone: "green" },
    { number: 2, label: "Publicar", tone: "gold" },
  ],
}: {
  activeStep: number;
  steps?: StepRailItem[];
}) {
  return (
    <div className="mb-6 grid gap-2 sm:grid-cols-2" aria-label="Etapas sequenciais do bolão">
      {steps.map((step) => {
        const active = step.number === activeStep;
        return (
          <div
            key={step.number}
            aria-label={`Etapa ${step.number}: ${step.label}`}
            data-tone={step.tone}
            className={cn(
              "rounded-[20px] border px-4 py-3 transition",
              toneClasses[step.tone],
              active ? "opacity-100" : "opacity-55",
            )}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.18em]">Etapa {step.number}</p>
            <p className="mt-1 text-sm font-black text-white">{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}
