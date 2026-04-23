import type { FinanceMode, PoolTypeId, useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

const poolTypes: Array<{ id: PoolTypeId; title: string; description: string }> = [
  { id: "rapid", title: "Rápido", description: "Leve, direto e sem excesso de regra." },
  { id: "complete", title: "Completo", description: "Mais mercados, mais profundidade e mais jornada." },
  { id: "paid", title: "Valendo grana", description: "Começa pelo essencial e só abre o financeiro quando fizer sentido." },
];

const financeModes: Array<{ id: FinanceMode; title: string; description: string }> = [
  { id: "free", title: "Sem dinheiro", description: "O bolão segue limpo, sem valor de entrada." },
  { id: "paid_external", title: "Pago por fora", description: "O app registra, mas o acerto acontece fora dele." },
];

export function CreateBolaoRulesStep({ flow }: { flow: Flow }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-white">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Etapa 2 de 4</p>
      <h1 className="mt-2 text-3xl font-black">Que tipo de bolão você quer montar?</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Primeiro você escolhe o estilo. O avançado só aparece quando realmente precisa.
      </p>

      <div className="mt-8 grid gap-3">
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
              <p className="mt-1 text-sm text-zinc-400">{type.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Financeiro</p>
        <div className="mt-3 grid gap-3">
          {financeModes.map((mode) => {
            const selected = flow.state.financeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => flow.setState((current) => ({ ...current, financeMode: mode.id }))}
                className={`rounded-3xl border p-4 text-left transition-colors ${
                  selected ? "border-primary bg-primary/10" : "border-white/10 bg-[#0c1811]"
                }`}
              >
                <p className="text-sm font-black text-white">{mode.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{mode.description}</p>
              </button>
            );
          })}
        </div>

        {flow.state.financeMode === "paid_external" ? (
          <div className="mt-4 grid gap-3">
            <input
              value={flow.state.entryFee}
              onChange={(event) => {
                const numericValue = Number(event.target.value);
                flow.setState((current) => ({
                  ...current,
                  entryFee: Number.isFinite(numericValue) && numericValue > 0 ? numericValue : "",
                }));
              }}
              placeholder="Valor de entrada"
              className="rounded-2xl border border-white/10 bg-[#0c1811] px-4 py-3 text-sm text-white"
            />
            <textarea
              value={flow.state.paymentDetails}
              onChange={(event) => flow.setState((current) => ({ ...current, paymentDetails: event.target.value }))}
              placeholder="Explique como o pagamento acontece fora do app"
              className="min-h-[90px] rounded-2xl border border-white/10 bg-[#0c1811] px-4 py-3 text-sm text-white"
            />
            <input
              value={flow.state.prizeDistribution}
              onChange={(event) => flow.setState((current) => ({ ...current, prizeDistribution: event.target.value }))}
              placeholder="Como vai ser o rateio?"
              className="rounded-2xl border border-white/10 bg-[#0c1811] px-4 py-3 text-sm text-white"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => flow.setStep("context")}
          className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white"
        >
          Voltar
        </button>
        <button
          onClick={() => flow.setStep("admission")}
          disabled={!flow.canAdvance}
          className="rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
