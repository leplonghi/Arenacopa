export const SUPPORTED_LANGUAGES = ["pt-BR", "en", "es"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = "pt-BR";

const BRAZIL_TIMEZONES = new Set([
  "America/Araguaina",
  "America/Bahia",
  "America/Belem",
  "America/Boa_Vista",
  "America/Campo_Grande",
  "America/Cuiaba",
  "America/Eirunepe",
  "America/Fortaleza",
  "America/Maceio",
  "America/Manaus",
  "America/Noronha",
  "America/Porto_Velho",
  "America/Recife",
  "America/Rio_Branco",
  "America/Santarem",
  "America/Sao_Paulo",
]);

function getSystemTimeZone() {
  if (typeof Intl === "undefined") {
    return null;
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

export function normalizeLanguage(language?: string | null): AppLanguage {
  const normalized = language?.toLowerCase().trim() ?? "";

  if (normalized.startsWith("pt")) return "pt-BR";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("en")) return "en";

  return DEFAULT_LANGUAGE;
}

export function getSystemLanguage(): AppLanguage {
  if (typeof navigator === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const candidates = [...(navigator.languages ?? []), navigator.language];

  for (const candidate of candidates) {
    const normalized = normalizeLanguage(candidate);
    if (normalized === "pt-BR") {
      return "pt-BR";
    }
  }

  const timeZone = getSystemTimeZone();
  if (timeZone && BRAZIL_TIMEZONES.has(timeZone)) {
    return "pt-BR";
  }

  for (const candidate of candidates) {
    const normalized = normalizeLanguage(candidate);
    if (normalized === "es" || normalized === "en") {
      return normalized;
    }
  }

  return DEFAULT_LANGUAGE;
}

export function applyDocumentLanguage(language: AppLanguage) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.lang = language;
  document.documentElement.setAttribute("data-language", language);
}

export function getDefaultProfileName(language: AppLanguage = getSystemLanguage()) {
  switch (language) {
    case "pt-BR":
      return "Torcedor";
    case "es":
      return "Aficionado";
    case "en":
    default:
      return "Fan";
  }
}
