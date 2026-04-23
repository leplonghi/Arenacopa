import { postPublicFunction } from "@/services/backend/functions-http";

type PublicInviteKind = "bolao" | "group";

export type PublicBolaoInvitePayload = {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  category: string | null;
  is_paid: boolean;
  memberCount: number;
  visibility?: "private" | "public";
  admission_mode?: "approval" | "direct_code_or_invite" | "direct_open";
  join_mode?: "private_invite" | "public_open";
  group_binding_mode?: "none" | "linked_discovery" | "group_gated";
  grupo_id?: string | null;
  required_group_id?: string | null;
  required_group_invite_code?: string | null;
  can_join_direct?: boolean;
};

export type PublicGroupInvitePayload = {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  category: string | null;
  memberCount: number;
  visibility?: "private" | "public";
  admission_mode?: "approval" | "direct_code_or_invite" | "direct_open";
  featured_bolao_id?: string | null;
  objective?: string;
  can_join_direct?: boolean;
};

async function resolvePublicInvite<T>(kind: PublicInviteKind, inviteCode: string): Promise<T | null> {
  try {
    const payload = await postPublicFunction<{ found?: boolean; data?: T }>("resolvePublicInvite", {
      kind,
      inviteCode,
    });
    return payload?.data ?? null;
  } catch (error) {
    if (error instanceof Error && error.message === "not_found") {
      return null;
    }
    throw error;
  }
}

export function resolvePublicBolaoInvite(inviteCode: string) {
  return resolvePublicInvite<PublicBolaoInvitePayload>("bolao", inviteCode);
}

export function resolvePublicGroupInvite(inviteCode: string) {
  return resolvePublicInvite<PublicGroupInvitePayload>("group", inviteCode);
}
