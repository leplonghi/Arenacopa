import { postAuthedFunction } from "@/services/backend/functions-http";
import type {
  BolaoJoinResult,
  CreateGroupPayload,
  GroupJoinResult,
  GroupSummary,
  UpdateGroupSettingsPayload,
} from "@/types/group-access";

function mapGroupSummary(input: any): GroupSummary {
  return {
    id: input.id ?? input.group_id,
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
  const raw = await postAuthedFunction<any>("createGroup", input.payload, input.token);
  return mapGroupSummary(raw);
}

export async function updateGroupSettings(input: {
  token?: string;
  payload: UpdateGroupSettingsPayload;
}) {
  const raw = await postAuthedFunction<any>("updateGroupSettings", input.payload, input.token);
  return mapGroupSummary(raw);
}

export async function requestGroupJoin(input: {
  token?: string;
  payload: { group_id: string; invite_code?: string | null; origin?: string };
}) {
  const raw = await postAuthedFunction<any>("requestGroupJoin", input.payload, input.token);
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
  const raw = await postAuthedFunction<any>("requestBolaoJoin", input.payload, input.token);
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
  return postAuthedFunction<any>("joinViaInvite", input.payload, input.token);
}
