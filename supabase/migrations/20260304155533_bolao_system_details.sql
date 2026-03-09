-- 1. Create bolao_champion_predictions
CREATE TABLE IF NOT EXISTS public.bolao_champion_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bolao_id UUID NOT NULL REFERENCES public.boloes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(bolao_id, user_id)
);

-- RLS for bolao_champion_predictions
ALTER TABLE public.bolao_champion_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view champion predictions in their bolao" 
ON public.bolao_champion_predictions FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.bolao_members 
    WHERE bolao_id = bolao_champion_predictions.bolao_id 
    AND user_id = auth.uid()
));

CREATE POLICY "Users can insert their own predictions"
ON public.bolao_champion_predictions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own predictions"
ON public.bolao_champion_predictions FOR UPDATE
USING (user_id = auth.uid());


-- 2. Create push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subs"
ON public.push_subscriptions FOR ALL
USING (user_id = auth.uid());


-- 3. Create scheduled_notifs
CREATE TABLE IF NOT EXISTS public.scheduled_notifs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.scheduled_notifs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scheduled notifs"
ON public.scheduled_notifs FOR SELECT
USING (target_user_id = auth.uid());


-- 4. Alter bolao_palpites if it doesn't have is_exact, add it
ALTER TABLE public.bolao_palpites ADD COLUMN IF NOT EXISTS is_exact BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bolao_palpites ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- 5. Create materialized view bolao_rankings
DROP MATERIALIZED VIEW IF EXISTS public.bolao_rankings;
CREATE MATERIALIZED VIEW public.bolao_rankings AS
SELECT 
    m.bolao_id,
    m.user_id,
    COALESCE(SUM(p.points), 0) AS total_points,
    COALESCE(SUM(CASE WHEN p.is_exact THEN 1 ELSE 0 END), 0) AS exact_matches,
    COALESCE(SUM(CASE WHEN p.points > 0 AND NOT p.is_exact THEN 1 ELSE 0 END), 0) AS correct_results
FROM public.bolao_members m
LEFT JOIN public.bolao_palpites p ON m.bolao_id = p.bolao_id AND m.user_id = p.user_id
GROUP BY m.bolao_id, m.user_id;

CREATE UNIQUE INDEX bolao_rankings_unique_idx ON public.bolao_rankings (bolao_id, user_id);

-- Helper function to refresh rankings
CREATE OR REPLACE FUNCTION public.refresh_bolao_rankings()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.bolao_rankings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Trigger to calculate points when match is finished
CREATE OR REPLACE FUNCTION public.calculate_bolao_points()
RETURNS TRIGGER AS $$
DECLARE
  palpite RECORD;
  v_bolao RECORD;
  v_points INT;
  v_is_exact BOOLEAN;
  v_home_diff INT;
  v_away_diff INT;
  v_match_result TEXT; -- 'home', 'away', 'draw'
  v_palpite_result TEXT;
BEGIN
  -- Only act if status changed to 'finished' or scores were updated on a finished game
  IF NEW.status = 'finished' AND (OLD.status != 'finished' OR OLD.home_score != NEW.home_score OR OLD.away_score != NEW.away_score) THEN
    
    IF NEW.home_score > NEW.away_score THEN v_match_result := 'home';
    ELSIF NEW.home_score < NEW.away_score THEN v_match_result := 'away';
    ELSE v_match_result := 'draw';
    END IF;

    FOR palpite IN 
      SELECT bp.id, bp.bolao_id, bp.home_score, bp.away_score 
      FROM public.bolao_palpites bp 
      WHERE bp.match_id = NEW.id
    LOOP
      v_points := 0;
      v_is_exact := FALSE;
      
      -- Get bolao scoring rules. Assuming `scoring_rules` is jsonb in `boloes`
      SELECT * INTO v_bolao FROM public.boloes WHERE id = palpite.bolao_id;
      
      IF palpite.home_score = NEW.home_score AND palpite.away_score = NEW.away_score THEN
         -- Exact score
         v_points := COALESCE((v_bolao.scoring_rules->>'exact')::INT, 0);
         v_is_exact := TRUE;
      ELSE
         -- Just result?
         IF palpite.home_score > palpite.away_score THEN v_palpite_result := 'home';
         ELSIF palpite.home_score < palpite.away_score THEN v_palpite_result := 'away';
         ELSE v_palpite_result := 'draw';
         END IF;

         IF v_palpite_result = v_match_result THEN
           v_points := COALESCE((v_bolao.scoring_rules->>'winner')::INT, 0); -- using 'winner' or 'draw' as per existing setup
         END IF;
      END IF;

      -- Add participation points
      v_points := v_points + COALESCE((v_bolao.scoring_rules->>'participation')::INT, 0);

      -- Update the palpite
      UPDATE public.bolao_palpites 
      SET points = v_points, is_exact = v_is_exact
      WHERE id = palpite.id;
    END LOOP;

    -- Refresh rankings after all palpites for this match are updated
    PERFORM public.refresh_bolao_rankings();

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_calculate_bolao_points ON public.matches;
CREATE TRIGGER trigger_calculate_bolao_points
AFTER UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.calculate_bolao_points();
