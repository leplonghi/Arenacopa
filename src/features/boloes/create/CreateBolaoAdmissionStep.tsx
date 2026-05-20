import { useTranslation } from "react-i18next";
import type { AccessMode, useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";
import { ArrowRight, Globe, Lock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToneClasses } from "@/features/boloes/create/stepColors";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

export function CreateBolaoAdmissionStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation("bolao");
  const tone = getToneClasses(5);

  const getOptions = (): Array<{ id: AccessMode; title: string; description: string }> => {
    const base = [
      {
        id: "approval" as const,
        title: t("creation.admission.modes.approval.title"),
        description: t("creation.admission.modes.approval.desc"),
      },
      {
        id: "public" as const,
        title: t("creation.admission.modes.public.title"),
        description: t("creation.admission.modes.public.desc"),
      },
    ];

    if (flow.state.contextMode !== "standalone") {
      base.push({
        id: "group_gated",
        title: t("creation.admission.modes.group_gated.title"),
        description: t("creation.admission.modes.group_gated.desc"),
      });
    }

    return base;
  };

  const options = getOptions();

  return (
    <div className="mx-auto max-w-5xl pb-8 text-white">
      <p className="break-words text-[11px] font-black uppercase leading-tight tracking-[0.2em] text-primary mt-4">
        {t("creation.admission.step_label")}
      </p>
      <h1 className="mt-2 text-3xl font-black">{t("creation.admission.title")}</h1>
      <p className="mt-2 text-sm text-zinc-400">
        {t("creation.admission.desc")}
      </p>

      <div className="mt-8 grid gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => flow.setState((s) => ({ ...s, accessMode: option.id }))}
            className={cn(
              "flex flex-col items-start gap-2 rounded-[20px] border p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]",
              flow.state.accessMode === option.id
                ? cn(tone.border, tone.bg, tone.shadow, "ring-1", tone.ring)
                : "border-white/10 bg-black/20 hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-3">
               <div className={cn("p-2 rounded-lg", flow.state.accessMode === option.id ? "bg-white/10" : "bg-black/20")}>
                  {option.id === 'public' && <Globe className="h-5 w-5" />}
                  {option.id === 'approval' && <Lock className="h-5 w-5" />}
                  {option.id === 'group_gated' && <ShieldAlert className="h-5 w-5" />}
               </div>
               <p className="text-base font-black text-white">{option.title}</p>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-10 flex justify-between">
        <button
          type="button"
          onClick={() => flow.setStep("type")}
          className="inline-flex items-center gap-2 rounded-[20px] border border-white/10 bg-black/20 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-zinc-400 transition-all hover:bg-white/5"
        >
          {t("wizard.back")}
        </button>
        <button
          type="button"
          onClick={() => flow.setStep("review")}
          disabled={!flow.canAdvance}
          className="inline-flex items-center gap-2 rounded-[20px] bg-primary px-8 py-3.5 text-xs font-black uppercase tracking-widest text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {t("wizard.next")}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
