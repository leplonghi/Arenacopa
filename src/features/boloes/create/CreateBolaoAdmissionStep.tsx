import { useTranslation } from "react-i18next";
import type { AccessMode, useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";
import { CreateBolaoStepRail } from "@/features/boloes/create/CreateBolaoStepRail";
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
    <div className="mx-auto max-w-3xl px-4 py-8 text-white">
      <div className="mb-8">
        <CreateBolaoStepRail activeStep={5} />
      </div>
      <p className={cn("text-[11px] font-black uppercase tracking-[0.22em]", tone.labelText)}>
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
            onClick={() => flow.setState((current) => ({ ...current, accessMode: option.id }))}
            className={cn(
              "rounded-3xl border p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
              flow.state.accessMode === option.id ? cn(tone.border, tone.bg) : "border-white/10 bg-white/5 hover:bg-white/10"
            )}
          >
            <p className="font-black">{option.title}</p>
            <p className="mt-1 text-sm text-zinc-400">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
        <p className="font-black text-white">{t("creation.admission.summary_title")}</p>
        <p className="mt-2">
          {flow.state.accessMode === "group_gated"
            ? t("creation.admission.summary.group_gated")
            : flow.state.accessMode === "public"
              ? t("creation.admission.summary.public")
              : t("creation.admission.summary.approval")}
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => flow.setStep("type")}
          className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white hover:bg-white/5 transition-colors"
        >
          {t("wizard.back")}
        </button>
        <button
          onClick={() => flow.setStep("review")}
          disabled={!flow.canAdvance}
          className="rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
        >
          {t("wizard.next")}
        </button>
      </div>
    </div>
  );
}
