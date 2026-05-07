import { useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, Loader2, MapPin, ShieldAlert, Store, Ticket } from "lucide-react";
import { ArenaHint, ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useDashboardMatches } from "@/hooks/useDashboardMatches";
import { normalizeBenefitCode, validateCommercialBenefitText } from "@/lib/commercial-campaign";
import { commercialPlanCatalog, commercialPlanOrder, getCommercialPlanDefinition } from "@/lib/commercial-campaign-pricing";
import {
  buildCampaignTitleFromMatch,
  filterFutureMatchesForCampaign,
  formatCep,
  formatWhatsapp,
  lookupCep,
  normalizeInstagramHandle,
  normalizeWhatsapp,
  validateCampaignPeriod,
  validateCep,
  validateWhatsapp,
} from "@/lib/commercial-campaign-input";
import {
  createCommercialCampaignDraft,
  listManagedMerchants,
} from "@/services/commercial/commercial-campaign.service";
import type { CommercialCampaignKind } from "@/types/commercial-campaign";
import type { MatchFeedItem } from "@/types/match-feed";
import { tStatic } from "@/i18n/staticText";

type Step = 1 | 2 | 3 | 4 | 5;
type ActivationType = "physical" | "virtual" | "hybrid";

const activationTypeLabels: Record<ActivationType, string> = {
  physical: "Física",
  virtual: "Virtual",
  hybrid: "Híbrida",
};

export default function CriarCampanhaBar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const { toast } = useToast();
  const { data: matches } = useDashboardMatches();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const requestedPlan = searchParams.get("plan");
  const initialPricingPlan =
    requestedPlan && requestedPlan in commercialPlanCatalog ? requestedPlan : "single_match";
  const [state, setState] = useState({
    kind: "match" as CommercialCampaignKind,
    activationType: "physical" as ActivationType,
    pricingPlan: initialPricingPlan as keyof typeof commercialPlanCatalog,
    merchantName: "",
    cep: "",
    city: "",
    neighborhood: "",
    whatsapp: "",
    instagram: "",
    title: "",
    championshipId: "brasileirao2026",
    matchId: "",
    startsAt: "",
    endsAt: "",
    benefitSummary: "",
    benefitCode: "",
    benefitTerms: "",
  });

  const futureMatches = useMemo(
    () => filterFutureMatchesForCampaign(matches, new Date()).slice(0, 12),
    [matches],
  );
  const selectedMatch = futureMatches.find((match) => match.id === state.matchId) ?? null;
  const selectedPlan = getCommercialPlanDefinition(state.pricingPlan);
  const normalizedBenefitCode = useMemo(
    () => normalizeBenefitCode(state.benefitCode || state.title || state.merchantName),
    [state.benefitCode, state.merchantName, state.title],
  );
  const benefitValidation = validateCommercialBenefitText(state.benefitSummary);
  const cepValidation = validateCep(state.cep);
  const whatsappValidation = validateWhatsapp(state.whatsapp);
  const periodValidation = validateCampaignPeriod(state.startsAt || null, state.endsAt || null, new Date());

  useEffect(() => {
    let mounted = true;
    void listManagedMerchants()
      .then((merchants) => {
        if (!mounted || merchants.length === 0) return;
        const last = merchants[0];
        setState((current) => current.merchantName
          ? current
          : {
              ...current,
              merchantName: last.name,
              cep: formatCep(last.cep || ""),
              city: last.city,
              neighborhood: last.neighborhood,
              whatsapp: formatWhatsapp(last.contactWhatsapp || ""),
              instagram: normalizeInstagramHandle(last.instagram || ""),
            });
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const canContinue =
    step === 1
      ? true
      : step === 2
        ? state.merchantName.trim().length >= 3 &&
          cepValidation.ok &&
          state.city.trim().length >= 2 &&
          state.neighborhood.trim().length >= 2 &&
          whatsappValidation.ok
        : step === 3
          ? state.kind === "match"
            ? Boolean(selectedMatch) && state.title.trim().length >= 3
            : periodValidation.ok && state.title.trim().length >= 3
          : step === 4
            ? benefitValidation.ok && normalizedBenefitCode.length >= 4
            : true;

  const update = (key: keyof typeof state, value: string) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setState((current) => ({ ...current, cep: formatted }));
    setCepError(null);

    if (validateCep(formatted).ok) {
      setCepLoading(true);
      void lookupCep(formatted)
        .then((address) => {
          setState((current) => ({
            ...current,
            cep: address.cep,
            city: address.city || current.city,
            neighborhood: address.neighborhood || current.neighborhood,
          }));
        })
        .catch(() => setCepError("CEP não encontrado. Revise os números ou preencha cidade e bairro manualmente."))
        .finally(() => setCepLoading(false));
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Seu navegador não liberou localização. Use CEP ou preencha manualmente.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setGpsStatus("Localização capturada. Use o CEP para preencher cidade e bairro com precisão."),
      () => setGpsStatus("Localização não autorizada. Sem problema: use CEP ou preencha manualmente."),
      { enableHighAccuracy: false, timeout: 7000 },
    );
  };

  const chooseMatch = (match: MatchFeedItem) => {
    setState((current) => ({
      ...current,
      kind: "match",
      championshipId: match.championshipId || current.championshipId,
      matchId: match.id,
      startsAt: match.matchDate,
      endsAt: "",
      title: buildCampaignTitleFromMatch(match),
    }));
  };

  const handleSubmit = async () => {
    if (!session) {
      toast({
        title: "Entre para criar a campanha",
        description: "Sua sessão expirou. Faça login novamente.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const token = await session.getIdToken();
      const campaign = await createCommercialCampaignDraft({
        token,
        payload: {
          merchant: {
            name: state.merchantName.trim(),
            cep: formatCep(state.cep),
            city: state.city.trim(),
            neighborhood: state.neighborhood.trim(),
            contact_whatsapp: normalizeWhatsapp(state.whatsapp),
            instagram: normalizeInstagramHandle(state.instagram) || null,
          },
          campaign: {
            kind: state.kind,
            pricing_plan: state.pricingPlan,
            title: state.title.trim(),
            championship_id: state.kind === "match" ? state.championshipId : null,
            match_id: state.kind === "match" ? state.matchId : null,
            starts_at: state.kind === "match" ? selectedMatch?.matchDate || state.startsAt : state.startsAt,
            ends_at: state.kind === "period" ? state.endsAt : null,
            benefit_summary: state.benefitSummary.trim(),
            benefit_code: normalizedBenefitCode,
            benefit_terms: state.benefitTerms.trim() || null,
            generated_title_source: state.kind === "match" ? state.matchId : "manual",
          },
        },
      });
      navigate(`/campanhas/${campaign.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      toast({
        title: "Não foi possível criar a campanha",
        description:
          message === "blocked_commercial_reward_language"
            ? "Use um benefício simples, sem promessa de dinheiro, sorteio ou aposta."
            : message === "invalid_cep"
              ? "Revise o CEP do negócio."
              : message === "invalid_phone"
                ? "Revise o WhatsApp com DDD."
                : message === "invalid_campaign_period" || message === "match_not_future"
                  ? "Escolha um jogo ou período futuro."
                  : "Revise os dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="arena-screen">
      <ArenaPanel tone="strong" className="p-5 sm:p-7">
        <ArenaSectionHeader
          eyebrow={`Etapa ${step} de 5`}
          title="Campanha para negócio"
          hint="Campanhas são para empresas, marcas, bares, eventos e estabelecimentos que querem QR, link e benefício simples."
        />
      </ArenaPanel>

      <ArenaPanel className="mt-5 p-5">
        {step === 1 ? (
          <div className="space-y-5">
            <div className="rounded-[24px] border border-primary/25 bg-primary/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{tStatic("Plano da campanha")}</p>
                  <p className="mt-1 font-display text-4xl font-black uppercase text-white">
                    {selectedPlan.priceLabel}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {selectedPlan.shortTitle} com QR code, link publico, bolao automatico da rodada e {selectedPlan.includedGames} jogo{selectedPlan.includedGames === 1 ? "" : "s"} incluido{selectedPlan.includedGames === 1 ? "" : "s"}.
                  </p>
                </div>
                <ArenaHint label="Sobre o preço">{tStatic("O pagamento acontece depois da revisão, antes da publicação final.")}</ArenaHint>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {commercialPlanOrder.map((planId) => {
                const plan = commercialPlanCatalog[planId];
                return (
                  <ChoiceCard
                    key={planId}
                    selected={state.pricingPlan === planId}
                    title={plan.title}
                    description={`${plan.shortTitle}, ${plan.includedGames} jogo${plan.includedGames === 1 ? "" : "s"} incluido${plan.includedGames === 1 ? "" : "s"}. ${plan.priceLabel}`}
                    onClick={() => setState((current) => ({ ...current, pricingPlan: planId }))}
                  />
                );
              })}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <ChoiceCard
                selected={state.kind === "match"}
                title="Campanha por jogo"
                description="Escolha uma partida futura e o app gera o nome da rodada."
                onClick={() => update("kind", "match")}
              />
              <ChoiceCard
                selected={state.kind === "period"}
                title="Campanha geral por período"
                description="Use quando a ação não depende de uma partida específica."
                onClick={() => update("kind", "period")}
              />
            </div>

            <div>
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                Tipo de ativação
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <ChoiceCard
                  selected={state.activationType === "physical"}
                  title="Física"
                  description="Ação presencial em bar, loja, escola, empresa, estande ou evento."
                  onClick={() => update("activationType", "physical")}
                />
                <ChoiceCard
                  selected={state.activationType === "virtual"}
                  title="Virtual"
                  description="Campanha para comunidade online, transmissão, grupo ou audiência remota."
                  onClick={() => update("activationType", "virtual")}
                />
                <ChoiceCard
                  selected={state.activationType === "hybrid"}
                  title="Híbrida"
                  description="Combina QR ou balcão físico com divulgação por link e WhatsApp."
                  onClick={() => update("activationType", "hybrid")}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                Nesta etapa, o tipo organiza a campanha na interface. A publicação continua usando o contrato atual.
              </p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <Store className="h-8 w-8 text-primary" />
            <h2 className="font-display text-3xl font-black uppercase text-white">{tStatic("Dados do negócio")}</h2>
            <Field
              label="Nome do negócio"
              value={state.merchantName}
              onChange={(value) => update("merchantName", value)}
              hint="Nome que aparecerá na campanha e no compartilhamento."
            />
            <div className="grid gap-3 sm:grid-cols-[0.8fr,1fr,1fr]">
              <Field
                label="CEP"
                value={state.cep}
                onChange={handleCepChange}
                hint="Use CEP para preencher cidade e bairro automaticamente."
                error={cepError || (!cepValidation.ok && state.cep ? "Informe um CEP no formato 00000-000." : null)}
                trailing={cepLoading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
              />
              <Field label="Cidade" value={state.city} onChange={(value) => update("city", value)} />
              <Field label="Bairro" value={state.neighborhood} onChange={(value) => update("neighborhood", value)} />
            </div>
            <button
              type="button"
              onClick={handleUseLocation}
              className="inline-flex items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white"
            >
              <MapPin className="h-4 w-4" />
              Usar minha localização
            </button>
            {gpsStatus ? <p className="text-xs leading-5 text-zinc-400">{gpsStatus}</p> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="WhatsApp"
                value={state.whatsapp}
                onChange={(value) => update("whatsapp", formatWhatsapp(value))}
                hint="Use DDD. Esse contato ajuda o participante a reconhecer o negócio."
                error={!whatsappValidation.ok && state.whatsapp ? "Informe um WhatsApp com DDD." : null}
              />
              <Field
                label="Instagram"
                value={state.instagram}
                onChange={(value) => update("instagram", normalizeInstagramHandle(value))}
                hint="Opcional. Pode ser @perfil ou link do Instagram."
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <CalendarDays className="h-8 w-8 text-primary" />
            <h2 className="font-display text-3xl font-black uppercase text-white">
              {state.kind === "match" ? "Escolha o jogo" : "Período da campanha"}
            </h2>
            {state.kind === "match" ? (
              <div className="grid gap-3">
                {futureMatches.length === 0 ? (
                  <p className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
                    Nenhum jogo futuro disponível agora. Use campanha geral por período.
                  </p>
                ) : futureMatches.map((match) => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => chooseMatch(match)}
                    className={`rounded-[20px] border p-4 text-left transition ${
                      state.matchId === match.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    <p className="font-black text-white">{match.homeTeamName} x {match.awayTeamName}</p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {new Date(match.matchDate).toLocaleString("pt-BR")}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Início" type="datetime-local" value={state.startsAt} onChange={(value) => update("startsAt", value)} />
                <Field label="Fim" type="datetime-local" value={state.endsAt} onChange={(value) => update("endsAt", value)} />
              </div>
            )}
            <Field
              label="Nome da rodada"
              value={state.title}
              onChange={(value) => update("title", value.slice(0, 90))}
              hint={state.kind === "match" ? "Gerado pelo jogo escolhido; ajuste só se precisar." : "Use um nome curto e claro para a campanha."}
              error={state.title.length > 90 ? "Use até 90 caracteres." : null}
              placeholder={state.kind === "match" ? "Escolha um jogo para gerar o nome" : "Semana especial da empresa"}
            />
            {state.kind === "period" && !periodValidation.ok && (state.startsAt || state.endsAt) ? (
              <p className="text-sm text-red-200">{tStatic("Escolha um período futuro, com fim depois do início.")}</p>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <Ticket className="h-8 w-8 text-primary" />
            <h2 className="font-display text-3xl font-black uppercase text-white">{tStatic("Benefício simples")}</h2>
            <Field
              label="Benefício para participantes"
              value={state.benefitSummary}
              onChange={(value) => update("benefitSummary", value)}
              placeholder="Mostre o código na recepção, balcão ou estande e ganhe um benefício."
              hint="Não use dinheiro, sorteio, prêmio, carteira, aposta ou rateio."
            />
            <Field
              label="Código de validação"
              value={state.benefitCode}
              onChange={(value) => update("benefitCode", normalizeBenefitCode(value))}
              placeholder={normalizedBenefitCode || "RODADA-DO-JOGO"}
              hint="Código que a equipe confere manualmente no local."
            />
            <Field
              label="Regras do benefício"
              value={state.benefitTerms}
              onChange={(value) => update("benefitTerms", value)}
              placeholder="Válido no dia do jogo, conforme disponibilidade do negócio."
              hint="Opcional, mas recomendado para evitar dúvidas."
            />
            {!benefitValidation.ok && state.benefitSummary ? (
              <div className="flex gap-3 rounded-[20px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                Use benefício simples. Não use promessa de dinheiro, sorteio, carteira, rateio ou aposta.
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-4">
            <h2 className="font-display text-3xl font-black uppercase text-white">{tStatic("Revisão")}</h2>
            <Summary label="Tipo" value={state.kind === "match" ? "Campanha por jogo" : "Campanha geral por período"} />
            <Summary label="Ativação" value={activationTypeLabels[state.activationType]} />
            <Summary label="Plano" value={`${selectedPlan.title} · ${selectedPlan.priceLabel}`} />
            <Summary label="Alcance" value={`${selectedPlan.shortTitle} · ${selectedPlan.includedGames} jogo${selectedPlan.includedGames === 1 ? "" : "s"} incluido${selectedPlan.includedGames === 1 ? "" : "s"}`} />
            <Summary label="Negócio" value={`${state.merchantName} · ${state.neighborhood}, ${state.city}`} />
            <Summary label="Rodada" value={state.title} />
            <Summary label="Benefício" value={state.benefitSummary} />
            <Summary label="Código" value={normalizedBenefitCode} />
            <p className="rounded-[20px] border border-primary/20 bg-primary/10 p-4 text-sm leading-6 text-zinc-200">
              Ao continuar, a campanha será criada como pendente de pagamento. O app não opera aposta, carteira, sorteio ou prêmio financeiro.
            </p>
          </div>
        ) : null}

        <div className="mt-7 flex gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => Math.max(1, current - 1) as Step)}
              className="rounded-[18px] border border-white/10 bg-white/[0.03] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white"
            >
              Voltar
            </button>
          ) : null}
          {step < 5 ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep((current) => Math.min(5, current + 1) as Step)}
              className="ml-auto rounded-[18px] bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black disabled:opacity-50"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              disabled={saving || !canContinue}
              onClick={() => void handleSubmit()}
              className="ml-auto inline-flex items-center gap-2 rounded-[18px] bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Criar campanha
            </button>
          )}
        </div>
      </ArenaPanel>
    </div>
  );
}

function ChoiceCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[22px] border p-4 text-left transition ${
        selected ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
      }`}
    >
      <p className="font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
  error,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  error?: string | null;
  trailing?: ReactNode;
}) {
  const inputId = useId();

  return (
    <div className="block">
      <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
        <label htmlFor={inputId}>
          {label}
        </label>
        {hint ? <ArenaHint label="Ajuda do campo">{hint}</ArenaHint> : null}
      </div>
      <span className="relative mt-2 block">
        <input
          id={inputId}
          aria-label={label}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-[18px] border bg-white/[0.04] px-4 py-3 text-white placeholder:text-zinc-600 ${
            error ? "border-red-400/50" : "border-white/10"
          } ${trailing ? "pr-10" : ""}`}
        />
        {trailing ? <span className="absolute right-3 top-1/2 -translate-y-1/2">{trailing}</span> : null}
      </span>
      {error ? <span className="mt-2 block text-xs leading-5 text-red-200">{error}</span> : null}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value || "Não informado"}</p>
    </div>
  );
}
