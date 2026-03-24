import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { type Match, type MatchPhase, matches as mockMatches } from "@/data/mockData";

type MatchRow = {
    id: string;
    home_team_code: string;
    away_team_code: string;
    home_score: number | null;
    away_score: number | null;
    match_date: string;
    venue_id: string;
    status: string;
    stage: string;
    group_id: string | null;
};

const phaseMap: Record<string, MatchPhase> = {
    group: "groups",
    GROUP_STAGE: "groups",
    round_of_32: "round-of-32",
    round_of_16: "round-of-16",
    qf: "quarter",
    sf: "semi",
    third_place: "third",
    final: "final",
};

async function fetchMatches(): Promise<Match[]> {
    const matchesRef = collection(db, "matches");
    const matchesQuery = query(matchesRef, orderBy("match_date", "asc"));
    const querySnapshot = await getDocs(matchesQuery);

    const rows = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
    })) as MatchRow[];

    const matches = rows.map((m) => ({
        id: m.id,
        homeTeam: m.home_team_code,
        awayTeam: m.away_team_code,
        homeScore: m.home_score ?? undefined,
        awayScore: m.away_score ?? undefined,
        date: m.match_date,
        stadium: m.venue_id,
        status: m.status as Match["status"],
        phase: (phaseMap[m.stage] || m.stage) as MatchPhase,
        group: m.group_id ?? undefined,
    })) as Match[];

    return matches.length > 0 ? matches : mockMatches;
}

export function useMatches() {
    const { data, isLoading } = useQuery({
        queryKey: ["matches"],
        queryFn: fetchMatches,
        staleTime: 10 * 60 * 1000, // matches are static for 10 min
    });

    return { data: data ?? null, isLoading };
}
