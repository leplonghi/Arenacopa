import { useState } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { buildBolaoMarkets } from "@/services/boloes/bolao-market.service";
import type { BolaoFormatSlug, MarketTemplateSlug, ScoringRules } from "@/types/bolao";

export interface CreateBolaoParams {
  name: string;
  description: string;
  emoji: string;
  category: "private" | "public";
  formatId: BolaoFormatSlug;
  selectedMarketIds: MarketTemplateSlug[];
  scoringRules: ScoringRules;
  champion: string;
  grupoId?: string | null;
}

export interface CreateBolaoResult {
  bolaoId: string;
  inviteCode: string;
}

export function useCreateBolao() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);

  const safeHaptic = async (style: ImpactStyle) => {
    try { await Haptics.impact({ style }); } catch { /* no-op on web */ }
  };

  const createBolao = async (params: CreateBolaoParams): Promise<CreateBolaoResult | null> => {
    if (!user || !params.name.trim()) return null;
    const championEnabled = params.selectedMarketIds.includes("champion");
    if (championEnabled && !params.champion) return null;

    await safeHaptic(ImpactStyle.Heavy);
    setCreating(true);
    try {
      const inviteCodeVal = Math.random().toString(36).substring(2, 8).toUpperCase();
      const insertData = {
        name: params.name.trim(),
        description: params.description.trim() || null,
        creator_id: user.id,
        category: params.category,
        format_id: params.formatId,
        is_paid: false,
        scoring_rules: params.scoringRules,
        scoring_mode: "default",
        visibility_mode: "hidden_until_deadline",
        cutoff_mode: "per_match",
        status: "open",
        invite_code: inviteCodeVal,
        avatar_url: params.emoji,
        grupo_id: params.grupoId ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const boloesRef = collection(db, "boloes");
      const bolaoDoc = await addDoc(boloesRef, insertData);
      const batch = writeBatch(db);

      const matchesSnapshot = await getDocs(
        query(collection(db, "matches"), orderBy("match_date", "asc"))
      );
      const matchRows = matchesSnapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as { match_date: string; stage?: string | null; group_id?: string | null; home_team_code?: string | null; away_team_code?: string | null }),
      }));

      batch.set(doc(db, "bolao_members", `${user.id}_${bolaoDoc.id}`), {
        bolao_id: bolaoDoc.id, user_id: user.id, role: "admin",
        payment_status: "exempt", created_at: new Date().toISOString(),
      });
      batch.set(doc(db, "bolao_onboarding_state", `${user.id}_${bolaoDoc.id}`), {
        id: `${user.id}_${bolaoDoc.id}`, bolao_id: bolaoDoc.id, user_id: user.id,
        seen_intro: false, seen_scoring: false, seen_markets: false,
        seen_ranking: false, completed_at: null, updated_at: new Date().toISOString(),
      });

      const markets = buildBolaoMarkets({
        bolaoId: bolaoDoc.id, formatId: params.formatId,
        selectedMarketIds: params.selectedMarketIds, matches: matchRows,
      });
      markets.forEach((m) => batch.set(doc(db, "bolao_markets", m.id), m));

      if (championEnabled && params.champion) {
        batch.set(doc(db, "bolao_champion_predictions", `${user.id}_${bolaoDoc.id}`), {
          bolao_id: bolaoDoc.id, user_id: user.id,
          team_code: params.champion, updated_at: new Date().toISOString(),
        });
      }

      await batch.commit();

      if (typeof window !== "undefined" && window.plausible) {
        window.plausible("Bolao Created", { props: { category: params.category, format: params.formatId } });
      }
      return { bolaoId: bolaoDoc.id, inviteCode: inviteCodeVal };
    } catch (error) {
      console.error("Erro ao criar bolão:", error);
      toast({
        title: "Erro ao criar bolão",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { createBolao, creating };
}
