-- Add power_play to bolao_palpites
ALTER TABLE public.bolao_palpites ADD COLUMN IF NOT EXISTS is_power_play BOOLEAN DEFAULT false;

-- Create table for extra bets (Champion, Top Scorer, etc.)
CREATE TABLE IF NOT EXISTS public.bolao_extra_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bolao_id UUID REFERENCES public.boloes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL, -- 'champion', 'top_scorer', 'brazil_stage'
  value TEXT NOT NULL, -- The bet itself (e.g. 'Brasil', 'Neymar', 'Quartas')
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(bolao_id, user_id, category)
);

-- Enable RLS for extra bets
ALTER TABLE public.bolao_extra_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own extra bets" ON public.bolao_extra_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Members can view others extra bets" ON public.bolao_extra_bets FOR SELECT USING (
  public.is_member_of_bolao(auth.uid(), bolao_id)
);
CREATE POLICY "Members can insert extra bets" ON public.bolao_extra_bets FOR INSERT WITH CHECK (
  auth.uid() = user_id AND public.is_member_of_bolao(auth.uid(), bolao_id)
);
CREATE POLICY "Users can update own extra bets" ON public.bolao_extra_bets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own extra bets" ON public.bolao_extra_bets FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger for extra bets
CREATE TRIGGER update_extra_bets_updated_at BEFORE UPDATE ON public.bolao_extra_bets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
