import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Globe2,
  Lock,
  Settings2,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRESETS, type AccessMode, type PoolTypeId, type SocialAudience, type useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";
import { commercialPlanCatalog } from "@/lib/commercial-campaign-pricing";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

type PersonalPreset = {
  id: PoolTypeId;
  title: string;
  description: string;
  accessMode: AccessMode;
  audience: SocialAudience;
};

const personalPresets: PersonalPreset[] = [
  {
    id: "rapid",
    title: "Rapido",
    description: "Privado, leve e pronto para a turma entrar sem rodeio.",
    accessMode: "approval",
    audience: "friends",
  },
  {
    id: "complete",
    title: "Completo",
    description: "Mais mercados e configuracao mais rica para quem quer aprofundar.",
    accessMode: "approval",
    audience: "friends",
  },
  {
    id: "complete",
    title: "Comunidade",
    description: "Bom para grupos maiores, escola, trabalho, bairro ou torcida organizada.",
    accessMode: "approval",
    audience: "community",
  },
  {
    id: "rapid",
    title: "Publico por link",
    description: "Deixe o acesso aberto para quem chegar pelo convite compartilhado.",
    accessMode: "public",
    audience: "community",
  },
];

const businessPlans = [
  commercialPlanCatalog.single_match,
  commercialPlanCatalog.five_matches,
  commercialPlanCatalog.short_championship,
  commercialPlanCatalog.full_cup,
];

export function CreateBolaoQuickStep({ flow }: { flow: Flow }) {
  const navigate = useNavigate();

  const applyPersonalPreset = (preset: PersonalPreset) => {
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

  const continueToBusiness = () => {
    navigate(`/campanhas/criar?plan=${flow.state.commercialPlanId}`);
  };

  const isPersonal = flow.state.audienceMode === "personal";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 text-white">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Etapa 1 de 2</p>
      <h1 className="mt-2 text-3xl font-black">Escolha como vamos criar</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
        Se for para sua turma, o fluxo continua gratis e direto. Se for para negocio, empresa ou evento, a campanha segue para checkout e publicacao comercial.
      </p>

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => flow.setState((current) => ({ ...current, audienceMode: "personal" }))}
          className={cn(
            "rounded-[28px] border p-5 text-left transition",
            isPersonal
              ? "border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(145,255,59,0.14)]"
              : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Gratis</p>
              <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-white">
                <Users className="h-6 w-6 text-primary" />
                Bolao da Turma
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                Para turma, equipe, escola, comunidade, torcida ou qualquer grupo que so quer jogar junto.
              </p>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              Sem plano pago
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => flow.setState((current) => ({ ...current, audienceMode: "business" }))}
          className={cn(
            "rounded-[28px] border p-5 text-left transition",
            !isPersonal
              ? "border-[#ffc54d]/35 bg-[#ffc54d]/[0.08] shadow-[0_0_0_1px_rgba(255,197,77,0.16)]"
              : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#ffc54d]">Negocios</p>
              <h2 className="mt-2 flex items-center gap-2 text-2xl font-black text-white">
                <BriefcaseBusiness className="h-6 w-6 text-[#ffc54d]" />
                ArenaCup para Negocios
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                Para bares, marcas, empresas, eventos e operacoes que precisam de campanha, QR, alcance e checkout.
              </p>
            </div>
            <span className="rounded-full border border-[#ffc54d]/25 bg-[#ffc54d]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#ffc54d]">
              Stripe Checkout
            </span>
          </div>
        </button>
      </div>

      {isPersonal ? (
        <>
          <div className="mt-7 grid gap-3">
            <input
              value={flow.state.name}
              onChange={(event) => flow.setState((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nome do bolao"
              className="rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-lg font-black text-white"
            />
            <textarea
              value={flow.state.description}
              onChange={(event) => flow.setState((current) => ({ ...current, description: event.target.value }))}
              placeholder="Descricao curta, opcional"
              className="min-h-[96px] rounded-[22px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white"
            />
          </div>

          <div className="mt-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Modelos gratuitos</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {personalPresets.map((preset) => {
                const selected =
                  flow.state.selectedTypeId === preset.id &&
                  flow.state.socialAudience === preset.audience &&
                  ((preset.accessMode === "public" && flow.state.accessMode === "public") ||
                    (preset.accessMode !== "public" && flow.state.accessMode !== "public"));

                return (
                  <button
                    key={`${preset.title}-${preset.accessMode}`}
                    type="button"
                    onClick={() => applyPersonalPreset(preset)}
                    className={cn(
                      "rounded-[24px] border p-4 text-left transition",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{preset.title}</p>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">{preset.description}</p>
                      </div>
                      {preset.accessMode === "public" ? (
                        <Globe2 className="h-5 w-5 shrink-0 text-primary" />
                      ) : (
                        <Lock className="h-5 w-5 shrink-0 text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-300">Personalizar regras e acesso</p>
            </div>

            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">Contexto</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { id: "standalone", title: "Sem grupo" },
                    { id: "new_group", title: "Criar grupo junto" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        flow.setState((current) => ({
                          ...current,
                          contextMode: option.id as "standalone" | "new_group",
                          accessMode:
                            option.id === "new_group"
                              ? "group_gated"
                              : current.accessMode === "group_gated"
                                ? "approval"
                                : current.accessMode,
                        }))
                      }
                      className={cn(
                        "rounded-[18px] border px-4 py-3 text-left text-sm font-black",
                        flow.state.contextMode === option.id
                          ? "border-primary bg-primary/10"
                          : "border-white/10 bg-black/20",
                      )}
                    >
                      {option.title}
                    </button>
                  ))}
                </div>

                {flow.state.contextMode === "new_group" ? (
                  <div className="grid gap-3">
                    <input
                      value={flow.state.newGroupName}
                      onChange={(event) => flow.setState((current) => ({ ...current, newGroupName: event.target.value }))}
                      placeholder="Nome do grupo"
                      className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                    />
                    <input
                      value={flow.state.newGroupDescription}
                      onChange={(event) => flow.setState((current) => ({ ...current, newGroupDescription: event.target.value }))}
                      placeholder="Descricao do grupo, opcional"
                      className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">Entrada e visibilidade</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { id: "approval", title: "Privado com aprovacao", icon: Lock },
                    { id: "public", title: "Publico por link", icon: Globe2 },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        flow.setState((current) => ({
                          ...current,
                          accessMode:
                            current.contextMode !== "standalone" && option.id === "approval"
                              ? "group_gated"
                              : (option.id as AccessMode),
                        }))
                      }
                      className={cn(
                        "rounded-[18px] border px-4 py-3 text-left text-sm font-black",
                        (option.id === "public" && flow.state.accessMode === "public") ||
                          (option.id === "approval" && flow.state.accessMode !== "public")
                          ? "border-primary bg-primary/10"
                          : "border-white/10 bg-black/20",
                      )}
                    >
                      <option.icon className="mb-2 h-4 w-4 text-primary" />
                      {option.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">Pontuacao</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { id: "conservative", title: "Leve" },
                    { id: "standard", title: "Equilibrada" },
                    { id: "risky", title: "Arriscada" },
                  ].map((option) => {
                    const selected = flow.state.scoringRules.exact === PRESETS[option.id as keyof typeof PRESETS].exact;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          flow.setState((current) => ({
                            ...current,
                            scoringRules: PRESETS[option.id as keyof typeof PRESETS],
                          }))
                        }
                        className={cn(
                          "rounded-[18px] border px-4 py-3 text-center text-sm font-black",
                          selected ? "border-primary bg-primary/10" : "border-white/10 bg-black/20",
                        )}
                      >
                        {option.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">Premiacao simbolica</p>
                <textarea
                  value={flow.state.prizeDistribution}
                  onChange={(event) => flow.setState((current) => ({ ...current, prizeDistribution: event.target.value }))}
                  placeholder="Opcional: trofeu, rodada paga, camisa, brinde interno ou reconhecimento simbolico."
                  className="min-h-[110px] rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-2 md:grid-cols-3">
              <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Mercados</p>
                <p className="mt-1 text-sm font-bold text-white">
                  {flow.state.selectedTypeId === "complete" ? "Completo" : "Rapido"}
                </p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Acesso</p>
                <p className="mt-1 text-sm font-bold text-white">
                  {flow.state.accessMode === "public" ? "Publico por link" : "Privado com aprovacao"}
                </p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Grupo</p>
                <p className="mt-1 text-sm font-bold text-white">
                  {flow.state.contextMode === "new_group" ? "Novo grupo junto" : "Bolao independente"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => flow.setStep("review")}
              disabled={!flow.canAdvance}
              className="inline-flex items-center gap-2 rounded-[20px] bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-50"
            >
              Revisar e publicar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mt-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Planos para negocios</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {businessPlans.map((plan) => {
                const selected = flow.state.commercialPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => flow.setState((current) => ({ ...current, commercialPlanId: plan.id }))}
                    className={cn(
                      "rounded-[24px] border p-4 text-left transition",
                      selected
                        ? "border-[#ffc54d]/35 bg-[#ffc54d]/[0.08]"
                        : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{plan.title}</p>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">{plan.description}</p>
                      </div>
                      <Sparkles className="h-5 w-5 shrink-0 text-[#ffc54d]" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-black text-[#ffc54d]">{plan.priceLabel}</span>
                      <span className="rounded-full border border-[#ffc54d]/20 bg-[#ffc54d]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#ffc54d]">
                        {plan.participantLimit.toLocaleString("pt-BR")} pessoas
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-7 rounded-[28px] border border-[#ffc54d]/20 bg-[#ffc54d]/[0.06] p-5">
            <div className="flex items-start gap-3">
              <Trophy className="mt-0.5 h-5 w-5 text-[#ffc54d]" />
              <div>
                <p className="text-sm font-black text-white">O caminho de negocios continua em um fluxo proprio.</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  La a gente coleta dados do negocio, escolhe jogo ou periodo, define beneficio simples e abre o checkout Stripe com o pacote de participantes selecionado.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={continueToBusiness}
              className="inline-flex items-center gap-2 rounded-[20px] bg-[#ffc54d] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black"
            >
              Continuar para negocios
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
