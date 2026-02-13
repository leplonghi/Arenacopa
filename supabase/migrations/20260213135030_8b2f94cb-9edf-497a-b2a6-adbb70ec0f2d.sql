
-- Add name and selected_groups columns to simulations
ALTER TABLE public.simulations 
  ADD COLUMN name text NOT NULL DEFAULT 'Minha Simulação',
  ADD COLUMN selected_groups text[] NOT NULL DEFAULT ARRAY['A','B','C','D','E','F','G','H','I','J','K','L'];

-- Drop unique constraint on user_id to allow multiple simulations per user
ALTER TABLE public.simulations DROP CONSTRAINT simulations_user_id_key;

-- Add index for faster lookups
CREATE INDEX idx_simulations_user_id ON public.simulations(user_id);
