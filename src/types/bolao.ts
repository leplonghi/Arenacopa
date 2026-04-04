export interface ScoringRules {
    exact: number;
    winner: number;
    draw: number;
    participation?: number;
}

export type BolaoFormatSlug =
    | "classic"
    | "detailed"
    | "knockout"
    | "tournament"
    | "strategic";

export type MarketScope = "match" | "phase" | "tournament" | "special";

export type PredictionType =
    | "single_choice"
    | "score"
    | "number"
    | "multi_choice"
    | "team";

export type MarketTemplateSlug =
    | "match_winner"
    | "exact_score"
    | "home_goals"
    | "away_goals"
    | "total_goals"
    | "both_score"
    | "first_team_to_score"
    | "group_winner"
    | "group_runner_up"
    | "qualified_teams"
    | "quarterfinalists"
    | "semifinalists"
    | "finalists"
    | "champion"
    | "runner_up"
    | "top_scorer"
    | "best_attack"
    | "best_defense"
    | "surprise_team"
    | "tournament_total_goals"
    | "power_play"
    | "confidence_pick"
    | "survivor_pick"
    | "bracket_pick";

export type BolaoMarketStatus = "open" | "closed" | "resolved";

export type BolaoTiebreakerType =
    | "final_goals"
    | "champion_goals"
    | "total_tournament_goals";

export type PredictionValue =
    | string
    | number
    | boolean
    | null
    | string[]
      | {
          home?: number | null;
          away?: number | null;
          winner?: string | null;
          teams?: string[];
          semifinalists?: string[];
          finalists?: string[];
          champion?: string | null;
      };

export interface BolaoFormatDefinition {
    id: BolaoFormatSlug;
    name: string;
    description: string;
    recommendedFor: string;
    icon: string;
    isEnabled: boolean;
    defaultMarketIds: MarketTemplateSlug[];
    defaultTiebreakers: BolaoTiebreakerType[];
}

export interface BolaoMarketTemplate {
    id: MarketTemplateSlug;
    scope: MarketScope;
    predictionType: PredictionType;
    title: string;
    description: string;
    helpText: string;
    defaultPointsExact: number;
    defaultPointsPartial: number;
    defaultMultiplier: number;
    supportsPowerPlay: boolean;
    supportsConfidence: boolean;
    isRequiredByDefault?: boolean;
    isEnabled: boolean;
}

export interface BolaoMarket {
    id: string;
    bolao_id: string;
    template_id: MarketTemplateSlug;
    slug: MarketTemplateSlug;
    scope: MarketScope;
    title: string;
    description: string;
    help_text?: string;
    match_id?: string | null;
    phase_id?: string | null;
    group_id?: string | null;
    is_required: boolean;
    opens_at?: string | null;
    closes_at?: string | null;
    status: BolaoMarketStatus;
    points_exact: number;
    points_partial: number;
    multiplier: number;
    supports_power_play: boolean;
    supports_confidence: boolean;
    order_index: number;
    prediction_type: PredictionType;
    resolution_value?: PredictionValue;
    resolution_meta?: Record<string, unknown> | null;
    resolved_at?: string | null;
    resolved_by?: string | null;
}

export interface BolaoPrediction {
    id: string;
    bolao_id: string;
    market_id: string;
    user_id: string;
    prediction_value: PredictionValue;
    prediction_meta?: Record<string, unknown> | null;
    points_awarded?: number | null;
    resolved: boolean;
    created_at: string;
    updated_at: string;
}

export interface BolaoTiebreaker {
    id: string;
    bolao_id: string;
    type: BolaoTiebreakerType;
    label: string;
    order: number;
    config?: Record<string, unknown> | null;
}

export interface BolaoOnboardingState {
    id: string;
    bolao_id: string;
    user_id: string;
    seen_intro: boolean;
    seen_scoring: boolean;
    seen_markets: boolean;
    seen_ranking: boolean;
    completed_at?: string | null;
    updated_at: string;
}

export interface BolaoActivity {
    id: string;
    bolao_id: string;
    user_id?: string | null;
    actor_name?: string | null;
    actor_avatar_url?: string | null;
    type:
        | "member_joined"
        | "prediction_saved"
        | "legacy_prediction_saved"
        | "market_resolved";
    title: string;
    description?: string | null;
    market_id?: string | null;
    match_id?: string | null;
    created_at?: string;
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
    format_id?: BolaoFormatSlug;
    scoring_mode?: "default" | "custom" | "exclusive";
    grupo_id?: string | null;
    visibility_mode?: "hidden_until_deadline" | "visible_after_save" | "always_hidden";
    cutoff_mode?: "per_match" | "per_phase" | "manual";
    /** Championship this bolão belongs to. Defaults to "wc2026" for legacy records. */
    championship_id?: string;
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
    category: 'champion' | 'top_scorer' | 'brazil_stage' | 'runner_up' | 'surprise_team';
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
