import { getGroupTeams, groups as allGroups } from "@/data/mockData";
import { type SimMatch, type Standing } from "@/contexts/SimulacaoContext";

export function generateGroupMatches(group: string): SimMatch[] {
    const teamCodes = getGroupTeams(group).map(t => t.code);
    const matches: SimMatch[] = [];
    for (let i = 0; i < teamCodes.length; i++) {
        for (let j = i + 1; j < teamCodes.length; j++) {
            matches.push({ home: teamCodes[i], away: teamCodes[j], homeScore: null, awayScore: null });
        }
    }
    return matches;
}

export function calcStandings(matches: SimMatch[], group: string): Standing[] {
    const teamCodes = getGroupTeams(group).map(t => t.code);
    const map: Record<string, Standing> = {};
    teamCodes.forEach(code => {
        map[code] = { teamCode: code, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
    });

    matches.forEach(m => {
        if (m.homeScore === null || m.awayScore === null) return;
        const h = map[m.home];
        const a = map[m.away];
        h.played++; a.played++;
        h.gf += m.homeScore; h.ga += m.awayScore;
        a.gf += m.awayScore; a.ga += m.homeScore;
        if (m.homeScore > m.awayScore) { h.won++; h.points += 3; a.lost++; }
        else if (m.homeScore < m.awayScore) { a.won++; a.points += 3; h.lost++; }
        else { h.drawn++; a.drawn++; h.points++; a.points++; }
    });

    return Object.values(map).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.gf - a.ga, gdB = b.gf - b.ga;
        if (gdB !== gdA) return gdB - gdA;
        return b.gf - a.gf;
    });
}

export function initMatches(selectedGroups?: string[]) {
    const init: Record<string, SimMatch[]> = {};
    (selectedGroups || allGroups).forEach(g => { init[g] = generateGroupMatches(g); });
    return init;
}
