export type BolaoLifecycleStatus = "draft" | "published" | "live" | "finished" | "archived";

export type EditableSections = {
  presentation: boolean;
  context: boolean;
  access_policy: boolean;
  competition_rules: boolean;
  finance_rules: boolean;
  operation?: boolean;
};

export type BolaoConfigState = {
  bolaoId: string;
  lifecycle: { status: BolaoLifecycleStatus };
  integrity: {
    isStructureLocked: boolean;
    configVersion: number;
  };
  editableSections: EditableSections;
};

export type CreateDraftBolaoPayload = {
  context?: Record<string, unknown>;
  presentation?: Record<string, unknown>;
  access_policy?: Record<string, unknown>;
  competition_rules?: Record<string, unknown>;
  finance_rules?: Record<string, unknown>;
  championship_id?: string | null;
};

export type UpdateBolaoConfigurationPayload = {
  bolao_id: string;
  expected_config_version: number;
  patch: Partial<Record<"context" | "access_policy" | "competition_rules" | "finance_rules", Record<string, unknown>>>;
};

export type PublishBolaoPayload = {
  bolao_id: string;
  expected_config_version: number;
};

export type DuplicateBolaoPayload = {
  source_bolao_id: string;
  origin?: "published_snapshot" | "live_draft";
  overrides?: {
    presentation?: Record<string, unknown>;
    context?: Record<string, unknown>;
    access_policy?: Record<string, unknown>;
    competition_rules?: Record<string, unknown>;
    finance_rules?: Record<string, unknown>;
  };
};

export type AlterBolaoPresentationPayload = {
  bolao_id: string;
  patch: Record<string, unknown>;
};

export type FinishBolaoPayload = {
  bolao_id: string;
  reason?: string;
};

export type ArchiveBolaoPayload = {
  bolao_id: string;
  reason?: string;
};

export type RemovePoolMemberPayload = {
  bolao_id: string;
  member_id: string;
  reason_code: string;
  reason_text?: string;
};

export type LeaveBolaoPayload = {
  bolao_id: string;
};

export type UpdatePoolMemberPaymentStatusPayload = {
  bolao_id: string;
  member_id: string;
  payment_status: "pending" | "paid" | "exempt";
};
