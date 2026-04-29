import { collection, doc, getDoc, getDocs, limit, query } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import type { CommercialCampaignStatus } from "@/types/commercial-campaign";

export type DiscoverCommercialCampaign = {
  id: string;
  title: string;
  shareCode: string;
  benefitSummary: string;
  status: CommercialCampaignStatus;
  merchantName: string;
  city: string;
  neighborhood: string;
};

type CampaignDoc = {
  title?: string;
  share_code?: string;
  benefit_summary?: string;
  status?: CommercialCampaignStatus;
  merchant_id?: string;
};

type MerchantDoc = {
  name?: string;
  city?: string;
  neighborhood?: string;
};

const discoverableCampaignStatuses: CommercialCampaignStatus[] = ["published", "live"];

async function loadMerchantSummary(merchantId: string | undefined) {
  if (!merchantId) {
    return null;
  }

  try {
    const snapshot = await getDoc(doc(db, "merchants", merchantId));
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.data() as MerchantDoc;
  } catch {
    return null;
  }
}

export async function listDiscoverCommercialCampaigns({ limitCount = 6 }: { limitCount?: number } = {}) {
  const snapshot = await getDocs(query(collection(db, "commercial_campaigns"), limit(limitCount * 2)));
  const campaigns = await Promise.all(
    snapshot.docs.map(async (docSnapshot) => {
      const data = docSnapshot.data() as CampaignDoc;
      const status = data.status ?? "draft";

      if (!discoverableCampaignStatuses.includes(status) || !data.share_code) {
        return null;
      }

      const merchant = await loadMerchantSummary(data.merchant_id);
      return {
        id: docSnapshot.id,
        title: data.title || "Campanha ArenaCup",
        shareCode: data.share_code,
        benefitSummary: data.benefit_summary || "Benefício disponível na campanha.",
        status,
        merchantName: merchant?.name || "Negócio parceiro",
        city: merchant?.city || "",
        neighborhood: merchant?.neighborhood || "",
      } satisfies DiscoverCommercialCampaign;
    }),
  );

  return campaigns.filter(Boolean).slice(0, limitCount) as DiscoverCommercialCampaign[];
}
