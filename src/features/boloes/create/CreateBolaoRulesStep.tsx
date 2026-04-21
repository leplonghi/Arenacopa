import type { FinanceMode, PoolTypeId, useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

const poolTypes: Array<{ id: PoolTypeId; title: string; description: string }> = [
  { id: "rachao", title: "Rachão rápido", description: "Leve, direto e fácil de explicar." },
  { id: "campeonato", title: "Bolão de campeonato", description: "Mais completo, com regras e mercados extras." },
  { id: "classico", title: "Clássico valendo alto", description: "Mais agressivo na pontuação e na disputa." },
];

const financeModes: Array<{ id: FinanceMode; title: string; description: string }> = [
  { id: "free", title: "Grátis", description: "Sem valor de entrada." },
  { id: "paid_external", title: "Pago por fora", description: "O app registra o estado, mas o pagamento acontece fora dele." },
];

export function CreateBolaoRulesStep({ flow }: { flow: Flow }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-white">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">wizard.step_2_label</p>
      <h1 className="mt-2 text-3xl font-black">wizard.rules_step.title</h1>
      <p className="mt-2 text-sm text-zinc-400">wizard.rules_step.description</p>

      <div className="mt-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Tipo de bolão</p>
        <div className="mt-3 grid gap-3">
          {poolTypes.map((type) => {
            const selected = flow.state.selectedTypeId === type.id;
            return (
              <button
                key={type.id}
                onClick={() => flow.setSelectedType(type.id)}
                className={`rounded-3xl border p-4 text-left transition-colors ${
                  selected ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
                }`}
              >
                <p className="text-sm font-black text-white">{type.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Financeiro</p>
        <div className="mt-3 grid gap-3">
          {financeModes.map((mode) => {
            const selected = flow.state.financeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => flow.setState((current) => ({ ...current, financeMode: mode.id }))}
                className={`rounded-3xl border p-4 text-left transition-colors ${
                  selected ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
                }`}
              >
                <p className="text-sm font-black text-white">{mode.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{mode.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {flow.state.financeMode === "paid_external" && (
        <div className="mt-6 grid gap-3">
          <input
            value={flow.state.entryFee}
            onChange={(event) => {
              const numericValue = Number(event.target.value);
              flow.setState((current) => ({
                ...current,
                entryFee: Number.isFinite(numericValue) ? numericValue : "",
              }));
            }}
            placeholder="Valor de entrada"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
          <textarea
            value={flow.state.paymentDetails}
            onChange={(event) => flow.setState((current) => ({ ...current, paymentDetails: event.target.value }))}
            placeholder="Como o pagamento acontece fora do app?"
            className="min-h-[100px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          />
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => flow.setStep("context")}
          className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white"
        >
          wizard.back
        </button>
        <button
          onClick={() => flow.setStep("review")}
          className="rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black"
        >
          wizard.next
        </button>
      </div>
    </div>
  );
}
