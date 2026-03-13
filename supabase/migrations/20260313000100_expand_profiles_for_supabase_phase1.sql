ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS fun_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notifications_goals BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notifications_news BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notifications_match_start BOOLEAN DEFAULT true;

UPDATE public.profiles
SET
  terms_accepted = COALESCE(terms_accepted, false) OR terms_accepted_at IS NOT NULL OR accepted_terms_at IS NOT NULL,
  accepted_terms_at = COALESCE(accepted_terms_at, terms_accepted_at)
WHERE terms_accepted_at IS NOT NULL OR accepted_terms_at IS NOT NULL;
