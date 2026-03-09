
import { matches } from './src/data/mockData.ts';

const phaseMap: Record<string, string> = {
    'groups': 'group',
    'round-of-32': 'round_of_32',
    'round-of-16': 'round_of_16', // Adding this as it's in mockData but missing from user list
    'quarter': 'qf',
    'semi': 'sf',
    'third': 'third_place',
    'final': 'final'
};

const sql = matches.map(m => {
    const stage = phaseMap[m.phase] || m.phase;
    const match_date = m.date;
    const home_score = m.homeScore !== undefined ? m.homeScore : 'NULL';
    const away_score = m.awayScore !== undefined ? m.awayScore : 'NULL';
    const group_id = m.group || 'NULL';

    return `(
    '${m.id}',
    '${stage}',
    ${group_id === 'NULL' ? 'NULL' : `'${group_id}'`},
    '${match_date}',
    '${m.homeTeam}',
    '${m.awayTeam}',
    ${home_score},
    ${away_score},
    '${m.stadium}',
    '${m.status}'
  )`;
}).join(',\n');

console.log(`INSERT INTO public.matches (id, stage, group_id, match_date, home_team_code, away_team_code, home_score, away_score, venue_id, status) VALUES\n${sql};`);
