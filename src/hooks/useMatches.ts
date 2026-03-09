
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Match, type MatchPhase } from "@/data/mockData";

export function useMatches() {
    return useQuery({
        queryKey: ["matches"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("matches")
                .select("*")
                .order("match_date", { ascending: true });

            if (error) throw error;

            // Map Supabase stages back to MatchPhase for frontend compatibility
            const phaseMap: Record<string, MatchPhase> = {
                'group': 'groups',
                'round_of_32': 'round-of-32',
                'round_of_16': 'round-of-16',
                'qf': 'quarter',
                'sf': 'semi',
                'third_place': 'third',
                'final': 'final'
            };

            return data.map(m => ({
                id: m.id,
                homeTeam: m.home_team_code,
                awayTeam: m.away_team_code,
                homeScore: m.home_score ?? undefined,
                awayScore: m.away_score ?? undefined,
                date: m.match_date,
                stadium: m.venue_id,
                status: m.status as any,
                phase: (phaseMap[m.stage] || m.stage) as MatchPhase,
                group: m.group_id ?? undefined
            })) as Match[];
        },
    });
}
