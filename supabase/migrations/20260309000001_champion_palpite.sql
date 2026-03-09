-- Add champion_team column to bolao_palpites
-- Used for match_id = 'champion_pick' entries that store who the user thinks will win the cup
ALTER TABLE public.bolao_palpites
  ADD COLUMN IF NOT EXISTS champion_team text DEFAULT NULL;

-- Add champion_winner to boloes so admins can set the actual champion after the tournament
-- When set, all champion_pick palpites are auto-scored (20 pts)
ALTER TABLE public.boloes
  ADD COLUMN IF NOT EXISTS champion_winner text DEFAULT NULL;
