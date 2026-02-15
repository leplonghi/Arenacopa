import { cn } from "@/lib/utils";

// Map team codes to ISO 3166-1 alpha-2 codes for flagcdn.com
const teamToISO: Record<string, string> = {
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

interface FlagProps {
  code: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "w-4 h-4",
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-14 h-14",
};

export function Flag({ code, size = "md", className }: FlagProps) {
  const iso = teamToISO[code];

  if (!iso) {
    return (
      <div className={cn(sizeMap[size], "rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground", className)}>
        {code.length > 3 ? "?" : code}
      </div>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w80/${iso}.png`}
      srcSet={`https://flagcdn.com/w160/${iso}.png 2x`}
      alt={code}
      className={cn(sizeMap[size], "rounded-full object-cover", className)}
    />
  );
}
