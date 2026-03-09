-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to check if there are live matches or if it's the top of the hour, then invoke Edge Function
CREATE OR REPLACE FUNCTION public.invoke_sync_matches()
RETURNS void AS $$
DECLARE
  v_live_count int;
  v_minute int;
  v_url text;
  v_anon_key text;
BEGIN
  -- Count live matches
  SELECT count(*) INTO v_live_count FROM public.matches WHERE status = 'live';
  
  -- Current minute
  v_minute := extract(minute from now());
  
  -- Run if we have live games (every 3 min), OR if it's minute 0 (hourly check outside games)
  IF v_live_count > 0 OR v_minute = 0 THEN
    
    -- Try reading edge function URL and anon key from Supabase internal settings
    BEGIN
      v_url := current_setting('app.settings.edge_function_base_url', true);
      v_anon_key := current_setting('app.settings.anon_key', true);
      
      -- Fallback handling for self-hosting or local Supabase instances
      IF v_url IS NULL OR v_url = '' THEN
        v_url := 'http://kong:8000/functions/v1';
      END IF;
      
      -- Invoke the edge function via HTTP POST using pg_net
      PERFORM net.http_post(
        url := v_url || '/sync-matches',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(v_anon_key, '')
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Graceful handle if current_setting throws
    END;
    
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear previous cron job if it existed
SELECT cron.unschedule('sync-matches-cron');

-- Schedule job to run every 3 minutes
SELECT cron.schedule(
  'sync-matches-cron',
  '*/3 * * * *',
  $$ SELECT public.invoke_sync_matches(); $$
);
