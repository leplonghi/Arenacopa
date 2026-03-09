-- Add accepted_terms_at to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;
