import { auth } from "@/integrations/firebase/client";
import { mapBolaoConfigDocument } from "@/services/boloes/bolao-config.mapper";
import type {
  AlterBolaoPresentationPayload,
  ArchiveBolaoPayload,
  CreateDraftBolaoPayload,
  DuplicateBolaoPayload,
  FinishBolaoPayload,
  PublishBolaoPayload,
  RemovePoolMemberPayload,
  UpdateBolaoConfigurationPayload,
} from "@/types/bolao-config";

function getFunctionsBaseUrl() {
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

async function postBolaoOperation<T>(
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
    throw new Error(data.error || `bolao_operation_failed:${functionName}`);
  }

  return data as T;
}

export async function createDraftBolao(input: {
  token?: string;
  payload: CreateDraftBolaoPayload;
}) {
  const raw = await postBolaoOperation<any>("createBolaoDraft", input.payload, input.token);
  return mapBolaoConfigDocument(raw);
}

export async function updateBolaoConfiguration(input: {
  token?: string;
  payload: UpdateBolaoConfigurationPayload;
}) {
  const raw = await postBolaoOperation<any>("updateBolaoConfiguration", input.payload, input.token);
  return mapBolaoConfigDocument(raw);
}

export async function publishBolao(input: {
  token?: string;
  payload: PublishBolaoPayload;
}) {
  const raw = await postBolaoOperation<any>("publishBolao", input.payload, input.token);
  return mapBolaoConfigDocument(raw);
}

export async function duplicateBolao(input: {
  token?: string;
  payload: DuplicateBolaoPayload;
}) {
  const raw = await postBolaoOperation<any>("duplicateBolao", input.payload, input.token);
  return mapBolaoConfigDocument(raw);
}

export async function alterBolaoPresentation(input: {
  token?: string;
  payload: AlterBolaoPresentationPayload;
}) {
  const raw = await postBolaoOperation<any>("alterBolaoPresentation", input.payload, input.token);
  return mapBolaoConfigDocument(raw);
}

export async function finishBolao(input: {
  token?: string;
  payload: FinishBolaoPayload;
}) {
  const raw = await postBolaoOperation<any>("finishBolao", input.payload, input.token);
  return mapBolaoConfigDocument(raw);
}

export async function archiveBolao(input: {
  token?: string;
  payload: ArchiveBolaoPayload;
}) {
  const raw = await postBolaoOperation<any>("archiveBolao", input.payload, input.token);
  return mapBolaoConfigDocument(raw);
}

export async function removePoolMember(input: {
  token?: string;
  payload: RemovePoolMemberPayload;
}) {
  return postBolaoOperation<{
    member_id: string;
    membership_status: string;
    removal_reason_code: string | null;
  }>("removePoolMember", input.payload, input.token);
}
