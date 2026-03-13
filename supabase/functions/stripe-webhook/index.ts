import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

type StripeCheckoutSession = {
  id: string;
  customer: string | null;
  payment_intent: string | null;
  amount_total: number | null;
  currency: string | null;
  status: string | null;
  payment_status: string | null;
  client_reference_id: string | null;
  metadata?: Record<string, string | undefined>;
};

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: StripeCheckoutSession;
  };
};

const textEncoder = new TextEncoder();

const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
};

const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const parseStripeSignature = (header: string | null) => {
  if (!header) return { timestamp: null, signatures: [] as string[] };

  const parts = header.split(",").map((item) => item.trim());
  const timestamp = parts.find((item) => item.startsWith("t="))?.slice(2) || null;
  const signatures = parts
    .filter((item) => item.startsWith("v1="))
    .map((item) => item.slice(3));

  return { timestamp, signatures };
};

const verifyStripeSignature = async (payload: string, signatureHeader: string | null, webhookSecret: string) => {
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const digest = await crypto.subtle.sign("HMAC", cryptoKey, textEncoder.encode(signedPayload));
  const expectedSignature = toHex(digest);
  return signatures.some((signature) => timingSafeEqual(signature, expectedSignature));
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
    const stripePriceId = Deno.env.get("STRIPE_PREMIUM_PRICE_ID") || "";

    if (!supabaseUrl || !serviceRoleKey || !stripeWebhookSecret || !stripePriceId) {
      throw new Error("Stripe webhook is not configured.");
    }

    const rawBody = await req.text();
    const signatureHeader = req.headers.get("stripe-signature");
    const isValid = await verifyStripeSignature(rawBody, signatureHeader, stripeWebhookSecret);

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid Stripe signature." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody) as StripeEvent;
    const session = event.data.object;
    const userId = session.metadata?.user_id || session.client_reference_id;

    if (!userId) {
      throw new Error("Stripe session is missing the user identifier.");
    }

    let status: "pending" | "active" | "expired" | "canceled" | "failed" = "pending";
    let purchasedAt: string | null = null;

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      status = "active";
      purchasedAt = new Date().toISOString();
    } else if (event.type === "checkout.session.expired") {
      status = "expired";
    } else {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    await adminClient
      .from("premium_subscriptions")
      .upsert(
        {
          user_id: userId,
          provider: "stripe",
          product_key: session.metadata?.product_key || "arena_premium_lifetime",
          status,
          stripe_customer_id: session.customer,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent,
          stripe_price_id: stripePriceId,
          amount_total: session.amount_total,
          currency: session.currency,
          purchased_at: purchasedAt,
          raw_event: event,
        },
        { onConflict: "stripe_checkout_session_id" },
      );

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
