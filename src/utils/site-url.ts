/** Production URL — the single source of truth for all external share links. */
const PRODUCTION_URL = 'https://arenacopa.app';

/**
 * Returns the current app origin.
 * - In Capacitor (native app): always returns PRODUCTION_URL
 * - In Web production: returns the current origin
 * - In Web development (localhost): returns PRODUCTION_URL so share links
 *   are always valid for real users, even when testing locally.
 */
export function getSiteUrl(): string {
  const isCapacitor = (window as Window & { Capacitor?: { isNative?: boolean } }).Capacitor?.isNative;
  if (isCapacitor) return PRODUCTION_URL;

  const origin = window.location.origin;
  const isLocalDev =
    origin.includes('localhost') || origin.includes('127.0.0.1');

  // Always use production for shareable contexts — localhost links are useless
  // for recipients who don't have the dev server running.
  if (isLocalDev) return PRODUCTION_URL;

  return origin;
}

/**
 * Builds a full invite / share URL using the production domain.
 * Always safe to share externally (WhatsApp, SMS, etc.).
 */
export function getInviteUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${PRODUCTION_URL}${normalizedPath}`;
}
