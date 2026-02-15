-- Add terms acceptance to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

-- Add configuration columns to boloes
ALTER TABLE public.boloes
ADD COLUMN IF NOT EXISTS category text CHECK (category IN ('public', 'private')) DEFAULT 'private',
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS entry_fee numeric(10, 2),
ADD COLUMN IF NOT EXISTS payment_details text,
ADD COLUMN IF NOT EXISTS prize_distribution text,
ADD COLUMN IF NOT EXISTS scoring_rules jsonb DEFAULT '{"exact": 5, "winner": 3, "draw": 2, "participation": 1}'::jsonb,
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('draft', 'open', 'active', 'finished')) DEFAULT 'open';

-- Add payment status to bolao_members
ALTER TABLE public.bolao_members
ADD COLUMN IF NOT EXISTS payment_status text CHECK (payment_status IN ('pending', 'paid', 'exempt')) DEFAULT 'pending';

-- Update RLS policies to allow reading these new columns (if needed, usually SELECT * covers it but good to be safe)
-- The existing policies on boloes are "Members and creators can view boloes" which uses SELECT, so it should be fine.

-- Function to ensure public pools are free
CREATE OR REPLACE FUNCTION check_public_pool_is_free()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.category = 'public' AND NEW.is_paid = true THEN
    RAISE EXCEPTION 'Public pools cannot be paid/money-based.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_public_pool_free
BEFORE INSERT OR UPDATE ON public.boloes
FOR EACH ROW EXECUTE FUNCTION check_public_pool_is_free();
