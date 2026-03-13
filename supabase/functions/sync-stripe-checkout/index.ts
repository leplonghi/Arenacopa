import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripeApiBase = "https://api.stripe.com/v1";

type StripeCheckoutSession = {
  id: string;
  status: string | null;
  payment_status: string | null;
  client_reference_id: string | null;
  customer: string | null;
  payment_intent: string | null;
  amount_total: number | null;
  currency: string | null;
  metadata?: Record<string, string | undefined>;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const stripePriceId = Deno.env.get("STRIPE_PREMIUM_PRICE_ID") || "";

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !stripeSecretKey || !stripePriceId) {
      throw new Error("Stripe sync is not configured.");
    }

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { checkoutSessionId } = await req.json();

    if (!checkoutSessionId) {
      throw new Error("checkoutSessionId is required.");
    }

    const stripeResponse = await fetch(`${stripeApiBase}/checkout/sessions/${checkoutSessionId}`, {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    });

    const session = (await stripeResponse.json()) as StripeCheckoutSession & { error?: { message?: string } };

    if (!stripeResponse.ok || !session.id) {
      throw new Error(session.error?.message || "Failed to load checkout session from Stripe.");
    }

    const sessionUserId = session.metadata?.user_id || session.client_reference_id;
    if (sessionUserId !== user.id) {
      return new Response(JSON.stringify({ error: "This checkout session does not belong to the current user." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let status: "pending" | "active" | "expired" | "canceled" | "failed" = "pending";
    let purchasedAt: string | null = null;

    if (session.payment_status === "paid") {
      status = "active";
      purchasedAt = new Date().toISOString();
    } else if (session.status === "expired") {
      status = "expired";
    } else if (session.status === "open") {
      status = "pending";
    } else {
      status = "failed";
    }

    await adminClient
      .from("premium_subscriptions")
      .upsert(
        {
          user_id: user.id,
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
          raw_event: session,
        },
        { onConflict: "stripe_checkout_session_id" },
      );

    return new Response(JSON.stringify({ isPremium: status === "active", status }), {
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
