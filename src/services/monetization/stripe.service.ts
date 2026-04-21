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
import { getSystemLanguage, normalizeLanguage, type AppLanguage } from "@/i18n/language";

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

type PremiumCopy = {
  checkoutUnavailable: string;
  environmentUnavailable: string;
  loginRequired: string;
  validationError: string;
  startError: string;
  supportSubject: string;
  supportBody: string;
};

const inactiveStatus: PremiumStatusResult = {
  isPremium: false,
  status: "inactive",
  checkoutSessionId: null,
  amountTotal: null,
  currency: null,
};

const premiumCopyByLanguage: Record<AppLanguage, PremiumCopy> = {
  "pt-BR": {
    checkoutUnavailable: "Premium temporariamente indisponivel enquanto o backend desta versao e estabilizado.",
    environmentUnavailable: "O checkout premium não está disponível neste ambiente agora.",
    loginRequired: "Entre na sua conta para continuar com o checkout premium.",
    validationError: "Não foi possível validar o checkout premium agora.",
    startError: "Não foi possível iniciar o checkout premium agora.",
    supportSubject: "Interesse no Arena CUP Premium",
    supportBody: "Olá! Quero ser avisado assim que o checkout do Arena CUP Premium estiver disponível.",
  },
  en: {
    checkoutUnavailable: "Premium is temporarily unavailable while this version's backend is being stabilized.",
    environmentUnavailable: "Premium checkout is not available in this environment right now.",
    loginRequired: "Sign in to continue with premium checkout.",
    validationError: "We couldn't validate premium checkout right now.",
    startError: "We couldn't start premium checkout right now.",
    supportSubject: "Interest in Arena CUP Premium",
    supportBody: "Hello! Please let me know as soon as Arena CUP Premium checkout is available.",
  },
  es: {
    checkoutUnavailable: "Premium está temporalmente no disponible mientras se estabiliza el backend de esta versión.",
    environmentUnavailable: "El checkout premium no está disponible en este entorno ahora mismo.",
    loginRequired: "Inicia sesión para continuar con el checkout premium.",
    validationError: "No se pudo validar el checkout premium ahora mismo.",
    startError: "No se pudo iniciar el checkout premium ahora mismo.",
    supportSubject: "Interés en Arena CUP Premium",
    supportBody: "¡Hola! Quiero que me avisen en cuanto el checkout de Arena CUP Premium esté disponible.",
  },
};

const getPremiumCopy = (language = getSystemLanguage()) => {
  return premiumCopyByLanguage[normalizeLanguage(language)];
};

export const PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE =
  getPremiumCopy().checkoutUnavailable;

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
    throw new Error(getPremiumCopy().environmentUnavailable);
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
    throw new Error(getPremiumCopy().loginRequired);
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
    const copy = getPremiumCopy();
    console.error(`Premium function ${functionName} failed`, data.error || response.status);
    throw new Error(
      functionName === "syncPremiumCheckoutSession"
        ? copy.validationError
        : copy.startError
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
  const copy = getPremiumCopy();
  const subject = encodeURIComponent(copy.supportSubject);
  const body = encodeURIComponent(copy.supportBody);

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
