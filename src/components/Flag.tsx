import { cn } from "@/lib/utils";

// Map team codes to ISO 3166-1 alpha-2 codes for flagcdn.com
const teamToISO: Record<string, string> = {
  USA: "us", MEX: "mx", COL: "co", MAR: "ma",
  BRA: "br", JPN: "jp", NGA: "ng", SUI: "ch",
  ARG: "ar", GER: "de", KOR: "kr", AUS: "au",
  FRA: "fr", ENG: "gb-eng", SEN: "sn", CAN: "ca",
  ESP: "es", NED: "nl", URU: "uy", IRN: "ir",
  POR: "pt", CRO: "hr", GHA: "gh", PAN: "pa",
  BEL: "be", DEN: "dk", CHI: "cl", TUN: "tn",
  ITA: "it", WAL: "gb-wls", ECU: "ec", CMR: "cm",
  SRB: "rs", POL: "pl", PAR: "py", NZL: "nz",
  AUT: "at", UKR: "ua", PER: "pe", ALG: "dz",
  CZE: "cz", TUR: "tr", VEN: "ve", SAU: "sa",
  SCO: "gb-sct", CRC: "cr", EGY: "eg", QAT: "qa",
};

interface FlagProps {
  code: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
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
        {code}
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
