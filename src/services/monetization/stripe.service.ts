import { supabase } from "@/services/supabase/client";

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
  const { data, error } = await supabase
    .from("premium_subscriptions")
    .select("status, stripe_checkout_session_id, amount_total, currency")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapSubscriptionRow(data as PremiumSubscriptionRow | null);
}

export async function createStripeCheckoutSession() {
  const { data, error } = await supabase.functions.invoke("create-stripe-checkout", {
    body: {},
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error("Stripe checkout URL was not returned.");
  }

  return {
    url: data.url as string,
    sessionId: (data.sessionId as string | undefined) ?? null,
  };
}

export async function syncStripeCheckoutSession(checkoutSessionId: string): Promise<PremiumStatusResult> {
  const { data, error } = await supabase.functions.invoke("sync-stripe-checkout", {
    body: {
      checkoutSessionId,
    },
  });

  if (error) {
    throw error;
  }

  return {
    isPremium: Boolean(data?.isPremium),
    status: (data?.status as PremiumSubscriptionStatus | undefined) ?? "inactive",
    checkoutSessionId,
    amountTotal: null,
    currency: null,
  };
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
