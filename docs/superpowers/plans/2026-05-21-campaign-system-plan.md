# Campaign System V2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the full ArenaCopa B2B campaign system — merchant wizard, palpite engine, ranking, ArenaTV, Quiz Round, prize redemption.

**Architecture:** Cloud Functions own all critical writes (scores, rankings, quota, prizes). Client reads Firestore real-time. ArenaTV reads a curated public doc with zero PII. `submitPalpite` is a callable (not client-direct write) to enable atomic quota reservation in a Firestore transaction.

**Tech Stack:** Firebase Functions v2 Node 20 TypeScript strict, Firestore, Stripe, React 18 + Vite + Vitest, Radix UI, Recharts.

## ✅ Resumo de Progresso (atualizado 2026-05-21)

| Fase | Status | Commit |
|---|---|---|
| T1 — campaign-types.ts | ✅ DONE | 0bbf89f |
| T2 — Scoring engine + 16 tests | ✅ DONE | f367794 |
| T3 — Firestore security rules | ✅ DONE | 891e74c |
| T4 — createCampaignDraft | ✅ DONE | 1175f61 |
| T5 — createCampaignCheckout + sync | ✅ DONE | 9536b32 |
| T6 — activateCampaignGame + submitPalpite | ✅ DONE | 9536b32 |
| T7 — lockPalpiteWindow scheduler | ✅ DONE | 9536b32 |
| T8 — computeGameRanking trigger | ✅ DONE | 9536b32 |
| T9-11 — TV state + quiz + prize + maintenance | ✅ DONE | 9536b32 |
| **T12 — Deploy backend functions** | **✅ 12/13 DONE** | 9536b32 |
| **⚠️ createCampaignCheckout** | **BLOCKED — precisa Stripe Price IDs** | ver abaixo |
| T13 — Frontend types + pricing | ✅ DONE | f63fa79 |
| T14 — CriarCampanhaBar wizard | ⚠️ CODE DONE — smoke blocked by auth | 2244127 |
| T15-17 — Detail + PalpiteCard + ArenaTV | ⬜ TODO | — |
| T18 — Full deploy + smoke test | ⬜ TODO | — |

**Para continuar (qualquer ambiente):** Leia este arquivo, execute o próximo ⏳ NEXT.

---

**Key paths:**
- Backend: `C:\Users\eduar\.antigravity\Arenacopa\functions\src\`
- Frontend: `C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa\src\`
- Rules: `C:\Users\eduar\.antigravity\Arenacopa\firestore.rules`

---

## Phase 1 — Backend Types & Scoring Engine

### Task 1: campaign-types.ts

**Files:** Create `functions/src/campaign-types.ts`

- [ ] Create the file:

```bash
# cwd: C:\Users\eduar\.antigravity\Arenacopa\functions
```

Write `src/campaign-types.ts`:

```typescript
export type MerchantType = "bar" | "company";
export type CampaignMode = "in_person" | "online" | "hybrid";
export type CampaignPlan = "rodada" | "torcida" | "copa" | "parceiro";
export type CampaignStatus = "draft" | "active" | "paused" | "finished" | "archived";
export type GameStatus = "setup" | "open" | "locked" | "live" | "finished" | "cancelled";
export type PrizeModel = "all_win" | "quiz_decides" | "all_win_quiz_top";
export type QuotaMode = "free" | "auto" | "manual";
export type QuizStatus = "pending" | "active" | "q1" | "q2" | "q3" | "q4" | "q5" | "finished";
export type PrizeTier = "champion" | "podium_2" | "podium_3" | "participant" | "exact_score" | "quiz_winner";

export const PLAN_MAX_PARTICIPANTS: Record<CampaignPlan, number> = {
  rodada: 200, torcida: 500, copa: 1500, parceiro: 999999,
};

export const PLAN_CREDITS: Record<CampaignPlan, number> = {
  rodada: 1, torcida: 3, copa: -1, parceiro: -1,
};

export const COPA_ENDS_AT = new Date("2026-07-19T23:59:59Z");

export type WinnerModelConfig =
  | { type: "champion"; benefit: string }
  | { type: "podium"; benefits: [string, string, string] }
  | { type: "exact_score"; benefit: string; max_winners: number | null }
  | { type: "top_percent"; percent: number; benefit: string; max_winners: number }
  | { type: "universal"; min_points: number; benefit: string };

export type MatchResult = {
  home_score: number;
  away_score: number;
  half_time_home: number | null;
  half_time_away: number | null;
  first_scorer: "home" | "away" | "none" | null;
  total_goals_bracket: "0-1" | "2-3" | "4+" | null;
};

export type ScoringResult = {
  total_points: number;
  exact_score: boolean;
  correct_winner: boolean;
  bonus_points: number;
  breakdown: { base: number; half_time: number; first_scorer: number; total_goals: number };
};

export type QuizQuestion = {
  id: string; category: string; question: string; options: string[];
  correct_index: number; // NEVER sent to client
  difficulty: "easy" | "medium" | "hard";
};
```

- [ ] Verify TypeScript compiles: `npm run build` — expected: no errors.

- [ ] Commit: `git add functions/src/campaign-types.ts && git commit -m "feat(campaign): shared backend types v2"`

---

### Task 2: campaign-scoring.ts

**Files:** Create `functions/src/campaign-scoring.ts`

- [ ] Write `src/campaign-scoring.ts`:

```typescript
import type { MatchResult, ScoringResult } from "./campaign-types";

export function scoreOnePalpite(
  palpite: Pick<MatchResult, "home_score" | "away_score" | "half_time_home" | "half_time_away" | "first_scorer" | "total_goals_bracket">,
  result: MatchResult,
): ScoringResult {
  // Base score: exact placar = 15, exact diff = 10, correct winner = 5, draw = 5
  let base = 0;
  const exactScore = palpite.home_score === result.home_score && palpite.away_score === result.away_score;
  const pWinner = Math.sign(palpite.home_score - palpite.away_score);
  const rWinner = Math.sign(result.home_score - result.away_score);
  const correctWinner = pWinner === rWinner;
  const exactDiff = (palpite.home_score - palpite.away_score) === (result.home_score - result.away_score);

  if (exactScore) {
    base = 15;
  } else if (correctWinner && exactDiff) {
    base = 10;
  } else if (correctWinner) {
    base = 5;
  }

  // Bonus
  let halfTime = 0;
  if (result.half_time_home !== null && palpite.half_time_home === result.half_time_home
      && palpite.half_time_away === result.half_time_away) {
    halfTime = 5;
  }

  let firstScorer = 0;
  if (result.first_scorer !== null && palpite.first_scorer === result.first_scorer) {
    firstScorer = 3;
  }

  let totalGoals = 0;
  if (result.total_goals_bracket !== null && palpite.total_goals_bracket === result.total_goals_bracket) {
    totalGoals = 2;
  }

  const bonusPoints = halfTime + firstScorer + totalGoals;
  return {
    total_points: base + bonusPoints,
    exact_score: exactScore,
    correct_winner: correctWinner,
    bonus_points: bonusPoints,
    breakdown: { base, half_time: halfTime, first_scorer: firstScorer, total_goals: totalGoals },
  };
}
```

- [ ] Write `src/__tests__/campaign-scoring.test.ts` (create `src/__tests__/` dir):

```typescript
import { scoreOnePalpite } from "../campaign-scoring";

const result = { home_score: 2, away_score: 1, half_time_home: 1, half_time_away: 0, first_scorer: "home" as const, total_goals_bracket: "2-3" as const };

test("exact score = 25 pts", () => {
  const s = scoreOnePalpite({ home_score: 2, away_score: 1, half_time_home: 1, half_time_away: 0, first_scorer: "home", total_goals_bracket: "2-3" }, result);
  expect(s.total_points).toBe(25);
  expect(s.exact_score).toBe(true);
});

test("correct winner only = 5 pts", () => {
  const s = scoreOnePalpite({ home_score: 3, away_score: 1, half_time_home: null, half_time_away: null, first_scorer: null, total_goals_bracket: null }, result);
  expect(s.total_points).toBe(5);
  expect(s.exact_score).toBe(false);
});

test("wrong prediction = 0 pts", () => {
  const s = scoreOnePalpite({ home_score: 0, away_score: 2, half_time_home: null, half_time_away: null, first_scorer: null, total_goals_bracket: null }, result);
  expect(s.total_points).toBe(0);
});

test("exact diff + correct winner = 10 pts", () => {
  const s = scoreOnePalpite({ home_score: 3, away_score: 2, half_time_home: null, half_time_away: null, first_scorer: null, total_goals_bracket: null }, result);
  expect(s.total_points).toBe(10);
});
```

- [ ] Add jest to functions: `npm install --save-dev jest @types/jest ts-jest`

- [ ] Add to `functions/package.json` scripts: `"test": "jest --testPathPattern=src/__tests__"`

- [ ] Add `functions/jest.config.js`:

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js"],
};
```

- [ ] Run: `npm test` — expected: 4 tests pass.

- [ ] Commit: `git add functions/src/campaign-scoring.ts functions/src/__tests__/ functions/jest.config.js functions/package.json && git commit -m "feat(campaign): scoring engine with tests"`

---

## Phase 2 — Firestore Security Rules

### Task 3: Update firestore.rules

**Files:** Modify `firestore.rules`

- [ ] Replace the existing `match /campaigns/{campaignId}` block and add new blocks. The full updated rules file must replace the old `campaigns` + `businesses` blocks and add new collections. Key change: old `campaigns` block used `user_id`; new one uses `owner_uid` with fine-grained field protection.

Add these helper functions inside `service cloud.firestore { match /databases/{database}/documents {`:

```javascript
function isCampaignOwner(campaignId) {
  return get(/databases/$(database)/documents/campaigns/$(campaignId)).data.owner_uid == request.auth.uid;
}

function isWithinPalpiteWindow(gameId) {
  return get(/databases/$(database)/documents/campaign_games/$(gameId)).data.palpite_window_closes_at > request.time;
}

function isWithinQuizWindow(quizId) {
  return get(/databases/$(database)/documents/quiz_rounds/$(quizId)).data.question_deadline > request.time;
}
```

- [ ] Replace the `match /campaigns/{campaignId}` block:

```javascript
match /campaigns/{campaignId} {
  allow read: if isSignedIn() && isOwner(resource.data.owner_uid);
  allow create: if isSignedIn() && isOwner(request.resource.data.owner_uid)
    && request.resource.data.status == "draft"
    && request.resource.data.participant_count == 0
    && request.resource.data.paid_at == null;
  allow update: if isSignedIn() && isOwner(resource.data.owner_uid)
    && resource.data.status == "draft"
    && !request.resource.data.diff(resource.data).affectedKeys()
         .hasAny(["participant_count","paid_at","stripe_order_id","status","share_code"]);
  allow delete: if isSignedIn() && isOwner(resource.data.owner_uid)
    && resource.data.status == "draft";
}
```

- [ ] Add new blocks (after `campaigns`, before the catch-all `match /{document=**}`):

```javascript
match /merchants/{merchantId} {
  allow read: if isSignedIn() && isOwner(resource.data.owner_uid);
  allow create: if isSignedIn() && isOwner(request.resource.data.owner_uid);
  allow update: if isSignedIn() && isOwner(resource.data.owner_uid)
    && !request.resource.data.diff(resource.data).affectedKeys()
         .hasAny(["plan","plan_credits","plan_expires_at","status","stripe_customer_id"]);
  allow delete: if false;
}

match /campaign_games/{gameId} {
  allow read: if isSignedIn();
  allow create: if isSignedIn() && isOwner(request.resource.data.owner_uid)
    && request.resource.data.status == "setup";
  allow update, delete: if false;
}

match /campaign_games/{gameId}/palpites/{userId} {
  allow read: if isSignedIn() && (isOwner(userId) || isCampaignOwner(resource.data.campaign_id));
  allow write: if false; // submitPalpite callable owns all writes
}

match /campaign_games/{gameId}/score_quotas/{scoreKey} {
  allow read: if isSignedIn();
  allow write: if false;
}

match /campaign_games/{gameId}/rankings/{userId} {
  allow read: if isSignedIn();
  allow write: if false;
}

match /campaign_rankings/{rankingId} {
  allow read: if isSignedIn();
  allow write: if false;
}

match /campaign_participants/{participantId} {
  allow read: if isSignedIn() && (isOwner(resource.data.user_uid) || isCampaignOwner(resource.data.campaign_id));
  allow create: if isSignedIn() && isOwner(request.resource.data.user_uid);
  allow update: if isSignedIn() && isCampaignOwner(resource.data.campaign_id)
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(["is_hidden","is_blocked"]);
  allow delete: if false;
}

match /quiz_rounds/{quizId} {
  allow read: if isSignedIn();
  allow write: if false;
}

match /quiz_rounds/{quizId}/answers/{answerId} {
  allow read: if isSignedIn() && isOwner(resource.data.user_uid);
  allow create: if isSignedIn()
    && isOwner(request.resource.data.user_uid)
    && isWithinQuizWindow(quizId);
  allow update, delete: if false;
}

match /quiz_questions/{questionId} {
  allow read: if isSignedIn();
  allow write: if false;
}

match /campaign_tv_state/{shareCode} {
  allow read: if true; // public — TV do bar sem login
  allow write: if false;
}

match /prize_redemptions/{redemptionId} {
  allow read: if isSignedIn() && isCampaignOwner(resource.data.campaign_id);
  allow update: if isSignedIn()
    && isCampaignOwner(resource.data.campaign_id)
    && resource.data.redeemed_at == null
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(["redeemed_at","redeemed_by_uid"]);
  allow create, delete: if false;
}
```

- [ ] Deploy rules: `firebase deploy --only firestore:rules`
- [ ] Verify in Firebase console: rules deployed without errors.
- [ ] Commit: `git add firestore.rules && git commit -m "feat(campaign): firestore security rules v2"`

---

## Phase 3 — Cloud Functions: Merchant Side

### Task 4: createCampaignDraft

**Files:** Create `functions/src/campaign-draft.ts`, modify `functions/src/index.ts`

- [ ] Write `src/campaign-draft.ts`:

```typescript
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import type { CampaignPlan, MerchantType, CampaignMode, WinnerModelConfig, PrizeModel, QuotaMode } from "./campaign-types";
import { PLAN_MAX_PARTICIPANTS, PLAN_CREDITS, COPA_ENDS_AT } from "./campaign-types";

const db = admin.firestore();

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export const createCampaignDraft = functions.https.onCall(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");

    const {
      plan, type, mode, name, benefit_summary, benefit_code, benefit_terms,
      winner_config, prize_model, quota_mode, quota_value,
      palpite_window_minutes, quiz_enabled,
    } = request.data as {
      plan: CampaignPlan; type: MerchantType; mode: CampaignMode;
      name: string; benefit_summary: string; benefit_code: string;
      benefit_terms?: string; winner_config: WinnerModelConfig;
      prize_model: PrizeModel; quota_mode: QuotaMode; quota_value?: number;
      palpite_window_minutes: 5 | 15 | 30; quiz_enabled: boolean;
    };

    const uid = request.auth.uid;

    // Verify merchant exists and has the plan
    const merchantSnap = await db.collection("merchants")
      .where("owner_uid", "==", uid).limit(1).get();
    if (merchantSnap.empty) {
      throw new functions.https.HttpsError("not-found", "Merchant profile not found. Create your merchant profile first.");
    }
    const merchant = merchantSnap.docs[0].data();
    if (merchant.plan !== plan) {
      throw new functions.https.HttpsError("permission-denied", "Plan mismatch. Your subscription is " + merchant.plan);
    }
    if (merchant.status !== "active") {
      throw new functions.https.HttpsError("permission-denied", "Merchant account is not active");
    }

    // Generate unique share code
    let shareCode: string;
    let attempts = 0;
    do {
      shareCode = generateShareCode();
      const exists = await db.collection("campaign_tv_state").doc(shareCode).get();
      if (!exists.exists) break;
      attempts++;
    } while (attempts < 5);

    const campaignRef = db.collection("campaigns").doc();
    const qrPayload = `https://arenacopa.com.br/c/${shareCode}`;

    const now = admin.firestore.FieldValue.serverTimestamp();
    await campaignRef.set({
      merchant_id: merchantSnap.docs[0].id,
      owner_uid: uid,
      type,
      mode,
      name: name.trim().slice(0, 80),
      description: null,
      logo_url: merchant.logo_url || null,
      status: "draft",
      plan,
      max_participants: PLAN_MAX_PARTICIPANTS[plan],
      participant_count: 0,
      prediction_quota_mode: quota_mode,
      prediction_quota_value: quota_value ?? null,
      winner_model: winner_config.type,
      winner_config,
      prize_model,
      quiz_enabled,
      benefit_summary: benefit_summary.trim(),
      benefit_code: benefit_code.toUpperCase().trim(),
      benefit_terms: benefit_terms?.trim() || null,
      share_code: shareCode,
      qr_payload: qrPayload,
      palpite_window_minutes,
      copa_round_tracking: plan !== "rodada",
      starts_at: null,
      ends_at: plan === "copa" || plan === "parceiro" ? admin.firestore.Timestamp.fromDate(COPA_ENDS_AT) : null,
      stripe_order_id: null,
      paid_at: null,
      created_at: now,
      updated_at: now,
    });

    return { campaign_id: campaignRef.id, share_code: shareCode, qr_payload: qrPayload };
  }
);
```

- [ ] In `functions/src/index.ts`, add at the bottom:

```typescript
export { createCampaignDraft } from "./campaign-draft";
```

- [ ] Build: `npm run build` — expected: no errors.
- [ ] Commit: `git add functions/src/campaign-draft.ts functions/src/index.ts && git commit -m "feat(campaign): createCampaignDraft callable"`

---

### Task 5: createCampaignCheckout + syncCampaignCheckout

**Files:** Create `functions/src/campaign-checkout.ts`, modify `functions/src/index.ts`

Stripe price secret names (must be set before deploy):
- `STRIPE_PRICE_CAMPANHA_RODADA` → Price for R$ 49,90 one-time
- `STRIPE_PRICE_CAMPANHA_TORCIDA` → Price for R$ 119,90 one-time
- `STRIPE_PRICE_CAMPANHA_COPA` → Price for R$ 349,90 one-time
- `STRIPE_PRICE_CAMPANHA_PARCEIRO` → Price for R$ 399,90 recurring/year

- [ ] Create Stripe products + prices in Stripe dashboard for the 4 plans above, then set secrets:

```bash
firebase functions:secrets:set STRIPE_PRICE_CAMPANHA_RODADA
firebase functions:secrets:set STRIPE_PRICE_CAMPANHA_TORCIDA
firebase functions:secrets:set STRIPE_PRICE_CAMPANHA_COPA
firebase functions:secrets:set STRIPE_PRICE_CAMPANHA_PARCEIRO
```

- [ ] Write `src/campaign-checkout.ts`:

```typescript
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import type { CampaignPlan } from "./campaign-types";

const db = admin.firestore();

const PLAN_PRICE_SECRET: Record<CampaignPlan, string> = {
  rodada:   "STRIPE_PRICE_CAMPANHA_RODADA",
  torcida:  "STRIPE_PRICE_CAMPANHA_TORCIDA",
  copa:     "STRIPE_PRICE_CAMPANHA_COPA",
  parceiro: "STRIPE_PRICE_CAMPANHA_PARCEIRO",
};

const PLAN_MODE: Record<CampaignPlan, "payment" | "subscription"> = {
  rodada: "payment", torcida: "payment", copa: "payment", parceiro: "subscription",
};

export const createCampaignCheckout = functions.https.onCall(
  { secrets: ["STRIPE_SECRET_KEY", "STRIPE_PRICE_CAMPANHA_RODADA", "STRIPE_PRICE_CAMPANHA_TORCIDA", "STRIPE_PRICE_CAMPANHA_COPA", "STRIPE_PRICE_CAMPANHA_PARCEIRO"] },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");

    const { campaign_id, success_url, cancel_url } = request.data as {
      campaign_id: string; success_url: string; cancel_url: string;
    };

    const campaignDoc = await db.collection("campaigns").doc(campaign_id).get();
    if (!campaignDoc.exists) throw new functions.https.HttpsError("not-found", "Campaign not found");
    const campaign = campaignDoc.data()!;
    if (campaign.owner_uid !== request.auth.uid) throw new functions.https.HttpsError("permission-denied", "Not your campaign");
    if (campaign.status !== "draft") throw new functions.https.HttpsError("failed-precondition", "Campaign already paid");

    const stripeKey = process.env.STRIPE_SECRET_KEY!;
    const priceId = process.env[PLAN_PRICE_SECRET[campaign.plan as CampaignPlan]]!;
    const stripe = new Stripe(stripeKey);

    const session = await stripe.checkout.sessions.create({
      mode: PLAN_MODE[campaign.plan as CampaignPlan],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${success_url}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url,
      metadata: { campaign_id, owner_uid: request.auth.uid },
      client_reference_id: campaign_id,
    });

    await db.collection("campaigns").doc(campaign_id).update({
      stripe_order_id: session.id,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { url: session.url };
  }
);

export const syncCampaignCheckout = functions.https.onCall(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (request) => {
    if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");
    const { session_id } = request.data as { session_id: string };
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return { status: "pending" };
    }

    const campaignId = session.metadata?.campaign_id;
    if (!campaignId) throw new functions.https.HttpsError("internal", "No campaign_id in session metadata");

    const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
    if (!campaignDoc.exists) throw new functions.https.HttpsError("not-found", "Campaign not found");
    if (campaignDoc.data()!.owner_uid !== request.auth.uid) throw new functions.https.HttpsError("permission-denied", "Not your campaign");

    if (campaignDoc.data()!.status !== "draft") return { status: "already_active" };

    // Activate campaign and update merchant credits
    const merchantId = campaignDoc.data()!.merchant_id;
    await db.runTransaction(async (t) => {
      const merchantDoc = await t.get(db.collection("merchants").doc(merchantId));
      const merchant = merchantDoc.data()!;
      const newCredits = merchant.plan_credits === -1 ? -1 : merchant.plan_credits - 0; // credits consumed per game, not per campaign

      t.update(db.collection("campaigns").doc(campaignId), {
        status: "active",
        paid_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      t.update(db.collection("merchants").doc(merchantId), {
        plan_credits: newCredits,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Create TV state document
    const shareCode = campaignDoc.data()!.share_code;
    const merchantDoc = await db.collection("merchants").doc(merchantId).get();
    await db.collection("campaign_tv_state").doc(shareCode).set({
      campaign_id: campaignId,
      merchant_name: merchantDoc.data()!.name,
      logo_url: campaignDoc.data()!.logo_url,
      benefit_summary: campaignDoc.data()!.benefit_summary,
      current_game_id: null,
      current_match: null,
      participant_count: 0,
      top_rankings: [],
      quiz_active: false,
      quiz_question: null,
      quiz_timer_ends_at: null,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { status: "active", campaign_id: campaignId };
  }
);
```

- [ ] Export from index.ts: `export { createCampaignCheckout, syncCampaignCheckout } from "./campaign-checkout";`
- [ ] Build: `npm run build` — no errors.
- [ ] Commit: `git add functions/src/campaign-checkout.ts functions/src/index.ts && git commit -m "feat(campaign): checkout + sync callables"`

---

### Task 6: activateCampaignGame + submitPalpite

**Files:** Create `functions/src/campaign-game.ts`

- [ ] Write `src/campaign-game.ts`:

```typescript
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { PLAN_MAX_PARTICIPANTS } from "./campaign-types";
import type { CampaignPlan, QuotaMode } from "./campaign-types";

const db = admin.firestore();

export const activateCampaignGame = functions.https.onCall(async (request) => {
  if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const { campaign_id, match_id, palpite_window_minutes } = request.data as {
    campaign_id: string; match_id: string; palpite_window_minutes: 5 | 15 | 30;
  };

  const [campaignDoc, matchDoc] = await Promise.all([
    db.collection("campaigns").doc(campaign_id).get(),
    db.collection("matches").doc(match_id).get(),
  ]);

  if (!campaignDoc.exists) throw new functions.https.HttpsError("not-found", "Campaign not found");
  if (!matchDoc.exists) throw new functions.https.HttpsError("not-found", "Match not found");

  const campaign = campaignDoc.data()!;
  if (campaign.owner_uid !== request.auth.uid) throw new functions.https.HttpsError("permission-denied", "Not your campaign");
  if (campaign.status !== "active") throw new functions.https.HttpsError("failed-precondition", "Campaign not active");

  const match = matchDoc.data()!;
  if (match.status !== "scheduled") throw new functions.https.HttpsError("failed-precondition", "Match is not scheduled");

  // Check and consume credit
  const merchantId = campaign.merchant_id;
  let gameRef: admin.firestore.DocumentReference;

  await db.runTransaction(async (t) => {
    const merchantDoc = await t.get(db.collection("merchants").doc(merchantId));
    const merchant = merchantDoc.data()!;

    if (merchant.plan_credits !== -1) {
      if (merchant.plan_credits <= 0) {
        throw new functions.https.HttpsError("resource-exhausted", "No game credits remaining. Upgrade your plan.");
      }
      t.update(db.collection("merchants").doc(merchantId), {
        plan_credits: admin.firestore.FieldValue.increment(-1),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const matchDate = new Date(match.match_date || match.matchDate);
    const windowCloses = new Date(matchDate.getTime() - palpite_window_minutes * 60 * 1000);

    gameRef = db.collection("campaign_games").doc();
    const quotaMode: QuotaMode = campaign.prediction_quota_mode || "free";
    const maxParticipants = PLAN_MAX_PARTICIPANTS[campaign.plan as CampaignPlan];
    const autoLimit = quotaMode === "auto" ? Math.floor(maxParticipants * 0.05) : null;

    t.set(gameRef, {
      campaign_id,
      merchant_id: merchantId,
      owner_uid: request.auth!.uid,
      match_id,
      match_snapshot: {
        home_team: match.homeTeamName || match.home_team,
        away_team: match.awayTeamName || match.away_team,
        match_date: match.match_date || match.matchDate,
      },
      status: "open",
      palpite_window_closes_at: admin.firestore.Timestamp.fromDate(windowCloses),
      participant_count: 0,
      quota_config: { mode: quotaMode, auto_limit: autoLimit, manual_value: campaign.prediction_quota_value || null },
      ranking_computed_at: null,
      top_winners: [],
      quiz_round_id: null,
      game_sequence: 1, // TODO: count existing games for this campaign
      credit_consumed: true,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  // Update TV state
  await db.collection("campaign_tv_state").doc(campaign.share_code).update({
    current_game_id: gameRef!.id,
    current_match: {
      home_team: match.homeTeamName || match.home_team,
      away_team: match.awayTeamName || match.away_team,
      match_date: match.match_date || match.matchDate,
    },
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { game_id: gameRef!.id };
});

export const submitPalpite = functions.https.onCall(async (request) => {
  if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const { game_id, display_name, home_score, away_score, half_time_home, half_time_away, first_scorer, total_goals_bracket } = request.data as {
    game_id: string; display_name: string;
    home_score: number; away_score: number;
    half_time_home?: number; half_time_away?: number;
    first_scorer?: "home" | "away" | "none";
    total_goals_bracket?: "0-1" | "2-3" | "4+";
  };

  const uid = request.auth.uid;

  await db.runTransaction(async (t) => {
    const gameDoc = await t.get(db.collection("campaign_games").doc(game_id));
    if (!gameDoc.exists) throw new functions.https.HttpsError("not-found", "Game not found");
    const game = gameDoc.data()!;

    if (game.status !== "open") throw new functions.https.HttpsError("failed-precondition", "Palpites are closed");

    const now = new Date();
    const windowCloses = game.palpite_window_closes_at.toDate();
    if (now >= windowCloses) throw new functions.https.HttpsError("failed-precondition", "Palpite window has closed");

    const palpiteRef = db.collection("campaign_games").doc(game_id).collection("palpites").doc(uid);
    const existing = await t.get(palpiteRef);
    if (existing.exists) throw new functions.https.HttpsError("already-exists", "Você já enviou seu palpite para este jogo");

    // Quota check
    const scoreKey = `${home_score}_${away_score}`;
    if (game.quota_config.mode !== "free") {
      const quotaRef = db.collection("campaign_games").doc(game_id).collection("score_quotas").doc(scoreKey);
      const quotaDoc = await t.get(quotaRef);
      const limit = game.quota_config.mode === "auto"
        ? game.quota_config.auto_limit
        : game.quota_config.manual_value;

      if (quotaDoc.exists && quotaDoc.data()!.count >= limit) {
        throw new functions.https.HttpsError("resource-exhausted", `Este placar (${home_score}x${away_score}) já está lotado. Escolha outro.`);
      }

      t.set(quotaRef, {
        score_key: scoreKey,
        count: admin.firestore.FieldValue.increment(1),
        limit: limit || 999,
        is_full: false, // will be updated by computeGameRanking if needed
      }, { merge: true });
    }

    const campaignDoc = await t.get(db.collection("campaigns").doc(game.campaign_id));

    t.set(palpiteRef, {
      user_uid: uid,
      campaign_id: game.campaign_id,
      merchant_id: game.merchant_id,
      display_name: display_name.trim().slice(0, 40),
      home_score, away_score,
      half_time_home: half_time_home ?? null,
      half_time_away: half_time_away ?? null,
      first_scorer: first_scorer ?? null,
      total_goals_bracket: total_goals_bracket ?? null,
      submitted_at: admin.firestore.FieldValue.serverTimestamp(),
      quota_slot: null,
      total_points: null, exact_score: null, correct_winner: null, bonus_points: null,
      rank: null, prize_tier: null,
      status: "submitted",
    });

    t.update(db.collection("campaign_games").doc(game_id), {
      participant_count: admin.firestore.FieldValue.increment(1),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update participant record (upsert)
    const participantRef = db.collection("campaign_participants").doc(`${uid}_${game.campaign_id}`);
    t.set(participantRef, {
      user_uid: uid,
      campaign_id: game.campaign_id,
      merchant_id: game.merchant_id,
      display_name: display_name.trim().slice(0, 40),
      city: null,
      joined_at: admin.firestore.FieldValue.serverTimestamp(),
      games_played: admin.firestore.FieldValue.increment(1),
      is_hidden: false,
      is_blocked: false,
      age_confirmed: true,
    }, { merge: true });

    // Update TV state participant count
    const shareCode = campaignDoc.data()!.share_code;
    t.update(db.collection("campaign_tv_state").doc(shareCode), {
      participant_count: admin.firestore.FieldValue.increment(1),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { ok: true };
});
```

- [ ] Export from index.ts: `export { activateCampaignGame, submitPalpite } from "./campaign-game";`
- [ ] Build: `npm run build` — no errors.
- [ ] Commit: `git add functions/src/campaign-game.ts functions/src/index.ts && git commit -m "feat(campaign): activateCampaignGame + submitPalpite callables"`

---

### Task 7: lockPalpiteWindow scheduler

**Files:** Create `functions/src/campaign-palpite-window.ts`

- [ ] Write `src/campaign-palpite-window.ts`:

```typescript
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const lockPalpiteWindow = functions.scheduler.onSchedule(
  { schedule: "every 1 minutes", timeZone: "America/Sao_Paulo" },
  async () => {
    const now = admin.firestore.Timestamp.now();
    const snap = await db.collection("campaign_games")
      .where("status", "==", "open")
      .where("palpite_window_closes_at", "<=", now)
      .limit(20)
      .get();

    if (snap.empty) return;

    const batch = db.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "locked",
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    console.log(`Locked ${snap.size} palpite windows`);
  }
);
```

- [ ] Export: `export { lockPalpiteWindow } from "./campaign-palpite-window";`
- [ ] Build: `npm run build` — no errors.
- [ ] Commit: `git add functions/src/campaign-palpite-window.ts functions/src/index.ts && git commit -m "feat(campaign): lockPalpiteWindow scheduler"`

---

## Phase 4 — Cloud Functions: Game Engine

### Task 8: computeGameRanking

**Files:** Create `functions/src/campaign-ranking.ts`

- [ ] Write `src/campaign-ranking.ts`:

```typescript
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { scoreOnePalpite } from "./campaign-scoring";
import type { MatchResult, PrizeTier, WinnerModelConfig } from "./campaign-types";

const db = admin.firestore();

export const computeGameRanking = functions.firestore.onDocumentUpdated(
  "matches/{matchId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.status === after.status) return;
    if (after.status !== "finished" && after.status !== "FT") return;

    const matchId = event.params.matchId;

    // Find all campaign_games for this match
    const gamesSnap = await db.collection("campaign_games")
      .where("match_id", "==", matchId)
      .where("status", "in", ["open", "locked", "live"])
      .get();

    if (gamesSnap.empty) return;

    for (const gameDoc of gamesSnap.docs) {
      await processGameRanking(gameDoc, after);
    }
  }
);

async function processGameRanking(
  gameDoc: admin.firestore.QueryDocumentSnapshot,
  matchData: admin.firestore.DocumentData,
) {
  const gameId = gameDoc.id;
  const game = gameDoc.data();

  // Build MatchResult from match data
  const result: MatchResult = {
    home_score: matchData.home_score ?? matchData.goals?.home ?? 0,
    away_score: matchData.away_score ?? matchData.goals?.away ?? 0,
    half_time_home: matchData.half_time_home ?? matchData.score?.halftime?.home ?? null,
    half_time_away: matchData.half_time_away ?? matchData.score?.halftime?.away ?? null,
    first_scorer: null, // enriched separately if available
    total_goals_bracket: null, // computed below
  };

  const totalGoals = result.home_score + result.away_score;
  if (totalGoals <= 1) result.total_goals_bracket = "0-1";
  else if (totalGoals <= 3) result.total_goals_bracket = "2-3";
  else result.total_goals_bracket = "4+";

  // Fetch all palpites
  const palpitesSnap = await db.collection("campaign_games").doc(gameId)
    .collection("palpites").get();
  if (palpitesSnap.empty) {
    await gameDoc.ref.update({ status: "finished", ranking_computed_at: admin.firestore.FieldValue.serverTimestamp() });
    return;
  }

  // Score all palpites
  const scored = palpitesSnap.docs.map((doc) => {
    const p = doc.data();
    const scoring = scoreOnePalpite(p, result);
    return { uid: doc.id, display_name: p.display_name, ...scoring };
  });

  // Sort: total_points desc, exact_score desc, bonus_points desc
  scored.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points;
    if (Number(b.exact_score) !== Number(a.exact_score)) return Number(b.exact_score) - Number(a.exact_score);
    return b.bonus_points - a.bonus_points;
  });

  // Assign ranks (ties share rank)
  let rank = 1;
  for (let i = 0; i < scored.length; i++) {
    if (i > 0 && scored[i].total_points === scored[i - 1].total_points) {
      scored[i].rank = scored[i - 1].rank;
    } else {
      scored[i].rank = rank;
    }
    rank++;
  }

  // Fetch campaign to get winner config
  const campaignDoc = await db.collection("campaigns").doc(game.campaign_id).get();
  const campaign = campaignDoc.data()!;
  const winnerConfig: WinnerModelConfig = campaign.winner_config;

  // Assign prize tiers
  const withTiers = scored.map((s) => {
    let prize_tier: PrizeTier | null = null;
    if (s.rank === 1) prize_tier = "champion";
    else if (s.rank === 2 && (winnerConfig.type === "podium")) prize_tier = "podium_2";
    else if (s.rank === 3 && (winnerConfig.type === "podium")) prize_tier = "podium_3";
    return { ...s, prize_tier };
  });

  // Write scores back to palpites + rankings subcollection
  const batch = db.batch();
  for (const s of withTiers) {
    batch.update(
      db.collection("campaign_games").doc(gameId).collection("palpites").doc(s.uid),
      { total_points: s.total_points, exact_score: s.exact_score, correct_winner: s.correct_winner, bonus_points: s.bonus_points, rank: s.rank, prize_tier: s.prize_tier, status: s.prize_tier ? "winner" : "scored" }
    );
    batch.set(
      db.collection("campaign_games").doc(gameId).collection("rankings").doc(s.uid),
      { user_uid: s.uid, display_name: s.display_name, total_points: s.total_points, exact_score: s.exact_score, bonus_points: s.bonus_points, rank: s.rank, prize_tier: s.prize_tier, updated_at: admin.firestore.FieldValue.serverTimestamp() }
    );
  }

  // Check for quiz trigger (tied rank-1 players + quiz configured)
  const topTied = withTiers.filter((s) => s.rank === 1);
  const needsQuiz = topTied.length > 1 && campaign.quiz_enabled && campaign.prize_model !== "all_win";

  batch.update(gameDoc.ref, {
    status: "finished",
    ranking_computed_at: admin.firestore.FieldValue.serverTimestamp(),
    top_winners: withTiers.slice(0, 3).map((s) => ({ uid: s.uid, display_name: s.display_name, total_points: s.total_points, rank: s.rank })),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  // Generate prize_redemptions for non-quiz cases
  if (!needsQuiz) {
    await generatePrizeRedemptions(gameId, game.campaign_id, withTiers, campaign);
  } else {
    // Create quiz_round (triggers startQuizRound via onWrite)
    await db.collection("quiz_rounds").add({
      campaign_id: game.campaign_id,
      game_id: gameId,
      status: "pending",
      participant_uids: topTied.map((s) => s.uid),
      questions: [], // populated by startQuizRound
      question_answers: {},
      current_question: 0,
      question_deadline: null,
      scores: Object.fromEntries(topTied.map((s) => [s.uid, 0])),
      winner_uid: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

async function generatePrizeRedemptions(
  gameId: string, campaignId: string,
  scored: Array<{ uid: string; display_name: string; prize_tier: PrizeTier | null }>,
  campaign: admin.firestore.DocumentData,
) {
  const winners = scored.filter((s) => s.prize_tier !== null);
  if (winners.length === 0) return;

  const batch = db.batch();
  for (const w of winners) {
    const code = generateRedemptionCode();
    batch.set(db.collection("prize_redemptions").doc(), {
      campaign_id: campaignId,
      game_id: gameId,
      winner_uid: w.uid,
      merchant_id: campaign.merchant_id,
      display_name: w.display_name,
      benefit_code: campaign.benefit_code,
      prize_tier: w.prize_tier,
      redemption_code: code,
      redeemed_at: null,
      redeemed_by_uid: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
}

function generateRedemptionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
```

- [ ] Export: `export { computeGameRanking } from "./campaign-ranking";`
- [ ] Build: `npm run build` — no errors.
- [ ] Commit: `git add functions/src/campaign-ranking.ts functions/src/index.ts && git commit -m "feat(campaign): computeGameRanking with scoring + prize redemption generation"`

---

### Task 9: updateCampaignTvState

**Files:** Create `functions/src/campaign-tv.ts`

- [ ] Write `src/campaign-tv.ts`:

```typescript
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

const db = admin.firestore();

// Triggered when rankings subcollection changes — updates the public TV state doc
export const updateCampaignTvState = functions.firestore.onDocumentWritten(
  "campaign_games/{gameId}/rankings/{userId}",
  async (event) => {
    const gameId = event.params.gameId;

    const gameDoc = await db.collection("campaign_games").doc(gameId).get();
    if (!gameDoc.exists) return;
    const game = gameDoc.data()!;

    const campaignDoc = await db.collection("campaigns").doc(game.campaign_id).get();
    if (!campaignDoc.exists) return;
    const shareCode = campaignDoc.data()!.share_code;

    // Fetch top 10 rankings — zero PII (display_name is pseudonymous, user chose it)
    const rankingsSnap = await db.collection("campaign_games").doc(gameId)
      .collection("rankings")
      .orderBy("total_points", "desc")
      .limit(10)
      .get();

    const top_rankings = rankingsSnap.docs.map((doc) => ({
      display_name: doc.data().display_name,
      total_points: doc.data().total_points,
      rank: doc.data().rank,
    }));

    await db.collection("campaign_tv_state").doc(shareCode).update({
      top_rankings,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);
```

- [ ] Export: `export { updateCampaignTvState } from "./campaign-tv";`
- [ ] Build: `npm run build` — no errors.
- [ ] Commit: `git add functions/src/campaign-tv.ts functions/src/index.ts && git commit -m "feat(campaign): updateCampaignTvState trigger"`

---

### Task 10: Quiz Round functions

**Files:** Create `functions/src/campaign-quiz.ts`

- [ ] Write `src/campaign-quiz.ts`:

```typescript
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import type { QuizStatus } from "./campaign-types";

const db = admin.firestore();
const QUIZ_QUESTION_SECONDS = 15;

export const startQuizRound = functions.firestore.onDocumentCreated(
  "quiz_rounds/{quizId}",
  async (event) => {
    const quizId = event.params.quizId;
    const quiz = event.data?.data();
    if (!quiz) return;
    if (quiz.status !== "pending") return;

    // Select 5 random questions (avoid empresa_custom for non-parceiro)
    const campaignDoc = await db.collection("campaigns").doc(quiz.campaign_id).get();
    const campaign = campaignDoc.data()!;
    const isPartner = campaign.plan === "parceiro";

    const questionsSnap = await db.collection("quiz_questions")
      .where("active", "==", true)
      .where("category", "!=", isPartner ? "" : "empresa_custom") // exclude empresa_custom for non-partners
      .limit(50)
      .get();

    // Shuffle and pick 5
    const shuffled = questionsSnap.docs.sort(() => Math.random() - 0.5).slice(0, 5);
    const questions = shuffled.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id, category: d.category, question: d.question,
        options: d.options,
        // correct_index EXCLUDED from public questions array
      };
    });
    const questionAnswers: Record<string, number> = {};
    shuffled.forEach((doc, i) => { questionAnswers[String(i)] = doc.data().correct_index; });

    const deadline = new Date(Date.now() + 30_000); // 30s to read first question

    await db.collection("quiz_rounds").doc(quizId).update({
      status: "active" as QuizStatus,
      questions,
      question_answers: questionAnswers,
      current_question: 0,
      question_deadline: admin.firestore.Timestamp.fromDate(deadline),
    });

    // Update TV state
    const shareCode = campaignDoc.data()!.share_code;
    await db.collection("campaign_tv_state").doc(shareCode).update({
      quiz_active: true,
      quiz_question: questions[0],
      quiz_timer_ends_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() + QUIZ_QUESTION_SECONDS * 1000)),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);

export const advanceQuizQuestion = functions.https.onCall(async (request) => {
  // Called by a Cloud Task / PubSub after 15s per question
  // For simplicity, merchant can also trigger manually via admin panel
  if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const { quiz_id } = request.data as { quiz_id: string };
  const quizDoc = await db.collection("quiz_rounds").doc(quiz_id).get();
  if (!quizDoc.exists) throw new functions.https.HttpsError("not-found", "Quiz not found");
  const quiz = quizDoc.data()!;

  // Verify caller is campaign owner
  const campaignDoc = await db.collection("campaigns").doc(quiz.campaign_id).get();
  if (campaignDoc.data()!.owner_uid !== request.auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "Not your campaign");
  }

  const currentQ = quiz.current_question;
  const correctIdx = quiz.question_answers[String(currentQ)];

  // Score answers for current question
  const answersSnap = await db.collection("quiz_rounds").doc(quiz_id)
    .collection("answers")
    .where("question_index", "==", currentQ)
    .get();

  const batch = db.batch();
  const deadlineMs = quiz.question_deadline?.toDate().getTime() || Date.now();

  for (const answerDoc of answersSnap.docs) {
    const answer = answerDoc.data();
    const correct = answer.answer_index === correctIdx;
    const answeredMs = answer.answered_at.toDate().getTime();
    const speedMs = Math.max(0, deadlineMs - answeredMs);
    const speedBonus = correct ? Math.round((speedMs / (QUIZ_QUESTION_SECONDS * 1000)) * 10) : 0;

    batch.update(answerDoc.ref, { correct, speed_bonus: speedBonus });

    if (correct) {
      batch.update(db.collection("quiz_rounds").doc(quiz_id), {
        [`scores.${answer.user_uid}`]: admin.firestore.FieldValue.increment(10 + speedBonus),
      });
    }
  }

  const nextQ = currentQ + 1;
  const isLast = nextQ >= 5;

  if (!isLast) {
    const nextDeadline = new Date(Date.now() + QUIZ_QUESTION_SECONDS * 1000);
    batch.update(db.collection("quiz_rounds").doc(quiz_id), {
      current_question: nextQ,
      status: `q${nextQ + 1}` as QuizStatus,
      question_deadline: admin.firestore.Timestamp.fromDate(nextDeadline),
    });
  } else {
    batch.update(db.collection("quiz_rounds").doc(quiz_id), {
      status: "finished" as QuizStatus,
    });
  }

  await batch.commit();

  if (isLast) {
    await finalizeQuiz(quiz_id, quiz);
  }

  return { ok: true, next_question: isLast ? null : nextQ };
});

async function finalizeQuiz(quizId: string, quiz: admin.firestore.DocumentData) {
  const quizDoc = await db.collection("quiz_rounds").doc(quizId).get();
  const scores: Record<string, number> = quizDoc.data()!.scores;

  // Find winner: highest score, then fastest (use uid as final tiebreaker)
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const winnerUid = sorted[0][0];

  await db.collection("quiz_rounds").doc(quizId).update({
    winner_uid: winnerUid,
    status: "finished" as QuizStatus,
  });

  // Generate prize redemption for quiz winner
  const campaignDoc = await db.collection("campaigns").doc(quiz.campaign_id).get();
  const campaign = campaignDoc.data()!;

  // Get winner display name
  const palpiteDoc = await db.collection("campaign_games").doc(quiz.game_id)
    .collection("palpites").doc(winnerUid).get();

  const code = Array.from({ length: 10 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 33)]).join("");
  await db.collection("prize_redemptions").add({
    campaign_id: quiz.campaign_id,
    game_id: quiz.game_id,
    winner_uid: winnerUid,
    merchant_id: campaign.merchant_id,
    display_name: palpiteDoc.data()?.display_name || "Participante",
    benefit_code: campaign.benefit_code,
    prize_tier: "quiz_winner",
    redemption_code: code,
    redeemed_at: null,
    redeemed_by_uid: null,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update game quiz_round_id
  await db.collection("campaign_games").doc(quiz.game_id).update({
    quiz_round_id: quizId,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}
```

- [ ] Export: `export { startQuizRound, advanceQuizQuestion } from "./campaign-quiz";`
- [ ] Build: `npm run build` — no errors.
- [ ] Commit: `git add functions/src/campaign-quiz.ts functions/src/index.ts && git commit -m "feat(campaign): quiz round functions"`

---

### Task 11: validatePrizeRedemption + schedulers

**Files:** Create `functions/src/campaign-prize.ts`, `functions/src/campaign-maintenance.ts`

- [ ] Write `src/campaign-prize.ts`:

```typescript
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const validatePrizeRedemption = functions.https.onCall(async (request) => {
  if (!request.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");

  const { redemption_code } = request.data as { redemption_code: string };
  const code = redemption_code.trim().toUpperCase();

  const snap = await db.collection("prize_redemptions")
    .where("redemption_code", "==", code)
    .limit(1)
    .get();

  if (snap.empty) throw new functions.https.HttpsError("not-found", "Código inválido");

  const doc = snap.docs[0];
  const redemption = doc.data();

  // Verify caller is merchant for this campaign
  const campaignDoc = await db.collection("campaigns").doc(redemption.campaign_id).get();
  if (campaignDoc.data()!.owner_uid !== request.auth.uid) {
    throw new functions.https.HttpsError("permission-denied", "Este prêmio não é da sua campanha");
  }

  if (redemption.redeemed_at !== null) {
    return { ok: false, reason: "already_redeemed", redeemed_at: redemption.redeemed_at.toDate().toISOString() };
  }

  await doc.ref.update({
    redeemed_at: admin.firestore.FieldValue.serverTimestamp(),
    redeemed_by_uid: request.auth.uid,
  });

  return {
    ok: true,
    winner_display_name: redemption.display_name,
    prize_tier: redemption.prize_tier,
    benefit_code: redemption.benefit_code,
  };
});
```

- [ ] Write `src/campaign-maintenance.ts`:

```typescript
import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { COPA_ENDS_AT } from "./campaign-types";

const db = admin.firestore();

export const expireCampaigns = functions.scheduler.onSchedule(
  { schedule: "every 24 hours", timeZone: "America/Sao_Paulo" },
  async () => {
    const now = new Date();
    if (now < COPA_ENDS_AT) return; // nothing to expire before the Cup ends

    const snap = await db.collection("campaigns")
      .where("plan", "in", ["copa", "torcida"])
      .where("status", "==", "active")
      .limit(100)
      .get();

    if (snap.empty) return;
    const batch = db.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, { status: "finished", updated_at: admin.firestore.FieldValue.serverTimestamp() });
    });
    await batch.commit();
    console.log(`Expired ${snap.size} campaigns`);
  }
);

export const sendRenewalReminders = functions.scheduler.onSchedule(
  { schedule: "every 24 hours", timeZone: "America/Sao_Paulo" },
  async () => {
    // Torcida: 1 credit left → remind to upgrade
    const torcidaSnap = await db.collection("merchants")
      .where("plan", "==", "torcida")
      .where("plan_credits", "==", 1)
      .get();

    const batch = db.batch();
    for (const doc of torcidaSnap.docs) {
      batch.set(db.collection("notifications").doc(), {
        user_id: doc.data().owner_uid,
        title: "Último jogo do seu pacote",
        message: "Você tem 1 crédito restante no Pacote Torcida. Considere fazer upgrade para a Copa Completa!",
        type: "warning",
        read: false,
        link: "/negocio/planos",
        created_at: new Date().toISOString(),
      });
    }

    // Rodada: no credits → suggest repurchase
    const rodadaSnap = await db.collection("merchants")
      .where("plan", "==", "rodada")
      .where("plan_credits", "==", 0)
      .get();

    for (const doc of rodadaSnap.docs) {
      batch.set(db.collection("notifications").doc(), {
        user_id: doc.data().owner_uid,
        title: "Sua rodada acabou",
        message: "Continue engajando seus clientes. Ative um novo Pacote Rodada ou faça upgrade!",
        type: "info",
        read: false,
        link: "/negocio/planos",
        created_at: new Date().toISOString(),
      });
    }

    await batch.commit();
  }
);
```

- [ ] Export: `export { validatePrizeRedemption } from "./campaign-prize"; export { expireCampaigns, sendRenewalReminders } from "./campaign-maintenance";`
- [ ] Build: `npm run build` — no errors.
- [ ] Commit: `git add functions/src/campaign-prize.ts functions/src/campaign-maintenance.ts functions/src/index.ts && git commit -m "feat(campaign): validatePrizeRedemption + maintenance schedulers"`

---

### Task 12: Deploy all backend functions

- [ ] Deploy the 8 new functions by name (avoids reconciling the ~50 v1 functions still in production):

```bash
# cwd: C:\Users\eduar\.antigravity\Arenacopa
firebase deploy --only \
  "functions:createCampaignDraft,\
functions:createCampaignCheckout,\
functions:syncCampaignCheckout,\
functions:activateCampaignGame,\
functions:submitPalpite,\
functions:lockPalpiteWindow,\
functions:computeGameRanking,\
functions:updateCampaignTvState,\
functions:startQuizRound,\
functions:advanceQuizQuestion,\
functions:validatePrizeRedemption,\
functions:expireCampaigns,\
functions:sendRenewalReminders"
```

- [ ] Verify in Firebase console: all 13 functions appear with status "healthy".
- [ ] Also deploy rules if not yet done: `firebase deploy --only firestore:rules`

---

## Phase 5 — Frontend Types & Pricing

### Task 13: Frontend types + pricing

**Files:**
- Create: `src/types/campaign-v2.ts`
- Create: `src/lib/campaign-v2-pricing.ts`

- [x] Write `src/types/campaign-v2.ts`:

```typescript
// Frontend mirror of backend campaign types (no correct_index, no admin-only fields)

export type MerchantType = "bar" | "company";
export type CampaignMode = "in_person" | "online" | "hybrid";
export type CampaignPlan = "rodada" | "torcida" | "copa" | "parceiro";
export type CampaignStatus = "draft" | "active" | "paused" | "finished" | "archived";
export type GameStatus = "setup" | "open" | "locked" | "live" | "finished" | "cancelled";
export type PrizeModel = "all_win" | "quiz_decides" | "all_win_quiz_top";
export type QuotaMode = "free" | "auto" | "manual";
export type PrizeTier = "champion" | "podium_2" | "podium_3" | "participant" | "exact_score" | "quiz_winner";

export type WinnerModelConfig =
  | { type: "champion"; benefit: string }
  | { type: "podium"; benefits: [string, string, string] }
  | { type: "exact_score"; benefit: string; max_winners: number | null }
  | { type: "top_percent"; percent: number; benefit: string; max_winners: number }
  | { type: "universal"; min_points: number; benefit: string };

export type Merchant = {
  id: string;
  type: MerchantType;
  owner_uid: string;
  name: string;
  logo_url: string | null;
  cep: string | null;
  city: string;
  neighborhood: string;
  contact_whatsapp: string | null;
  instagram: string | null;
  status: "draft" | "active" | "blocked";
  plan: CampaignPlan;
  plan_credits: number;
  plan_expires_at: Date | null;
};

export type Campaign = {
  id: string;
  merchant_id: string;
  owner_uid: string;
  type: MerchantType;
  mode: CampaignMode;
  name: string;
  description: string | null;
  logo_url: string | null;
  status: CampaignStatus;
  plan: CampaignPlan;
  max_participants: number;
  participant_count: number;
  winner_config: WinnerModelConfig;
  prize_model: PrizeModel;
  quiz_enabled: boolean;
  benefit_summary: string;
  benefit_code: string;
  share_code: string;
  qr_payload: string;
  palpite_window_minutes: 5 | 15 | 30;
  paid_at: Date | null;
};

export type CampaignGame = {
  id: string;
  campaign_id: string;
  match_id: string;
  match_snapshot: { home_team: string; away_team: string; match_date: string };
  status: GameStatus;
  palpite_window_closes_at: Date;
  participant_count: number;
  ranking_computed_at: Date | null;
  quiz_round_id: string | null;
};

export type Palpite = {
  user_uid: string;
  display_name: string;
  home_score: number;
  away_score: number;
  half_time_home: number | null;
  half_time_away: number | null;
  first_scorer: "home" | "away" | "none" | null;
  total_goals_bracket: "0-1" | "2-3" | "4+" | null;
  submitted_at: Date;
  total_points: number | null;
  rank: number | null;
  prize_tier: PrizeTier | null;
  status: "submitted" | "scored" | "winner" | "quiz_winner";
};

export type RankingEntry = {
  user_uid: string;
  display_name: string;
  total_points: number;
  rank: number;
  prize_tier: PrizeTier | null;
};

export type TvState = {
  campaign_id: string;
  merchant_name: string;
  logo_url: string | null;
  benefit_summary: string;
  current_game_id: string | null;
  current_match: { home_team: string; away_team: string; match_date: string } | null;
  participant_count: number;
  top_rankings: Array<{ display_name: string; total_points: number; rank: number }>;
  quiz_active: boolean;
  quiz_question: { id: string; question: string; options: string[] } | null;
  quiz_timer_ends_at: Date | null;
};

export type QuizRound = {
  id: string;
  status: "pending" | "active" | "q1" | "q2" | "q3" | "q4" | "q5" | "finished";
  questions: Array<{ id: string; question: string; options: string[] }>;
  current_question: number;
  question_deadline: Date | null;
  scores: Record<string, number>;
  winner_uid: string | null;
};

export type PrizeRedemption = {
  id: string;
  winner_uid: string;
  display_name: string;
  benefit_code: string;
  prize_tier: PrizeTier;
  redemption_code: string;
  redeemed_at: Date | null;
};

// Human-readable labels
export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Rascunho",
  active: "Ativa",
  paused: "Pausada",
  finished: "Encerrada",
  archived: "Arquivada",
};

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  setup: "Configurando",
  open: "Aberto para palpites",
  locked: "Palpites encerrados",
  live: "Ao vivo",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

export const PRIZE_TIER_LABELS: Record<PrizeTier, string> = {
  champion: "🥇 Campeão",
  podium_2: "🥈 2º lugar",
  podium_3: "🥉 3º lugar",
  participant: "Participante",
  exact_score: "Placar Exato",
  quiz_winner: "Campeão do Quiz",
};
```

- [x] Write `src/lib/campaign-v2-pricing.ts`:

```typescript
import type { CampaignPlan } from "@/types/campaign-v2";

export type PlanInfo = {
  id: CampaignPlan;
  name: string;
  tagline: string;
  price_cents: number;
  price_label: string;
  max_games: string;
  max_participants: number;
  features: string[];
  badge: string | null;
  mode: "payment" | "subscription";
};

export const CAMPAIGN_PLANS: PlanInfo[] = [
  {
    id: "rodada",
    name: "Rodada",
    tagline: "Perfeito para um jogo especial",
    price_cents: 4990,
    price_label: "R$ 49,90",
    max_games: "1 jogo",
    max_participants: 200,
    features: [
      "1 jogo ativável",
      "Até 200 participantes",
      "QR code para participação",
      "ArenaTV com placar ao vivo",
      "Campeão ou Pódio",
      "Código de benefício exclusivo",
    ],
    badge: null,
    mode: "payment",
  },
  {
    id: "torcida",
    name: "Pacote Torcida",
    tagline: "Para a fase de grupos",
    price_cents: 11990,
    price_label: "R$ 119,90",
    max_games: "3 jogos",
    max_participants: 500,
    features: [
      "3 jogos ativáveis",
      "Até 500 participantes",
      "Ranking acumulado entre jogos",
      "Todos os modelos de vencedor",
      "Analytics básico",
      "Lembrete de renovação",
    ],
    badge: "Mais popular",
    mode: "payment",
  },
  {
    id: "copa",
    name: "Copa Completa",
    tagline: "Todos os jogos até a final",
    price_cents: 34990,
    price_label: "R$ 349,90",
    max_games: "Ilimitado até 19/jul",
    max_participants: 1500,
    features: [
      "Jogos ilimitados até 19/07/2026",
      "Até 1.500 participantes",
      "Upload de logo do negócio",
      "Analytics completo",
      "Quiz Round para desempate",
      "Todos os modelos de premiação",
    ],
    badge: "Melhor custo-benefício",
    mode: "payment",
  },
  {
    id: "parceiro",
    name: "Arena Parceiro",
    tagline: "Para empresas e eventos",
    price_cents: 39990,
    price_label: "R$ 399,90/ano",
    max_games: "Ilimitado",
    max_participants: 999999,
    features: [
      "Jogos ilimitados",
      "Participantes ilimitados",
      "Modo empresa (online/híbrido)",
      "Quiz personalizado da empresa",
      "Analytics avançado",
      "Suporte prioritário",
    ],
    badge: "Empresas",
    mode: "subscription",
  },
];

export function getPlanById(id: CampaignPlan): PlanInfo {
  return CAMPAIGN_PLANS.find((p) => p.id === id)!;
}

export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
```

- [x] Write tests at `src/lib/__tests__/campaign-v2-pricing.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { CAMPAIGN_PLANS, getPlanById, formatPrice } from "../campaign-v2-pricing";

describe("campaign-v2-pricing", () => {
  it("has 4 plans", () => { expect(CAMPAIGN_PLANS).toHaveLength(4); });
  it("getPlanById returns correct plan", () => { expect(getPlanById("torcida").price_cents).toBe(11990); });
  it("formatPrice formats BRL correctly", () => { expect(formatPrice(4990)).toBe("R$ 49,90"); });
  it("all plans have required fields", () => {
    CAMPAIGN_PLANS.forEach((p) => {
      expect(p.id).toBeTruthy();
      expect(p.features.length).toBeGreaterThan(0);
    });
  });
});
```

- [x] Run: `npm test` (in frontend dir) — expected: tests pass.
- [x] Commit: `git add src/types/campaign-v2.ts src/lib/campaign-v2-pricing.ts src/lib/__tests__/campaign-v2-pricing.test.ts && git commit -m "feat(campaign): frontend types v2 + pricing catalog"`

---

## Phase 6 — Frontend: Campaign Wizard (Bar)

### Task 14: CriarCampanhaBar — Step 1 (plan selection)

**Files:** Rewrite `src/pages/CriarCampanhaBar.tsx`

The existing wizard has 5 steps with a dead `activationType` state, GPS dead end, and wrong pricing. Replace entirely.

New structure: 4 steps
1. Plano (plan selection)
2. Configurar Benefício (benefit + prize model + quota)
3. Selecionar Jogo (game/match picker)
4. Confirmar e Pagar

- [x] Write the full wizard. This is a large file — write it in sections. Start with Step 1 skeleton and state types:

```bash
# cwd: OneDrive frontend dir
# Use Write tool or PowerShell to create the file
```

Write `src/pages/CriarCampanhaBar.tsx`:

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { functions, db } from "@/lib/firebase";
import { CAMPAIGN_PLANS, getPlanById } from "@/lib/campaign-v2-pricing";
import { normalizeBenefitCode, validateCommercialBenefitText } from "@/lib/commercial-campaign";
import type { CampaignPlan, WinnerModelConfig, PrizeModel, QuotaMode } from "@/types/campaign-v2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ChevronRight, ChevronLeft, Trophy, Users, Zap, Star } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { MatchFeedItem } from "@/types/match-feed";

type Step = 1 | 2 | 3 | 4;

type WizardState = {
  plan: CampaignPlan | null;
  campaignName: string;
  benefitSummary: string;
  benefitCode: string;
  winnerModel: WinnerModelConfig | null;
  prizeModel: PrizeModel;
  quotaMode: QuotaMode;
  quotaValue: number | null;
  palpiteWindowMinutes: 5 | 15 | 30;
  quizEnabled: boolean;
  selectedMatchId: string | null;
  selectedMatch: MatchFeedItem | null;
};

const INITIAL_STATE: WizardState = {
  plan: null, campaignName: "", benefitSummary: "", benefitCode: "",
  winnerModel: null, prizeModel: "quiz_decides", quotaMode: "auto",
  quotaValue: null, palpiteWindowMinutes: 15, quizEnabled: true,
  selectedMatchId: null, selectedMatch: null,
};

export default function CriarCampanhaBar() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchFeedItem[]>([]);

  // Persist wizard state in localStorage to survive refresh
  useEffect(() => {
    const saved = localStorage.getItem("wizard_criar_campanha_bar");
    if (saved) {
      try { setState(JSON.parse(saved)); } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("wizard_criar_campanha_bar", JSON.stringify(state));
  }, [state]);

  // Load future scheduled matches
  useEffect(() => {
    if (step !== 3) return;
    const load = async () => {
      const now = Timestamp.now();
      const snap = await getDocs(
        query(collection(db, "matches"),
          where("status", "==", "scheduled"),
          where("match_date", ">", now.toDate().toISOString()),
          orderBy("match_date", "asc"))
      );
      setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as MatchFeedItem)));
    };
    load();
  }, [step]);

  const update = (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch }));

  // ── Step 1: Plan selection ─────────────────────────────────────────────────
  const Step1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Escolha seu plano</h2>
      <div className="grid grid-cols-1 gap-3">
        {CAMPAIGN_PLANS.map((plan) => {
          const selected = state.plan === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => update({ plan: plan.id, winnerModel: null })}
              className={`text-left rounded-xl border-2 p-4 transition-all ${selected ? "border-green-500 bg-green-500/10" : "border-white/10 bg-white/5 hover:border-white/30"}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{plan.name}</span>
                    {plan.badge && <Badge className="bg-amber-500 text-black text-xs">{plan.badge}</Badge>}
                  </div>
                  <p className="text-sm text-white/60 mt-0.5">{plan.tagline}</p>
                  <p className="text-xs text-white/40 mt-1">{plan.max_games} · até {plan.max_participants === 999999 ? "ilimitados" : plan.max_participants} participantes</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{plan.price_label}</p>
                  {selected && <CheckCircle className="w-5 h-5 text-green-400 mt-1 ml-auto" />}
                </div>
              </div>
              {selected && (
                <ul className="mt-3 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-white/70 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── Step 2: Benefit + prize model ──────────────────────────────────────────
  const Step2 = () => {
    const plan = getPlanById(state.plan!);
    const benefitValidation = validateCommercialBenefitText(state.benefitSummary);

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Configure o benefício</h2>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Nome da campanha</label>
          <Input
            value={state.campaignName}
            onChange={(e) => update({ campaignName: e.target.value })}
            placeholder="Ex: Bolão da Final - Bar do Zé"
            maxLength={80}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Benefício do vencedor</label>
          <Textarea
            value={state.benefitSummary}
            onChange={(e) => {
              const val = e.target.value;
              update({ benefitSummary: val, benefitCode: normalizeBenefitCode(val) });
            }}
            placeholder="Ex: 1 chopp grátis na próxima visita"
            maxLength={120}
            className="bg-white/10 border-white/20 text-white resize-none"
          />
          {state.benefitSummary && !benefitValidation.ok && (
            <p className="text-xs text-red-400">
              {benefitValidation.reasonCode === "blocked_commercial_reward_language"
                ? "Não é permitido mencionar dinheiro, prêmios em dinheiro ou apostas."
                : "Digite o benefício."}
            </p>
          )}
          {state.benefitCode && (
            <p className="text-xs text-white/40">Código gerado: <span className="text-white font-mono">{state.benefitCode}</span></p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Modelo de premiação</label>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: "champion" as const, label: "1 Campeão", desc: "Quiz desempata em caso de empate", icon: Trophy },
              { id: "podium" as const, label: "Pódio (Top 3)", desc: "1°, 2° e 3° lugares recebem prêmios diferentes", icon: Star },
              ...(plan.id !== "rodada" ? [{ id: "exact_score" as const, label: "Placar Exato", desc: "Todos que acertam o placar exato ganham", icon: Zap }] : []),
            ].map((model) => (
              <button
                key={model.id}
                onClick={() => update({
                  winnerModel: model.id === "champion"
                    ? { type: "champion", benefit: state.benefitSummary }
                    : model.id === "podium"
                    ? { type: "podium", benefits: [state.benefitSummary, "Cortesia", "Cortesia"] }
                    : { type: "exact_score", benefit: state.benefitSummary, max_winners: null },
                })}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${state.winnerModel?.type === model.id ? "border-green-500 bg-green-500/10" : "border-white/10 bg-white/5"}`}
              >
                <model.icon className="w-5 h-5 text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">{model.label}</p>
                  <p className="text-xs text-white/50">{model.desc}</p>
                </div>
                {state.winnerModel?.type === model.id && <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/70">Fechar palpites antes do apito</label>
          <div className="flex gap-2">
            {([5, 15, 30] as const).map((min) => (
              <button
                key={min}
                onClick={() => update({ palpiteWindowMinutes: min })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${state.palpiteWindowMinutes === min ? "bg-green-500 text-black" : "bg-white/10 text-white/70"}`}
              >
                {min} min
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Step 3: Match selection ────────────────────────────────────────────────
  const Step3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Selecione o jogo</h2>
      <p className="text-sm text-white/60">O jogo será ativado após o pagamento. Você pode mudar depois.</p>
      {matches.length === 0 ? (
        <p className="text-white/40 text-center py-8">Carregando jogos...</p>
      ) : (
        <div className="space-y-2">
          {matches.slice(0, 20).map((match) => {
            const selected = state.selectedMatchId === match.id;
            const date = new Date(match.matchDate);
            return (
              <button
                key={match.id}
                onClick={() => update({ selectedMatchId: match.id, selectedMatch: match })}
                className={`w-full text-left p-3 rounded-xl border transition-all ${selected ? "border-green-500 bg-green-500/10" : "border-white/10 bg-white/5 hover:border-white/30"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    {match.homeTeamName} <span className="text-white/40">x</span> {match.awayTeamName}
                  </span>
                  {selected && <CheckCircle className="w-4 h-4 text-green-400" />}
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Step 4: Confirm + submit ───────────────────────────────────────────────
  const Step4 = () => {
    const plan = getPlanById(state.plan!);
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Confirme e finalize</h2>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4 space-y-3">
            <Row label="Plano" value={plan.name} />
            <Row label="Preço" value={plan.price_label} />
            <Row label="Campanha" value={state.campaignName || "(sem nome)"} />
            <Row label="Benefício" value={state.benefitSummary} />
            <Row label="Premiação" value={state.winnerModel?.type === "champion" ? "1 Campeão" : state.winnerModel?.type === "podium" ? "Pódio Top 3" : "Placar Exato"} />
            {state.selectedMatch && (
              <Row label="Jogo inicial" value={`${state.selectedMatch.homeTeamName} x ${state.selectedMatch.awayTeamName}`} />
            )}
          </CardContent>
        </Card>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    );
  };

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between text-sm">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );

  // ── Navigation guards ──────────────────────────────────────────────────────
  const canProceed = (): boolean => {
    if (step === 1) return state.plan !== null;
    if (step === 2) return Boolean(state.campaignName.trim() && state.benefitSummary.trim() && state.winnerModel && validateCommercialBenefitText(state.benefitSummary).ok);
    if (step === 3) return true; // match selection optional (can activate later)
    return true;
  };

  const handleSubmit = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const token = await session.getIdToken();
      const createDraft = httpsCallable(functions, "createCampaignDraft");
      const result = await createDraft({
        plan: state.plan,
        type: "bar",
        mode: "in_person",
        name: state.campaignName,
        benefit_summary: state.benefitSummary,
        benefit_code: state.benefitCode,
        winner_config: state.winnerModel,
        prize_model: state.prizeModel,
        quota_mode: state.quotaMode,
        quota_value: state.quotaValue,
        palpite_window_minutes: state.palpiteWindowMinutes,
        quiz_enabled: state.quizEnabled,
      });
      const { campaign_id } = result.data as { campaign_id: string };
      localStorage.removeItem("wizard_criar_campanha_bar");
      navigate(`/campanha/${campaign_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar campanha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const STEP_LABELS = ["Plano", "Benefício", "Jogo", "Confirmar"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-32">
      <div className="max-w-md mx-auto px-4 pt-8">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEP_LABELS.map((label, idx) => {
            const n = (idx + 1) as Step;
            const done = n < step;
            const active = n === step;
            return (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-1 rounded-full transition-all ${done ? "bg-green-500" : active ? "bg-green-500/50" : "bg-white/10"}`} />
                <span className={`text-xs ${active ? "text-white" : done ? "text-green-400" : "text-white/30"}`}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/95 backdrop-blur border-t border-white/10">
          <div className="max-w-md mx-auto flex gap-3">
            {step > 1 && (
              <Button variant="outline" className="flex-1 border-white/20 text-white" onClick={() => setStep((s) => (s - 1) as Step)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            )}
            {step < 4 ? (
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold"
                disabled={!canProceed()}
                onClick={() => setStep((s) => (s + 1) as Step)}
              >
                Continuar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? "Criando..." : "Criar e Pagar"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [x] Run: `npm run build` in frontend dir — expected: no TypeScript errors.
- [ ] Smoke test manually: navigate to `/criar-campanha-bar`, verify 4-step wizard renders, plan selection works, benefit validates. **Blocked:** Playwright route check redirected to `/auth?redirect=%2Fcriar-campanha-bar` because no authenticated browser session was available.
- [x] Commit: `git add src/pages/CriarCampanhaBar.tsx && git commit -m "feat(campaign): rewrite wizard Bar — 4-step plan+benefit+game+confirm"`

---

### Task 15: CampanhaBarDetail — update status + payment

**Files:** Modify `src/pages/CampanhaBarDetail.tsx`

Key changes:
1. Replace raw status enum display with `CAMPAIGN_STATUS_LABELS`
2. Call `createCampaignCheckout` instead of old `createCommercialCampaignCheckout`
3. After Stripe redirect-back, call `syncCampaignCheckout` with `?session_id=`
4. Show list of campaign games with status
5. Show QR code and share link when active

- [ ] In `CampanhaBarDetail.tsx`, update the status display:

```tsx
import { CAMPAIGN_STATUS_LABELS } from "@/types/campaign-v2";
// Replace: <span>{campaign.status}</span>
// With:
<span>{CAMPAIGN_STATUS_LABELS[campaign.status as CampaignStatus] ?? campaign.status}</span>
```

- [ ] Replace the payment button handler:

```tsx
const handlePay = async () => {
  if (!session || !campaign) return;
  setLoading(true);
  try {
    const checkout = httpsCallable(functions, "createCampaignCheckout");
    const result = await checkout({
      campaign_id: campaign.id,
      success_url: `${window.location.origin}/campanha/${campaign.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: window.location.href,
    });
    const { url } = result.data as { url: string };
    window.location.assign(url);
  } catch (err) {
    console.error(err);
    setError("Erro ao iniciar pagamento. Tente novamente.");
  } finally {
    setLoading(false);
  }
};
```

- [ ] Add useEffect to sync on return from Stripe:

```tsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  if (!sessionId || !session) return;
  const sync = httpsCallable(functions, "syncCampaignCheckout");
  sync({ session_id: sessionId }).then(() => {
    // Remove query param and reload campaign
    window.history.replaceState({}, "", window.location.pathname);
    // Campaign will re-load via Firestore listener
  });
}, [session]);
```

- [ ] Run: `npm run build` — no errors.
- [ ] Commit: `git add src/pages/CampanhaBarDetail.tsx && git commit -m "feat(campaign): CampanhaBarDetail — fix status labels, payment flow, sync on return"`

---

## Phase 7 — Frontend: Live Experience

### Task 16: PalpiteCard component + CampanhaParticipante page

**Files:**
- Create: `src/components/campaign/PalpiteCard.tsx`
- Modify: `src/pages/PublicCommercialCampaign.tsx` (rename/replace with participante flow)

- [ ] Write `src/components/campaign/PalpiteCard.tsx`:

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CampaignPlan } from "@/types/campaign-v2";

type Props = {
  plan: CampaignPlan;
  homeTeam: string;
  awayTeam: string;
  onSubmit: (palpite: PalpiteInput) => Promise<void>;
  loading?: boolean;
  error?: string | null;
};

export type PalpiteInput = {
  display_name: string;
  home_score: number;
  away_score: number;
  half_time_home?: number;
  half_time_away?: number;
  first_scorer?: "home" | "away" | "none";
  total_goals_bracket?: "0-1" | "2-3" | "4+";
};

export function PalpiteCard({ plan, homeTeam, awayTeam, onSubmit, loading, error }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [htHome, setHtHome] = useState("");
  const [htAway, setHtAway] = useState("");
  const [firstScorer, setFirstScorer] = useState<"home" | "away" | "none" | null>(null);
  const [totalGoals, setTotalGoals] = useState<"0-1" | "2-3" | "4+" | null>(null);

  const showBonus = plan !== "rodada";
  const showTotalGoals = plan === "copa" || plan === "parceiro";

  const handleSubmit = async () => {
    await onSubmit({
      display_name: displayName,
      home_score: Number(home),
      away_score: Number(away),
      ...(showBonus && htHome !== "" ? { half_time_home: Number(htHome), half_time_away: Number(htAway) } : {}),
      ...(showBonus && firstScorer ? { first_scorer: firstScorer } : {}),
      ...(showTotalGoals && totalGoals ? { total_goals_bracket: totalGoals } : {}),
    });
  };

  const isValid = displayName.trim().length >= 3 && home !== "" && away !== "";

  return (
    <div className="bg-white/5 rounded-2xl p-5 space-y-5 border border-white/10">
      <div>
        <label className="text-xs text-white/50 mb-1 block">Seu nome (aparece no placar)</label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Nome ou apelido"
          maxLength={40}
          className="bg-white/10 border-white/20 text-white"
        />
      </div>

      <div>
        <p className="text-xs text-white/50 mb-2">Placar final</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 text-center">
            <p className="text-xs text-white/50 mb-1">{homeTeam}</p>
            <Input
              type="number" min={0} max={20}
              value={home}
              onChange={(e) => setHome(e.target.value)}
              className="text-center text-2xl font-bold bg-white/10 border-white/20 text-white h-14"
            />
          </div>
          <span className="text-white/40 text-xl font-bold">x</span>
          <div className="flex-1 text-center">
            <p className="text-xs text-white/50 mb-1">{awayTeam}</p>
            <Input
              type="number" min={0} max={20}
              value={away}
              onChange={(e) => setAway(e.target.value)}
              className="text-center text-2xl font-bold bg-white/10 border-white/20 text-white h-14"
            />
          </div>
        </div>
      </div>

      {showBonus && (
        <div>
          <p className="text-xs text-white/50 mb-2">Placar no intervalo <span className="text-green-400">+5 pts</span></p>
          <div className="flex items-center gap-3">
            <Input type="number" min={0} max={20} value={htHome} onChange={(e) => setHtHome(e.target.value)} placeholder="Casa" className="text-center bg-white/10 border-white/20 text-white" />
            <span className="text-white/40">x</span>
            <Input type="number" min={0} max={20} value={htAway} onChange={(e) => setHtAway(e.target.value)} placeholder="Fora" className="text-center bg-white/10 border-white/20 text-white" />
          </div>
        </div>
      )}

      {showBonus && (
        <div>
          <p className="text-xs text-white/50 mb-2">Quem marca primeiro? <span className="text-green-400">+3 pts</span></p>
          <div className="flex gap-2">
            {([homeTeam, awayTeam, "Nenhum"] as const).map((label, i) => {
              const val = i === 0 ? "home" : i === 1 ? "away" : "none";
              return (
                <button key={label} onClick={() => setFirstScorer(val as "home" | "away" | "none")}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${firstScorer === val ? "bg-green-500 text-black" : "bg-white/10 text-white/70"}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showTotalGoals && (
        <div>
          <p className="text-xs text-white/50 mb-2">Total de gols <span className="text-green-400">+2 pts</span></p>
          <div className="flex gap-2">
            {(["0-1", "2-3", "4+"] as const).map((bracket) => (
              <button key={bracket} onClick={() => setTotalGoals(bracket)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${totalGoals === bracket ? "bg-green-500 text-black" : "bg-white/10 text-white/70"}`}>
                {bracket}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <Button onClick={handleSubmit} disabled={!isValid || loading}
        className="w-full bg-green-500 hover:bg-green-600 text-black font-bold h-12">
        {loading ? "Enviando..." : "Enviar Palpite"}
      </Button>
    </div>
  );
}
```

- [ ] Run: `npm run build` — no errors.
- [ ] Commit: `git add src/components/campaign/PalpiteCard.tsx && git commit -m "feat(campaign): PalpiteCard component — placar + bonus fields"`

---

### Task 17: ArenaTV redesign

**Files:** Modify `src/pages/ArenaTV.tsx`

The existing ArenaTV.tsx needs a full redesign for the new `campaign_tv_state` schema. It should:
- Read `campaign_tv_state/{shareCode}` (public, no login required)
- Display logo, match, live rankings, participant count
- Show quiz question when `quiz_active === true`

- [ ] Rewrite `src/pages/ArenaTV.tsx`:

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TvState } from "@/types/campaign-v2";
import { Users, Trophy } from "lucide-react";

export default function ArenaTV() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [tv, setTv] = useState<TvState | null>(null);
  const [quizTimer, setQuizTimer] = useState<number | null>(null);

  useEffect(() => {
    if (!shareCode) return;
    const ref = doc(db, "campaign_tv_state", shareCode);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setTv(snap.data() as TvState);
    });
  }, [shareCode]);

  // Quiz countdown timer
  useEffect(() => {
    if (!tv?.quiz_timer_ends_at) { setQuizTimer(null); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(tv.quiz_timer_ends_at!).getTime() - Date.now()) / 1000));
      setQuizTimer(remaining);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [tv?.quiz_timer_ends_at]);

  if (!tv) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50">Conectando à ArenaTV...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          {tv.logo_url && <img src={tv.logo_url} alt={tv.merchant_name} className="h-12 w-12 rounded-xl object-cover" />}
          <div>
            <h1 className="text-2xl font-black text-white">{tv.merchant_name}</h1>
            <p className="text-sm text-green-400">{tv.benefit_summary}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-white/60">
            <Users className="w-5 h-5" />
            <span className="text-2xl font-bold text-white">{tv.participant_count}</span>
          </div>
          <p className="text-xs text-white/40">participantes</p>
        </div>
      </div>

      {/* Match info */}
      {tv.current_match && (
        <div className="text-center py-8 px-6">
          <div className="flex items-center justify-center gap-6">
            <span className="text-3xl font-black text-white">{tv.current_match.home_team}</span>
            <span className="text-4xl font-black text-green-400 mx-2">x</span>
            <span className="text-3xl font-black text-white">{tv.current_match.away_team}</span>
          </div>
          <p className="text-white/40 text-sm mt-2">
            {new Date(tv.current_match.match_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
          </p>
        </div>
      )}

      {/* Quiz mode */}
      {tv.quiz_active && tv.quiz_question && (
        <div className="mx-6 p-6 bg-amber-500/10 border-2 border-amber-500 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-amber-400 font-bold text-lg">⚡ RODADA QUIZ</span>
            {quizTimer !== null && (
              <span className={`text-4xl font-black ${quizTimer <= 5 ? "text-red-400 animate-pulse" : "text-white"}`}>{quizTimer}s</span>
            )}
          </div>
          <p className="text-xl font-bold text-white mb-4">{tv.quiz_question.question}</p>
          <div className="grid grid-cols-2 gap-3">
            {tv.quiz_question.options.map((opt, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-3 text-sm text-white font-medium">
                <span className="text-white/40 mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rankings */}
      {tv.top_rankings.length > 0 && (
        <div className="mx-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Placar ao vivo</h2>
          </div>
          <div className="space-y-2">
            {tv.top_rankings.map((entry, idx) => (
              <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl ${idx === 0 ? "bg-amber-500/10 border border-amber-500/30" : "bg-white/5"}`}>
                <span className={`text-2xl font-black w-8 text-center ${idx === 0 ? "text-amber-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-600" : "text-white/30"}`}>
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}°`}
                </span>
                <span className="flex-1 text-lg font-semibold text-white">{entry.display_name}</span>
                <span className="text-2xl font-black text-green-400">{entry.total_points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!tv.current_game_id && !tv.quiz_active && tv.top_rankings.length === 0 && (
        <div className="text-center py-16">
          <p className="text-6xl mb-4">⚽</p>
          <p className="text-2xl font-bold text-white">Aguardando próximo jogo</p>
          <p className="text-white/40 mt-2">{tv.benefit_summary}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] Ensure router has a route for ArenaTV with shareCode param. In `src/App.tsx` (or router config), verify: `<Route path="/tv/:shareCode" element={<ArenaTV />} />`. If not present, add it.
- [ ] Run: `npm run build` — no errors.
- [ ] Commit: `git add src/pages/ArenaTV.tsx && git commit -m "feat(campaign): ArenaTV redesign — real-time rankings + quiz display"`

---

## Phase 8 — Final Deploy

### Task 18: Full deploy

- [ ] Build frontend:

```bash
# cwd: C:\Users\eduar\OneDrive\Desktop\Antigravity\ArenaCopa\Arenacopa
npm run build -- --outDir "C:/Users/eduar/.antigravity/Arenacopa/dist"
```

Expected: build completes, dist/ populated.

- [ ] Deploy hosting:

```bash
# cwd: C:\Users\eduar\.antigravity\Arenacopa
firebase deploy --only hosting
```

- [ ] Deploy any remaining functions:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

- [ ] Smoke test in production:
  - [ ] Log in as bar owner → navigate to `/criar-campanha-bar` → wizard shows 4 steps
  - [ ] Select plan → proceed to benefit step → enter benefit → select prize model
  - [ ] Proceed to game step → see list of Copa 2026 matches
  - [ ] Proceed to confirm → click "Criar e Pagar" → Stripe checkout opens
  - [ ] Complete payment → redirected back → `syncCampaignCheckout` fires → campaign status becomes "active"
  - [ ] Navigate to `/campanha/{id}` → status shows "Ativa" (not "active")
  - [ ] Navigate to `/tv/{shareCode}` — TV screen loads without login
  - [ ] Activate a game → game appears in campaign detail
  - [ ] Submit palpite via callable → appears in Firestore subcollection

- [ ] Commit any final fixes: `git add -p && git commit -m "chore: final deploy fixes"`

---

## Self-Review Checklist

### Spec coverage:
- [x] 13 Firestore collections: merchants, campaigns, campaign_games, palpites (sub), score_quotas (sub), rankings (sub), campaign_rankings, quiz_rounds, answers (sub), quiz_questions, campaign_participants, prize_redemptions, campaign_tv_state
- [x] Security rules for all new collections
- [x] 13 Cloud Functions: createCampaignDraft, createCampaignCheckout, syncCampaignCheckout, activateCampaignGame, submitPalpite, lockPalpiteWindow, computeGameRanking, updateCampaignTvState, startQuizRound, advanceQuizQuestion, validatePrizeRedemption, expireCampaigns, sendRenewalReminders
- [x] Scoring engine (max 25 pts/game) with tests
- [x] Quota system via server-side transaction in submitPalpite
- [x] Quiz Round flow (startQuizRound → advanceQuizQuestion → finalizeQuiz)
- [x] Prize redemption generation + validation callable
- [x] Frontend wizard (Bar, 4 steps)
- [x] PalpiteCard component
- [x] ArenaTV redesign with quiz support

### Gaps remaining (follow-up plan):
- Company wizard (`CriarCampanhaEmpresa.tsx`) — same structure as Bar but mode = online|hybrid, quiz_enabled forced true for parceiro
- Analytics dashboard (Recharts charts for participant trends, palpite distribution)
- Logo upload to Firebase Storage (replace "Em Breve" button in CampanhaBarDetail)
- `campaign_rankings` update on each game completion (cumulative points)
- Push notifications for Quiz Round invites
- `CampanhaParticipante.tsx` — public join page that renders PalpiteCard
- `quiz_questions` seed data (200+ questions)

### Type consistency:
- `CampaignPlan` = `"rodada" | "torcida" | "copa" | "parceiro"` — consistent across backend + frontend
- `PLAN_MAX_PARTICIPANTS` matches spec (200/500/1500/∞)
- `PrizeTier` values match between backend ranking write and frontend display labels
- `share_code` used as `campaign_tv_state` document ID — consistent in createCampaignDraft, syncCampaignCheckout, activateCampaignGame, updateCampaignTvState, ArenaTV route
