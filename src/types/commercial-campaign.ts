export type MerchantStatus = "draft" | "active" | "blocked";
export type MerchantStaffRole = "owner" | "manager" | "staff";
export type CommercialCampaignStatus =
  | "draft"
  | "pending_payment"
  | "published"
  | "live"
  | "finished"
  | "archived";

export type CommercialOrderStatus = "pending" | "paid" | "failed" | "refunded";

export type MerchantSummary = {
  id: string;
  name: string;
  cep?: string | null;
  city: string;
  neighborhood: string;
  status: MerchantStatus;
  contactWhatsapp?: string | null;
  instagram?: string | null;
};

export type CommercialCampaignKind = "match" | "period";
export type CommercialCampaignPricingPlan =
  | "single_match"
  | "five_matches"
  | "short_championship"
  | "full_cup";
export type CommercialCampaignBillingMode = "one_time" | "subscription";

export type CommercialCampaign = {
  id: string;
  merchantId: string;
  kind: CommercialCampaignKind;
  bolaoId: string | null;
  groupId: string | null;
  championshipId: string | null;
  matchId: string | null;
  status: CommercialCampaignStatus;
  title: string;
  shareCode: string;
  qrPayload: string;
  benefitSummary: string;
  benefitCode: string;
  benefitTerms: string | null;
  pricingPlan: CommercialCampaignPricingPlan;
  includedGames: number | null;
  participantLimit: number | null;
  billingMode: CommercialCampaignBillingMode;
  stripePriceId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  paidOrderId: string | null;
  generatedTitleSource?: string | null;
  merchant?: MerchantSummary;
  bolaoInviteCode?: string | null;
};

export type CreateCommercialCampaignDraftPayload = {
  merchant_id?: string | null;
  merchant?: {
    name: string;
    cep: string;
    city: string;
    neighborhood: string;
    contact_whatsapp?: string | null;
    instagram?: string | null;
  };
  campaign: {
    kind: CommercialCampaignKind;
    title: string;
    championship_id?: string | null;
    match_id?: string | null;
    pricing_plan: CommercialCampaignPricingPlan;
    starts_at?: string | null;
    ends_at?: string | null;
    benefit_summary: string;
    benefit_code: string;
    benefit_terms?: string | null;
    generated_title_source?: string | null;
  };
};

export type CreateCommercialCampaignCheckoutPayload = {
  campaign_id: string;
  site_url: string;
};

export type SyncCommercialCampaignCheckoutPayload = {
  checkout_session_id: string;
};

export type CommercialCampaignCheckout = {
  url: string;
  sessionId: string;
  orderId: string;
};
