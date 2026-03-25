import type { Palpite, BolaoPrediction, BolaoData, MemberData } from "@/types/bolao";
import type { ProfileRecord } from "@/services/profile/profile.types";

// ─── Profile Fixtures ─────────────────────────────────────────────────────────

export function createMockProfile(overrides?: Partial<ProfileRecord>): ProfileRecord {
  return {
    user_id: "user-123",
    name: "Torcedor Teste",
    avatar_url: null,
    favorite_team: null,
    preferred_language: "pt-BR",
    fun_mode: false,
    terms_accepted: true,
    terms_accepted_at: "2026-01-01T00:00:00.000Z",
    accepted_terms_at: "2026-01-01T00:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as ProfileRecord;
}

// ─── Palpite Fixtures ─────────────────────────────────────────────────────────

export function createMockPalpite(overrides?: Partial<Palpite>): Palpite {
  return {
    id: "user-123_bolao-1_match-1",
    bolao_id: "bolao-1",
    user_id: "user-123",
    match_id: "match-1",
    home_score: 2,
    away_score: 1,
    is_power_play: false,
    created_at: "2026-01-01T00:00:00.000Z",
    points: null,
    ...overrides,
  } as Palpite;
}

// ─── Prediction Fixtures ──────────────────────────────────────────────────────

export function createMockPrediction(overrides?: Partial<BolaoPrediction>): BolaoPrediction {
  return {
    id: "user-123_bolao-1_market-1",
    bolao_id: "bolao-1",
    market_id: "market-1",
    user_id: "user-123",
    prediction_value: "BRA",
    prediction_meta: null,
    points_awarded: null,
    resolved: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as BolaoPrediction;
}

// ─── Bolão Fixtures ───────────────────────────────────────────────────────────

export function createMockBolao(overrides?: Partial<BolaoData>): BolaoData {
  return {
    id: "bolao-1",
    name: "Bolão do Teste",
    description: "Bolão de teste",
    created_by: "user-123",
    created_at: "2026-01-01T00:00:00.000Z",
    entry_fee: 0,
    max_members: 50,
    scoring_rules: { exact: 5, winner: 3, draw: 2, participation: 1 },
    ...overrides,
  } as BolaoData;
}

// ─── Member Fixtures ──────────────────────────────────────────────────────────

export function createMockMember(overrides?: Partial<MemberData>): MemberData {
  return {
    id: "user-123_bolao-1",
    bolao_id: "bolao-1",
    user_id: "user-123",
    payment_status: "paid",
    joined_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as MemberData;
}

// ─── Firebase User Fixture ────────────────────────────────────────────────────

export function createMockFirebaseUser(overrides?: Record<string, unknown>) {
  return {
    uid: "user-123",
    email: "test@example.com",
    displayName: "Torcedor Teste",
    emailVerified: true,
    ...overrides,
  };
}
