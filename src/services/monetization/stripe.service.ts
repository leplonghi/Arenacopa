import { auth, db } from "@/integrations/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { monetizationEnv } from "@/lib/env";

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

type CheckoutSessionResponse = {
  url: string;
  sessionId: string;
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

export const PREMIUM_SUPPORT_EMAIL = "suporte@arenacup.com";

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

const getFunctionsBaseUrl = () => {
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("O checkout premium não está disponível neste ambiente agora.");
  }

  return `https://us-central1-${projectId}.cloudfunctions.net`;
};

const getCheckoutSiteUrl = () => {
  const origin = window.location.origin;
  if (origin.startsWith("http://") || origin.startsWith("https://")) {
    return origin;
  }

  return "https://arenacopa.app";
};

async function callPremiumFunction<T>(functionName: string, payload: Record<string, unknown>): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Entre na sua conta para continuar com o checkout premium.");
  }

  const idToken = await user.getIdToken();
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
    console.error(`Premium function ${functionName} failed`, data.error || response.status);
    throw new Error(
      functionName === "syncPremiumCheckoutSession"
        ? "Não foi possível validar o checkout premium agora."
        : "Não foi possível iniciar o checkout premium agora."
    );
  }

  return data as T;
}

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
    console.error("Error getting premium status:", error);
    return inactiveStatus;
  }
}

export async function createStripeCheckoutSession(): Promise<CheckoutSessionResponse> {
  if (!monetizationEnv.premiumCheckoutEnabled) {
    throw new Error(PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE);
  }

  return callPremiumFunction<CheckoutSessionResponse>("createPremiumCheckoutSession", {
    siteUrl: getCheckoutSiteUrl(),
  });
}

export async function syncStripeCheckoutSession(checkoutSessionId: string): Promise<PremiumStatusResult> {
  if (!monetizationEnv.premiumCheckoutEnabled) {
    return inactiveStatus;
  }

  return callPremiumFunction<PremiumStatusResult>("syncPremiumCheckoutSession", {
    checkoutSessionId,
  });
}

export function getPremiumSupportMailto() {
  const subject = encodeURIComponent("Interesse no Arena CUP Premium");
  const body = encodeURIComponent(
    "Olá! Quero ser avisado assim que o checkout do Arena CUP Premium estiver disponível."
  );

  return `mailto:${PREMIUM_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
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
