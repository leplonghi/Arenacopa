/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_ENABLE_PREMIUM_SIMULATION?: string;
    readonly VITE_STRIPE_PREMIUM_PRICE_LABEL?: string;
    readonly VITE_STRIPE_PREMIUM_PRODUCT_NAME?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
}
