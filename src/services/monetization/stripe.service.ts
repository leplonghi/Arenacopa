import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { monetizationEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export type PremiumSubscriptionStatus = "inactive" | "pending" | "active" | "expired" | "canceled" | "failed";

type PremiumSubscriptionRow = {
  status: Exclude<PremiumSubscriptionStatus, "inactive">;
  stripe_checkout_session_id: string | null;
  amount_total: number | null;
  currency: string | null;
};

export type PremiumStatusResult = {
  isPremium: boolean;
  status: PremiumSubscriptionStatus;
  checkoutSessionId: string | null;
  amountTotal: number | null;
  currency: string | null;
};

const inactiveStatus: PremiumStatusResult = {
  isPremium: false,
  status: "inactive",
  checkoutSessionId: null,
  amountTotal: null,
  currency: null,
};

export const PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE =
  "Premium temporariamente indisponivel enquanto o backend desta versao e estabilizado.";

const mapSubscriptionRow = (row: PremiumSubscriptionRow | null): PremiumStatusResult => {
  if (!row) {
    return inactiveStatus;
  }

  return {
    isPremium: row.status === "active",
    status: row.status,
    checkoutSessionId: row.stripe_checkout_session_id,
    amountTotal: row.amount_total,
    currency: row.currency,
  };
};

export async function getPremiumStatus(userId: string): Promise<PremiumStatusResult> {
  try {
    const q = query(
      collection(db, "premium_subscriptions"),
      where("user_id", "==", userId),
      orderBy("created_at", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return inactiveStatus;
    
    const data = querySnapshot.docs[0].data() as PremiumSubscriptionRow;
    return mapSubscriptionRow(data);
  } catch (error) {
    logger.error("Error getting premium status", { userId, error });
    return inactiveStatus;
  }
}

export async function createStripeCheckoutSession() {
  if (!monetizationEnv.premiumCheckoutEnabled) {
    throw new Error(PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE);
  }

  throw new Error(PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE);
}

export async function syncStripeCheckoutSession(checkoutSessionId: string): Promise<PremiumStatusResult> {
  void checkoutSessionId;
  return inactiveStatus;
}

export function redirectToCheckout(url: string) {
  window.location.assign(url);
}

export function activatePremiumSimulation(): PremiumStatusResult {
  localStorage.setItem("isPremium", "true");
  return {
    isPremium: true,
    status: "active",
    checkoutSessionId: "simulation",
    amountTotal: null,
    currency: "brl",
  };
}
