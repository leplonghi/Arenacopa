import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FinanceMode, PoolTypeId, useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";
import { cn } from "@/lib/utils";
import { getToneClasses } from "@/features/boloes/create/stepColors";



type Flow = ReturnType<typeof useBolaoCreateFlow>;

export function CreateBolaoRulesStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation("bolao");
  const tone = getToneClasses(4);


  const poolTypes: Array<{ id: PoolTypeId; title: string; description: string }> = [
    {
      id: "rapid",
      title: t("creation.rules.types.rapid.title"),
      description: t("creation.rules.types.rapid.desc"),
    },
    {
      id: "complete",
      title: t("creation.rules.types.complete.title"),
      description: t("creation.rules.types.complete.desc"),
    },
  ];



  const selectedType = poolTypes.find((tp) => tp.id === flow.state.selectedTypeId);
  const hasSelectedType = Boolean(selectedType);
  const cutoffOptions = [0, 5, 10, 15];





  return (
    <div className="mx-auto max-w-3xl pb-8 text-white">
      <p className={cn("mt-4 text-[11px] font-black uppercase tracking-[0.22em]", tone.labelText)}>
        {t("creation.rules.step_label")}
      </p>
      <h1 className="mt-2 text-3xl font-black">{t("creation.rules.title")}</h1>
      <p className="mt-2 text-sm text-zinc-400">{t("creation.rules.desc")}</p>

      {/* Pool type selection */}
      <div className="mt-8 grid gap-3">
        {poolTypes.map((type) => {
          const selected = flow.state.selectedTypeId === type.id;
          return (
            <button
              key={type.id}
              onClick={() => flow.setSelectedType(type.id)}
              className={cn(
                "rounded-[32px] border p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                selected ? cn(tone.border, tone.bg) : "border-white/10 bg-white/5 hover:bg-white/10"
              )}
            >
              <p className="text-[17px] font-black text-white">{type.title}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">{type.description}</p>
            </button>
          );
        })}
      </div>

      {hasSelectedType && (
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Cutoff tolerance */}
          <div className="mb-6 rounded-3xl border border-white/10 bg-[#0c1811] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
                  Tolerância para palpites
                </p>
                <p className="mt-2 text-sm text-zinc-300">
                  Até quantos minutos após o início o participante pode palpitar. Jogo finalizado nunca aceita palpite.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-center text-sm font-black text-primary">
                {flow.state.predictionCutoffMinutes} min
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {cutoffOptions.map((minutes) => {
                const selected = flow.state.predictionCutoffMinutes === minutes;
                return (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() =>
                      flow.setState((current) => ({ ...current, predictionCutoffMinutes: minutes }))
                    }
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-[11px] font-black uppercase tracking-[0.16em] transition-all",
                      selected
                        ? cn(tone.border, tone.bg, "text-white")
                        : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                    )}
                  >
                    {minutes === 0 ? "Início" : `+${minutes} min`}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => flow.setStep("context")}
          className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white hover:bg-white/5 transition-colors"
        >
          {t("wizard.back")}
        </button>
        <button
          onClick={() => flow.setStep("admission")}
          disabled={!flow.canAdvance}
          className="rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
        >
          {t("wizard.next")}
        </button>
      </div>
    </div>
  );
}
