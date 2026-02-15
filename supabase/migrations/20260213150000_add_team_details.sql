
ALTER TABLE public.teams
ADD COLUMN demographics JSONB DEFAULT '{}',
ADD COLUMN fifa_titles INTEGER DEFAULT 0,
ADD COLUMN fifa_ranking INTEGER DEFAULT 0,
ADD COLUMN qualifiers_stats JSONB DEFAULT '{}';
