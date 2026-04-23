import { auth } from "@/integrations/firebase/client";

export function getFunctionsBaseUrl() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Ambiente Firebase incompleto.");
  }

  return `https://us-central1-${projectId}.cloudfunctions.net`;
}

async function resolveIdToken(tokenOverride?: string) {
  if (tokenOverride) {
    return tokenOverride;
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error("Autenticação obrigatória.");
  }

  return user.getIdToken();
}

export async function postAuthedFunction<T>(
  functionName: string,
  payload: Record<string, unknown>,
  tokenOverride?: string,
): Promise<T> {
  const idToken = await resolveIdToken(tokenOverride);
  const response = await fetch(`${getFunctionsBaseUrl()}/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>;
  if (!response.ok) {
    if (response.status === 404 && !data.error) {
      throw new Error("not_found");
    }
    throw new Error(data.error || `function_failed:${functionName}`);
  }

  return data as T;
}

export async function postPublicFunction<T>(
  functionName: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${getFunctionsBaseUrl()}/${functionName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string } & Record<string, unknown>;
  if (!response.ok) {
    if (response.status === 404 && !data.error) {
      throw new Error("not_found");
    }
    throw new Error(data.error || `function_failed:${functionName}`);
  }

  return data as T;
}
