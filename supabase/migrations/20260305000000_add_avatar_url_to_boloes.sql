-- Add avatar_url to boloes to store the emoji icon
ALTER TABLE public.boloes ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '🏆';
