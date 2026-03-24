/**
 * App-wide constants.
 * Centralised here so that magic strings are never duplicated across files.
 */

// ── Demo mode ───────────────────────────────────────────────────────────────
/** Synthetic user ID used exclusively in development demo mode. */
export const DEMO_USER_ID = "demo-user-id" as const;

/** localStorage key that activates demo mode (DEV builds only). */
export const DEMO_MODE_STORAGE_KEY = "demo_mode" as const;

// ── Onboarding ──────────────────────────────────────────────────────────────
/** localStorage key written after the user completes onboarding. */
export const ONBOARDING_DONE_KEY = "arenacopa_onboarding_done" as const;

/** localStorage key written when the user dismisses the Bolões intro banner. */
export const BOLOES_INTRO_SEEN_KEY = "arenacopa_boloes_intro_seen" as const;
