// ===== TEAMS =====
export interface Team {
  code: string;
  name: string;
  flag: string;
  group: string;
  confederation: string;
}

export const teams: Team[] = [
  // Group A
  { code: "USA", name: "Estados Unidos", flag: "🇺🇸", group: "A", confederation: "CONCACAF" },
  { code: "MEX", name: "México", flag: "🇲🇽", group: "A", confederation: "CONCACAF" },
  { code: "COL", name: "Colômbia", flag: "🇨🇴", group: "A", confederation: "CONMEBOL" },
  { code: "MAR", name: "Marrocos", flag: "🇲🇦", group: "A", confederation: "CAF" },
  // Group B
  { code: "BRA", name: "Brasil", flag: "🇧🇷", group: "B", confederation: "CONMEBOL" },
  { code: "JPN", name: "Japão", flag: "🇯🇵", group: "B", confederation: "AFC" },
  { code: "NGA", name: "Nigéria", flag: "🇳🇬", group: "B", confederation: "CAF" },
  { code: "SUI", name: "Suíça", flag: "🇨🇭", group: "B", confederation: "UEFA" },
  // Group C
  { code: "ARG", name: "Argentina", flag: "🇦🇷", group: "C", confederation: "CONMEBOL" },
  { code: "GER", name: "Alemanha", flag: "🇩🇪", group: "C", confederation: "UEFA" },
  { code: "KOR", name: "Coreia do Sul", flag: "🇰🇷", group: "C", confederation: "AFC" },
  { code: "AUS", name: "Austrália", flag: "🇦🇺", group: "C", confederation: "AFC" },
  // Group D
  { code: "FRA", name: "França", flag: "🇫🇷", group: "D", confederation: "UEFA" },
  { code: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "D", confederation: "UEFA" },
  { code: "SEN", name: "Senegal", flag: "🇸🇳", group: "D", confederation: "CAF" },
  { code: "CAN", name: "Canadá", flag: "🇨🇦", group: "D", confederation: "CONCACAF" },
  // Group E
  { code: "ESP", name: "Espanha", flag: "🇪🇸", group: "E", confederation: "UEFA" },
  { code: "NED", name: "Holanda", flag: "🇳🇱", group: "E", confederation: "UEFA" },
  { code: "URU", name: "Uruguai", flag: "🇺🇾", group: "E", confederation: "CONMEBOL" },
  { code: "IRN", name: "Irã", flag: "🇮🇷", group: "E", confederation: "AFC" },
  // Group F
  { code: "POR", name: "Portugal", flag: "🇵🇹", group: "F", confederation: "UEFA" },
  { code: "CRO", name: "Croácia", flag: "🇭🇷", group: "F", confederation: "UEFA" },
  { code: "GHA", name: "Gana", flag: "🇬🇭", group: "F", confederation: "CAF" },
  { code: "PAN", name: "Panamá", flag: "🇵🇦", group: "F", confederation: "CONCACAF" },
  // Group G
  { code: "BEL", name: "Bélgica", flag: "🇧🇪", group: "G", confederation: "UEFA" },
  { code: "DEN", name: "Dinamarca", flag: "🇩🇰", group: "G", confederation: "UEFA" },
  { code: "CHI", name: "Chile", flag: "🇨🇱", group: "G", confederation: "CONMEBOL" },
  { code: "TUN", name: "Tunísia", flag: "🇹🇳", group: "G", confederation: "CAF" },
  // Group H
  { code: "ITA", name: "Itália", flag: "🇮🇹", group: "H", confederation: "UEFA" },
  { code: "WAL", name: "País de Gales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", group: "H", confederation: "UEFA" },
  { code: "ECU", name: "Equador", flag: "🇪🇨", group: "H", confederation: "CONMEBOL" },
  { code: "CMR", name: "Camarões", flag: "🇨🇲", group: "H", confederation: "CAF" },
  // Group I
  { code: "SRB", name: "Sérvia", flag: "🇷🇸", group: "I", confederation: "UEFA" },
  { code: "POL", name: "Polônia", flag: "🇵🇱", group: "I", confederation: "UEFA" },
  { code: "PAR", name: "Paraguai", flag: "🇵🇾", group: "I", confederation: "CONMEBOL" },
  { code: "NZL", name: "Nova Zelândia", flag: "🇳🇿", group: "I", confederation: "OFC" },
  // Group J
  { code: "AUT", name: "Áustria", flag: "🇦🇹", group: "J", confederation: "UEFA" },
  { code: "UKR", name: "Ucrânia", flag: "🇺🇦", group: "J", confederation: "UEFA" },
  { code: "PER", name: "Peru", flag: "🇵🇪", group: "J", confederation: "CONMEBOL" },
  { code: "ALG", name: "Argélia", flag: "🇩🇿", group: "J", confederation: "CAF" },
  // Group K
  { code: "CZE", name: "República Tcheca", flag: "🇨🇿", group: "K", confederation: "UEFA" },
  { code: "TUR", name: "Turquia", flag: "🇹🇷", group: "K", confederation: "UEFA" },
  { code: "VEN", name: "Venezuela", flag: "🇻🇪", group: "K", confederation: "CONMEBOL" },
  { code: "SAU", name: "Arábia Saudita", flag: "🇸🇦", group: "K", confederation: "AFC" },
  // Group L
  { code: "SCO", name: "Escócia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "L", confederation: "UEFA" },
  { code: "CRC", name: "Costa Rica", flag: "🇨🇷", group: "L", confederation: "CONCACAF" },
  { code: "EGY", name: "Egito", flag: "🇪🇬", group: "L", confederation: "CAF" },
  { code: "QAT", name: "Catar", flag: "🇶🇦", group: "L", confederation: "AFC" },
];

export const getTeam = (code: string) => teams.find(t => t.code === code)!;
export const getGroupTeams = (group: string) => teams.filter(t => t.group === group);
export const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

// ===== STADIUMS =====
export interface Stadium {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  lat: number;
  lng: number;
  timezone: string;
  climaHint: string;
}

export const stadiums: Stadium[] = [
  { id: "metlife", name: "MetLife Stadium", city: "Nova Jersey", country: "EUA", capacity: 82500, lat: 40.8135, lng: -74.0745, timezone: "America/New_York", climaHint: "Quente e úmido no verão" },
  { id: "rosebowl", name: "Rose Bowl", city: "Pasadena", country: "EUA", capacity: 90888, lat: 34.1613, lng: -118.1676, timezone: "America/Los_Angeles", climaHint: "Seco e ensolarado" },
  { id: "att", name: "AT&T Stadium", city: "Arlington", country: "EUA", capacity: 80000, lat: 32.7473, lng: -97.0945, timezone: "America/Chicago", climaHint: "Ar condicionado (coberto)" },
  { id: "azteca", name: "Estádio Azteca", city: "Cidade do México", country: "México", capacity: 87523, lat: 19.3029, lng: -99.1506, timezone: "America/Mexico_City", climaHint: "Altitude elevada, ameno" },
  { id: "bmo", name: "BMO Field", city: "Toronto", country: "Canadá", capacity: 45736, lat: 43.6335, lng: -79.4186, timezone: "America/Toronto", climaHint: "Agradável no verão" },
  { id: "lumen", name: "Lumen Field", city: "Seattle", country: "EUA", capacity: 69000, lat: 47.5952, lng: -122.3316, timezone: "America/Los_Angeles", climaHint: "Temperado, possível chuva leve" },
  { id: "lincoln", name: "Lincoln Financial Field", city: "Filadélfia", country: "EUA", capacity: 69328, lat: 39.9008, lng: -75.1675, timezone: "America/New_York", climaHint: "Quente no verão" },
  { id: "hard-rock", name: "Hard Rock Stadium", city: "Miami", country: "EUA", capacity: 65326, lat: 25.958, lng: -80.2389, timezone: "America/New_York", climaHint: "Tropical, quente e úmido" },
  { id: "guadalajara", name: "Estádio Akron", city: "Guadalajara", country: "México", capacity: 49850, lat: 20.6822, lng: -103.4623, timezone: "America/Mexico_City", climaHint: "Quente, temporada de chuvas" },
  { id: "monterrey", name: "Estádio BBVA", city: "Monterrey", country: "México", capacity: 53500, lat: 25.6694, lng: -100.2444, timezone: "America/Monterrey", climaHint: "Muito quente" },
  { id: "bc-place", name: "BC Place", city: "Vancouver", country: "Canadá", capacity: 54500, lat: 49.2768, lng: -123.112, timezone: "America/Vancouver", climaHint: "Agradável (coberto)" },
];

// ===== MATCHES =====
export type MatchStatus = "scheduled" | "live" | "finished";
export type MatchPhase = "groups" | "round-of-32" | "round-of-16" | "quarter" | "semi" | "third" | "final";

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  date: string; // ISO string
  stadium: string;
  status: MatchStatus;
  minute?: number;
  phase: MatchPhase;
  group?: string;
}

const today = new Date();
const todayStr = today.toISOString().split("T")[0];
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split("T")[0];
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split("T")[0];

export const matches: Match[] = [
  // Yesterday - finished
  { id: "m1", homeTeam: "USA", awayTeam: "MAR", homeScore: 2, awayScore: 1, date: `${yesterdayStr}T18:00:00`, stadium: "metlife", status: "finished", phase: "groups", group: "A" },
  { id: "m2", homeTeam: "BRA", awayTeam: "SUI", homeScore: 3, awayScore: 0, date: `${yesterdayStr}T21:00:00`, stadium: "rosebowl", status: "finished", phase: "groups", group: "B" },
  // Today
  { id: "m3", homeTeam: "ARG", awayTeam: "KOR", homeScore: 1, awayScore: 0, date: `${todayStr}T14:00:00`, stadium: "att", status: "live", minute: 67, phase: "groups", group: "C" },
  { id: "m4", homeTeam: "FRA", awayTeam: "CAN", date: `${todayStr}T17:00:00`, stadium: "azteca", status: "scheduled", phase: "groups", group: "D" },
  { id: "m5", homeTeam: "ESP", awayTeam: "IRN", date: `${todayStr}T20:00:00`, stadium: "bmo", status: "scheduled", phase: "groups", group: "E" },
  { id: "m6", homeTeam: "COL", awayTeam: "MEX", date: `${todayStr}T22:00:00`, stadium: "hard-rock", status: "scheduled", phase: "groups", group: "A" },
  // Tomorrow
  { id: "m7", homeTeam: "GER", awayTeam: "AUS", date: `${tomorrowStr}T14:00:00`, stadium: "lumen", status: "scheduled", phase: "groups", group: "C" },
  { id: "m8", homeTeam: "ENG", awayTeam: "SEN", date: `${tomorrowStr}T17:00:00`, stadium: "lincoln", status: "scheduled", phase: "groups", group: "D" },
  { id: "m9", homeTeam: "POR", awayTeam: "PAN", date: `${tomorrowStr}T20:00:00`, stadium: "guadalajara", status: "scheduled", phase: "groups", group: "F" },
  { id: "m10", homeTeam: "JPN", awayTeam: "NGA", date: `${tomorrowStr}T22:00:00`, stadium: "monterrey", status: "scheduled", phase: "groups", group: "B" },
  // More matches for group standings
  { id: "m11", homeTeam: "NED", awayTeam: "URU", date: `${tomorrowStr}T15:00:00`, stadium: "bc-place", status: "scheduled", phase: "groups", group: "E" },
  { id: "m12", homeTeam: "CRO", awayTeam: "GHA", date: `${tomorrowStr}T18:00:00`, stadium: "metlife", status: "scheduled", phase: "groups", group: "F" },
];

export const getTodayMatches = () => matches.filter(m => m.date.startsWith(todayStr));
export const getTomorrowMatches = () => matches.filter(m => m.date.startsWith(tomorrowStr));
export const getMatchesByDate = (dateStr: string) => matches.filter(m => m.date.startsWith(dateStr));

// ===== GROUP STANDINGS =====
export interface GroupStanding {
  teamCode: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  probability: number; // % chance of advancing
}

export const groupStandings: Record<string, GroupStanding[]> = {
  A: [
    { teamCode: "USA", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, points: 3, probability: 78 },
    { teamCode: "COL", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 62 },
    { teamCode: "MEX", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 45 },
    { teamCode: "MAR", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2, points: 0, probability: 30 },
  ],
  B: [
    { teamCode: "BRA", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 0, points: 3, probability: 88 },
    { teamCode: "JPN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 52 },
    { teamCode: "NGA", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 38 },
    { teamCode: "SUI", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 3, points: 0, probability: 22 },
  ],
  C: [
    { teamCode: "ARG", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 82 },
    { teamCode: "GER", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 70 },
    { teamCode: "KOR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 30 },
    { teamCode: "AUS", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 18 },
  ],
  D: [
    { teamCode: "FRA", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 80 },
    { teamCode: "ENG", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 75 },
    { teamCode: "SEN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 28 },
    { teamCode: "CAN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 17 },
  ],
  E: [
    { teamCode: "ESP", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 76 },
    { teamCode: "NED", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 72 },
    { teamCode: "URU", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 40 },
    { teamCode: "IRN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 12 },
  ],
  F: [
    { teamCode: "POR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 74 },
    { teamCode: "CRO", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 60 },
    { teamCode: "GHA", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 32 },
    { teamCode: "PAN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 10 },
  ],
  G: [
    { teamCode: "BEL", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 68 },
    { teamCode: "DEN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 55 },
    { teamCode: "CHI", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 42 },
    { teamCode: "TUN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 20 },
  ],
  H: [
    { teamCode: "ITA", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 72 },
    { teamCode: "ECU", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 45 },
    { teamCode: "WAL", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 40 },
    { teamCode: "CMR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 25 },
  ],
  I: [
    { teamCode: "SRB", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 50 },
    { teamCode: "POL", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 48 },
    { teamCode: "PAR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 35 },
    { teamCode: "NZL", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 10 },
  ],
  J: [
    { teamCode: "AUT", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 50 },
    { teamCode: "UKR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 48 },
    { teamCode: "PER", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 30 },
    { teamCode: "ALG", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 22 },
  ],
  K: [
    { teamCode: "TUR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 52 },
    { teamCode: "CZE", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 45 },
    { teamCode: "VEN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 35 },
    { teamCode: "SAU", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 18 },
  ],
  L: [
    { teamCode: "EGY", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 45 },
    { teamCode: "SCO", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 40 },
    { teamCode: "CRC", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 30 },
    { teamCode: "QAT", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 15 },
  ],
};

// ===== BOLÕES =====
export interface BolaoParticipant {
  name: string;
  avatar: string;
  points: number;
  delta: number; // position change
  rank: number;
}

export interface Bolao {
  id: string;
  name: string;
  icon: string;
  type: "official" | "private";
  createdByMe: boolean;
  status: "active" | "finished";
  participants: BolaoParticipant[];
  totalContribution: number;
  modules: string[];
  myRank: number;
  myPoints: number;
  myDelta: number;
  progress: number; // % of matches completed
  distribution: { label: string; pct: number }[];
}

export const boloes: Bolao[] = [
  {
    id: "b1",
    name: "Família Copa 2026",
    icon: "⚽",
    type: "private",
    createdByMe: true,
    status: "active",
    totalContribution: 500,
    modules: ["Placar Exato", "Campeão"],
    myRank: 2,
    myPoints: 45,
    myDelta: 1,
    progress: 8,
    distribution: [
      { label: "1º", pct: 50 },
      { label: "2º", pct: 30 },
      { label: "3º", pct: 20 },
    ],
    participants: [
      { name: "Carlos", avatar: "👨", points: 52, delta: 0, rank: 1 },
      { name: "Você", avatar: "🧑", points: 45, delta: 1, rank: 2 },
      { name: "Ana", avatar: "👩", points: 42, delta: -1, rank: 3 },
      { name: "Pedro", avatar: "👦", points: 38, delta: 2, rank: 4 },
      { name: "Julia", avatar: "👧", points: 35, delta: -2, rank: 5 },
      { name: "Rafael", avatar: "🧔", points: 30, delta: 0, rank: 6 },
      { name: "Marina", avatar: "👩‍🦰", points: 28, delta: 1, rank: 7 },
      { name: "Lucas", avatar: "👱", points: 25, delta: -1, rank: 8 },
    ],
  },
  {
    id: "b2",
    name: "Bolão do Escritório",
    icon: "🏢",
    type: "private",
    createdByMe: false,
    status: "active",
    totalContribution: 1200,
    modules: ["Resultado", "Placar Exato", "Classificação Grupo"],
    myRank: 5,
    myPoints: 32,
    myDelta: -2,
    progress: 8,
    distribution: [
      { label: "1º", pct: 40 },
      { label: "2º", pct: 25 },
      { label: "3º", pct: 20 },
      { label: "4º", pct: 10 },
      { label: "5º", pct: 5 },
    ],
    participants: [
      { name: "Roberto", avatar: "🧔", points: 58, delta: 2, rank: 1 },
      { name: "Fernanda", avatar: "👩‍💼", points: 55, delta: 0, rank: 2 },
      { name: "Marcos", avatar: "👨‍💼", points: 48, delta: 1, rank: 3 },
      { name: "Patrícia", avatar: "👩", points: 40, delta: -1, rank: 4 },
      { name: "Você", avatar: "🧑", points: 32, delta: -2, rank: 5 },
    ],
  },
  {
    id: "b3",
    name: "Copa dos Amigos",
    icon: "🍻",
    type: "private",
    createdByMe: false,
    status: "active",
    totalContribution: 0,
    modules: ["Resultado"],
    myRank: 1,
    myPoints: 60,
    myDelta: 0,
    progress: 8,
    distribution: [],
    participants: [
      { name: "Você", avatar: "🧑", points: 60, delta: 0, rank: 1 },
      { name: "Thiago", avatar: "👨", points: 55, delta: 0, rank: 2 },
      { name: "Beatriz", avatar: "👩", points: 50, delta: 0, rank: 3 },
    ],
  },
  {
    id: "b4",
    name: "Bolão Universitário",
    icon: "🎓",
    type: "official",
    createdByMe: false,
    status: "finished",
    totalContribution: 300,
    modules: ["Placar Exato"],
    myRank: 8,
    myPoints: 120,
    myDelta: 0,
    progress: 100,
    distribution: [
      { label: "1º", pct: 50 },
      { label: "2º", pct: 30 },
      { label: "3º", pct: 20 },
    ],
    participants: [
      { name: "Felipe", avatar: "👨‍🎓", points: 180, delta: 0, rank: 1 },
      { name: "Camila", avatar: "👩‍🎓", points: 165, delta: 0, rank: 2 },
      { name: "Diego", avatar: "🧑‍🎓", points: 155, delta: 0, rank: 3 },
    ],
  },
];

// ===== USER PROFILE =====
export interface UserProfile {
  name: string;
  avatar: string;
  favoriteTeam: string;
  memberSince: string;
  funMode: "off" | "leve" | "medio" | "caotico";
  notifications: {
    goals: boolean;
    news: boolean;
    matchStart: boolean;
  };
}

export const userProfile: UserProfile = {
  name: "Jogador",
  avatar: "🧑",
  favoriteTeam: "BRA",
  memberSince: "2025",
  funMode: "leve",
  notifications: {
    goals: true,
    news: true,
    matchStart: true,
  },
};

// ===== BRACKET =====
export interface BracketMatch {
  id: string;
  round: string;
  homeTeam: string | null;
  awayTeam: string | null;
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
}

export const bracketMatches: BracketMatch[] = [
  // Round of 32 (sample)
  { id: "r32-1", round: "Oitavas", homeTeam: "BRA", awayTeam: null, status: "scheduled" },
  { id: "r32-2", round: "Oitavas", homeTeam: "ARG", awayTeam: null, status: "scheduled" },
  { id: "r32-3", round: "Oitavas", homeTeam: "FRA", awayTeam: null, status: "scheduled" },
  { id: "r32-4", round: "Oitavas", homeTeam: "ESP", awayTeam: null, status: "scheduled" },
  // Quarters
  { id: "q1", round: "Quartas", homeTeam: null, awayTeam: null, status: "scheduled" },
  { id: "q2", round: "Quartas", homeTeam: null, awayTeam: null, status: "scheduled" },
  // Semi
  { id: "s1", round: "Semi", homeTeam: null, awayTeam: null, status: "scheduled" },
  // Final
  { id: "f1", round: "Final", homeTeam: null, awayTeam: null, status: "scheduled" },
];

// Helper
export const formatMatchTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

export const formatMatchDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
};

export const getStadium = (id: string) => stadiums.find(s => s.id === id);

export const phaseLabels: Record<MatchPhase, string> = {
  "groups": "Fase de Grupos",
  "round-of-32": "32 avos",
  "round-of-16": "Oitavas",
  "quarter": "Quartas",
  "semi": "Semifinal",
  "third": "3º Lugar",
  "final": "Final",
};
