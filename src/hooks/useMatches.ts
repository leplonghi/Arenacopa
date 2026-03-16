import { useEffect, useState } from "react";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { type Match, type MatchPhase, type MatchStatus } from "@/data/mockData";

type MatchRow = {
    id: string;
    home_team_code: string;
    away_team_code: string;
    home_score: number | null;
    away_score: number | null;
    match_date: string;
    venue_id: string;
    status: MatchStatus;
    stage: string;
    group_id: string | null;
};

export function useMatches() {
    const [data, setData] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const matchesRef = collection(db, "matches");
        const matchesQuery = query(matchesRef, orderBy("match_date", "asc"));

        const unsubscribe = onSnapshot(
            matchesQuery,
            (querySnapshot) => {
                const rows = querySnapshot.docs.map((docSnapshot) => ({
                    id: docSnapshot.id,
                    ...docSnapshot.data(),
                })) as MatchRow[];

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

                const matches = rows.map((m) => ({
                    id: m.id,
                    homeTeam: m.home_team_code,
                    awayTeam: m.away_team_code,
                    homeScore: m.home_score ?? undefined,
                    awayScore: m.away_score ?? undefined,
                    date: m.match_date,
                    stadium: m.venue_id,
                    status: m.status,
                    phase: (phaseMap[m.stage] || m.stage) as MatchPhase,
                    group: m.group_id ?? undefined,
                })) as Match[];

                setData(matches);
                setIsLoading(false);
            },
            (error) => {
                console.error("Error listening to matches in Firestore:", error);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { data, isLoading };
}
