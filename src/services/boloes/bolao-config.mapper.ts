import type { BolaoConfigState, BolaoLifecycleStatus, EditableSections } from "@/types/bolao-config";

export type BolaoConfigDocument = {
  id?: string;
  bolao_id?: string;
  lifecycle?: {
    status?: BolaoLifecycleStatus;
  };
  integrity?: {
    is_structure_locked?: boolean;
    config_version?: number | string;
  };
  editable_sections?: Partial<Record<keyof EditableSections, boolean>>;
};

export function mapBolaoConfigDocument(input: BolaoConfigDocument): BolaoConfigState {
  return {
    bolaoId: input.id ?? input.bolao_id ?? "",
    lifecycle: {
      status: input.lifecycle?.status ?? "draft",
    },
    integrity: {
      isStructureLocked: Boolean(input.integrity?.is_structure_locked),
      configVersion: Number(input.integrity?.config_version ?? 1),
    },
    editableSections: {
      presentation: Boolean(input.editable_sections?.presentation),
      context: Boolean(input.editable_sections?.context),
      access_policy: Boolean(input.editable_sections?.access_policy),
      competition_rules: Boolean(input.editable_sections?.competition_rules),
      finance_rules: Boolean(input.editable_sections?.finance_rules),
      operation: Boolean(input.editable_sections?.operation),
    },
  };
}
