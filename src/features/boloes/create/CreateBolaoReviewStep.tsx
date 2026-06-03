import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
import { invalidateBolaoListingCache } from "@/services/boloes/bolao-listing.service";
import { cn } from "@/lib/utils";
import type { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

const emojiOptions = ["⚽", "🏆", "🔥", "🎯", "🎉", "🦁"];

export function CreateBolaoReviewStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation("bolao");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session, user } = useAuth();
  const { current: championship } = useChampionship();
  const queryClient = useQueryClient();
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
      return t("creation.review.messages.error_auth");
    }

    if (message === "config_conflict") {
      return t("creation.review.messages.error_conflict");
    }

    if (message === "validation_failed") {
      return t("creation.review.messages.error_validation");
    }

    if (message === "payment_required") {
      return t("creation.review.messages.error_payment");
    }

    return t("creation.review.messages.error_generic");
  };

  // Normalise match ids: empty array is valid for specific bolão types, 
  // but "all" is the special flag for full championship access.
  const resolveMatchIds = (ids: string[] | "all"): string[] | "all" => {
    return ids;
  };

  // Strip payment method prefix tags like [pix], [beer] etc.
  const resolvePaymentDetails = (raw: string): string =>
    raw.replace(/^\[\w+\]\s*/, "").trim();

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
        prediction_cutoff_minutes: flow.state.predictionCutoffMinutes,
        scoring_rules: flow.state.scoringRules,
      },
      finance_rules: {
        finance_mode: flow.state.financeMode,
        entry_fee_amount: typeof flow.state.entryFee === "number" ? flow.state.entryFee : null,
        distribution_custom_text: flow.state.prizeDistribution.trim() || null,
        payment_details: resolvePaymentDetails(flow.state.paymentDetails),
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
          allowed_match_ids: resolveMatchIds(flow.state.allowedMatchIds),
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
        championship_id: championship.id,
        allowed_match_ids: resolveMatchIds(flow.state.allowedMatchIds),
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
      invalidateBolaoListingCache(user?.id);
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["dashboardData", user.id] });
      }
      toast({
        title: t("creation.review.messages.draft_success_title"),
        description: t("creation.review.messages.draft_success_desc", { id: draft.bolaoId }),
      });
    } catch {
      toast({
        title: t("creation.review.messages.draft_error_title"),
        description: t("creation.review.messages.draft_error_desc"),
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
      const matchIds = resolveMatchIds(flow.state.allowedMatchIds);

      if (!flow.draftId) {
        const published = await createAndPublishBolao({
          token,
          payload: {
            championship_id: championship.id,
            allowed_match_ids: matchIds,
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
              prediction_cutoff_minutes: flow.state.predictionCutoffMinutes,
              scoring_rules: flow.state.scoringRules,
            },
            finance_rules: {
              finance_mode: flow.state.financeMode,
              entry_fee_amount: typeof flow.state.entryFee === "number" ? flow.state.entryFee : null,
              distribution_custom_text: flow.state.prizeDistribution.trim() || null,
              payment_details: resolvePaymentDetails(flow.state.paymentDetails),
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
        invalidateBolaoListingCache(user?.id);
        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: ["dashboardData", user.id] });
        }
        navigate(`/boloes/${published.bolaoId}?tab=turma&created=true`);
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

      const basePayload = {
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
          prediction_cutoff_minutes: flow.state.predictionCutoffMinutes,
          scoring_rules: flow.state.scoringRules,
        },
        finance_rules: {
          finance_mode: flow.state.financeMode,
          entry_fee_amount: typeof flow.state.entryFee === "number" ? flow.state.entryFee : null,
          distribution_custom_text: flow.state.prizeDistribution.trim() || null,
          payment_details: resolvePaymentDetails(flow.state.paymentDetails),
        },
        presentation: {
          name: flow.state.name.trim(),
          description: flow.state.description.trim(),
          emoji: flow.state.emoji,
        },
        championship_id: championship.id,
        allowed_match_ids: matchIds,
      };

      const draft =
        flow.draftId && flow.draftConfigVersion
          ? await updateBolaoConfiguration({
              token,
              payload: {
                bolao_id: flow.draftId,
                expected_config_version: flow.draftConfigVersion,
                championship_id: championship.id,
                allowed_match_ids: matchIds,
                patch: {
                  context: basePayload.context,
                  access_policy: basePayload.access_policy,
                  competition_rules: basePayload.competition_rules,
                  finance_rules: basePayload.finance_rules,
                },
                force_edit: true,
              },
            })
          : await createDraftBolao({
              token,
              payload: basePayload,
            });

      const presentationPromise = flow.draftId && flow.draftConfigVersion
        ? alterBolaoPresentation({
            token,
            payload: {
              bolao_id: flow.draftId,
              patch: basePayload.presentation,
            },
          })
        : Promise.resolve(draft);

      const publishPromise = publishBolao({
        token,
        payload: {
          bolao_id: draft.bolaoId,
          expected_config_version: draft.integrity.configVersion,
        },
      });

      const [_, published] = await Promise.all([presentationPromise, publishPromise]);

      flow.setDraftId(draft.bolaoId);
      flow.setDraftConfigVersion(published.integrity.configVersion);

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
      invalidateBolaoListingCache(user?.id);
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["dashboardData", user.id] });
      }
      navigate(`/boloes/${published.bolaoId}?tab=palpites`);
    } catch (error) {
      console.error("Create bolao failed", error);
      toast({
        title: t("creation.review.messages.publish_error_title"),
        description: getFailureMessage(error),
        variant: "destructive",
      });
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl pb-8 text-white">
      <p className="break-words text-[11px] font-black uppercase leading-tight tracking-[0.2em] text-primary">
        {t("creation.review.step_label")}
      </p>
      <h1 className="mt-2 text-3xl font-black">{t("creation.review.title")}</h1>
      <p className="mt-2 text-sm text-zinc-400">
        {t("creation.review.desc")}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {emojiOptions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => flow.setState((current) => ({ ...current, emoji }))}
            className={cn(
              "rounded-2xl border p-3 text-2xl transition-all hover:scale-110 active:scale-90",
              flow.state.emoji === emoji ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(213,255,92,0.1)]" : "border-white/10 bg-white/5"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3">
        <input
          value={flow.state.name}
          onChange={(event) => flow.setState((current) => ({ ...current, name: event.target.value }))}
          placeholder={t("creation.review.placeholder_name")}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-black text-white focus:outline-none focus:border-primary/50 transition-colors"
        />
        <textarea
          value={flow.state.description}
          onChange={(event) => flow.setState((current) => ({ ...current, description: event.target.value }))}
          placeholder={t("creation.review.placeholder_desc")}
          className="min-h-[110px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">{t("creation.review.summary_title")}</p>
        <div className="mt-3 space-y-2 text-sm text-zinc-300">
          <p>{t("creation.review.context_label")}: {flow.state.contextMode === "standalone" ? t("creation.context.modes.standalone") : flow.state.contextMode === "existing_group" ? t("creation.context.modes.existing_group") : t("creation.context.modes.new_group")}</p>
          <p>{t("creation.review.admission_label")}: {flow.state.accessMode === "group_gated" ? t("creation.admission.modes.group_gated.title") : flow.state.accessMode === "public" ? t("creation.admission.modes.public.title") : t("creation.admission.modes.approval.title")}</p>
          <p>{t("creation.review.type_label")}: {flow.state.selectedTypeId === "rapid" ? t("creation.rules.types.rapid.title") : t("creation.rules.types.complete.title")}</p>
          <p>{t("creation.review.prize_label")}: {flow.state.prizeDistribution.trim() || t("creation.review.no_prize")}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => flow.setStep("admission")}
          className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white hover:bg-white/5 transition-colors"
        >
          {t("wizard.back")}
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => void handleSaveDraft()}
            disabled={publishing}
            className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {t("creation.review.save_draft")}
          </button>
          <button
            onClick={() => void handleCreate()}
            disabled={!flow.canAdvance || publishing}
            className="inline-flex min-w-[156px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-70 hover:scale-105 active:scale-95 transition-transform shadow-[0_4px_15px_rgba(213,255,92,0.2)]"
          >
            {publishing ? (
              <>
                <span
                  role="status"
                  aria-label={t("creation.review.publishing")}
                  className="relative h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black"
                />
                {t("creation.review.publishing")}
              </>
            ) : (
              t("creation.review.publish")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
