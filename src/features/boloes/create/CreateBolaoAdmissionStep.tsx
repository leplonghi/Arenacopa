import type { AccessMode, useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

function getOptions(flow: Flow): Array<{ id: AccessMode; title: string; description: string }> {
  const base = [
    {
      id: "approval" as const,
      title: "Privado com aprovação",
      description: "A pessoa pede entrada e o dono do bolão decide com calma.",
    },
    {
      id: "public" as const,
      title: "Público",
      description: "A entrada é direta enquanto o bolão estiver aberto.",
    },
  ];

  if (flow.state.contextMode !== "standalone") {
    base.push({
      id: "group_gated",
      title: "Controlado pelo grupo",
      description: "Só entra no bolão quem já faz parte do grupo vinculado.",
    });
  }

  return base;
}

export function CreateBolaoAdmissionStep({ flow }: { flow: Flow }) {
  const options = getOptions(flow);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-white">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Etapa 3 de 4</p>
      <h1 className="mt-2 text-3xl font-black">Como as pessoas entram?</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Aqui você define a expectativa do convite. Isso precisa ficar claro desde o primeiro link.
      </p>

      <div className="mt-8 grid gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => flow.setState((current) => ({ ...current, accessMode: option.id }))}
            className={`rounded-3xl border p-4 text-left transition-colors ${
              flow.state.accessMode === option.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
            }`}
          >
            <p className="font-black">{option.title}</p>
            <p className="mt-1 text-sm text-zinc-400">{option.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
        <p className="font-black text-white">Resumo da decisão</p>
        <p className="mt-2">
          {flow.state.accessMode === "group_gated"
            ? "O link do bolão vai orientar a pessoa a entrar no grupo antes."
            : flow.state.accessMode === "public"
              ? "O link do bolão deixa claro que a entrada é direta."
              : "O link do bolão deixa claro que a entrada depende de aprovação."}
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => flow.setStep("type")}
          className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white"
        >
          Voltar
        </button>
        <button
          onClick={() => flow.setStep("review")}
          disabled={!flow.canAdvance}
          className="rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
