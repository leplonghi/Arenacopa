import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useChampionship } from "@/contexts/ChampionshipContext";
import {
  alterBolaoPresentation,
  createAndPublishBolao,
  createDraftBolao,
  publishBolao,
  updateBolaoConfiguration,
} from "@/services/boloes/bolao-config.service";
import { createGroup } from "@/services/groups/group-access.service";
import { trackBolaoConfigEvent } from "@/lib/analytics/bolao-config.telemetry";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import { mapWizardStateToBolaoStructure } from "@/features/boloes/create/useBolaoCreateFlow";
import { CreateBolaoStepRail } from "@/features/boloes/create/CreateBolaoStepRail";
import type { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

const emojiOptions = ["⚽", "🏆", "🔥", "🎯", "🎉", "🦁"];

export function CreateBolaoReviewStep({ flow }: { flow: Flow }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const { current: championship } = useChampionship();
  const [publishing, setPublishing] = useState(false);

  const structure = mapWizardStateToBolaoStructure(flow.state);

  const getOperationToken = async () => {
    if (!session) {
      throw new Error("auth_required");
    }

    return session.getIdToken();
  };

  const getFailureMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : "";

    if (message === "auth_required" || message.includes("Autenticação")) {
      return "Sua sessão expirou. Entre novamente e publique o bolão.";
    }

    if (message === "config_conflict") {
      return "Esse rascunho mudou em outro lugar. Atualize a página e tente de novo.";
    }

    if (message === "validation_failed") {
      return "Confira nome, entrada e regras antes de publicar.";
    }

    return "Revise os dados e tente novamente.";
  };

  const createOrUpdateDraft = async () => {
    const token = await getOperationToken();
    const configurationPatch = {
      context: {
        group_binding_mode: structure.groupBindingMode,
        grupo_id: structure.grupoId,
      },
      access_policy: structure.accessPolicy,
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

    if (!flow.draftId) {
      const draft = await createDraftBolao({
        token,
        payload: {
          ...configurationPatch,
          presentation: {
            name: flow.state.name.trim(),
            description: flow.state.description.trim(),
            emoji: flow.state.emoji,
          },
          championship_id: championship.id,
        },
      });
      flow.setDraftId(draft.bolaoId);
      flow.setDraftConfigVersion(draft.integrity.configVersion);
      return draft;
    }

    const updated = await updateBolaoConfiguration({
      token,
      payload: {
        bolao_id: flow.draftId,
        expected_config_version: flow.draftConfigVersion || 1,
        patch: configurationPatch,
      },
    });
    await alterBolaoPresentation({
      token,
      payload: {
        bolao_id: flow.draftId,
        patch: {
          name: flow.state.name.trim(),
          description: flow.state.description.trim(),
          emoji: flow.state.emoji,
        },
      },
    });
    return updated;
  };

  const handleSaveDraft = async () => {
    try {
      trackSocialEvent("pool_create_started", {
        context_mode: flow.state.contextMode,
      });
      const draft = await createOrUpdateDraft();
      flow.setDraftConfigVersion(draft.integrity.configVersion);
      trackBolaoConfigEvent("draft_created", {
        source: "create_wizard",
        group_binding_mode: structure.groupBindingMode,
      });
      toast({
        title: "Rascunho salvo",
        description: `Você pode voltar depois usando o bolão ${draft.bolaoId}.`,
      });
    } catch {
      toast({
        title: "Não foi possível salvar o rascunho",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async () => {
    if (publishing) return;

    setPublishing(true);
    try {
      trackSocialEvent("pool_create_started", {
        context_mode: flow.state.contextMode,
        access_mode: flow.state.accessMode,
      });

      const token = await getOperationToken();

      if (!flow.draftId) {
        const published = await createAndPublishBolao({
          token,
          payload: {
            championship_id: championship.id,
            context: {
              group_binding_mode: structure.groupBindingMode,
              grupo_id: structure.grupoId,
            },
            access_policy: structure.accessPolicy,
            competition_rules: {
              pool_type: flow.state.selectedTypeId,
              format: flow.state.formatId,
              scoring_mode: flow.state.scoringMode,
              markets: flow.state.selectedMarketIds,
              scoring_rules: flow.state.scoringRules,
            },
            finance_rules: {
              finance_mode: "free",
              entry_fee_amount: null,
              distribution_custom_text: flow.state.prizeDistribution.trim(),
              payment_details: "",
            },
            presentation: {
              name: flow.state.name.trim(),
              description: flow.state.description.trim(),
              emoji: flow.state.emoji,
            },
            group_creation:
              flow.state.contextMode === "new_group"
                ? {
                    presentation: {
                      name: flow.state.newGroupName.trim(),
                      description: flow.state.newGroupDescription.trim(),
                      emoji: flow.state.newGroupEmoji,
                      objective: flow.state.newGroupObjective,
                    },
                    visibility: flow.state.newGroupVisibility,
                    admission_mode: flow.state.newGroupAdmissionMode,
                  }
                : null,
          },
        });

        trackSocialEvent("pool_create_completed", {
          context_mode: flow.state.contextMode,
          access_mode: flow.state.accessMode,
        });
        trackBolaoConfigEvent("pool_published", {
          source: "create_wizard",
          lifecycle_status: published.lifecycle.status,
          group_binding_mode: structure.groupBindingMode,
          join_mode: structure.accessPolicy.join_mode,
        });
        navigate(`/boloes/${published.bolaoId}`);
        return;
      }

      let grupoId = structure.grupoId;
      if (flow.state.contextMode === "new_group") {
        const createdGroup = await createGroup({
          token,
          payload: {
            presentation: {
              name: flow.state.newGroupName.trim(),
              description: flow.state.newGroupDescription.trim(),
              emoji: flow.state.newGroupEmoji,
              objective: flow.state.newGroupObjective,
            },
            visibility: flow.state.newGroupVisibility,
            admission_mode: flow.state.newGroupAdmissionMode,
          },
        });
        grupoId = createdGroup.id;
      }

      const draft =
        flow.draftId && flow.draftConfigVersion
          ? await updateBolaoConfiguration({
              token,
              payload: {
                bolao_id: flow.draftId,
                expected_config_version: flow.draftConfigVersion,
                patch: {
                  context: {
                    group_binding_mode:
                      flow.state.accessMode === "group_gated"
                        ? "group_gated"
                        : flow.state.contextMode === "standalone"
                          ? "none"
                          : "linked_discovery",
                    grupo_id: grupoId,
                  },
                  access_policy: structure.accessPolicy,
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
                },
              },
            })
          : await createDraftBolao({
              token,
              payload: {
                context: {
                  group_binding_mode:
                    flow.state.accessMode === "group_gated"
                      ? "group_gated"
                      : flow.state.contextMode === "standalone"
                        ? "none"
                        : "linked_discovery",
                  grupo_id: grupoId,
                },
                access_policy: structure.accessPolicy,
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
                presentation: {
                  name: flow.state.name.trim(),
                  description: flow.state.description.trim(),
                  emoji: flow.state.emoji,
                },
                championship_id: championship.id,
              },
            });
      if (flow.draftId && flow.draftConfigVersion) {
        await alterBolaoPresentation({
          token,
          payload: {
            bolao_id: flow.draftId,
            patch: {
              name: flow.state.name.trim(),
              description: flow.state.description.trim(),
              emoji: flow.state.emoji,
            },
          },
        });
      }
      flow.setDraftId(draft.bolaoId);
      flow.setDraftConfigVersion(draft.integrity.configVersion);

      const published = await publishBolao({
        token,
        payload: {
          bolao_id: draft.bolaoId,
          expected_config_version: draft.integrity.configVersion,
        },
      });

      trackSocialEvent("pool_create_completed", {
        context_mode: flow.state.contextMode,
        access_mode: flow.state.accessMode,
      });
      trackBolaoConfigEvent("pool_published", {
        source: "create_wizard",
        lifecycle_status: published.lifecycle.status,
        group_binding_mode:
          flow.state.accessMode === "group_gated"
            ? "group_gated"
            : flow.state.contextMode === "standalone"
              ? "none"
              : "linked_discovery",
        join_mode: structure.accessPolicy.join_mode,
      });
      navigate(`/boloes/${published.bolaoId}`);
    } catch (error) {
      console.error("Create bolao failed", error);
      toast({
        title: "Não foi possível publicar o bolão",
        description: getFailureMessage(error),
        variant: "destructive",
      });
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-white">
      <CreateBolaoStepRail activeStep={2} />
      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Etapa 2 de 2</p>
      <h1 className="mt-2 text-3xl font-black">Revise e publique</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Confira o resumo final. Se quiser ajustar acesso, grupo ou pontuacao, volte um passo.
      </p>

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
          placeholder="Nome do bolão"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-black text-white"
        />
        <textarea
          value={flow.state.description}
          onChange={(event) => flow.setState((current) => ({ ...current, description: event.target.value }))}
          placeholder="Uma descrição curta para explicar o clima do bolão"
          className="min-h-[110px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
        />
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Resumo final</p>
        <div className="mt-3 space-y-2 text-sm text-zinc-300">
          <p>Contexto: {flow.state.contextMode === "standalone" ? "Sem grupo" : flow.state.contextMode === "existing_group" ? "Grupo existente" : "Novo grupo + bolão"}</p>
          <p>Entrada: {flow.state.accessMode === "group_gated" ? "Controlado pelo grupo" : flow.state.accessMode === "public" ? "Público" : "Privado com aprovação"}</p>
          <p>Tipo: {flow.state.selectedTypeId === "rapid" ? "Rapido" : "Completo"}</p>
          <p>Premiacao simbolica: {flow.state.prizeDistribution.trim() || "Nao definida"}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => flow.setStep("quick")}
          className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white"
        >
          Voltar
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => void handleSaveDraft()}
            disabled={publishing}
            className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white"
          >
            Salvar rascunho
          </button>
          <button
            onClick={() => void handleCreate()}
            disabled={!flow.canAdvance || publishing}
            className="inline-flex min-w-[156px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-70"
          >
            {publishing ? (
              <>
                <span
                  role="status"
                  aria-label="Criando bolão"
                  className="relative h-5 w-5 animate-spin rounded-full border-2 border-black/80 bg-white shadow-[inset_0_0_0_2px_rgba(0,0,0,0.12)]"
                >
                  <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-black/70" />
                  <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-black/70" />
                </span>
                Criando bolão
              </>
            ) : (
              "Publicar bolão"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
