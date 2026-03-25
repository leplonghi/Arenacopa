import { useState, useRef, useEffect } from "react";
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
  // Guard against calling setState on an unmounted component (e.g. user navigates
  // away mid-creation while batch.commit() is still in flight).
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const safeHaptic = async (style: ImpactStyle) => {
    try { await Haptics.impact({ style }); } catch { /* no-op on web */ }
  };

  const createBolao = async (params: CreateBolaoParams): Promise<CreateBolaoResult | null> => {
    if (!user || !params.name.trim()) return null;
    const championEnabled = params.selectedMarketIds.includes("champion");

    await safeHaptic(ImpactStyle.Heavy);
    setCreating(true);
    let phase = "prepare";
    try {
      phase = "generate_invite";
      const inviteCodeVal = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      phase = "data_setup";
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

      phase = "create_bolao_doc";
      const boloesRef = collection(db, "boloes");
      const bolaoDoc = await addDoc(boloesRef, insertData);

      phase = "batch_init";
      const batch = writeBatch(db);

      phase = "fetch_matches";
      const matchesSnapshot = await getDocs(
        query(collection(db, "matches"), orderBy("match_date", "asc"))
      );
      const matchRows = matchesSnapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as { match_date: string; stage?: string | null; group_id?: string | null; home_team_code?: string | null; away_team_code?: string | null }),
      }));

      phase = "batch_members";
      batch.set(doc(db, "bolao_members", `${user.id}_${bolaoDoc.id}`), {
        bolao_id: bolaoDoc.id, user_id: user.id, role: "admin",
        payment_status: "exempt", created_at: new Date().toISOString(),
      });

      phase = "batch_onboarding";
      batch.set(doc(db, "bolao_onboarding_state", `${user.id}_${bolaoDoc.id}`), {
        id: `${user.id}_${bolaoDoc.id}`, bolao_id: bolaoDoc.id, user_id: user.id,
        seen_intro: false, seen_scoring: false, seen_markets: false,
        seen_ranking: false, completed_at: null, updated_at: new Date().toISOString(),
      });

      phase = "batch_markets";
      const markets = buildBolaoMarkets({
        bolaoId: bolaoDoc.id, formatId: params.formatId,
        selectedMarketIds: params.selectedMarketIds, matches: matchRows,
      });
      markets.forEach((m) => batch.set(doc(db, "bolao_markets", m.id), m));

      if (championEnabled && params.champion) {
        phase = "batch_champion";
        batch.set(doc(db, "bolao_champion_predictions", `${user.id}_${bolaoDoc.id}`), {
          bolao_id: bolaoDoc.id, user_id: user.id,
          team_code: params.champion, updated_at: new Date().toISOString(),
        });
      }

      phase = "batch_commit";
      await batch.commit();

      if (typeof window !== "undefined" && window.plausible) {
        window.plausible("Bolao Created", { props: { category: params.category, format: params.formatId } });
      }
      return { bolaoId: bolaoDoc.id, inviteCode: inviteCodeVal };
    } catch (error) {
      console.error(`Erro ao criar bolão [${phase}]:`, error);
      toast({
        title: `Erro [${phase}]`,
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  };

  return { createBolao, creating };
}
