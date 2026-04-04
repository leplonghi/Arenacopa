export type NewsIngestionType = "rss" | "api" | "scrape";

export type NewsCountry = "BR" | "ES" | "GB" | "EU";

export type ChampionshipNewsTarget =
  | "wc2026"
  | "brasileirao2026"
  | "ucl2526"
  | "laliga2526"
  | "premier2526";

export interface NewsSourceDefinition {
  id: string;
  name: string;
  country: NewsCountry;
  language: "pt-BR" | "es" | "en";
  ingestionType: NewsIngestionType;
  url: string;
  feedUrl?: string;
  championships: ChampionshipNewsTarget[];
  priority: number;
  enabled: boolean;
  notes?: string;
}

export interface NewsSourcePreference {
  championshipId: ChampionshipNewsTarget;
  countryPriority: NewsCountry[];
  fallbackLanguages: Array<"pt-BR" | "es" | "en">;
}
