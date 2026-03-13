CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stripe',
  product_key text NOT NULL DEFAULT 'arena_premium_lifetime',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'canceled', 'failed')),
  stripe_customer_id text,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_price_id text,
  amount_total integer,
  currency text,
  purchased_at timestamptz,
  expires_at timestamptz,
  raw_event jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS premium_subscriptions_user_id_idx
  ON public.premium_subscriptions(user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS premium_subscriptions_one_active_per_user_idx
  ON public.premium_subscriptions(user_id)
  WHERE status = 'active';

ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their premium subscriptions"
  ON public.premium_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_premium_subscriptions_updated_at ON public.premium_subscriptions;
CREATE TRIGGER update_premium_subscriptions_updated_at
  BEFORE UPDATE ON public.premium_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.is_user_premium(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.premium_subscriptions
    WHERE user_id = target_user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_user_premium(uuid) TO authenticated;
