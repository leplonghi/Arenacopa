import { auth } from "@/integrations/firebase/client";

export function getFunctionsBaseUrl() {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Ambiente Firebase incompleto.");
  }

  if (import.meta.env.DEV) {
    return "/__functions";
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s guard

  let response: Response;
  try {
    response = await fetch(`${getFunctionsBaseUrl()}/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`function_timeout:${functionName}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

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
  const url = `${getFunctionsBaseUrl()}/${functionName}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    console.error(`[functions-http] Network error calling ${functionName}:`, networkError);
    throw new Error(`network_error:${functionName}`);
  }

  let data: { error?: string } & Record<string, unknown> = {};
  try {
    const text = await response.text();
    data = text ? (JSON.parse(text) as { error?: string } & Record<string, unknown>) : {};
  } catch (parseError) {
    console.error(`[functions-http] Failed to parse response from ${functionName}:`, parseError);
  }

  if (!response.ok) {
    if (response.status === 404 && !data.error) {
      throw new Error("not_found");
    }
    throw new Error(data.error || `function_failed:${functionName}:${response.status}`);
  }

  return data as T;
}
