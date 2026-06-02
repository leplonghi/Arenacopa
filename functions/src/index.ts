/**
 * ArenaCopa — Firebase Cloud Functions
 *
 * Secrets a configurar via `firebase functions:secrets:set <NAME>`:
 *   API_FOOTBALL_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *   STRIPE_PRICE_COPA_PASS, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL
 *   STRIPE_PRICE_B2B_POR_JOGO, STRIPE_PRICE_B2B_FASE_GRUPOS,
 *   STRIPE_PRICE_B2B_COPA_COMPLETA, STRIPE_PRICE_B2B_PARCEIRO_LOCAL,
 *   STRIPE_PRICE_B2B_PARCEIRO_NACIONAL
 */

import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import express from "express";
import webpush from "web-push";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// ─── Types & constants ────────────────────────────────────────────────────────

type Plan = "copa_pass" | "pro_monthly" | "pro_annual";
type B2BPlan =
  | "por_jogo"
  | "fase_grupos"
  | "copa_completa"
  | "parceiro_local"
  | "parceiro_nacional";

const ALLOWED_ORIGINS = new Set([
  "https://arenacopa.com.br",
  "https://arenacopa.web.app",
  "http://localhost:5173",
  "http://localhost:4173",
]);

// Copa 2026 final: Copa Pass expires at end of this date
const COPA_PASS_EXPIRES_AT = new Date("2026-07-19T23:59:59Z");

// Pre-create this coupon in Stripe Dashboard: amount_off = 1990 (R$19,90), once
const COPA_PASS_UPGRADE_COUPON = "COPA_PASS_UPGRADE_2026";

const PLAN_PRICE_ENV: Record<Plan, string> = {
  copa_pass:   "STRIPE_PRICE_COPA_PASS",
  pro_monthly: "STRIPE_PRICE_PRO_MONTHLY",
  pro_annual:  "STRIPE_PRICE_PRO_ANNUAL",
};

const PLAN_MODE: Record<Plan, "payment" | "subscription"> = {
  copa_pass:   "payment",
  pro_monthly: "subscription",
  pro_annual:  "subscription",
};

const B2B_PLAN_PRICE_ENV: Record<B2BPlan, string> = {
  por_jogo:          "STRIPE_PRICE_B2B_POR_JOGO",
  fase_grupos:       "STRIPE_PRICE_B2B_FASE_GRUPOS",
  copa_completa:     "STRIPE_PRICE_B2B_COPA_COMPLETA",
  parceiro_local:    "STRIPE_PRICE_B2B_PARCEIRO_LOCAL",
  parceiro_nacional: "STRIPE_PRICE_B2B_PARCEIRO_NACIONAL",
};

const B2B_PLAN_MODE: Record<B2BPlan, "payment" | "subscription"> = {
  por_jogo:          "payment",
  fase_grupos:       "payment",
  copa_completa:     "payment",
  parceiro_local:    "subscription",
  parceiro_nacional: "subscription",
};

const countryMap: Record<string, string> = {
  "Brazil": "BRA", "Argentina": "ARG", "France": "FRA", "Germany": "GER",
  "Spain": "ESP", "England": "ENG", "Portugal": "POR", "Italy": "ITA",
  "Netherlands": "NED", "Belgium": "BEL", "United States": "USA",
  "Mexico": "MEX", "Uruguay": "URU", "Colombia": "COL", "Senegal": "SEN",
  "Morocco": "MAR", "Japan": "JPN", "South Korea": "KOR",
  "Croatia": "CRO", "Switzerland": "SUI",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStripe(key: string): Stripe {
  return new Stripe(key);
}

async function writeSubscription(
  userId: string,
  plan: Plan | "free",
  status: "active" | "canceled" | "expired" | "past_due",
  extra: Record<string, unknown> = {}
): Promise<void> {
  const payload = {
    plan,
    status,
    ...extra,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await Promise.all([
    db.collection("subscriptions").doc(userId).set(payload, { merge: true }),
    // Mirror to profiles so existing frontend reads keep working
    db.collection("profiles").doc(userId).set(
      { subscription: { plan, status }, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    ),
  ]);
}

async function notify(userId: string, title: string, message: string): Promise<void> {
  await db.collection("notifications").add({
    user_id: userId, title, message,
    type: "success", read: false, link: "/perfil",
    created_at: new Date().toISOString(),
  });
}

// ─── 1. SYNC MATCHES — cron every 3 minutes ───────────────────────────────────

export const syncMatches = functions.scheduler.onSchedule(
  {
    schedule: "every 3 minutes",
    timeZone: "America/Sao_Paulo",
    secrets: ["API_FOOTBALL_KEY", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"],
  },
  async () => {
    const apiKey = process.env.API_FOOTBALL_KEY;
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    if (!apiKey) { console.error("API_FOOTBALL_KEY não configurada"); return; }

    const liveSnap = await db.collection("matches")
      .where("status", "==", "live").limit(1).get();
    const now = new Date();
    if (liveSnap.empty && now.getMinutes() !== 0) {
      console.log("Nenhum jogo ao vivo. Pulando."); return;
    }

    if (vapidPublic && vapidPrivate) {
      webpush.setVapidDetails("mailto:suporte@arenacup.tech", vapidPublic, vapidPrivate);
    }

    const today = now.toISOString().split("T")[0];
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${today}`,
      { headers: { "x-apisports-key": apiKey } }
    );
    if (!response.ok) { console.error(`API-Football erro: ${response.statusText}`); return; }

    const data = await response.json();
    const fixtures = (data.response || []) as Record<string, unknown>[];

    // Fetch all today's matches in one query — fixes N+1
    const todaySnap = await db.collection("matches")
      .where("match_date", ">=", `${today}T00:00:00Z`)
      .where("match_date", "<=", `${today}T23:59:59Z`)
      .get();

    const matchIndex = new Map<string, admin.firestore.QueryDocumentSnapshot>();
    todaySnap.docs.forEach((doc) => {
      const d = doc.data();
      matchIndex.set(`${d.home_team_code}_${d.away_team_code}`, doc);
    });

    const batch = db.batch();
    const goalEvents: Array<{
      homeCode: string; awayCode: string;
      homeScore: number; awayScore: number; elapsed: number;
    }> = [];

    for (const item of fixtures) {
      const teams = item.teams as { home: { name: string }; away: { name: string } };
      const goals = item.goals as { home: number | null; away: number | null };
      const fixture = item.fixture as { status: { short: string; elapsed: number | null } };

      const homeName = teams.home.name;
      const awayName = teams.away.name;
      const homeCode = countryMap[homeName] || homeName.substring(0, 3).toUpperCase();
      const awayCode = countryMap[awayName] || awayName.substring(0, 3).toUpperCase();
      const newHome = goals.home ?? 0;
      const newAway = goals.away ?? 0;
      const sc = fixture.status.short;

      let status = "scheduled";
      if (["1H","2H","HT","ET","P","BT","LIVE"].includes(sc)) status = "live";
      else if (["FT","AET","PEN"].includes(sc)) status = "finished";

      const matchDoc = matchIndex.get(`${homeCode}_${awayCode}`);
      if (matchDoc) {
        const existing = matchDoc.data();
        const oldHome: number = existing.home_score ?? 0;
        const oldAway: number = existing.away_score ?? 0;
        batch.update(matchDoc.ref, {
          home_score: newHome, away_score: newAway, status,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        if (newHome > oldHome || newAway > oldAway) {
          goalEvents.push({
            homeCode, awayCode, homeScore: newHome, awayScore: newAway,
            elapsed: fixture.status.elapsed ?? 90,
          });
        }
      }
    }

    await batch.commit();
    console.log(`Sync concluído. ${goalEvents.length} gol(s).`);
    if (goalEvents.length > 0 && vapidPublic && vapidPrivate) {
      await sendGoalPush(goalEvents);
    }
  }
);

async function sendGoalPush(
  goals: Array<{ homeCode: string; awayCode: string; homeScore: number; awayScore: number; elapsed: number }>
): Promise<void> {
  const subsSnap = await db.collection("push_subscriptions").get();
  if (subsSnap.empty) return;
  const deleteBatch = db.batch();
  let hasDeletes = false;

  for (const goal of goals) {
    const payload = JSON.stringify({
      title: "⚽ GOOOOL!",
      body: `${goal.homeCode} ${goal.homeScore} × ${goal.awayScore} ${goal.awayCode} — ${goal.elapsed}'`,
      url: "/copa/calendario", icon: "/icon-192x192.png",
    });
    await Promise.allSettled(
      subsSnap.docs.map(async (subDoc) => {
        const sub = subDoc.data();
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
            payload
          );
        } catch (err: unknown) {
          const code = (err as { statusCode?: number }).statusCode;
          if (code === 410 || code === 404) { deleteBatch.delete(subDoc.ref); hasDeletes = true; }
        }
      })
    );
  }
  if (hasDeletes) await deleteBatch.commit();
}

// ─── 2. STRIPE WEBHOOK ────────────────────────────────────────────────────────
// express.raw() captures the body as Buffer before any JSON parser,
// which is required for Stripe signature verification.

const webhookApp = express();

webhookApp.post("/", express.raw({ type: "*/*" }), async (req, res) => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !whSecret) {
    res.status(500).send("Stripe secrets not configured"); return;
  }

  const stripe = makeStripe(stripeKey);
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, whSecret);
  } catch (err) {
    console.error("Stripe signature failed:", err);
    res.status(400).send("Webhook Error"); return;
  }

  try {
    await handleStripeEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", event.type, err);
    res.status(500).send("Internal error");
  }
});

export const stripeWebhook = functions.https.onRequest(
  { secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] },
  webhookApp
);

async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutComplete(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await onSubscriptionChange(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      await onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      console.log(`Unhandled event: ${event.type}`);
  }
}

async function onCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.user_id;
  const plan = session.metadata?.plan as Plan | undefined;
  if (!userId || !plan) {
    console.warn("Missing userId or plan in session metadata:", session.id); return;
  }

  if (plan === "copa_pass") {
    const expiresAt = admin.firestore.Timestamp.fromDate(COPA_PASS_EXPIRES_AT);
    const customerId = typeof session.customer === "string" ? session.customer : null;
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
    await writeSubscription(userId, "copa_pass", "active", {
      stripeCustomerId: customerId,
      stripeSubscriptionId: null,
      stripePaymentIntentId: paymentIntentId,
      currentPeriodEnd: expiresAt,
      copaPassCreditApplied: false,
    });
    await notify(userId, "🎉 Copa Pass ativado!", "Aproveite a Copa 2026 completa até 19/jul/2026.");
    console.log(`Copa Pass ativado: ${userId}`);
  }
  // PRO subscriptions are handled by customer.subscription.created
}

async function onSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.user_id;
  if (!userId) {
    console.warn("Missing user_id in subscription metadata:", subscription.id); return;
  }

  const plan = (subscription.metadata?.plan as Plan) || "pro_monthly";
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer : subscription.customer.id;
  const currentPeriodEnd = admin.firestore.Timestamp.fromMillis(
    subscription.current_period_end * 1000
  );
  const creditApplied = subscription.metadata?.copa_pass_credit_applied === "true";

  if (["active", "trialing"].includes(subscription.status)) {
    await writeSubscription(userId, plan, "active", {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd,
      copaPassCreditApplied: creditApplied,
    });
  } else {
    await writeSubscription(userId, plan, "past_due", {
      stripeSubscriptionId: subscription.id,
    });
  }
}

async function onSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;
  await writeSubscription(userId, "free", "canceled", { stripeSubscriptionId: null });
  await notify(userId, "Assinatura cancelada",
    "Sua assinatura Arena PRO foi cancelada. Você ainda pode usar o plano gratuito.");
}

async function onInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer : (invoice.customer as Stripe.Customer | null)?.id;
  if (!customerId) return;
  const snap = await db.collection("subscriptions")
    .where("stripeCustomerId", "==", customerId).limit(1).get();
  if (!snap.empty) {
    await snap.docs[0].ref.set(
      { status: "past_due", updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
}

// ─── 3. CREATE B2C CHECKOUT ────────────────────────────────────────────────────

export const createStripeCheckout = functions.https.onCall(
  {
    secrets: [
      "STRIPE_SECRET_KEY",
      "STRIPE_PRICE_COPA_PASS",
      "STRIPE_PRICE_PRO_MONTHLY",
      "STRIPE_PRICE_PRO_ANNUAL",
    ],
  },
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login necessário.");
    }
    const uid = request.auth.uid;
    const plan = request.data?.plan as Plan | undefined;
    if (!plan || !(plan in PLAN_PRICE_ENV)) {
      throw new functions.https.HttpsError("invalid-argument", "Plano inválido.");
    }

    const origin = request.data?.origin as string | undefined;
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      throw new functions.https.HttpsError("invalid-argument", "Origin não permitida.");
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new functions.https.HttpsError("internal", "Stripe não configurado.");

    const priceId = process.env[PLAN_PRICE_ENV[plan]];
    if (!priceId) {
      throw new functions.https.HttpsError("internal", `Price ID não configurado: ${plan}`);
    }

    const stripe = makeStripe(stripeKey);
    const mode = PLAN_MODE[plan];

    // R2: apply Copa Pass upgrade credit for PRO Monthly
    let discounts: Array<{ coupon: string }> | undefined;
    if (plan === "pro_monthly") {
      const subDoc = await db.collection("subscriptions").doc(uid).get();
      const sub = subDoc.data();
      if (sub?.plan === "copa_pass" && sub?.status === "active" && !sub?.copaPassCreditApplied) {
        discounts = [{ coupon: COPA_PASS_UPGRADE_COUPON }];
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: uid, plan },
      success_url: `${origin}/premium/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/premium`,
    };

    if (mode === "subscription") {
      // Propagate metadata to subscription so renewal events carry user_id
      sessionParams.subscription_data = {
        metadata: {
          user_id: uid,
          plan,
          copa_pass_credit_applied: discounts ? "true" : "false",
        },
      };
    }

    if (discounts) sessionParams.discounts = discounts;

    const session = await stripe.checkout.sessions.create(sessionParams);
    return { url: session.url };
  }
);

// ─── 4. CREATE B2B CHECKOUT ────────────────────────────────────────────────────

export const createB2BCheckout = functions.https.onCall(
  {
    secrets: [
      "STRIPE_SECRET_KEY",
      "STRIPE_PRICE_B2B_POR_JOGO",
      "STRIPE_PRICE_B2B_FASE_GRUPOS",
      "STRIPE_PRICE_B2B_COPA_COMPLETA",
      "STRIPE_PRICE_B2B_PARCEIRO_LOCAL",
      "STRIPE_PRICE_B2B_PARCEIRO_NACIONAL",
    ],
  },
  async (request) => {
    if (!request.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login necessário.");
    }
    const uid = request.auth.uid;

    const plan = request.data?.plan as B2BPlan | undefined;
    if (!plan || !(plan in B2B_PLAN_PRICE_ENV)) {
      throw new functions.https.HttpsError("invalid-argument", "Plano B2B inválido.");
    }

    const origin = request.data?.origin as string | undefined;
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      throw new functions.https.HttpsError("invalid-argument", "Origin não permitida.");
    }

    const businessName = (request.data?.businessName as string | undefined)?.trim();
    if (!businessName) {
      throw new functions.https.HttpsError("invalid-argument", "Nome do negócio obrigatório.");
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new functions.https.HttpsError("internal", "Stripe não configurado.");

    const priceId = process.env[B2B_PLAN_PRICE_ENV[plan]];
    if (!priceId) {
      throw new functions.https.HttpsError("internal", `Price ID B2B não configurado: ${plan}`);
    }

    const stripe = makeStripe(stripeKey);
    const mode = B2B_PLAN_MODE[plan];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: uid, plan, business_name: businessName },
      success_url: `${origin}/parceiro/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/parceiro`,
    };

    if (mode === "subscription") {
      sessionParams.subscription_data = {
        metadata: { user_id: uid, plan, business_name: businessName },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return { url: session.url };
  }
);

// ─── 5. EXPIRE COPA PASSES — daily at 6am BRT ─────────────────────────────────

export const expireCopaPasses = functions.scheduler.onSchedule(
  {
    schedule: "0 6 * * *",
    timeZone: "America/Sao_Paulo",
  },
  async () => {
    const now = admin.firestore.Timestamp.now();
    const snap = await db.collection("subscriptions")
      .where("plan", "==", "copa_pass")
      .where("status", "==", "active")
      .where("currentPeriodEnd", "<=", now)
      .get();

    if (snap.empty) { console.log("Nenhum Copa Pass para expirar."); return; }

    const batch = db.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "expired",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    for (const doc of snap.docs) {
      await notify(
        doc.id,
        "⏰ Copa Pass expirou",
        "A Copa 2026 acabou! Continue nos Campeonatos com Arena PRO. Toque para assinar."
      );
    }
    console.log(`${snap.size} Copa Pass(es) expirado(s).`);
  }
);

// ─── CAMPAIGN SYSTEM V2 — exports ─────────────────────────────────────────────
// Each campaign module is in its own file to keep concerns isolated.
// All critical field writes (scores, rankings, prize redemptions) happen in
// Cloud Functions via Admin SDK — never from the client.

export { createCampaignDraft }      from "./campaign-draft";
export { createCampaignCheckout, syncCampaignCheckout } from "./campaign-checkout";
export { activateCampaignGame, submitPalpite }          from "./campaign-game";
export { lockPalpiteWindow }        from "./campaign-palpite-window";
export { computeGameRanking }       from "./campaign-ranking";
export { updateCampaignTvState }    from "./campaign-tv";
export { startQuizRound, advanceQuizQuestion } from "./campaign-quiz";
export { validatePrizeRedemption }  from "./campaign-prize";
export { expireCampaigns, sendRenewalReminders, checkStaleBoloes } from "./campaign-maintenance";

// ─── 6. COMPUTE RANKINGS — Firestore trigger ──────────────────────────────────

const BATCH_LIMIT = 490; // Firestore max is 500; leave headroom

export const onPalpiteWrite = functions.firestore.onDocumentWritten(
  "bolao_palpites/{palpiteId}",
  async (event) => {
    const data = event.data?.after?.data();
    if (!data) return;
    const { bolao_id, user_id } = data as { bolao_id: string; user_id: string };
    if (!bolao_id || !user_id) return;

    const palpitesSnap = await db.collection("bolao_palpites")
      .where("bolao_id", "==", bolao_id).get();

    const userPoints = new Map<string, { total: number; exact: number; winner: number }>();
    for (const doc of palpitesSnap.docs) {
      const p = doc.data();
      if (p.points == null) continue;
      const uid: string = p.user_id;
      const curr = userPoints.get(uid) ?? { total: 0, exact: 0, winner: 0 };
      curr.total += p.points;
      if (p.is_exact) curr.exact++;
      else if (p.points > 0) curr.winner++;
      userPoints.set(uid, curr);
    }

    const sorted = [...userPoints.entries()].sort(([, a], [, b]) =>
      b.total - a.total || b.exact - a.exact || b.winner - a.winner
    );

    // Chunk writes to stay within Firestore batch limit
    for (let i = 0; i < sorted.length; i += BATCH_LIMIT) {
      const chunk = sorted.slice(i, i + BATCH_LIMIT);
      const batch = db.batch();
      chunk.forEach(([uid, stats], j) => {
        const rankDoc = db.doc(`bolao_rankings/${uid}_${bolao_id}`);
        batch.set(rankDoc, {
          bolao_id, user_id: uid,
          total_points: stats.total,
          exact_matches: stats.exact,
          correct_results: stats.winner,
          rank: i + j + 1,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      });
      await batch.commit();
    }

    console.log(`Rankings do bolão ${bolao_id}: ${sorted.length} participantes.`);
  }
);
