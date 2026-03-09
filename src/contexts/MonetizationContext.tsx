import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

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

    useEffect(() => {
        const initRevenueCat = async () => {
            if (Capacitor.isNativePlatform()) {
                Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

                // TODO: Replace with the actual public API keys from RevenueCat
                const apiKey = Capacitor.getPlatform() === 'ios'
                    ? "appl_api_key_placeholder"
                    : "goog_api_key_placeholder";

                await Purchases.configure({ apiKey });

                try {
                    const info = await Purchases.getCustomerInfo();
                    if (typeof info.customerInfo.entitlements.active['arena_elite'] !== 'undefined') {
                        setIsPremium(true);
                        localStorage.setItem("isPremium", "true");
                    }
                } catch (e) {
                    console.error("Error fetching customer info", e);
                }
            }
        };
        initRevenueCat();
    }, []);

    const purchasePremium = async () => {
        setIsLoading(true);

        if (Capacitor.isNativePlatform()) {
            try {
                const offerings = await Purchases.getOfferings();
                const packageToBuy = offerings.current?.availablePackages.find(p => p.identifier === "arena_elite") || offerings.current?.availablePackages[0];

                if (packageToBuy) {
                    const { customerInfo } = await Purchases.purchasePackage({ aPackage: packageToBuy });
                    if (typeof customerInfo.entitlements.active['arena_elite'] !== 'undefined') {
                        localStorage.setItem("isPremium", "true");
                        setIsPremium(true);
                        toast.success("Premium ativado! Obrigado pelo apoio.");
                    }
                } else {
                    toast.error("Pacote premium não encontrado.");
                }
            } catch (e: any) {
                if (!e.userCancelled) {
                    toast.error("Erro ao processar compra.");
                }
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Fallback or Dev mode simulation for web
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
