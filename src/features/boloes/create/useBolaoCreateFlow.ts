import { useMemo, useState } from "react";
import { getDefaultMarketIdsForFormat } from "@/services/boloes/bolao-format.service";
import type { BolaoFormatSlug, MarketTemplateSlug, ScoringRules } from "@/types/bolao";

export type CreateStep = "mode" | "quick" | "catalog" | "context" | "type" | "admission" | "review";
export type PoolContextMode = "standalone" | "existing_group" | "new_group";
export type GroupBindingMode = "none" | "linked_discovery" | "group_gated";
export type FinanceMode = "free" | "paid_external";
export type PoolTypeId = "rapid" | "complete" | "paid";
export type AccessMode = "approval" | "public" | "group_gated";
export type PresetKey = "standard" | "risky" | "conservative";
export type SocialAudience = "friends" | "family" | "company_coworkers" | "community";
export type CreateAudienceMode = "personal" | "business";
export type CommercialPlanId =
  | "single_match"
  | "five_matches"
  | "short_championship"
  | "full_cup";

export const PRESETS: Record<PresetKey, ScoringRules> = {
  standard: { exact: 10, winner: 3, draw: 3, participation: 1 },
  risky: { exact: 20, winner: 5, draw: 5, participation: 0 },
  conservative: { exact: 5, winner: 2, draw: 2, participation: 1 },
};

type WizardState = {
  audienceMode: CreateAudienceMode;
  commercialPlanId: CommercialPlanId;
  contextMode: PoolContextMode;
  selectedGrupoId: string | null;
  accessMode: AccessMode;
  financeMode: FinanceMode;
  entryFee: number | "";
  paymentDetails: string;
  prizeDistribution: string;
  selectedTypeId: PoolTypeId;
  formatId: BolaoFormatSlug;
  selectedMarketIds: MarketTemplateSlug[];
  predictionCutoffMinutes: number;
  scoringRules: ScoringRules;
  scoringMode: "default" | "exclusive";
  name: string;
  description: string;
  emoji: string;
  socialAudience: SocialAudience;
  newGroupName: string;
  newGroupDescription: string;
  newGroupEmoji: string;
  newGroupObjective: string;
  newGroupVisibility: "private" | "public";
  newGroupAdmissionMode: "approval" | "direct_code_or_invite";
  championshipId: string | null;
  allowedMatchIds: string[] | "all";
};

const poolTypeConfig: Record<PoolTypeId, { formatId: BolaoFormatSlug; preset: PresetKey }> = {
  rapid: { formatId: "classic", preset: "conservative" },
  complete: { formatId: "detailed", preset: "standard" },
  paid: { formatId: "classic", preset: "risky" },
};

function getInitialMarkets(formatId: BolaoFormatSlug) {
  return getDefaultMarketIdsForFormat(formatId).filter((market) => market !== "champion") as MarketTemplateSlug[];
}

export function mapWizardStateToBolaoStructure(state: WizardState) {
  const derivedGroupId = state.contextMode === "new_group" ? null : state.selectedGrupoId;
  const groupBindingMode: GroupBindingMode =
    state.accessMode === "group_gated"
      ? "group_gated"
      : state.contextMode === "standalone"
        ? "none"
        : "linked_discovery";

  return {
    groupBindingMode,
    grupoId: derivedGroupId,
    accessPolicy: {
      join_mode: state.accessMode === "public" ? "public_open" : "private_invite",
      visibility: state.accessMode === "public" ? "public" : "private",
      admission_mode: state.accessMode === "public" ? "direct_open" : "approval",
    },
  };
}

export function useBolaoCreateFlow(initialGrupoId: string | null) {
  const initialType = poolTypeConfig.rapid;
  const [step, setStep] = useState<CreateStep>("quick");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftConfigVersion, setDraftConfigVersion] = useState<number | null>(null);
  const [state, setState] = useState<WizardState>({
    contextMode: initialGrupoId ? "existing_group" : "standalone",
    audienceMode: "personal",
    commercialPlanId: "single_match",
    selectedGrupoId: initialGrupoId,
    accessMode: initialGrupoId ? "group_gated" : "approval",
    financeMode: "free",
    entryFee: "",
    paymentDetails: "",
    prizeDistribution: "",
    selectedTypeId: "rapid",
    formatId: initialType.formatId,
    selectedMarketIds: getInitialMarkets(initialType.formatId),
    predictionCutoffMinutes: 0,
    scoringRules: PRESETS[initialType.preset],
    scoringMode: "default",
    name: "",
    description: "",
    emoji: "⚽",
    socialAudience: "friends",
    newGroupName: "",
    newGroupDescription: "",
    newGroupEmoji: "👥",
    newGroupObjective: "friends",
    newGroupVisibility: "private",
    newGroupAdmissionMode: "approval",
    championshipId: null,
    allowedMatchIds: "all",
  });

  const canAdvance = useMemo(() => {
    if (step === "mode") return false; // mode step uses its own navigation

    if (step === "quick") {
      if (state.audienceMode === "business") {
        return true;
      }

      if (state.contextMode === "new_group" && state.newGroupName.trim().length < 3) {
        return false;
      }

      return state.name.trim().length >= 3;
    }

    if (step === "catalog") {
      if (!state.championshipId) return false;
      if (Array.isArray(state.allowedMatchIds) && state.allowedMatchIds.length === 0) return false;
      return true;
    }

    if (step === "context") {
      if (state.contextMode === "existing_group") {
        return Boolean(state.selectedGrupoId);
      }

      if (state.contextMode === "new_group") {
        return state.newGroupName.trim().length >= 3;
      }

      return true;
    }

    if (step === "type") {
      return true;
    }

    if (step === "admission") {
      return !(state.accessMode === "group_gated" && state.contextMode === "standalone");
    }

    return state.name.trim().length >= 3;
  }, [state, step]);

  const setSelectedType = (typeId: PoolTypeId) => {
    const config = poolTypeConfig[typeId];
    setState((current) => ({
      ...current,
      selectedTypeId: typeId,
      formatId: config.formatId,
      selectedMarketIds: getInitialMarkets(config.formatId),
      scoringRules: PRESETS[config.preset],
      financeMode: typeId === "paid" ? "paid_external" : current.financeMode,
    }));
  };

  return {
    canAdvance,
    draftId,
    draftConfigVersion,
    setDraftId,
    setDraftConfigVersion,
    setSelectedType,
    setState,
    setStep,
    state,
    step,
  };
}
