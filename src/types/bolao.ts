export interface ScoringRules {
    exact: number;
    winner: number;
    draw: number;
    participation?: number;
}

export interface BolaoData {
    id: string;
    name: string;
    description: string | null;
    invite_code: string;
    creator_id: string;
    created_at: string;
    category: 'public' | 'private';
    is_paid: boolean;
    entry_fee: number | null;
    payment_details: string | null;
    prize_distribution: string | null;
    scoring_rules: ScoringRules;
    avatar_url: string | null;
    status: 'draft' | 'open' | 'active' | 'finished';
}

export interface MemberData {
    user_id: string;
    role: string;
    joined_at: string;
    payment_status?: 'pending' | 'paid' | 'exempt';
    profile: { name: string; avatar_url: string | null } | null;
}

export interface Palpite {
    id: string;
    bolao_id: string;
    user_id: string;
    match_id: string;
    home_score: number | null;
    away_score: number | null;
    points?: number | null;
    is_power_play?: boolean;
    created_at: string;
}

export interface ExtraBet {
    id: string;
    bolao_id: string;
    user_id: string;
    category: 'champion' | 'top_scorer' | 'brazil_stage';
    value: string;
    points_awarded: number;
    created_at: string;
}

export interface BolaoRowResponse {
    id: string;
    name: string;
    description: string | null;
    creator_id: string;
    invite_code: string;
    created_at: string;
    bolao_members: { count: number }[];
    is_paid: boolean;
    entry_fee: number | null;
}
