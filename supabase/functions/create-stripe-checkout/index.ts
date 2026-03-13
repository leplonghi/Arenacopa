import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripeApiBase = "https://api.stripe.com/v1";

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
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:8080";

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !stripeSecretKey || !stripePriceId) {
      throw new Error("Stripe checkout is not configured. Missing Supabase or Stripe secrets.");
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

    const existingActive = await adminClient
      .from("premium_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingActive.data?.id) {
      return new Response(JSON.stringify({ error: "User already has an active premium subscription." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = new URLSearchParams();
    formData.set("mode", "payment");
    formData.set("success_url", `${siteUrl}/premium?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
    formData.set("cancel_url", `${siteUrl}/premium?checkout=cancelled`);
    formData.set("client_reference_id", user.id);
    formData.set("line_items[0][price]", stripePriceId);
    formData.set("line_items[0][quantity]", "1");
    formData.set("allow_promotion_codes", "true");
    formData.set("metadata[user_id]", user.id);
    formData.set("metadata[product_key]", "arena_premium_lifetime");

    if (user.email) {
      formData.set("customer_email", user.email);
    }

    const stripeResponse = await fetch(`${stripeApiBase}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const stripeData = await stripeResponse.json();

    if (!stripeResponse.ok || !stripeData.url || !stripeData.id) {
      throw new Error(stripeData.error?.message || "Failed to create Stripe checkout session.");
    }

    await adminClient
      .from("premium_subscriptions")
      .upsert(
        {
          user_id: user.id,
          provider: "stripe",
          product_key: "arena_premium_lifetime",
          status: "pending",
          stripe_customer_id: stripeData.customer ?? null,
          stripe_checkout_session_id: stripeData.id,
          stripe_price_id: stripePriceId,
          amount_total: stripeData.amount_total ?? null,
          currency: stripeData.currency ?? null,
          raw_event: stripeData,
        },
        { onConflict: "stripe_checkout_session_id" },
      );

    return new Response(JSON.stringify({ url: stripeData.url, sessionId: stripeData.id }), {
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
