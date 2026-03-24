const parseBoolean = (value: string | undefined, fallback = false) => {
  if (value == null) return fallback;
  return value === "true";
};

export const monetizationEnv = {
  enablePremiumSimulation:
    parseBoolean(import.meta.env.VITE_ENABLE_PREMIUM_SIMULATION, false) || import.meta.env.DEV,
  premiumCheckoutEnabled: parseBoolean(import.meta.env.VITE_PREMIUM_CHECKOUT_ENABLED, false),
  premiumPriceLabel: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_LABEL?.trim() || "R$9,90",
  premiumProductName: import.meta.env.VITE_STRIPE_PREMIUM_PRODUCT_NAME?.trim() || "Arena CUP Premium",
};
