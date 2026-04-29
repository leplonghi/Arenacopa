export function getBootstrapRedirectTarget(input: {
  pathname: string;
  search: string;
  sessionRedirect: string | null;
}) {
  if (input.sessionRedirect) {
    return normalizeInternalPath(input.sessionRedirect);
  }

  if (input.pathname === "/auth") {
    return null;
  }

  const redirect = new URLSearchParams(input.search).get("redirect");
  return redirect ? normalizeInternalPath(redirect) : null;
}

export function getLocalAuthHostRedirectUrl(input: {
  href: string;
  isDev: boolean;
}) {
  if (!input.isDev) return null;

  const url = new URL(input.href);
  if (url.hostname !== "127.0.0.1") return null;

  url.hostname = "localhost";
  return url.toString();
}

function normalizeInternalPath(target: string) {
  const trimmed = target.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) {
    return null;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
