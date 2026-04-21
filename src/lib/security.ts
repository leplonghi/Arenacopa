const SAFE_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"]);

export function sanitizeInternalRedirect(redirectPath?: string | null) {
  if (!redirectPath) return "/";

  try {
    const decodedPath = decodeURIComponent(redirectPath);
    if (!decodedPath.startsWith("/")) return "/";
    if (decodedPath.startsWith("//")) return "/";
    if (decodedPath.includes("://")) return "/";
    if (decodedPath.startsWith("/\\")) return "/";
    return decodedPath;
  } catch {
    return "/";
  }
}

export function sanitizeExternalUrl(value?: string | null) {
  if (!value) return null;

  try {
    const parsed = new URL(value, window.location.origin);
    if (!SAFE_EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function openSafeExternalUrl(url?: string | null, target = "_blank") {
  const safeUrl = sanitizeExternalUrl(url);
  if (!safeUrl) return false;

  window.open(safeUrl, target, "noopener,noreferrer");
  return true;
}

export function buildWhatsAppShareUrl(text: string) {
  const shareUrl = new URL("https://wa.me/");
  shareUrl.searchParams.set("text", text);
  return sanitizeExternalUrl(shareUrl.toString());
}

export function openWhatsAppShare(text: string, target = "_blank") {
  return openSafeExternalUrl(buildWhatsAppShareUrl(text), target);
}
