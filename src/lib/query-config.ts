/**
 * Centralized TanStack Query cache configuration.
 * Tune these values to balance data freshness vs. Firestore read costs.
 */

/** Static/slow-changing data (matches, championships, profile) — 5 min fresh */
export const STALE_5M = 5 * 60 * 1_000;
/** Semi-dynamic data (bolões, rankings) — 2 min fresh */
export const STALE_2M = 2 * 60 * 1_000;
/** Very dynamic data (predictions, join requests) — 30 sec fresh */
export const STALE_30S = 30 * 1_000;

/** Keep unused queries alive in cache for 10 min */
export const GC_10M = 10 * 60 * 1_000;
/** Keep unused queries alive for 5 min */
export const GC_5M = 5 * 60 * 1_000;
