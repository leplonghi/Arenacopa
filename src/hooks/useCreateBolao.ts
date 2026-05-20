import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  doc,
  setDoc,
} from "firebase/firestore";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createAndPublishBolao } from "@/services/boloes/bolao-config.service";
import type { BolaoFormatSlug, MarketTemplateSlug, ScoringRules } from "@/types/bolao";

export interface CreateBolaoParams {
  name: string;
  description: string;
  emoji: string;
  category: "private" | "public";
  isPaid?: boolean;
  entryFee?: number;
  prizeDistribution?: string;
  paymentDetails?: string;
  scoringMode?: "default" | "exclusive";
  formatId: BolaoFormatSlug;
  selectedMarketIds: MarketTemplateSlug[];
  scoringRules: ScoringRules;
  champion: string;
  grupoId?: string | null;
  championshipId?: string;
  allowedMatchIds?: string[] | "all";
  /** Quando fornecido, cria um bolão de jogo único (Rachão rápido) */
  matchId?: string;
}

export interface CreateBolaoResult {
  bolaoId: string;
  inviteCode: string;
}

export function useCreateBolao() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation("bolao");
  const [creating, setCreating] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const safeHaptic = async (style: ImpactStyle) => {
    try { await Haptics.impact({ style }); } catch { /* no-op on web */ }
  };

  const generateInviteCodeFromBolaoId = (bolaoId: string) => {
    const normalized = bolaoId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return normalized.slice(-8);
  };

  const createBolao = async (params: CreateBolaoParams): Promise<CreateBolaoResult | null> => {
    if (!user || !params.name.trim()) return null;
    const championEnabled = params.selectedMarketIds.includes("champion");

    await safeHaptic(ImpactStyle.Heavy);
    setCreating(true);
    let phase = "prepare";
    try {
      phase = "data_setup";
      const allowedMatchIds = params.allowedMatchIds ?? (params.matchId ? [params.matchId] : "all");

      phase = "create_function";
      const created = await createAndPublishBolao({
        payload: {
          presentation: {
            name: params.name.trim(),
            description: params.description.trim() || "",
            emoji: params.emoji,
          },
          context: {
            grupo_id: params.grupoId ?? null,
            group_binding_mode: params.grupoId ? "linked" : "none",
          },
          access_policy: {
            visibility: params.category,
            join_mode: params.category === "public" ? "public_open" : "private_invite",
          },
          competition_rules: {
            format: params.formatId,
            scoring_mode: params.scoringMode ?? "default",
            markets: params.selectedMarketIds,
            scoring_rules: params.scoringRules,
          },
          finance_rules: {
            finance_mode: params.isPaid ? "paid_external" : "free",
            entry_fee_amount: params.entryFee ?? null,
            distribution_custom_text: params.prizeDistribution ?? "",
            payment_details: params.paymentDetails ?? "",
          },
          championship_id: params.championshipId ?? null,
          allowed_match_ids: allowedMatchIds,
        },
      });

      if (championEnabled && params.champion) {
        phase = "champion_prediction";
        await setDoc(doc(db, "bolao_champion_predictions", `${user.id}_${created.bolaoId}`), {
          bolao_id: created.bolaoId, user_id: user.id,
          team_code: params.champion, updated_at: new Date().toISOString(),
        });
      }

      if (typeof window !== "undefined" && window.plausible) {
        window.plausible("Bolao Created", { props: { category: params.category, format: params.formatId } });
      }
      return { bolaoId: created.bolaoId, inviteCode: generateInviteCodeFromBolaoId(created.bolaoId) };
    } catch (error) {
      console.error(`Erro ao criar bolão [${phase}]:`, error);
      toast({
        title: t('create.error_title', { defaultValue: 'Não foi possível criar o bolão' }),
        description: t('create.error_desc', { defaultValue: 'Revise os dados e tente novamente em alguns instantes.' }),
        variant: "destructive",
      });
      return null;
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  };

  return { createBolao, creating };
}
