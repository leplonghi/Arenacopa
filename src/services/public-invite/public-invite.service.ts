type PublicInviteKind = "bolao" | "group";

export type PublicBolaoInvitePayload = {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  category: string | null;
  is_paid: boolean;
  memberCount: number;
};

export type PublicGroupInvitePayload = {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  category: string | null;
  memberCount: number;
};

function getFunctionsBaseUrl() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Ambiente Firebase incompleto.");
  }

  return `https://us-central1-${projectId}.cloudfunctions.net`;
}

async function resolvePublicInvite<T>(kind: PublicInviteKind, inviteCode: string): Promise<T | null> {
  const response = await fetch(`${getFunctionsBaseUrl()}/resolvePublicInvite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      kind,
      inviteCode,
    }),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Não foi possível carregar o convite.");
  }

  const payload = await response.json();
  return (payload?.data as T | undefined) ?? null;
}

export function resolvePublicBolaoInvite(inviteCode: string) {
  return resolvePublicInvite<PublicBolaoInvitePayload>("bolao", inviteCode);
}

export function resolvePublicGroupInvite(inviteCode: string) {
  return resolvePublicInvite<PublicGroupInvitePayload>("group", inviteCode);
}
