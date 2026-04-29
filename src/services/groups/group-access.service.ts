import { postAuthedFunction } from "@/services/backend/functions-http";
import type {
  BolaoJoinResult,
  CreateGroupPayload,
  GroupAdmissionMode,
  GroupJoinResult,
  GroupSummary,
  GroupVisibility,
  UpdateGroupSettingsPayload,
} from "@/types/group-access";

type GroupSummaryDocument = {
  id?: string;
  group_id?: string;
  name?: string;
  description?: string | null;
  emoji?: string;
  visibility?: GroupVisibility;
  admission_mode?: GroupAdmissionMode;
  category?: "private" | "public";
  featured_bolao_id?: string | null;
  objective?: string;
  invite_code?: string;
};

type GroupJoinResponse = {
  group_id: string;
  status: GroupJoinResult["status"];
  membership_status?: GroupJoinResult["membershipStatus"];
  request_id?: string;
  request_status?: GroupJoinResult["requestStatus"];
  group?: GroupSummaryDocument;
};

type BolaoJoinResponse = {
  bolao_id: string;
  status: BolaoJoinResult["status"];
  membership_status?: BolaoJoinResult["membershipStatus"];
  request_id?: string;
  request_status?: BolaoJoinResult["requestStatus"];
  required_group_id?: string | null;
};

export type JoinViaInviteResult = GroupJoinResponse | BolaoJoinResponse;

function mapGroupSummary(input: GroupSummaryDocument): GroupSummary {
  return {
    id: input.id ?? input.group_id ?? "",
    name: input.name ?? "",
    description: input.description ?? null,
    emoji: input.emoji ?? "👥",
    visibility: input.visibility ?? (input.category === "public" ? "public" : "private"),
    admissionMode:
      input.admission_mode ??
      ((input.category === "public" ? "direct_code_or_invite" : "approval") as GroupSummary["admissionMode"]),
    category: input.category ?? "private",
    featuredBolaoId: input.featured_bolao_id ?? null,
    objective: input.objective ?? "friends",
    inviteCode: input.invite_code ?? "",
  };
}

export async function createGroup(input: {
  token?: string;
  payload: CreateGroupPayload;
}) {
  const raw = await postAuthedFunction<GroupSummaryDocument>("createGroup", input.payload, input.token);
  return mapGroupSummary(raw);
}

export async function updateGroupSettings(input: {
  token?: string;
  payload: UpdateGroupSettingsPayload;
}) {
  const raw = await postAuthedFunction<GroupSummaryDocument>("updateGroupSettings", input.payload, input.token);
  return mapGroupSummary(raw);
}

export async function requestGroupJoin(input: {
  token?: string;
  payload: { group_id: string; invite_code?: string | null; origin?: string };
}) {
  const raw = await postAuthedFunction<GroupJoinResponse>("requestGroupJoin", input.payload, input.token);
  return {
    groupId: raw.group_id,
    status: raw.status,
    membershipStatus: raw.membership_status,
    requestId: raw.request_id,
    requestStatus: raw.request_status,
    group: raw.group ? mapGroupSummary(raw.group) : undefined,
  } satisfies GroupJoinResult;
}

export async function approveGroupJoin(input: {
  token?: string;
  payload: { group_id: string; request_id: string; reason_code?: string | null };
}) {
  return postAuthedFunction<{
    request_id: string;
    request_status: string;
    membership_status: string;
  }>("approveGroupJoin", input.payload, input.token);
}

export async function rejectGroupJoin(input: {
  token?: string;
  payload: { group_id: string; request_id: string; reason_code?: string | null };
}) {
  return postAuthedFunction<{
    request_id: string;
    request_status: string;
  }>("rejectGroupJoin", input.payload, input.token);
}

export async function leaveGroup(input: {
  token?: string;
  payload: { group_id: string };
}) {
  return postAuthedFunction<{ membership_status: string }>("leaveGroup", input.payload, input.token);
}

export async function removeGroupMember(input: {
  token?: string;
  payload: { group_id: string; member_id: string; reason_code?: string | null };
}) {
  return postAuthedFunction<{
    member_id: string;
    membership_status: string;
  }>("removeGroupMember", input.payload, input.token);
}

export async function setFeaturedGroupBolao(input: {
  token?: string;
  payload: { group_id: string; bolao_id?: string | null };
}) {
  return postAuthedFunction<{
    group_id: string;
    featured_bolao_id: string | null;
  }>("setFeaturedGroupBolao", input.payload, input.token);
}

export async function requestBolaoJoin(input: {
  token?: string;
  payload: { bolao_id: string; invite_code?: string | null; origin?: string };
}) {
  const raw = await postAuthedFunction<BolaoJoinResponse>("requestBolaoJoin", input.payload, input.token);
  return {
    bolaoId: raw.bolao_id,
    status: raw.status,
    membershipStatus: raw.membership_status,
    requestId: raw.request_id,
    requestStatus: raw.request_status,
    requiredGroupId: raw.required_group_id ?? null,
  } satisfies BolaoJoinResult;
}

export async function approveBolaoJoin(input: {
  token?: string;
  payload: { bolao_id: string; request_id: string; reason_code?: string | null };
}) {
  return postAuthedFunction<{
    request_id: string;
    request_status: string;
    membership_status: string;
  }>("approveBolaoJoin", input.payload, input.token);
}

export async function rejectBolaoJoin(input: {
  token?: string;
  payload: { bolao_id: string; request_id: string; reason_code?: string | null };
}) {
  return postAuthedFunction<{
    request_id: string;
    request_status: string;
  }>("rejectBolaoJoin", input.payload, input.token);
}

export async function joinViaInvite(input: {
  token?: string;
  payload: { kind: "group" | "bolao"; invite_code: string };
}) {
  return postAuthedFunction<JoinViaInviteResult>("joinViaInvite", input.payload, input.token);
}
