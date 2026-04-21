const APP_ADMIN_EMAILS = new Set(["leplonghi@gmail.com"]);

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || "";
}

export function isAppAdminEmail(email: string | null | undefined) {
  return APP_ADMIN_EMAILS.has(normalizeEmail(email));
}

export function hasPremiumAccessByEmail(email: string | null | undefined) {
  return isAppAdminEmail(email);
}
