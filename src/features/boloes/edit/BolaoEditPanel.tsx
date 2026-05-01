import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BolaoEditSectionCard } from "@/features/boloes/edit/BolaoEditSectionCard";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardMatches } from "@/hooks/useDashboardMatches";
import { useUserGroups } from "@/hooks/useUserGroups";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/integrations/firebase/client";
import { updateDoc, doc } from "firebase/firestore";
import { getDefaultMarketIdsForFormat, listBolaoFormats } from "@/services/boloes/bolao-format.service";
import {
  alterBolaoPresentation,
  deleteBolao,
  duplicateBolao,
  finishBolao,
  archiveBolao,
  updateBolaoConfiguration,
} from "@/services/boloes/bolao-config.service";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import type { BolaoData } from "@/types/bolao";
import type { BolaoFormatSlug, MarketTemplateSlug, ScoringRules } from "@/types/bolao";

type BolaoEditPanelProps = {
  bolao: BolaoData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBolaoUpdated?: (patch: Partial<BolaoData>) => void;
};

type GroupBindingMode = "none" | "linked_discovery" | "group_gated";
type JoinMode = "private_invite" | "public_open";
type FinanceMode = "free" | "paid_external";

export function BolaoEditPanel({ bolao, open, onOpenChange, onBolaoUpdated }: BolaoEditPanelProps) {
  const { t } = useTranslation("bolao");
  const navigate = useNavigate();
  const { toast } = useToast();
  const availableFormats = listBolaoFormats();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("⚽");
  const [groupBindingMode, setGroupBindingMode] = useState<GroupBindingMode>("none");
  const [selectedGrupoId, setSelectedGrupoId] = useState<string | null>(null);
  const [joinMode, setJoinMode] = useState<JoinMode>("private_invite");
  const [formatId, setFormatId] = useState<BolaoFormatSlug>("classic");
  const [selectedMarketIds, setSelectedMarketIds] = useState<MarketTemplateSlug[]>([]);
  const [scoringRules, setScoringRules] = useState<ScoringRules>({
    exact: 10,
    winner: 3,
    draw: 3,
    participation: 1,
  });
  const [financeMode, setFinanceMode] = useState<FinanceMode>("free");
  const [entryFee, setEntryFee] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [prizeDistribution, setPrizeDistribution] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [allowedMatchIds, setAllowedMatchIds] = useState<string[] | "all">("all");

  const { groups: availableGroups } = useUserGroups(open);

  useEffect(() => {
    if (!bolao) {
      return;
    }

    setName(bolao.name || "");
    setDescription(bolao.description || "");
    setEmoji(bolao.avatar_url || "⚽");
    setGroupBindingMode((bolao.grupo_id ? "linked_discovery" : "none") as GroupBindingMode);
    setSelectedGrupoId(bolao.grupo_id || null);
    setJoinMode(bolao.category === "public" ? "public_open" : "private_invite");
    setFormatId((bolao.format_id || "classic") as BolaoFormatSlug);
    setSelectedMarketIds(bolao.scoring_rules?.markets || getDefaultMarketIdsForFormat(bolao.format_id || "classic") as MarketTemplateSlug[]);
    setScoringRules({
      exact: bolao.scoring_rules?.exact ?? 10,
      winner: bolao.scoring_rules?.winner ?? 3,
      draw: bolao.scoring_rules?.draw ?? 3,
      participation: bolao.scoring_rules?.participation ?? 1,
    });
    setFinanceMode(bolao.is_paid ? "paid_external" : "free");
    setEntryFee(bolao.entry_fee ? String(bolao.entry_fee) : "");
    setPaymentDetails(bolao.payment_details || "");
    setPrizeDistribution(bolao.prize_distribution || "");
    setAllowedMatchIds(bolao.allowed_match_ids ?? "all");
  }, [bolao]);

  useEffect(() => {
    if (!open) {
      setDeleteConfirmOpen(false);
      setCancelConfirmOpen(false);
    }
  }, [open]);

  if (!bolao) {
    return null;
  }

  const editableSections = bolao.editable_sections ?? {
    presentation: true,
    context: false,
    access_policy: false,
    competition_rules: false,
    finance_rules: false,
    operation: true,
  };

  const configVersion = bolao.integrity?.config_version ?? 1;

  const mapConfigStateToLegacyPatch = (updated: {
    lifecycle: { status: BolaoData["lifecycle"] extends { status: infer T } ? T : string };
    integrity: { configVersion: number; isStructureLocked: boolean };
    editableSections: BolaoData["editable_sections"];
  }) => ({
    editable_sections: {
      presentation: Boolean(updated.editableSections?.presentation),
      context: Boolean(updated.editableSections?.context),
      access_policy: Boolean(updated.editableSections?.access_policy),
      competition_rules: Boolean(updated.editableSections?.competition_rules),
      finance_rules: Boolean(updated.editableSections?.finance_rules),
      operation: Boolean(updated.editableSections?.operation),
    },
    integrity: {
      ...(bolao.integrity || {}),
      config_version: updated.integrity.configVersion,
      is_structure_locked: updated.integrity.isStructureLocked,
    },
    lifecycle: {
      ...(bolao.lifecycle || {}),
      status: updated.lifecycle.status,
    },
    status:
      updated.lifecycle.status === "live"
        ? "active"
        : updated.lifecycle.status === "published"
          ? "open"
          : updated.lifecycle.status === "archived"
            ? "finished"
            : updated.lifecycle.status,
  });

  const updateLocal = (patch: Partial<BolaoData>) => {
    onBolaoUpdated?.(patch);
  };

  const handleSaveIdentity = async () => {
    if (!name.trim()) {
      toast({
        title: t("edit.sections.identity.error_name_required"),
        description: t("edit.sections.identity.error_name_desc"),
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingKey("presentation");
      await alterBolaoPresentation({
        payload: {
          bolao_id: bolao.id,
          patch: {
            name: name.trim(),
            description: description.trim(),
            emoji,
          },
        },
      });

      updateLocal({
        name: name.trim(),
        description: description.trim() || null,
        avatar_url: emoji,
      });
      toast({
        title: t("edit.sections.identity.success_title"),
        description: t("edit.sections.identity.success_desc"),
      });
    } catch {
      toast({
        title: t("errors.generic_title"),
        description: t("errors.try_again_later"),
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const saveConfigurationSection = async (
    key: "participation" | "rules" | "finance",
    patch: Record<string, unknown>,
    localPatch: Partial<BolaoData>,
    successTitle: string,
  ) => {
    try {
      setSavingKey(key);
      const updated = await updateBolaoConfiguration({
        payload: {
          bolao_id: bolao.id,
          expected_config_version: configVersion,
          patch,
        },
      });

      updateLocal({
        ...localPatch,
        ...mapConfigStateToLegacyPatch(updated as never),
      });

      toast({
        title: successTitle,
        description: t("edit.sections.participation.success_title"),
      });
    } catch (error) {
      toast({
        title: t("errors.generic_title"),
        description: t("errors.try_again_later"),
        variant: "destructive",
      });
      if (error instanceof Error && error.message === "structure_locked") {
        trackSocialEvent("edit_blocked_after_lock", {
          section: key,
          bolao_id: bolao.id,
        });
      }
    } finally {
      setSavingKey(null);
    }
  };

  const handleLifecycleAction = async (action: "finish" | "archive") => {
    try {
      setSavingKey(action);
      const updated =
        action === "finish"
          ? await finishBolao({
              payload: {
                bolao_id: bolao.id,
                reason: "owner_finished_from_edit_panel",
              },
            })
          : await archiveBolao({
              payload: {
                bolao_id: bolao.id,
                reason: "owner_archived_from_edit_panel",
              },
            });

      updateLocal(mapConfigStateToLegacyPatch(updated as never));
      toast({
        title: action === "finish" ? t("edit.sections.danger.finish") : t("edit.sections.danger.archive"),
        description: t("edit.sections.identity.success_desc"),
      });
    } catch {
      toast({
        title: t("errors.generic_title"),
        description: t("errors.try_again_later"),
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleDeleteBolao = async () => {
    try {
      setSavingKey("delete");
      const updated = await deleteBolao({
        payload: {
          bolao_id: bolao.id,
          reason: "owner_deleted_from_edit_panel",
        },
      });

      updateLocal(mapConfigStateToLegacyPatch(updated as never));
      toast({
        title: t("edit.sections.danger.delete"),
        description: t("edit.sections.danger.confirm_delete_desc"),
      });
      onOpenChange(false);
      navigate("/boloes", { replace: true });
    } catch {
      toast({
        title: t("errors.generic_title"),
        description: t("errors.try_again_later"),
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleCancelBolao = async () => {
    try {
      setSavingKey("cancel");
      const archived = await archiveBolao({
        payload: {
          bolao_id: bolao.id,
          reason: "owner_cancelled",
        },
      });

      updateLocal(mapConfigStateToLegacyPatch(archived as never));
      toast({
        title: t("edit.sections.danger.cancel"),
        description: t("edit.sections.danger.confirm_delete_desc"),
      });
      onOpenChange(false);
      navigate("/boloes", { replace: true });
    } catch {
      toast({
        title: t("errors.generic_title"),
        description: t("errors.try_again_later"),
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
      setCancelConfirmOpen(false);
    }
  };

  const handleDuplicateForSection = async (
    key: "participation" | "rules" | "finance",
    overrides: Record<string, unknown>,
  ) => {
    try {
      setSavingKey(key);
      trackSocialEvent("edit_blocked_after_lock", {
        section: key,
        bolao_id: bolao.id,
      });
      const duplicated = await duplicateBolao({
        payload: {
          source_bolao_id: bolao.id,
          origin: "published_snapshot",
          overrides,
        },
      });
      trackSocialEvent("duplicate_after_lock", {
        section: key,
        source_bolao_id: bolao.id,
        duplicated_bolao_id: duplicated.bolaoId,
      });

      toast({
        title: "Cópia criada",
        description: "Abrimos uma nova versão em rascunho para você ajustar sem mexer no original.",
      });
      onOpenChange(false);
      navigate(`/boloes/${duplicated.bolaoId}`);
    } catch {
      toast({
        title: "Não foi possível duplicar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const participationEditable = Boolean(editableSections.context || editableSections.access_policy);
  const canSaveParticipation = groupBindingMode === "none" || Boolean(selectedGrupoId);
  const canSaveRules = selectedMarketIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-white/10 bg-[#08140d] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">{t("edit.title")}</DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            {t("edit.description")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-white/5 p-1">
            <TabsTrigger value="general" className="rounded-xl py-2 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              {t("edit.tabs.general")}
            </TabsTrigger>
            <TabsTrigger value="participation" className="rounded-xl py-2 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              {t("edit.tabs.participation")}
            </TabsTrigger>
            <TabsTrigger value="rules" className="rounded-xl py-2 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              {t("edit.tabs.rules")}
            </TabsTrigger>
            <TabsTrigger value="finance" className="rounded-xl py-2 text-xs font-black uppercase tracking-wider transition-all data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              {t("edit.tabs.finance")}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
            <AnimatePresence mode="wait">
              <TabsContent value="general" key="general" className="m-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid gap-6 pb-4"
                >
                  <div className="grid gap-4">
                    <BolaoEditSectionCard
                      title={t("edit.sections.identity.title")}
                      description={t("edit.sections.identity.desc")}
                      editable={editableSections.presentation}
                      actionLabel={t("edit.sections.identity.action")}
                      onAction={() => void handleSaveIdentity()}
                      busy={savingKey === "presentation"}
                    />
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                            {t("edit.sections.identity.name_placeholder")}
                          </span>
                          <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder={t("edit.sections.identity.name_placeholder")}
                            className="rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-sm text-white focus:border-primary/30 focus:outline-none transition-colors"
                          />
                        </div>
                        <div className="grid gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                            {t("edit.sections.identity.avatar_placeholder")}
                          </span>
                          <input
                            value={emoji}
                            onChange={(event) => setEmoji(event.target.value)}
                            placeholder={t("edit.sections.identity.avatar_placeholder")}
                            className="rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-sm text-white focus:border-primary/30 focus:outline-none transition-colors"
                          />
                        </div>
                        <div className="grid gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                            {t("edit.sections.identity.desc_placeholder")}
                          </span>
                          <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder={t("edit.sections.identity.desc_placeholder")}
                            className="min-h-[110px] rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-sm text-white focus:border-primary/30 focus:outline-none transition-colors resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <BolaoEditSectionCard
                      title={t("edit.sections.operation.title")}
                      description={t("edit.sections.operation.desc")}
                      editable={true}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => void handleLifecycleAction("finish")}
                        disabled={savingKey !== null}
                        className="rounded-2xl border border-white/10 bg-white/5 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-white/80 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                      >
                        {t("edit.sections.operation.action_finish")}
                      </button>
                      <button
                        onClick={() => void handleLifecycleAction("archive")}
                        disabled={savingKey !== null}
                        className="rounded-2xl border border-white/10 bg-white/5 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-white/80 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                      >
                        {t("edit.sections.operation.action_archive")}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <BolaoEditSectionCard
                      title={t("edit.sections.danger.title")}
                      description={t("edit.sections.danger.desc")}
                      editable={true}
                    />
                    <div className="grid gap-3">
                      {bolao.integrity?.is_structure_locked ? (
                        <div className="grid gap-3">
                           <button
                            onClick={() => {
                              if (!cancelConfirmOpen) {
                                setCancelConfirmOpen(true);
                                return;
                              }
                              void handleCancelBolao();
                            }}
                            disabled={savingKey === "cancel"}
                            className="rounded-2xl border border-red-500/20 bg-red-500/10 py-3.5 text-[11px] font-black uppercase tracking-[0.15em] text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            {savingKey === "cancel"
                              ? t("edit.sections.danger.canceling")
                              : cancelConfirmOpen
                                ? t("edit.sections.danger.confirm_cancel")
                                : t("edit.sections.danger.cancel_bolao")}
                          </button>
                          {cancelConfirmOpen && (
                            <div className="grid gap-2">
                              <p className="rounded-2xl border border-red-300/20 bg-black/20 px-4 py-3 text-xs text-red-100/85">
                                {t("edit.sections.danger.cancel_warning")}
                              </p>
                              <button
                                type="button"
                                onClick={() => setCancelConfirmOpen(false)}
                                className="text-xs text-zinc-400 underline hover:text-white"
                              >
                                {t("edit.sections.danger.give_up")}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          <button
                            onClick={() => {
                              if (!deleteConfirmOpen) {
                                setDeleteConfirmOpen(true);
                                return;
                              }
                              void handleDeleteBolao();
                            }}
                            disabled={savingKey === "delete"}
                            className="rounded-2xl border border-red-500/20 bg-red-500/10 py-3.5 text-[11px] font-black uppercase tracking-[0.15em] text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            {savingKey === "delete"
                              ? t("edit.sections.danger.deleting")
                              : deleteConfirmOpen
                                ? t("edit.sections.danger.confirm_delete")
                                : t("edit.sections.danger.delete")}
                          </button>
                          {deleteConfirmOpen && (
                            <div className="grid gap-2">
                              <p className="rounded-2xl border border-red-300/20 bg-black/20 px-4 py-3 text-xs text-red-100/85">
                                {t("edit.sections.danger.delete_warning")}
                              </p>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmOpen(false)}
                                className="text-xs text-zinc-400 underline hover:text-white"
                              >
                                {t("edit.sections.danger.give_up")}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="participation" key="participation" className="m-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid gap-4 pb-4"
                >
                  <BolaoEditSectionCard
                    title={t("edit.sections.participation.title")}
                    description={t("edit.sections.participation.desc")}
                    editable={participationEditable}
                    actionLabel={participationEditable ? t("edit.sections.participation.action_save") : t("edit.sections.participation.action_duplicate")}
                    onAction={() =>
                      !canSaveParticipation
                        ? toast({
                            title: t("edit.sections.participation.error_select_group"),
                            description: t("edit.sections.participation.error_select_group_desc"),
                            variant: "destructive",
                          })
                        : participationEditable
                          ? void saveConfigurationSection(
                              "participation",
                              {
                                context: {
                                  group_binding_mode: groupBindingMode,
                                  grupo_id: groupBindingMode === "none" ? null : selectedGrupoId,
                                },
                                access_policy: {
                                  join_mode: joinMode,
                                  visibility: joinMode === "public_open" ? "public" : "private",
                                },
                              },
                              {
                                category: joinMode === "public_open" ? "public" : "private",
                                grupo_id: groupBindingMode === "none" ? null : selectedGrupoId,
                              },
                              t("edit.sections.participation.success_title"),
                            )
                          : void handleDuplicateForSection("participation", {
                              context: {
                                group_binding_mode: groupBindingMode,
                                grupo_id: groupBindingMode === "none" ? null : selectedGrupoId,
                              },
                              access_policy: {
                                join_mode: joinMode,
                                visibility: joinMode === "public_open" ? "public" : "private",
                              },
                              presentation: {
                                name: `${name.trim() || bolao.name} (cópia)`,
                              },
                            })
                    }
                    busy={savingKey === "participation"}
                  />
                  <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                    <label className="grid gap-2 text-sm">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                        {t("edit.sections.participation.group_relation")}
                      </span>
                      <select
                        value={groupBindingMode}
                        onChange={(event) => {
                          const nextValue = event.target.value as GroupBindingMode;
                          setGroupBindingMode(nextValue);
                          if (nextValue === "none") {
                            setSelectedGrupoId(null);
                          }
                        }}
                        className="rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-white focus:border-primary/30 focus:outline-none transition-colors"
                      >
                        <option value="none">{t("edit.sections.participation.no_group")}</option>
                        <option value="linked_discovery">{t("edit.sections.participation.discovery_link")}</option>
                        <option value="group_gated">{t("edit.sections.participation.group_gated")}</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                        {t("edit.sections.participation.linked_group")}
                      </span>
                      <select
                        value={selectedGrupoId || ""}
                        onChange={(event) => setSelectedGrupoId(event.target.value || null)}
                        disabled={groupBindingMode === "none"}
                        className="rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-white focus:border-primary/30 focus:outline-none transition-colors disabled:opacity-30"
                      >
                        <option value="">{t("edit.sections.participation.select_group")}</option>
                        {availableGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                        {t("edit.sections.participation.access_policy")}
                      </span>
                      <select
                        value={joinMode}
                        onChange={(event) => setJoinMode(event.target.value as JoinMode)}
                        className="rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-white focus:border-primary/30 focus:outline-none transition-colors"
                      >
                        <option value="private_invite">{t("edit.sections.participation.private_invite")}</option>
                        <option value="public_open">{t("edit.sections.participation.public_open")}</option>
                      </select>
                    </label>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="rules" key="rules" className="m-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid gap-4 pb-4"
                >
                  <BolaoEditSectionCard
                    title={t("edit.sections.rules.title")}
                    description={t("edit.sections.rules.desc")}
                    editable={editableSections.competition_rules}
                    actionLabel={editableSections.competition_rules ? t("edit.sections.rules.action_save") : t("edit.sections.rules.action_duplicate")}
                    onAction={() =>
                      !canSaveRules
                        ? toast({
                            title: t("edit.sections.rules.error_markets"),
                            description: t("edit.sections.rules.error_markets_desc"),
                            variant: "destructive",
                          })
                        : editableSections.competition_rules
                          ? void saveConfigurationSection(
                              "rules",
                              {
                                competition_rules: {
                                  format: formatId,
                                  scoring_mode: bolao.scoring_mode || "default",
                                  scoring_rules: scoringRules,
                                  markets: selectedMarketIds,
                                },
                              },
                              {
                                format_id: formatId as BolaoData["format_id"],
                                scoring_rules: scoringRules,
                              },
                              t("edit.sections.rules.success_title"),
                            )
                          : void handleDuplicateForSection("rules", {
                              competition_rules: {
                                format: formatId,
                                scoring_mode: bolao.scoring_mode || "default",
                                scoring_rules: scoringRules,
                                markets: selectedMarketIds,
                              },
                              presentation: {
                                name: `${name.trim() || bolao.name} (cópia)`,
                              },
                            })
                    }
                    busy={savingKey === "rules"}
                  />
                  
                  <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                          {t("edit.sections.rules.format")}
                        </span>
                        <select
                          value={formatId}
                          onChange={(event) => {
                            const newFormat = event.target.value as BolaoFormatSlug;
                            setFormatId(newFormat);
                            setSelectedMarketIds(getDefaultMarketIdsForFormat(newFormat) as MarketTemplateSlug[]);
                          }}
                          className="rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-white focus:border-primary/30 focus:outline-none transition-colors"
                        >
                          {availableFormats.map((f) => (
                            <option key={f.slug} value={f.slug}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                          {t("edit.sections.rules.exact_points")}
                        </span>
                        <input
                          type="number"
                          value={scoringRules.exact}
                          onChange={(e) => setScoringRules({ ...scoringRules, exact: Number(e.target.value) })}
                          className="rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-white focus:border-primary/30 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2 text-sm">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                          {t("edit.sections.rules.winner")}
                        </span>
                        <input
                          type="number"
                          value={scoringRules.winner}
                          onChange={(e) => setScoringRules({ ...scoringRules, winner: Number(e.target.value) })}
                          className="rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-white focus:border-primary/30 focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="grid gap-2 text-sm">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                          {t("edit.sections.rules.draw")}
                        </span>
                        <input
                          type="number"
                          value={scoringRules.draw}
                          onChange={(e) => setScoringRules({ ...scoringRules, draw: Number(e.target.value) })}
                          className="rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-white focus:border-primary/30 focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="grid gap-2 text-sm">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                          {t("edit.sections.rules.participation")}
                        </span>
                        <input
                          type="number"
                          value={scoringRules.participation}
                          onChange={(e) => setScoringRules({ ...scoringRules, participation: Number(e.target.value) })}
                          className="rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-white focus:border-primary/30 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="finance" key="finance" className="m-0 focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid gap-4 pb-4"
                >
                  <BolaoEditSectionCard
                    title={t("edit.sections.finance.title")}
                    description={t("edit.sections.finance.desc")}
                    editable={editableSections.finance_rules}
                    actionLabel={editableSections.finance_rules ? t("edit.sections.finance.action_save") : t("edit.sections.finance.action_duplicate")}
                    onAction={() =>
                      editableSections.finance_rules
                        ? void saveConfigurationSection(
                            "finance",
                            {
                              finance_rules: {
                                is_paid: financeMode === "paid_external",
                                entry_fee: Number(entryFee) || 0,
                                payment_details: paymentDetails.trim(),
                                prize_distribution: prizeDistribution.trim(),
                              },
                            },
                            {
                              is_paid: financeMode === "paid_external",
                              entry_fee: Number(entryFee) || 0,
                              payment_details: paymentDetails.trim(),
                              prize_distribution: prizeDistribution.trim(),
                            },
                            t("edit.sections.finance.success_title"),
                          )
                        : void handleDuplicateForSection("finance", {
                            finance_rules: {
                              is_paid: financeMode === "paid_external",
                              entry_fee: Number(entryFee) || 0,
                              payment_details: paymentDetails.trim(),
                              prize_distribution: prizeDistribution.trim(),
                            },
                            presentation: {
                              name: `${name.trim() || bolao.name} (cópia)`,
                            },
                          })
                    }
                    busy={savingKey === "finance"}
                  />
                  <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                    <label className="grid gap-2 text-sm">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                        {t("edit.sections.finance.mode")}
                      </span>
                      <select
                        value={financeMode}
                        onChange={(event) => setFinanceMode(event.target.value as FinanceMode)}
                        className="rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-white focus:border-primary/30 focus:outline-none transition-colors"
                      >
                        <option value="free">{t("edit.sections.finance.free")}</option>
                        <option value="paid_external">{t("edit.sections.finance.paid_external")}</option>
                      </select>
                    </label>
                    {financeMode === "paid_external" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="grid gap-4 overflow-hidden"
                      >
                        <label className="grid gap-2 text-sm">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                            {t("edit.sections.finance.entry_fee")}
                          </span>
                          <input
                            type="number"
                            value={entryFee}
                            onChange={(event) => setEntryFee(event.target.value)}
                            placeholder="0.00"
                            className="rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-white focus:border-primary/30 focus:outline-none transition-colors"
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                            {t("edit.sections.finance.payment_details")}
                          </span>
                          <textarea
                            value={paymentDetails}
                            onChange={(event) => setPaymentDetails(event.target.value)}
                            placeholder={t("edit.sections.finance.payment_details_placeholder")}
                            className="min-h-[80px] rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-white focus:border-primary/30 focus:outline-none transition-colors resize-none"
                          />
                        </label>
                        <label className="grid gap-2 text-sm">
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 pl-1">
                            {t("edit.sections.finance.prize_distribution")}
                          </span>
                          <textarea
                            value={prizeDistribution}
                            onChange={(event) => setPrizeDistribution(event.target.value)}
                            placeholder={t("edit.sections.finance.prize_distribution_placeholder")}
                            className="min-h-[80px] rounded-2xl border border-white/10 bg-[#0a1a11] px-4 py-3.5 text-white focus:border-primary/30 focus:outline-none transition-colors resize-none"
                          />
                        </label>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
