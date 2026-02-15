import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

interface MonetizationContextType {
    isPremium: boolean;
    purchasePremium: () => Promise<void>;
    shouldShowInterstitial: () => boolean; // Checks if it's time to show an interstitial
    incrementActionCount: () => void; // Call this on navigation or major actions
    isLoading: boolean;
}

const MonetizationContext = createContext<MonetizationContextType | undefined>(undefined);

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
    const [isPremium, setIsPremium] = useState<boolean>(() => {
        return localStorage.getItem("isPremium") === "true";
    });
    const [isLoading, setIsLoading] = useState(false);

    // Counter for interstitial logic (e.g., show ad every 5 navigations/actions)
    const [actionCount, setActionCount] = useState(0);

    const purchasePremium = async () => {
        setIsLoading(true);
        // TODO: Replace with real Stripe Payment Link or Checkout Session
        // For now, simulating a successful purchase
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                localStorage.setItem("isPremium", "true");
                setIsPremium(true);
                toast.success("Premium ativado! Obrigado pelo apoio.", {
                    description: "Todos os anúncios foram removidos."
                });
                setIsLoading(false);
                resolve();
            }, 2000);
        });
    };

    const incrementActionCount = () => {
        if (isPremium) return;
        setActionCount(prev => prev + 1);
    };

    const shouldShowInterstitial = () => {
        if (isPremium) return false;
        // Show interstitial every 7 significant actions to be less annoying
        return actionCount > 0 && actionCount % 7 === 0;
    };

    return (
        <MonetizationContext.Provider value={{
            isPremium,
            purchasePremium,
            shouldShowInterstitial,
            incrementActionCount,
            isLoading
        }}>
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
