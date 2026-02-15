-- Add preferred_language column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT NULL CHECK (preferred_language IN ('pt-BR', 'en', 'es'));

-- Comment on column
COMMENT ON COLUMN profiles.preferred_language IS 'User preferred language code (pt-BR, en, es)';
