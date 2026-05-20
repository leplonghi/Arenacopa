import {
  ArrowRight,
  Globe2,
  ListChecks,
  Lock,
  Users,
  Info,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  type AccessMode,
  type PoolTypeId,
  type SocialAudience,
  type useBolaoCreateFlow,
} from "@/features/boloes/create/useBolaoCreateFlow";
import { getToneClasses } from "@/features/boloes/create/stepColors";
import { ArenaActionDock, ArenaCommandPanel } from "@/components/arena/ArenaExperience";
import { getArenaAssetSrc } from "@/lib/arena-assets";



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
  tone: "green" | "blue" | "gold";
};

const socialPresets: SocialPreset[] = [
  {
    id: "rapid",
    title: "Amigos/família",
    description: "Criar, convidar e palpitar sem configuração pesada.",
    accessMode: "approval",
    audience: "friends",
    icon: Users,
    entrance: "Código ou aprovação",
    whenToUse: "Turma, família ou escola",
    tone: "green",
  },
  {
    id: "complete",
    title: "Comunidade",
    description: "Controle de entrada e ranking compartilhado.",
    accessMode: "approval",
    audience: "community",
    icon: ListChecks,
    entrance: "Grupo ou aprovação",
    whenToUse: "Bairro, torcida ou trabalho",
    tone: "blue",
  },
  {
    id: "rapid",
    title: "Aberto",
    description: "Qualquer pessoa entra pelo link.",
    accessMode: "public",
    audience: "community",
    icon: Globe2,
    entrance: "Link compartilhado",
    whenToUse: "Ação aberta ou evento",
    tone: "gold",
  },
];

const howItWorksSteps = ["Criar bolão", "Convidar participantes", "Dar chutes", "Ver ranking"];

export function CreateBolaoQuickStep({ flow }: { flow: Flow }) {
  const tone = getToneClasses(1);
  const previewSrc = getArenaAssetSrc("generated/pool-create-preview.webp");

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



  return (
    <div className="mx-auto max-w-5xl text-white pt-4">
      <p className="break-words text-[10px] font-black uppercase leading-tight tracking-[0.2em] text-primary">
        Etapa 1 de 6
      </p>
      <h1 className="mt-2 break-words font-display text-[2.5rem] font-black uppercase leading-[0.9] tracking-[-0.02em] [overflow-wrap:anywhere]">
        Crie o bolão da turma
      </h1>
      <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-zinc-400">
        Um caminho social para amigos, família e grupos. Se a intenção for campanha comercial,
        use a área de negócios fora deste fluxo.
      </p>

      <ArenaCommandPanel
        image={{ src: previewSrc, alt: "", eager: true, position: "center" }}
        className="mt-5 min-h-[148px] p-4 sm:p-5"
      >
        <p className="arena-kicker text-primary">Preview do criador</p>
        <h2 className="mt-2 max-w-lg text-2xl font-black leading-tight text-white">
          Configure o essencial agora. Deixe regras finas para a revisão.
        </h2>
        <p className="mt-2 max-w-md text-xs font-semibold leading-5 text-zinc-400">
          Nome, tipo de turma e acesso resolvem a maior parte do fluxo. A barra inferior mantém o avanço sempre à mão no celular.
        </p>
      </ArenaCommandPanel>

      <div className="mt-5 grid gap-2.5">
        <input
          value={flow.state.name}
          onChange={(event) => flow.setState((current) => ({ ...current, name: event.target.value }))}
          placeholder="Nome do bolão"
          className="min-w-0 rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-2.5 text-base font-black text-white focus:border-primary/50 outline-none transition-colors"
        />
        <textarea
          value={flow.state.description}
          onChange={(event) => flow.setState((current) => ({ ...current, description: event.target.value }))}
          placeholder="Descrição curta (opcional)"
          className="min-h-[80px] min-w-0 rounded-[18px] border border-white/10 bg-white/[0.05] px-4 py-2.5 text-xs text-white focus:border-primary/50 outline-none transition-colors"
        />
      </div>

      <div className="mt-7">
        <p className="break-words text-xs font-black uppercase leading-tight tracking-[0.14em] text-zinc-300">
          Para quem é o bolão?
        </p>

        <TooltipProvider delayDuration={200}>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {socialPresets.map((preset) => {
              const selected =
                flow.state.selectedTypeId === preset.id &&
                flow.state.socialAudience === preset.audience &&
                ((preset.accessMode === "public" && flow.state.accessMode === "public") ||
                  (preset.accessMode !== "public" && flow.state.accessMode !== "public"));

              const Icon = preset.icon;

              const borderActiveMap = {
                green: "border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/50",
                blue: "border-blue-500 bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.25)] ring-1 ring-blue-400/50",
                gold: "border-amber-500 bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50",
              };
              
              const borderIdleMap = {
                green: "border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10",
                blue: "border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-blue-500/10",
                gold: "border-white/10 bg-white/5 hover:border-amber-500/50 hover:bg-amber-500/10",
              };

              const iconActiveMap = {
                green: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]",
                blue: "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]",
                gold: "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]",
              };

              const iconIdleMap = {
                green: "text-zinc-500",
                blue: "text-zinc-500",
                gold: "text-zinc-500",
              };

              return (
                <Tooltip key={`${preset.title}-${preset.accessMode}`}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Para quem: ${preset.title}`}
                      onClick={() => applySocialPreset(preset)}
                      className={cn(
                        "min-w-0 rounded-[10px] border p-1.5 text-left transition relative overflow-hidden",
                        selected
                          ? borderActiveMap[preset.tone]
                          : borderIdleMap[preset.tone],
                      )}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-1.5">
                        <div className="min-w-0 flex items-center gap-1.5">
                          <Icon className={cn("h-3.5 w-3.5 shrink-0", selected ? iconActiveMap[preset.tone] : iconIdleMap[preset.tone])} />
                          <p className={cn("break-words text-[11px] font-black leading-tight [overflow-wrap:anywhere]", selected ? "text-white" : "text-zinc-200")}>
                            {preset.title}
                          </p>
                        </div>
                        {preset.accessMode === "public" ? (
                          <Globe2 className={cn("h-3 w-3 shrink-0", selected ? iconActiveMap[preset.tone] : "text-white/40")} />
                        ) : (
                          <Lock className={cn("h-3 w-3 shrink-0", selected ? iconActiveMap[preset.tone] : "text-white/40")} />
                        )}
                      </div>
                      <div className="mt-1 flex gap-1 text-[7px] text-zinc-300">
                        <span className="min-w-0 rounded border border-white/5 bg-black/40 px-1 py-0.5 truncate">
                          <strong className="mr-1 uppercase tracking-wider text-zinc-500">Acesso:</strong>
                          {preset.entrance}
                        </span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-900 border-zinc-800 text-zinc-200" side="bottom">
                    <p className="text-xs font-medium max-w-[200px]">{preset.description}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Uso: {preset.whenToUse}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
        {selectedPreset ? (
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Selecionado: <span className={cn("font-black", tone.text)}>{selectedPreset.title}</span>. Você ainda pode trocar antes de avançar.
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-[18px] border border-white/10 bg-white/[0.02] px-4 py-3">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between min-w-0 text-[11px] font-black uppercase leading-tight tracking-[0.14em] text-primary">
            Como funciona
            <Info className="h-3.5 w-3.5 text-primary opacity-60 group-open:opacity-100" />
          </summary>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
            {howItWorksSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-1.5 rounded-full border border-white/5 bg-black/20 px-2.5 py-1">
                <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-primary text-[8px] font-black text-black">
                  {index + 1}
                </span>
                <span className="font-bold text-zinc-300">{step}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-black/20 px-2.5 py-1">
               <span className="font-bold text-zinc-300">Pontuação: 10 pts exato, 5 pts vencedor.</span>
            </div>
          </div>
        </details>
      </div>
      <ArenaActionDock className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="hidden text-xs font-bold text-zinc-400 sm:block">
            Etapa rápida pronta para virar convite.
          </p>
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
      </ArenaActionDock>
    </div>
  );
}
