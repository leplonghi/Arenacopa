import { postAuthedFunction, postPublicFunction } from "@/services/backend/functions-http";
import type {
  CommercialCampaign,
  CommercialCampaignBillingMode,
  CommercialCampaignCheckout,
  CommercialCampaignPricingPlan,
  CreateCommercialCampaignCheckoutPayload,
  CreateCommercialCampaignDraftPayload,
  MerchantSummary,
  SyncCommercialCampaignCheckoutPayload,
} from "@/types/commercial-campaign";

type MerchantDocument = {
  id?: string;
  merchant_id?: string;
  name?: string;
  cep?: string | null;
  city?: string;
  neighborhood?: string;
  status?: MerchantSummary["status"];
  contact_whatsapp?: string | null;
  instagram?: string | null;
};

type CommercialCampaignDocument = {
  id?: string;
  campaign_id?: string;
  merchant_id?: string;
  bolao_id?: string | null;
  group_id?: string | null;
  championship_id?: string | null;
  match_id?: string | null;
  kind?: CommercialCampaign["kind"];
  status?: CommercialCampaign["status"];
  title?: string;
  share_code?: string;
  qr_payload?: string;
  pricing_plan?: CommercialCampaignPricingPlan;
  included_games?: number | null;
  participant_limit?: number | null;
  billing_mode?: CommercialCampaignBillingMode;
  stripe_price_id?: string | null;
  benefit_summary?: string;
  benefit_code?: string;
  benefit_terms?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  paid_order_id?: string | null;
  generated_title_source?: string | null;
  merchant?: MerchantDocument;
  bolao_invite_code?: string | null;
};

function mapMerchant(input?: MerchantDocument): MerchantSummary | undefined {
  if (!input) return undefined;

  return {
    id: input.id ?? input.merchant_id ?? "",
    name: input.name ?? "",
    cep: input.cep ?? null,
    city: input.city ?? "",
    neighborhood: input.neighborhood ?? "",
    status: input.status ?? "draft",
    contactWhatsapp: input.contact_whatsapp ?? null,
    instagram: input.instagram ?? null,
  };
}

export function mapCommercialCampaign(input: CommercialCampaignDocument): CommercialCampaign {
  return {
    id: input.id ?? input.campaign_id ?? "",
    merchantId: input.merchant_id ?? "",
    kind: input.kind ?? "match",
    bolaoId: input.bolao_id ?? null,
    groupId: input.group_id ?? null,
    championshipId: input.championship_id ?? null,
    matchId: input.match_id ?? null,
    status: input.status ?? "draft",
    title: input.title ?? "",
    shareCode: input.share_code ?? "",
    qrPayload: input.qr_payload ?? "",
    pricingPlan: input.pricing_plan ?? "single_match",
    includedGames: input.included_games ?? null,
    participantLimit: input.participant_limit ?? null,
    billingMode: input.billing_mode ?? "one_time",
    stripePriceId: input.stripe_price_id ?? null,
    benefitSummary: input.benefit_summary ?? "",
    benefitCode: input.benefit_code ?? "",
    benefitTerms: input.benefit_terms ?? null,
    startsAt: input.starts_at ?? null,
    endsAt: input.ends_at ?? null,
    paidOrderId: input.paid_order_id ?? null,
    generatedTitleSource: input.generated_title_source ?? null,
    merchant: mapMerchant(input.merchant),
    bolaoInviteCode: input.bolao_invite_code ?? null,
  };
}

export async function createCommercialCampaignDraft(input: {
  token?: string;
  payload: CreateCommercialCampaignDraftPayload;
}) {
  const raw = await postAuthedFunction<CommercialCampaignDocument>(
    "createCommercialCampaignDraft",
    input.payload,
    input.token,
  );
  return mapCommercialCampaign(raw);
}

export async function listManagedMerchants(input: { token?: string } = {}) {
  const raw = await postAuthedFunction<MerchantDocument[]>("listManagedMerchants", {}, input.token);
  return raw.map((merchant) => mapMerchant(merchant)).filter(Boolean) as MerchantSummary[];
}

export async function getCommercialCampaign(input: {
  token?: string;
  payload: { campaign_id: string };
}) {
  const raw = await postAuthedFunction<CommercialCampaignDocument>(
    "getCommercialCampaign",
    input.payload,
    input.token,
  );
  return mapCommercialCampaign(raw);
}

export async function createCommercialCampaignCheckout(input: {
  token?: string;
  payload: CreateCommercialCampaignCheckoutPayload;
}) {
  const raw = await postAuthedFunction<{
    url: string;
    sessionId?: string;
    session_id?: string;
    orderId?: string;
    order_id?: string;
  }>("createCommercialCampaignCheckout", input.payload, input.token);

  return {
    url: raw.url,
    sessionId: raw.sessionId ?? raw.session_id ?? "",
    orderId: raw.orderId ?? raw.order_id ?? "",
  } satisfies CommercialCampaignCheckout;
}

export async function syncCommercialCampaignCheckout(input: {
  token?: string;
  payload: SyncCommercialCampaignCheckoutPayload;
}) {
  const raw = await postAuthedFunction<CommercialCampaignDocument>(
    "syncCommercialCampaignCheckout",
    input.payload,
    input.token,
  );
  return mapCommercialCampaign(raw);
}

export async function resolveCommercialCampaign(input: {
  shareCode: string;
}) {
  const raw = await postPublicFunction<CommercialCampaignDocument>("resolveCommercialCampaign", {
    share_code: input.shareCode,
  });
  return mapCommercialCampaign(raw);
}
