import type { GroupBindingMode, JoinMode, useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

const bindingModes: Array<{ id: GroupBindingMode; title: string; description: string }> = [
  { id: "none", title: "Sem grupo", description: "O bolão nasce independente e você decide os convites depois." },
  { id: "linked_discovery", title: "Grupo como vitrine", description: "O grupo ajuda a descobrir o bolão, mas a entrada pode continuar aberta." },
  { id: "group_gated", title: "Grupo controla a entrada", description: "Quem entra no bolão precisa estar no grupo vinculado." },
];

const joinModes: Array<{ id: JoinMode; title: string; description: string }> = [
  { id: "private_invite", title: "Privado por convite", description: "Entram apenas pessoas convidadas ou aprovadas." },
  { id: "public_open", title: "Público", description: "Qualquer pessoa pode entrar enquanto o bolão estiver aberto." },
];

export function CreateBolaoContextStep({ flow }: { flow: Flow }) {
  const availableBindingModes = flow.state.selectedGrupoId
    ? bindingModes
    : bindingModes.filter((mode) => mode.id === "none");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-white">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">wizard.step_1_label</p>
      <h1 className="mt-2 text-3xl font-black">wizard.context_step.title</h1>
      <p className="mt-2 text-sm text-zinc-400">wizard.context_step.description</p>

      <div className="mt-8 grid gap-3">
        {availableBindingModes.map((mode) => {
          const selected = flow.state.groupBindingMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => flow.setState((current) => ({ ...current, groupBindingMode: mode.id }))}
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

      <div className="mt-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Quem pode entrar</p>
        <div className="mt-3 grid gap-3">
          {joinModes
            .filter((mode) => !(flow.state.groupBindingMode === "group_gated" && mode.id === "public_open"))
            .map((mode) => {
              const selected = flow.state.joinMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => flow.setState((current) => ({ ...current, joinMode: mode.id }))}
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

      <div className="mt-8 flex justify-end">
        <button
          onClick={() => flow.setStep("rules")}
          className="rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black"
        >
          wizard.next
        </button>
      </div>
    </div>
  );
}
