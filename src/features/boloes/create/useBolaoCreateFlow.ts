import { useMemo, useState } from "react";
import { getDefaultMarketIdsForFormat } from "@/services/boloes/bolao-format.service";
import type { BolaoFormatSlug, MarketTemplateSlug, ScoringRules } from "@/types/bolao";

export type CreateStep = "context" | "rules" | "review";
export type GroupBindingMode = "none" | "linked_discovery" | "group_gated";
export type JoinMode = "private_invite" | "public_open";
export type FinanceMode = "free" | "paid_external";
export type PoolTypeId = "rachao" | "campeonato" | "classico";
export type PresetKey = "standard" | "risky" | "conservative";

export const PRESETS: Record<PresetKey, ScoringRules> = {
  standard: { exact: 10, winner: 3, draw: 3, participation: 1 },
  risky: { exact: 20, winner: 5, draw: 5, participation: 0 },
  conservative: { exact: 5, winner: 2, draw: 2, participation: 1 },
};

type WizardState = {
  groupBindingMode: GroupBindingMode;
  selectedGrupoId: string | null;
  joinMode: JoinMode;
  financeMode: FinanceMode;
  entryFee: number | "";
  paymentDetails: string;
  prizeDistribution: string;
  selectedTypeId: PoolTypeId;
  formatId: BolaoFormatSlug;
  selectedMarketIds: MarketTemplateSlug[];
  scoringRules: ScoringRules;
  scoringMode: "default" | "exclusive";
  name: string;
  description: string;
  emoji: string;
};

const poolTypeConfig: Record<PoolTypeId, { formatId: BolaoFormatSlug; preset: PresetKey }> = {
  rachao: { formatId: "classic", preset: "standard" },
  campeonato: { formatId: "detailed", preset: "standard" },
  classico: { formatId: "classic", preset: "risky" },
};

function getInitialMarkets(formatId: BolaoFormatSlug) {
  return getDefaultMarketIdsForFormat(formatId).filter((market) => market !== "champion") as MarketTemplateSlug[];
}

export function useBolaoCreateFlow(initialGrupoId: string | null) {
  const initialType = poolTypeConfig.rachao;
  const [step, setStep] = useState<CreateStep>("context");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [state, setState] = useState<WizardState>({
    groupBindingMode: initialGrupoId ? "linked_discovery" : "none",
    selectedGrupoId: initialGrupoId,
    joinMode: "private_invite",
    financeMode: "free",
    entryFee: "",
    paymentDetails: "",
    prizeDistribution: "",
    selectedTypeId: "rachao",
    formatId: initialType.formatId,
    selectedMarketIds: getInitialMarkets(initialType.formatId),
    scoringRules: PRESETS[initialType.preset],
    scoringMode: "default",
    name: "",
    description: "",
    emoji: "⚽",
  });

  const canAdvance = useMemo(() => {
    if (step === "context") {
      return true;
    }

    if (step === "rules") {
      return true;
    }

    return state.name.trim().length >= 3;
  }, [state.name, step]);

  const setSelectedType = (typeId: PoolTypeId) => {
    const config = poolTypeConfig[typeId];
    setState((current) => ({
      ...current,
      selectedTypeId: typeId,
      formatId: config.formatId,
      selectedMarketIds: getInitialMarkets(config.formatId),
      scoringRules: PRESETS[config.preset],
    }));
  };

  return {
    canAdvance,
    draftId,
    setDraftId,
    setSelectedType,
    setState,
    setStep,
    state,
    step,
  };
}
