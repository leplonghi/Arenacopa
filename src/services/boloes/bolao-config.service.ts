import { postAuthedFunction } from "@/services/backend/functions-http";
import { mapBolaoConfigDocument } from "@/services/boloes/bolao-config.mapper";
import type {
  AlterBolaoPresentationPayload,
  ArchiveBolaoPayload,
  CreateDraftBolaoPayload,
  DuplicateBolaoPayload,
  FinishBolaoPayload,
  LeaveBolaoPayload,
  PublishBolaoPayload,
  RemovePoolMemberPayload,
  UpdatePoolMemberPaymentStatusPayload,
  UpdateBolaoConfigurationPayload,
} from "@/types/bolao-config";

async function postBolaoOperation<T>(
  functionName: string,
  payload: Record<string, unknown>,
  tokenOverride?: string,
): Promise<T> {
  return postAuthedFunction<T>(functionName, payload, tokenOverride);
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

export async function leaveBolao(input: {
  token?: string;
  payload: LeaveBolaoPayload;
}) {
  return postBolaoOperation<{
    membership_status: string;
  }>("leaveBolao", input.payload, input.token);
}

export async function updatePoolMemberPaymentStatus(input: {
  token?: string;
  payload: UpdatePoolMemberPaymentStatusPayload;
}) {
  return postBolaoOperation<{
    member_id: string;
    payment_status: string;
  }>("updatePoolMemberPaymentStatus", input.payload, input.token);
}
