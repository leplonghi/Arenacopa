import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BolaoEditSectionCard } from "@/features/boloes/edit/BolaoEditSectionCard";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getDefaultMarketIdsForFormat, listBolaoFormats } from "@/services/boloes/bolao-format.service";
import {
  alterBolaoPresentation,
  duplicateBolao,
  finishBolao,
  archiveBolao,
  updateBolaoConfiguration,
} from "@/services/boloes/bolao-config.service";
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
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
  const [availableGroups, setAvailableGroups] = useState<Array<{ id: string; name: string }>>([]);

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
    setSelectedMarketIds(getDefaultMarketIdsForFormat(bolao.format_id || "classic") as MarketTemplateSlug[]);
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
  }, [bolao]);

  useEffect(() => {
    if (!user?.id || !open) {
      return;
    }

    let mounted = true;
    void (async () => {
      try {
        const membershipSnap = await getDocs(
          query(collection(db, "grupo_members"), where("user_id", "==", user.id)),
        );
        const grupoIds = Array.from(
          new Set(
            membershipSnap.docs
              .map((doc) => doc.data().grupo_id as string | undefined)
              .filter(Boolean),
          ),
        );

        const grupos = await Promise.all(
          grupoIds.map(async (grupoId) => {
            const snapshot = await getDocs(
              query(collection(db, "grupos"), where("__name__", "==", grupoId)),
            );
            const match = snapshot.docs[0];
            return match ? { id: match.id, name: String(match.data().name || "Grupo") } : null;
          }),
        );

        if (mounted) {
          setAvailableGroups(grupos.filter(Boolean) as Array<{ id: string; name: string }>);
        }
      } catch {
        if (mounted) {
          setAvailableGroups([]);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, user?.id]);

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
        title: "Nome obrigatório",
        description: "Dê um nome claro para o bolão antes de salvar.",
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
        title: "Identidade atualizada",
        description: "As informações visuais do bolão foram salvas com segurança.",
      });
    } catch {
      toast({
        title: "Não foi possível salvar",
        description: "Tente novamente em alguns instantes.",
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
        description: "O contrato do bolão foi atualizado com segurança.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível salvar a seção",
        description: "Pode ter havido conflito de versão ou trava estrutural.",
        variant: "destructive",
      });
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
        title: action === "finish" ? "Bolão encerrado" : "Bolão arquivado",
        description: "O estado operacional foi atualizado com segurança.",
      });
    } catch {
      toast({
        title: "Não foi possível atualizar o status",
        description: "Verifique se o bolão está no estado correto para essa ação.",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleDuplicateForSection = async (
    key: "participation" | "rules" | "finance",
    overrides: Record<string, unknown>,
  ) => {
    try {
      setSavingKey(key);
      const duplicated = await duplicateBolao({
        payload: {
          source_bolao_id: bolao.id,
          origin: "published_snapshot",
          overrides,
        },
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
          <DialogTitle className="text-2xl font-black">Editar bolão</DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            Cada seção respeita o estado do bolão. O que já afeta justiça competitiva vira cópia, não gambiarra.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <BolaoEditSectionCard
            title="Identidade"
            description="Nome, descrição, avatar e mensagens visuais do bolão."
            editable={editableSections.presentation}
            actionLabel="Salvar identidade"
            onAction={() => void handleSaveIdentity()}
            busy={savingKey === "presentation"}
          />
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome do bolão"
                className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-sm text-white"
              />
              <input
                value={emoji}
                onChange={(event) => setEmoji(event.target.value)}
                placeholder="Emoji ou avatar curto"
                className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-sm text-white"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Descrição do bolão"
                className="min-h-[110px] rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-sm text-white"
              />
            </div>
          </div>

          <BolaoEditSectionCard
            title="Participação"
            description="Vínculo com grupo, política de entrada e visibilidade."
            editable={participationEditable}
            actionLabel={participationEditable ? "Salvar participação" : "Duplicar para ajustar participação"}
            onAction={() =>
              !canSaveParticipation
                ? toast({
                    title: "Escolha um grupo",
                    description: "Selecione o grupo antes de vincular essa participação.",
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
                      "Participação atualizada",
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
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-300">Relação com grupo</span>
              <select
                value={groupBindingMode}
                onChange={(event) => {
                  const nextValue = event.target.value as GroupBindingMode;
                  setGroupBindingMode(nextValue);
                  if (nextValue === "none") {
                    setSelectedGrupoId(null);
                  }
                }}
                className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-white"
              >
                <option value="none">Sem grupo</option>
                <option value="linked_discovery">Vinculado para descoberta</option>
                <option value="group_gated">Entrada limitada ao grupo</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-300">Grupo vinculado</span>
              <select
                value={selectedGrupoId || ""}
                onChange={(event) => setSelectedGrupoId(event.target.value || null)}
                disabled={groupBindingMode === "none"}
                className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-white disabled:opacity-50"
              >
                <option value="">Selecione um grupo</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-300">Quem pode entrar</span>
              <select
                value={joinMode}
                onChange={(event) => setJoinMode(event.target.value as JoinMode)}
                className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-white"
              >
                <option value="private_invite">Somente convite</option>
                <option value="public_open">Aberto ao público</option>
              </select>
            </label>
          </div>

          <BolaoEditSectionCard
            title="Regras"
            description="Formato, mercados, pontuação e travas competitivas."
            editable={editableSections.competition_rules}
            actionLabel={editableSections.competition_rules ? "Salvar regras" : "Duplicar para mudar regras"}
            onAction={() =>
              !canSaveRules
                ? toast({
                    title: "Escolha ao menos um mercado",
                    description: "O bolão precisa de pelo menos um mercado ativo para funcionar.",
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
                      "Regras atualizadas",
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
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-300">Formato</span>
              <select
                value={formatId}
                onChange={(event) => {
                  const nextFormat = event.target.value as BolaoFormatSlug;
                  setFormatId(nextFormat);
                  setSelectedMarketIds(getDefaultMarketIdsForFormat(nextFormat) as MarketTemplateSlug[]);
                }}
                className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-white"
              >
                {availableFormats.map((format) => (
                  <option key={format.id} value={format.id}>
                    {format.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-sm text-zinc-300">
              {availableFormats.find((format) => format.id === formatId)?.description || "Formato atual do bolão."}
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-sm text-zinc-300 md:col-span-2">
              <p className="mb-3 font-black text-white">Mercados ativos</p>
              <div className="flex flex-wrap gap-2">
                {(getDefaultMarketIdsForFormat(formatId) as MarketTemplateSlug[]).map((marketId) => {
                  const checked = selectedMarketIds.includes(marketId);
                  return (
                    <button
                      key={marketId}
                      type="button"
                      onClick={() =>
                        setSelectedMarketIds((current) =>
                          checked ? current.filter((id) => id !== marketId) : [...current, marketId],
                        )
                      }
                      className={`rounded-full border px-3 py-2 text-xs font-bold ${
                        checked ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-zinc-300"
                      }`}
                    >
                      {marketId}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-300">Pontos por placar exato</span>
              <input
                type="number"
                value={scoringRules.exact}
                onChange={(event) =>
                  setScoringRules((current) => ({ ...current, exact: Number(event.target.value || 0) }))
                }
                className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-white"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-300">Pontos por vencedor</span>
              <input
                type="number"
                value={scoringRules.winner}
                onChange={(event) =>
                  setScoringRules((current) => ({ ...current, winner: Number(event.target.value || 0) }))
                }
                className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-white"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-300">Pontos por empate</span>
              <input
                type="number"
                value={scoringRules.draw}
                onChange={(event) =>
                  setScoringRules((current) => ({ ...current, draw: Number(event.target.value || 0) }))
                }
                className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-white"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-300">Pontos por participação</span>
              <input
                type="number"
                value={scoringRules.participation ?? 0}
                onChange={(event) =>
                  setScoringRules((current) => ({ ...current, participation: Number(event.target.value || 0) }))
                }
                className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-white"
              />
            </label>
          </div>

          <BolaoEditSectionCard
            title="Financeiro"
            description="Modo grátis/pago, valor de entrada e rateio."
            editable={editableSections.finance_rules}
            actionLabel={editableSections.finance_rules ? "Salvar financeiro" : "Duplicar para mudar financeiro"}
            onAction={() =>
              editableSections.finance_rules
                ? void saveConfigurationSection(
                    "finance",
                    {
                      finance_rules: {
                        finance_mode: financeMode,
                        entry_fee_amount: financeMode === "paid_external" && entryFee ? Number(entryFee) : null,
                        distribution_custom_text: prizeDistribution.trim(),
                        payment_details: paymentDetails.trim(),
                      },
                    },
                    {
                      is_paid: financeMode === "paid_external",
                      entry_fee: financeMode === "paid_external" && entryFee ? Number(entryFee) : null,
                      payment_details: paymentDetails.trim() || null,
                      prize_distribution: prizeDistribution.trim() || null,
                    },
                    "Financeiro atualizado",
                  )
                : void handleDuplicateForSection("finance", {
                    finance_rules: {
                      finance_mode: financeMode,
                      entry_fee_amount: financeMode === "paid_external" && entryFee ? Number(entryFee) : null,
                      distribution_custom_text: prizeDistribution.trim(),
                      payment_details: paymentDetails.trim(),
                    },
                    presentation: {
                      name: `${name.trim() || bolao.name} (cópia)`,
                    },
                  })
            }
            busy={savingKey === "finance"}
          />
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-300">Modo financeiro</span>
              <select
                value={financeMode}
                onChange={(event) => setFinanceMode(event.target.value as FinanceMode)}
                className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-white"
              >
                <option value="free">Grátis</option>
                <option value="paid_external">Pago por fora</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-300">Valor de entrada</span>
              <input
                value={entryFee}
                onChange={(event) => setEntryFee(event.target.value)}
                placeholder="Ex.: 20"
                className="rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-white"
              />
            </label>
            <label className="grid gap-2 text-sm md:col-span-2">
              <span className="text-zinc-300">Como o pagamento acontece</span>
              <textarea
                value={paymentDetails}
                onChange={(event) => setPaymentDetails(event.target.value)}
                placeholder="Pix, prazo, conferência manual..."
                className="min-h-[90px] rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-white"
              />
            </label>
            <label className="grid gap-2 text-sm md:col-span-2">
              <span className="text-zinc-300">Rateio ou regra do prêmio</span>
              <textarea
                value={prizeDistribution}
                onChange={(event) => setPrizeDistribution(event.target.value)}
                placeholder="Ex.: 70% para 1º, 30% para 2º"
                className="min-h-[90px] rounded-2xl border border-white/10 bg-[#122117] px-4 py-3 text-white"
              />
            </label>
          </div>

          <BolaoEditSectionCard
            title="Operação"
            description="Encerrar ou arquivar o bolão quando a disputa terminar."
            editable={Boolean(editableSections.operation)}
            actionLabel="Encerrar bolão"
            onAction={() => void handleLifecycleAction("finish")}
            busy={savingKey === "finish"}
          />
          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
            <button
              onClick={() => void handleLifecycleAction("finish")}
              disabled={savingKey === "finish" || savingKey === "archive"}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-black text-amber-300 disabled:opacity-50"
            >
              Encerrar bolão
            </button>
            <button
              onClick={() => void handleLifecycleAction("archive")}
              disabled={savingKey === "finish" || savingKey === "archive"}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              Arquivar bolão
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
