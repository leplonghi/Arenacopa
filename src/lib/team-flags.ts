const LOCAL_FLAGS_BASE_PATH = "/images/flags";
const LOCAL_TEAM_CRESTS_BASE_PATH = "/images/teams";
const PLAYOFF_PLACEHOLDER_CODES = new Set(["EPA", "EPB", "EPC", "EPD", "FP1", "FP2"]);

// Map team codes to ISO 3166-1 alpha-2 codes for the local SVG catalog.
export const teamToISO: Record<string, string> = {
  // Group A
  MEX: "mx", RSA: "za", KOR: "kr", EPD: "",
  // Group B
  CAN: "ca", EPA: "", QAT: "qa", SUI: "ch",
  // Group C
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct",
  // Group D
  USA: "us", PAR: "py", AUS: "au", EPC: "",
  // Group E
  GER: "de", CUR: "cw", CIV: "ci", ECU: "ec",
  // Group F
  NED: "nl", JPN: "jp", EPB: "", TUN: "tn",
  // Group G
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  // Group H
  ESP: "es", CPV: "cv", SAU: "sa", URU: "uy",
  // Group I
  FRA: "fr", SEN: "sn", FP2: "", NOR: "no",
  // Group J
  ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  // Group K
  POR: "pt", FP1: "", UZB: "uz", COL: "co",
  // Group L
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
};

export function getFlagUrlForCode(code: string) {
  const normalizedCode = code?.trim().toUpperCase();
  const iso = teamToISO[normalizedCode];

  if (iso) {
    return `${LOCAL_FLAGS_BASE_PATH}/${iso}.svg`;
  }

  if (PLAYOFF_PLACEHOLDER_CODES.has(normalizedCode)) {
    return `${LOCAL_FLAGS_BASE_PATH}/playoff-slot.svg`;
  }

  return null;
}

function extractNumericTeamId(value?: string | null) {
  const normalized = value?.trim();
  return normalized && /^\d+$/.test(normalized) ? normalized : null;
}

function extractTeamIdFromCrestUrl(crestUrl?: string | null) {
  if (!crestUrl) return null;

  try {
    const url = new URL(crestUrl);
    const match = url.pathname.match(/\/(\d+)(?:_large)?\.(?:png|svg)$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function getLocalTeamCrestUrl(teamId?: string | null) {
  const normalizedId = extractNumericTeamId(teamId);
  if (!normalizedId) return null;
  return `${LOCAL_TEAM_CRESTS_BASE_PATH}/${normalizedId}.svg`;
}

function normalizeExternalCrestUrlToSvg(crestUrl?: string | null) {
  if (!crestUrl) return null;

  try {
    const url = new URL(crestUrl);

    if (url.hostname === "crests.football-data.org") {
      url.pathname = url.pathname.replace(/(?:_large)?\.(png|svg)$/i, ".svg");
      return url.toString();
    }

    return /\.svg($|\?)/i.test(url.toString()) ? url.toString() : null;
  } catch {
    return null;
  }
}

interface TeamImageOptions {
  code: string;
  crestUrl?: string | null;
  teamId?: string | null;
}

export function getTeamImageUrl({
  code,
  crestUrl,
  teamId,
}: TeamImageOptions) {
  const localTeamCrestUrl =
    getLocalTeamCrestUrl(teamId) ?? getLocalTeamCrestUrl(extractTeamIdFromCrestUrl(crestUrl));

  if (localTeamCrestUrl) {
    return localTeamCrestUrl;
  }

  const externalSvgUrl = normalizeExternalCrestUrlToSvg(crestUrl);
  if (externalSvgUrl) {
    return externalSvgUrl;
  }

  return getFlagUrlForCode(code);
}
