
export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    url: string;
    imageUrl?: string;
    source: string;
    publishedAt: string;
    tags: string[];
}

export interface Curiosity {
    id: string;
    content: string;
    category: "history" | "stats" | "culture" | "venue";
    imageUrl?: string;
}

export interface HostCity {
    id: string;
    name: string;
    country: string;
    description: string;
    population?: number;
    climate?: string;
    imageUrl?: string;
    stadiumId?: string; // Links to Stadium
}

// Extends existing Stadium type if needed, or redefines for database
export interface StadiumUpdate {
    id: string;
    condition?: string; // Current condition/status
    nextMatchId?: string;
    lastUpdated: string;
}

export interface CopaDataUpdate {
    news: NewsItem[];
    curiosities: Curiosity[];
    weatherUpdates: Record<string, { temp: number; condition: string }>; // Keyed by cityId
}
