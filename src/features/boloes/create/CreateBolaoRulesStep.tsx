import { useTranslation } from "react-i18next";
import type { FinanceMode, PoolTypeId, useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";
import { CreateBolaoStepRail } from "@/features/boloes/create/CreateBolaoStepRail";
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
      description: t("creation.rules.types.rapid.desc") 
    },
    { 
      id: "complete", 
      title: t("creation.rules.types.complete.title"), 
      description: t("creation.rules.types.complete.desc") 
    },
    { 
      id: "paid", 
      title: t("creation.rules.types.paid.title"), 
      description: t("creation.rules.types.paid.desc") 
    },
  ];

  const financeModes: Array<{ id: FinanceMode; title: string; description: string }> = [
    { 
      id: "free", 
      title: t("creation.rules.finance.free.title"), 
      description: t("creation.rules.finance.free.desc") 
    },
    { 
      id: "paid_external", 
      title: t("creation.rules.finance.paid_external.title"), 
      description: t("creation.rules.finance.paid_external.desc") 
    },
  ];

  const selectedType = poolTypes.find((t) => t.id === flow.state.selectedTypeId);
  const hasSelectedType = Boolean(selectedType);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-white">
      <div className="mb-8">
        <CreateBolaoStepRail activeStep={4} />
      </div>
      <p className={cn("text-[11px] font-black uppercase tracking-[0.22em]", tone.labelText)}>
        {t("creation.rules.step_label")}
      </p>
      <h1 className="mt-2 text-3xl font-black">{t("creation.rules.title")}</h1>
      <p className="mt-2 text-sm text-zinc-400">
        {t("creation.rules.desc")}
      </p>

      <div className="mt-8 grid gap-3">
        {hasSelectedType && selectedType ? (
          <div className={cn("rounded-3xl border p-4", tone.border, tone.bg)}>
            <p className="text-sm font-black text-white">{selectedType.title}</p>
            <p className="mt-1 text-sm text-zinc-400">{selectedType.description}</p>
          </div>
        ) : (
          poolTypes.map((type) => {
            const selected = flow.state.selectedTypeId === type.id;
            return (
              <button
                key={type.id}
                onClick={() => flow.setSelectedType(type.id)}
                className={cn(
                  "rounded-3xl border p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                  selected ? cn(tone.border, tone.bg) : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                <p className="text-sm font-black text-white">{type.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{type.description}</p>
              </button>
            );
          })
        )}
      </div>

      {hasSelectedType && (
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            {t("creation.rules.finance_label")}
          </p>
          
          {flow.state.financeMode ? (
            <div className="mt-3">
              {financeModes.map((mode) => {
                const selected = flow.state.financeMode === mode.id;
                if (!selected) return null;
                return (
                  <div key={mode.id} className={cn("rounded-3xl border p-4", tone.border, tone.bg)}>
                    <p className="text-sm font-black text-white">{mode.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{mode.description}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 grid gap-3">
              {financeModes.map((mode) => {
                const selected = flow.state.financeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => flow.setState((current) => ({ ...current, financeMode: mode.id }))}
                    className={cn(
                      "rounded-3xl border p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                      selected ? cn(tone.border, tone.bg) : "border-white/10 bg-[#0c1811] hover:bg-white/5"
                    )}
                  >
                    <p className="text-sm font-black text-white">{mode.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{mode.description}</p>
                  </button>
                );
              })}
            </div>
          )}

          {flow.state.financeMode === "paid_external" ? (
            <div className="mt-4 grid gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <input
                value={flow.state.entryFee}
                onChange={(event) => {
                  const numericValue = Number(event.target.value);
                  flow.setState((current) => ({
                    ...current,
                    entryFee: Number.isFinite(numericValue) && numericValue > 0 ? numericValue : "",
                  }));
                }}
                placeholder={t("creation.rules.placeholder_fee")}
                className="rounded-2xl border border-white/10 bg-[#0c1811] px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
              />
              <textarea
                value={flow.state.paymentDetails}
                onChange={(event) => flow.setState((current) => ({ ...current, paymentDetails: event.target.value }))}
                placeholder={t("creation.rules.placeholder_payment")}
                className="min-h-[90px] rounded-2xl border border-white/10 bg-[#0c1811] px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
              />
              <input
                value={flow.state.prizeDistribution}
                onChange={(event) => flow.setState((current) => ({ ...current, prizeDistribution: event.target.value }))}
                placeholder={t("creation.rules.placeholder_prize")}
                className="rounded-2xl border border-white/10 bg-[#0c1811] px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
              />
            </div>
          ) : null}
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
