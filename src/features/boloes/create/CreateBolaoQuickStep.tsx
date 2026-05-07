import {
  ArrowRight,
  Globe2,
  ListChecks,
  Lock,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateBolaoStepRail } from "@/features/boloes/create/CreateBolaoStepRail";
import {
  type AccessMode,
  type PoolTypeId,
  type SocialAudience,
  type useBolaoCreateFlow,
} from "@/features/boloes/create/useBolaoCreateFlow";
import { getToneClasses } from "@/features/boloes/create/stepColors";
import { tStatic } from "@/i18n/staticText";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

type SocialPreset = {
  id: PoolTypeId;
  title: string;
  description: string;
  accessMode: AccessMode;
  audience: SocialAudience;
  icon: LucideIcon;
  entrance: string;
  whenToUse: string;
};

const socialPresets: SocialPreset[] = [
  {
    id: "rapid",
    title: "Amigos/família",
    description: "Para grupos pequenos que querem criar, convidar e palpitar sem configuração pesada.",
    accessMode: "approval",
    audience: "friends",
    icon: Users,
    entrance: "Código ou aprovação",
    whenToUse: "Turma, família, escola ou equipe",
  },
  {
    id: "complete",
    title: "Comunidade",
    description: "Para grupos maiores ou recorrentes, com controle de entrada e ranking compartilhado.",
    accessMode: "approval",
    audience: "community",
    icon: ListChecks,
    entrance: "Grupo ou aprovação",
    whenToUse: "Bairro, torcida, curso, clube ou trabalho",
  },
  {
    id: "rapid",
    title: "Aberto por link",
    description: "Para divulgar o convite e deixar qualquer pessoa entrar pelo link compartilhado.",
    accessMode: "public",
    audience: "community",
    icon: Globe2,
    entrance: "Link compartilhado",
    whenToUse: "Rede social, evento ou ação aberta",
  },
];

const howItWorksSteps = ["Criar bolão", "Convidar participantes", "Dar chutes", "Ver ranking"];

export function CreateBolaoQuickStep({ flow }: { flow: Flow }) {
  const tone = getToneClasses(1);

  const applySocialPreset = (preset: SocialPreset) => {
    flow.setSelectedType(preset.id);
    flow.setState((current) => ({
      ...current,
      audienceMode: "personal",
      selectedTypeId: preset.id,
      socialAudience: preset.audience,
      financeMode: "free",
      accessMode:
        current.contextMode !== "standalone" && preset.accessMode === "approval"
          ? "group_gated"
          : preset.accessMode,
    }));
  };

  const selectedPreset = socialPresets.find((preset) => {
    const isMatch =
      flow.state.selectedTypeId === preset.id &&
      flow.state.socialAudience === preset.audience &&
      ((preset.accessMode === "public" && flow.state.accessMode === "public") ||
        (preset.accessMode !== "public" && flow.state.accessMode !== "public"));
    return isMatch;
  });

  const hasSelectedPreset = Boolean(selectedPreset);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-white">
      <CreateBolaoStepRail activeStep={1} />
      <p className="break-words text-[11px] font-black uppercase leading-tight tracking-[0.18em] text-primary">
        Etapa 1 de 6
      </p>
      <h1 className="mt-2 break-words font-display text-[2.35rem] font-black uppercase leading-tight tracking-[0.02em] [overflow-wrap:anywhere]">
        Crie o bolão da turma
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
        Um caminho social para amigos, família e comunidades. Se a intenção for campanha comercial,
        use a área de negócios fora deste fluxo.
      </p>

      <div className="mt-7 grid gap-3">
        <input
          value={flow.state.name}
          onChange={(event) => flow.setState((current) => ({ ...current, name: event.target.value }))}
          placeholder="Nome do bolao"
          className="min-w-0 rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-lg font-black text-white"
        />
        <textarea
          value={flow.state.description}
          onChange={(event) => flow.setState((current) => ({ ...current, description: event.target.value }))}
          placeholder="Descricao curta, opcional"
          className="min-h-[96px] min-w-0 rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white"
        />
      </div>

      <div className="mt-7">
        <p className="break-words text-xs font-black uppercase leading-tight tracking-[0.14em] text-zinc-300">
          Para quem é o bolão?
        </p>

        {hasSelectedPreset && selectedPreset ? (
          <div className={cn("mt-3 rounded-[24px] border p-4", tone.border, tone.bg)}>
            <div className="flex items-center gap-3">
              <selectedPreset.icon className={cn("h-5 w-5 shrink-0", tone.text)} />
              <div>
                <p className="text-sm font-black text-white">{selectedPreset.title}</p>
                <p className="text-xs text-zinc-400">{selectedPreset.description}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {socialPresets.map((preset) => {
              const selected =
                flow.state.selectedTypeId === preset.id &&
                flow.state.socialAudience === preset.audience &&
                ((preset.accessMode === "public" && flow.state.accessMode === "public") ||
                  (preset.accessMode !== "public" && flow.state.accessMode !== "public"));

              const Icon = preset.icon;

              return (
                <button
                  key={`${preset.title}-${preset.accessMode}`}
                  type="button"
                  aria-label={`Para quem: ${preset.title}`}
                  onClick={() => applySocialPreset(preset)}
                  className={cn(
                    "min-w-0 rounded-[24px] border p-4 text-left transition",
                    selected
                      ? cn(tone.border, tone.bg, tone.shadow, "ring-1", tone.ring)
                      : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]",
                  )}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon className={cn("h-5 w-5 shrink-0", selected ? tone.text : "text-primary")} />
                        <p className="break-words text-sm font-black leading-tight text-white [overflow-wrap:anywhere]">
                          {preset.title}
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">{preset.description}</p>
                    </div>
                    {preset.accessMode === "public" ? (
                      <Globe2 className={cn("h-5 w-5 shrink-0", selected ? tone.text : "text-primary")} />
                    ) : (
                      <Lock className={cn("h-5 w-5 shrink-0", selected ? tone.text : "text-primary")} />
                    )}
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-zinc-300">
                    <span className="min-w-0 rounded-[14px] border border-white/10 bg-black/20 px-3 py-2">
                      <strong className="block break-words text-[10px] uppercase leading-tight tracking-[0.12em] text-zinc-500">
                        Entrada
                      </strong>
                      {preset.entrance}
                    </span>
                    <span className="min-w-0 rounded-[14px] border border-white/10 bg-black/20 px-3 py-2">
                      <strong className="block break-words text-[10px] uppercase leading-tight tracking-[0.12em] text-zinc-500">
                        Uso ideal
                      </strong>
                      {preset.whenToUse}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-7 grid gap-3 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="break-words text-xs font-black uppercase leading-tight tracking-[0.14em] text-primary">
            Como funciona
          </p>
          <div className="mt-4 grid gap-2">
            {howItWorksSteps.map((step, index) => (
              <div key={step} className="flex min-w-0 items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-black">
                  {index + 1}
                </span>
                <span className="min-w-0 break-words text-sm font-bold text-white">{step}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
          <p className="break-words text-sm font-black text-white">{tStatic("Pontuação padrão")}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            10 pontos para placar exato, 5 pontos para acertar vencedor ou empate, e ranking
            atualizado conforme os resultados forem apurados.
          </p>
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            O ArenaCup organiza chutes, regras e rankings. O app não processa apostas nem
            premiações em dinheiro.
          </p>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={() => flow.setStep("catalog")}
          disabled={!flow.canAdvance}
          className="inline-flex min-w-0 items-center gap-2 whitespace-normal rounded-[20px] bg-primary px-5 py-3 text-center text-[11px] font-black uppercase leading-tight tracking-[0.14em] text-black disabled:opacity-50"
        >
          Avançar
          <ArrowRight className="h-4 w-4 shrink-0" />
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
      <p className="break-words text-[10px] font-black uppercase leading-tight tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-white [overflow-wrap:anywhere]">{value}</p>
    </div>
  );
}
