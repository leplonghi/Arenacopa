import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { hasPremiumAccessByEmail } from "@/lib/access";
import { monetizationEnv } from "@/lib/env";
import {
  activatePremiumSimulation,
  createStripeCheckoutSession,
  getPremiumStatus,
  redirectToCheckout,
  syncStripeCheckoutSession,
  type PremiumSubscriptionStatus,
} from "@/services/monetization/stripe.service";

interface MonetizationContextType {
  isPremium: boolean;
  subscriptionStatus: PremiumSubscriptionStatus;
  purchasePremium: () => Promise<boolean>;
  refreshPremiumStatus: (checkoutSessionId?: string) => Promise<void>;
  shouldShowInterstitial: () => boolean;
  incrementActionCount: () => void;
  isLoading: boolean;
}

const MonetizationContext = createContext<MonetizationContextType | undefined>(undefined);

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<PremiumSubscriptionStatus>("inactive");
  const [isLoading, setIsLoading] = useState(false);
  const [actionCount, setActionCount] = useState(0);

  const applyPremiumState = useCallback((nextIsPremium: boolean, nextStatus: PremiumSubscriptionStatus) => {
    setIsPremium(nextIsPremium);
    setSubscriptionStatus(nextStatus);
    localStorage.setItem("isPremium", String(nextIsPremium));
  }, []);

  const refreshPremiumStatus = useCallback(async (checkoutSessionId?: string) => {
    if (!user) {
      applyPremiumState(false, "inactive");
      return;
    }

    if (hasPremiumAccessByEmail(user.email)) {
      applyPremiumState(true, "active");
      return;
    }

    const isDemoUser = user.id === "demo-user-id";
    if (isDemoUser) {
      const simulatedPremium = localStorage.getItem("isPremium") === "true";
      applyPremiumState(simulatedPremium, simulatedPremium ? "active" : "inactive");
      return;
    }

    setIsLoading(true);
    try {
      const result = checkoutSessionId
        ? await syncStripeCheckoutSession(checkoutSessionId)
        : await getPremiumStatus(user.id);
      applyPremiumState(result.isPremium, result.status);
    } catch (error) {
      console.error("Error loading premium status", error);
      toast.error("Nao foi possivel validar seu status premium agora.");
    } finally {
      setIsLoading(false);
    }
  }, [applyPremiumState, user]);

  useEffect(() => {
    void refreshPremiumStatus();
  }, [refreshPremiumStatus]);

  const purchasePremium = async () => {
    setIsLoading(true);
    try {
      const isDemoUser = user?.id === "demo-user-id";
      if (isDemoUser && monetizationEnv.enablePremiumSimulation) {
        const simulated = activatePremiumSimulation();
        applyPremiumState(simulated.isPremium, simulated.status);
        toast.success("Premium simulado no modo demo.");
        return true;
      }

      const checkout = await createStripeCheckoutSession();
      redirectToCheckout(checkout.url);
      return true;
    } catch (error) {
      console.error("Error starting premium checkout", error);
      toast.error("Não foi possível iniciar o checkout premium agora.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const incrementActionCount = () => {
    if (isPremium) return;
    setActionCount((prev) => prev + 1);
  };

  const shouldShowInterstitial = () => {
    if (isPremium) return false;
    return actionCount > 0 && actionCount % 7 === 0;
  };

  return (
    <MonetizationContext.Provider
      value={{
        isPremium,
        subscriptionStatus,
        purchasePremium,
        refreshPremiumStatus,
        shouldShowInterstitial,
        incrementActionCount,
        isLoading,
      }}
    >
      {children}
    </MonetizationContext.Provider>
  );
}

export const useMonetization = () => {
  const context = useContext(MonetizationContext);
  if (context === undefined) {
    throw new Error("useMonetization must be used within a MonetizationProvider");
  }
  return context;
};
