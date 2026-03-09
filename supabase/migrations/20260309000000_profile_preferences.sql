-- Add preference columns to profiles table
-- favorite_team: user's selected team (code like "BRA", "ARG")
-- notifications: JSON object with per-type notification preferences
-- fun_mode: whether fun/celebration animations are enabled

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS favorite_team text DEFAULT 'BRA',
  ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"goals": true, "news": false, "matchStart": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS fun_mode boolean DEFAULT true;

-- Add is_public to boloes table (was collected in UI but never stored)
ALTER TABLE public.boloes
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Update the timestamp trigger to fire on these new columns too
-- (already handled by the existing updated_at trigger on the profiles table)
