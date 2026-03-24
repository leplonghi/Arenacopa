import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map of common API-Football country names to 3-letter codes used in ArenaCUP
const countryMap: Record<string, string> = {
    "Brazil": "BRA", "Argentina": "ARG", "France": "FRA", "Germany": "GER",
    "Spain": "ESP", "England": "ENG", "Portugal": "POR", "Italy": "ITA",
    "Netherlands": "NED", "Belgium": "BEL", "United States": "USA", "Mexico": "MEX",
    "Uruguay": "URU", "Colombia": "COL", "Senegal": "SEN", "Morocco": "MAR",
    "Japan": "JPN", "South Korea": "KOR", "Croatia": "CRO", "Switzerland": "SUI"
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || '';
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
        if (vapidPublicKey && vapidPrivateKey) {
            webpush.setVapidDetails('mailto:suporte@arenacup.com', vapidPublicKey, vapidPrivateKey);
        }

        // Get the API key from Supabase Vault (Secrets mechanism)
        const apiFootballKey = Deno.env.get('API_FOOTBALL_KEY');
        if (!apiFootballKey) {
            throw new Error("API_FOOTBALL_KEY secret is missing");
        }

        const today = new Date().toISOString().split('T')[0];

        // Fetch today's fixtures
        // League 1 is usually World Cup in API-Football
        const response = await fetch(`https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=${today}`, {
            headers: {
                "x-apisports-key": apiFootballKey
            }
        });

        if (!response.ok) {
            throw new Error(`API-Football error: ${response.statusText}`);
        }

        const data = await response.json();
        const fixtures = data.response || [];

        let updatedCount = 0;

        for (const item of fixtures) {
            const homeName = item.teams.home.name;
            const awayName = item.teams.away.name;
            const homeCode = countryMap[homeName] || homeName.substring(0, 3).toUpperCase();
            const awayCode = countryMap[awayName] || awayName.substring(0, 3).toUpperCase();

            const homeScore = item.goals.home;
            const awayScore = item.goals.away;

            let status = 'scheduled';
            const statusCode = item.fixture.status.short;

            // Map API-Football statuses to our status enum (live/finished/scheduled)
            if (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(statusCode)) {
                status = 'live';
            } else if (['FT', 'AET', 'PEN'].includes(statusCode)) {
                status = 'finished';
            }

            // Find the matching game in our DB scheduled for today
            const { data: existingMatches } = await supabase
                .from('matches')
                .select('id, home_score, away_score')
                .eq('home_team_code', homeCode)
                .eq('away_team_code', awayCode)
                .gte('match_date', `${today}T00:00:00Z`)
                .lte('match_date', `${today}T23:59:59Z`);

            if (existingMatches && existingMatches.length > 0) {
                const match = existingMatches[0];
                const matchId = match.id;

                const oldHomeScore = match.home_score || 0;
                const oldAwayScore = match.away_score || 0;

                const newHomeScore = homeScore !== null ? homeScore : 0;
                const newAwayScore = awayScore !== null ? awayScore : 0;

                // Upsert/Update the score and status
                await supabase
                    .from('matches')
                    .update({
                        home_score: newHomeScore,
                        away_score: newAwayScore,
                        status: status
                    })
                    .eq('id', matchId);

                if ((newHomeScore > oldHomeScore || newAwayScore > oldAwayScore) && vapidPublicKey && vapidPrivateKey) {
                    const { data: subs } = await supabase.from('push_subscriptions').select('*');
                    if (subs && subs.length > 0) {
                        const payload = JSON.stringify({
                            title: 'Gooool!',
                            body: `${homeCode} ${newHomeScore} x ${newAwayScore} ${awayCode} - ${item.fixture.status.elapsed}'`,
                            url: '/'
                        });

                        const notifications = subs.map(sub => {
                            const pushSubscription = {
                                endpoint: sub.endpoint,
                                keys: {
                                    auth: sub.auth,
                                    p256dh: sub.p256dh
                                }
                            };
                            return webpush.sendNotification(pushSubscription, payload).catch(e => {
                                if (e.statusCode === 410 || e.statusCode === 404) {
                                    supabase.from('push_subscriptions').delete().eq('id', sub.id).then();
                                }
                            });
                        });
                        await Promise.allSettled(notifications);
                    }
                }

                updatedCount++;
            }
        }

        return new Response(JSON.stringify({ success: true, updated: updatedCount }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
