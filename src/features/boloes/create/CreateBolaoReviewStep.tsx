import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useChampionship } from "@/contexts/ChampionshipContext";
import {
  alterBolaoPresentation,
  createDraftBolao,
  publishBolao,
  updateBolaoConfiguration,
} from "@/services/boloes/bolao-config.service";
import { trackBolaoConfigEvent } from "@/lib/analytics/bolao-config.telemetry";
import type { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

const emojiOptions = ["⚽", "🏆", "🔥", "🎯", "🎉", "🦁"];

export function CreateBolaoReviewStep({ flow }: { flow: Flow }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { current: championship } = useChampionship();

  const configurationPatch = {
    context: {
      group_binding_mode: flow.state.groupBindingMode,
      grupo_id: flow.state.selectedGrupoId,
    },
    access_policy: {
      join_mode: flow.state.joinMode,
      visibility: flow.state.joinMode === "public_open" ? "public" : "private",
    },
    competition_rules: {
      pool_type: flow.state.selectedTypeId,
      format: flow.state.formatId,
      scoring_mode: flow.state.scoringMode,
      markets: flow.state.selectedMarketIds,
      scoring_rules: flow.state.scoringRules,
    },
    finance_rules: {
      finance_mode: flow.state.financeMode,
      entry_fee_amount: typeof flow.state.entryFee === "number" ? flow.state.entryFee : null,
      distribution_custom_text: flow.state.prizeDistribution.trim(),
      payment_details: flow.state.paymentDetails.trim(),
    },
  } as const;

  const presentationPatch = {
    name: flow.state.name.trim(),
    description: flow.state.description.trim(),
    emoji: flow.state.emoji,
  };

  const handleSaveDraft = async () => {
    try {
      const draft = await createDraftBolao({
        payload: {
          ...configurationPatch,
          presentation: presentationPatch,
          championship_id: championship.id,
        },
      });

      flow.setDraftId(draft.bolaoId);
      trackBolaoConfigEvent("draft_created", {
        source: "create_wizard",
        group_binding_mode: flow.state.groupBindingMode,
      });
      toast({ title: "Rascunho criado", description: `ID: ${draft.bolaoId}` });
    } catch (error) {
      toast({ title: "Não foi possível salvar o rascunho", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    try {
      let bolaoId = flow.draftId;
      let configVersion = 1;

      if (!bolaoId) {
        const draft = await createDraftBolao({
          payload: {
            ...configurationPatch,
            presentation: presentationPatch,
            championship_id: championship.id,
          },
        });
        bolaoId = draft.bolaoId;
        configVersion = draft.integrity.configVersion;
        flow.setDraftId(draft.bolaoId);
      } else {
        const updated = await updateBolaoConfiguration({
          payload: {
            bolao_id: bolaoId,
            expected_config_version: configVersion,
            patch: configurationPatch,
          },
        });

        configVersion = updated.integrity.configVersion;

        await alterBolaoPresentation({
          payload: {
            bolao_id: bolaoId,
            patch: presentationPatch,
          },
        });
      }

      const published = await publishBolao({
        payload: {
          bolao_id: bolaoId,
          expected_config_version: configVersion,
        },
      });

      trackBolaoConfigEvent("pool_published", {
        source: "create_wizard",
        lifecycle_status: published.lifecycle.status,
        group_binding_mode: flow.state.groupBindingMode,
        join_mode: flow.state.joinMode,
      });
      navigate(`/boloes/${published.bolaoId}`);
    } catch (error) {
      toast({
        title: "Não foi possível publicar o bolão",
        description: "Revise as regras e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 text-white">
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">wizard.step_3_label</p>
      <h1 className="mt-2 text-3xl font-black">wizard.review_step.title</h1>
      <p className="mt-2 text-sm text-zinc-400">wizard.review_step.description</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {emojiOptions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => flow.setState((current) => ({ ...current, emoji }))}
            className={`rounded-2xl border p-3 text-2xl ${
              flow.state.emoji === emoji ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3">
        <input
          value={flow.state.name}
          onChange={(event) => flow.setState((current) => ({ ...current, name: event.target.value }))}
          placeholder="wizard.name_step.name_placeholder"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-black text-white"
        />
        <textarea
          value={flow.state.description}
          onChange={(event) => flow.setState((current) => ({ ...current, description: event.target.value }))}
          placeholder="wizard.name_step.description_placeholder"
          className="min-h-[110px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
        />
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Resumo</p>
        <div className="mt-3 space-y-2 text-sm text-zinc-300">
          <p>Vínculo: {flow.state.groupBindingMode}</p>
          <p>Entrada: {flow.state.joinMode}</p>
          <p>Formato: {flow.state.selectedTypeId}</p>
          <p>Financeiro: {flow.state.financeMode}</p>
          {flow.draftId && <p>Rascunho salvo: {flow.draftId}</p>}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => flow.setStep("rules")}
          className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white"
        >
          wizard.back
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => void handleSaveDraft()}
            className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white"
          >
            Salvar rascunho
          </button>
          <button
            onClick={() => void handleCreate()}
            disabled={!flow.canAdvance}
            className="rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-50"
          >
            Publicar bolão
          </button>
        </div>
      </div>
    </div>
  );
}
