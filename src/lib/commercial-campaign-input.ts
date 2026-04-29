import type { MatchFeedItem } from "@/types/match-feed";

export type ValidationResult =
  | { ok: true; reasonCode: null }
  | { ok: false; reasonCode: string };

export type ViaCepAddress = {
  cep: string;
  city: string;
  neighborhood: string;
  state: string;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCep(value: string) {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function validateCep(value: string): ValidationResult {
  return digitsOnly(value).length === 8
    ? { ok: true, reasonCode: null }
    : { ok: false, reasonCode: "invalid_cep" };
}

export function formatWhatsapp(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function normalizeWhatsapp(value: string) {
  return digitsOnly(value);
}

export function validateWhatsapp(value: string): ValidationResult {
  const digits = digitsOnly(value);
  return digits.length === 10 || digits.length === 11
    ? { ok: true, reasonCode: null }
    : { ok: false, reasonCode: "invalid_phone" };
}

export function normalizeInstagramHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withoutUrl = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^instagram\.com\//i, "");
  return withoutUrl.replace(/^@/, "").replace(/\/+$/, "").trim();
}

export function validateCampaignPeriod(startsAt: string | null, endsAt: string | null, now = new Date()): ValidationResult {
  if (!startsAt || !endsAt) {
    return { ok: false, reasonCode: "invalid_campaign_period" };
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false, reasonCode: "invalid_campaign_period" };
  }

  if (start.getTime() <= now.getTime() || end.getTime() <= start.getTime()) {
    return { ok: false, reasonCode: "invalid_campaign_period" };
  }

  return { ok: true, reasonCode: null };
}

export function filterFutureMatchesForCampaign(matches: MatchFeedItem[], now = new Date()) {
  return matches
    .filter((match) => match.status === "scheduled")
    .filter((match) => new Date(match.matchDate).getTime() > now.getTime())
    .sort((left, right) => new Date(left.matchDate).getTime() - new Date(right.matchDate).getTime());
}

export function buildCampaignTitleFromMatch(match: MatchFeedItem) {
  return `${match.homeTeamName} x ${match.awayTeamName} - rodada especial`;
}

export async function lookupCep(value: string): Promise<ViaCepAddress> {
  const digits = digitsOnly(value);
  if (digits.length !== 8) {
    throw new Error("invalid_cep");
  }

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  const data = (await response.json()) as {
    erro?: boolean;
    cep?: string;
    localidade?: string;
    bairro?: string;
    uf?: string;
  };

  if (!response.ok || data.erro) {
    throw new Error("invalid_cep");
  }

  return {
    cep: data.cep || formatCep(digits),
    city: data.localidade || "",
    neighborhood: data.bairro || "",
    state: data.uf || "",
  };
}
