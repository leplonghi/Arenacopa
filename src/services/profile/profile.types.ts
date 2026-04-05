export type PreferredLanguage = "pt-BR" | "en" | "es";

export interface ProfileRecord {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  nickname: string | null;
  birth_date: string | null;
  gender: string | null;
  nationality: string | null;
  favorite_team: string | null;
  preferred_language: PreferredLanguage | null;
  fun_mode: boolean | null;
  notifications_goals: boolean | null;
  notifications_news: boolean | null;
  notifications_match_start: boolean | null;
  terms_accepted: boolean | null;
  terms_accepted_at: string | null;
  accepted_terms_at: string | null;
}

export interface PublicProfileRecord {
  user_id: string;
  name: string | null;
  nickname?: string | null;
  avatar_url: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ProfileUpdateInput {
  name?: string;
  avatar_url?: string | null;
  bio?: string | null;
  nickname?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  nationality?: string | null;
  favorite_team?: string | null;
  preferred_language?: PreferredLanguage | null;
  fun_mode?: boolean | null;
  notifications_goals?: boolean | null;
  notifications_news?: boolean | null;
  notifications_match_start?: boolean | null;
  terms_accepted?: boolean | null;
  terms_accepted_at?: string | null;
  accepted_terms_at?: string | null;
}
