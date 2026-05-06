import { type Match } from "@/data/mockData";
import { type Palpite, type ScoringRules } from "@/types/bolao";

export type PointResultType = 'exact' | 'winner' | 'draw' | 'miss';
export type PointResult = {
    points: number;
    type: PointResultType;
    isPowerPlay: boolean;
};

export function calculatePoints(palpite: Palpite, match: Match | undefined, rules?: ScoringRules): PointResult {
    if (!match || match.status !== "finished" || match.homeScore == null || match.awayScore == null) {
        return { points: 0, type: 'miss', isPowerPlay: false };
    }
    const ph = palpite.home_score;
    const pa = palpite.away_score;

    if (ph === null || pa === null) return { points: 0, type: 'miss', isPowerPlay: false };
    const mh = match.homeScore as number;
    const ma = match.awayScore as number;

    let points = 0;
    let type: PointResultType = 'miss';

    // Default rules if not provided
    const exactPts = rules?.exact ?? 5;
    const winnerPts = rules?.winner ?? 3;
    const drawPts = rules?.draw ?? 2;
    const participationPts = rules?.participation ?? 0;

    // Start with participation points
    points = participationPts;

    // Exact score
    if (ph === mh && pa === ma) {
        points = exactPts;
        type = 'exact';
    } else {
        const palpiteDiff = ph - pa;
        const matchDiff = mh - ma;

        const palpiteResult = palpiteDiff > 0 ? "home" : palpiteDiff < 0 ? "away" : "draw";
        const matchResult = matchDiff > 0 ? "home" : matchDiff < 0 ? "away" : "draw";

        if (palpiteResult === matchResult) {
            if (matchResult === "draw") {
                // Correct Draw (but wrong score)
                points = drawPts;
                type = 'draw';
            } else {
                // Correct Winner (but wrong score)
                points = winnerPts;
                type = 'winner';
            }
        } else {
            type = 'miss';
        }
    }

    if (palpite.is_power_play && points > 0) {
        points *= 2;
    }

    return { points, type, isPowerPlay: !!palpite.is_power_play };
}
