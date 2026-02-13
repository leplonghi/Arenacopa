// ===== TEAMS (Official FIFA World Cup 2026 Draw) =====
export interface Team {
  code: string;
  name: string;
  flag: string;
  group: string;
  confederation: string;
}

export const teams: Team[] = [
  // Group A
  { code: "MEX", name: "México", flag: "🇲🇽", group: "A", confederation: "CONCACAF" },
  { code: "RSA", name: "África do Sul", flag: "🇿🇦", group: "A", confederation: "CAF" },
  { code: "KOR", name: "Coreia do Sul", flag: "🇰🇷", group: "A", confederation: "AFC" },
  { code: "EPD", name: "Playoff Euro D", flag: "🏳️", group: "A", confederation: "UEFA" },
  // Group B
  { code: "CAN", name: "Canadá", flag: "🇨🇦", group: "B", confederation: "CONCACAF" },
  { code: "EPA", name: "Playoff Euro A", flag: "🏳️", group: "B", confederation: "UEFA" },
  { code: "QAT", name: "Catar", flag: "🇶🇦", group: "B", confederation: "AFC" },
  { code: "SUI", name: "Suíça", flag: "🇨🇭", group: "B", confederation: "UEFA" },
  // Group C
  { code: "BRA", name: "Brasil", flag: "🇧🇷", group: "C", confederation: "CONMEBOL" },
  { code: "MAR", name: "Marrocos", flag: "🇲🇦", group: "C", confederation: "CAF" },
  { code: "HAI", name: "Haiti", flag: "🇭🇹", group: "C", confederation: "CONCACAF" },
  { code: "SCO", name: "Escócia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C", confederation: "UEFA" },
  // Group D
  { code: "USA", name: "Estados Unidos", flag: "🇺🇸", group: "D", confederation: "CONCACAF" },
  { code: "PAR", name: "Paraguai", flag: "🇵🇾", group: "D", confederation: "CONMEBOL" },
  { code: "AUS", name: "Austrália", flag: "🇦🇺", group: "D", confederation: "AFC" },
  { code: "EPC", name: "Playoff Euro C", flag: "🏳️", group: "D", confederation: "UEFA" },
  // Group E
  { code: "GER", name: "Alemanha", flag: "🇩🇪", group: "E", confederation: "UEFA" },
  { code: "CUR", name: "Curaçao", flag: "🇨🇼", group: "E", confederation: "CONCACAF" },
  { code: "CIV", name: "Costa do Marfim", flag: "🇨🇮", group: "E", confederation: "CAF" },
  { code: "ECU", name: "Equador", flag: "🇪🇨", group: "E", confederation: "CONMEBOL" },
  // Group F
  { code: "NED", name: "Holanda", flag: "🇳🇱", group: "F", confederation: "UEFA" },
  { code: "JPN", name: "Japão", flag: "🇯🇵", group: "F", confederation: "AFC" },
  { code: "EPB", name: "Playoff Euro B", flag: "🏳️", group: "F", confederation: "UEFA" },
  { code: "TUN", name: "Tunísia", flag: "🇹🇳", group: "F", confederation: "CAF" },
  // Group G
  { code: "BEL", name: "Bélgica", flag: "🇧🇪", group: "G", confederation: "UEFA" },
  { code: "EGY", name: "Egito", flag: "🇪🇬", group: "G", confederation: "CAF" },
  { code: "IRN", name: "Irã", flag: "🇮🇷", group: "G", confederation: "AFC" },
  { code: "NZL", name: "Nova Zelândia", flag: "🇳🇿", group: "G", confederation: "OFC" },
  // Group H
  { code: "ESP", name: "Espanha", flag: "🇪🇸", group: "H", confederation: "UEFA" },
  { code: "CPV", name: "Cabo Verde", flag: "🇨🇻", group: "H", confederation: "CAF" },
  { code: "SAU", name: "Arábia Saudita", flag: "🇸🇦", group: "H", confederation: "AFC" },
  { code: "URU", name: "Uruguai", flag: "🇺🇾", group: "H", confederation: "CONMEBOL" },
  // Group I
  { code: "FRA", name: "França", flag: "🇫🇷", group: "I", confederation: "UEFA" },
  { code: "SEN", name: "Senegal", flag: "🇸🇳", group: "I", confederation: "CAF" },
  { code: "FP2", name: "Playoff FIFA 2", flag: "🏳️", group: "I", confederation: "CONMEBOL" },
  { code: "NOR", name: "Noruega", flag: "🇳🇴", group: "I", confederation: "UEFA" },
  // Group J
  { code: "ARG", name: "Argentina", flag: "🇦🇷", group: "J", confederation: "CONMEBOL" },
  { code: "ALG", name: "Argélia", flag: "🇩🇿", group: "J", confederation: "CAF" },
  { code: "AUT", name: "Áustria", flag: "🇦🇹", group: "J", confederation: "UEFA" },
  { code: "JOR", name: "Jordânia", flag: "🇯🇴", group: "J", confederation: "AFC" },
  // Group K
  { code: "POR", name: "Portugal", flag: "🇵🇹", group: "K", confederation: "UEFA" },
  { code: "FP1", name: "Playoff FIFA 1", flag: "🏳️", group: "K", confederation: "CONCACAF" },
  { code: "UZB", name: "Uzbequistão", flag: "🇺🇿", group: "K", confederation: "AFC" },
  { code: "COL", name: "Colômbia", flag: "🇨🇴", group: "K", confederation: "CONMEBOL" },
  // Group L
  { code: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L", confederation: "UEFA" },
  { code: "CRO", name: "Croácia", flag: "🇭🇷", group: "L", confederation: "UEFA" },
  { code: "GHA", name: "Gana", flag: "🇬🇭", group: "L", confederation: "CAF" },
  { code: "PAN", name: "Panamá", flag: "🇵🇦", group: "L", confederation: "CONCACAF" },
];

export const getTeam = (code: string) => teams.find(t => t.code === code)!;
export const getGroupTeams = (group: string) => teams.filter(t => t.group === group);
export const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

// ===== STADIUMS (All 16 Official Venues) =====
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
  { id: "metlife", name: "MetLife Stadium", city: "East Rutherford", country: "EUA", capacity: 82500, lat: 40.8135, lng: -74.0745, timezone: "America/New_York", climaHint: "Quente e úmido no verão" },
  { id: "sofi", name: "SoFi Stadium", city: "Inglewood", country: "EUA", capacity: 70240, lat: 33.9535, lng: -118.3392, timezone: "America/Los_Angeles", climaHint: "Coberto, clima agradável" },
  { id: "att", name: "AT&T Stadium", city: "Arlington", country: "EUA", capacity: 80000, lat: 32.7473, lng: -97.0945, timezone: "America/Chicago", climaHint: "Ar condicionado (coberto)" },
  { id: "azteca", name: "Estádio Azteca", city: "Cidade do México", country: "México", capacity: 87523, lat: 19.3029, lng: -99.1506, timezone: "America/Mexico_City", climaHint: "Altitude elevada, ameno" },
  { id: "bmo", name: "BMO Field", city: "Toronto", country: "Canadá", capacity: 45736, lat: 43.6335, lng: -79.4186, timezone: "America/Toronto", climaHint: "Agradável no verão" },
  { id: "lumen", name: "Lumen Field", city: "Seattle", country: "EUA", capacity: 69000, lat: 47.5952, lng: -122.3316, timezone: "America/Los_Angeles", climaHint: "Temperado, possível chuva leve" },
  { id: "lincoln", name: "Lincoln Financial Field", city: "Filadélfia", country: "EUA", capacity: 69328, lat: 39.9008, lng: -75.1675, timezone: "America/New_York", climaHint: "Quente no verão" },
  { id: "hard-rock", name: "Hard Rock Stadium", city: "Miami Gardens", country: "EUA", capacity: 65326, lat: 25.958, lng: -80.2389, timezone: "America/New_York", climaHint: "Tropical, quente e úmido" },
  { id: "akron", name: "Estádio Akron", city: "Zapopan", country: "México", capacity: 49850, lat: 20.6822, lng: -103.4623, timezone: "America/Mexico_City", climaHint: "Quente, temporada de chuvas" },
  { id: "bbva", name: "Estádio BBVA", city: "Guadalupe", country: "México", capacity: 53500, lat: 25.6694, lng: -100.2444, timezone: "America/Monterrey", climaHint: "Muito quente" },
  { id: "bc-place", name: "BC Place", city: "Vancouver", country: "Canadá", capacity: 54500, lat: 49.2768, lng: -123.112, timezone: "America/Vancouver", climaHint: "Agradável (coberto)" },
  { id: "mercedes", name: "Mercedes-Benz Stadium", city: "Atlanta", country: "EUA", capacity: 71000, lat: 33.7554, lng: -84.4005, timezone: "America/New_York", climaHint: "Coberto, ar condicionado" },
  { id: "nrg", name: "NRG Stadium", city: "Houston", country: "EUA", capacity: 72220, lat: 29.6847, lng: -95.4107, timezone: "America/Chicago", climaHint: "Coberto, quente e úmido" },
  { id: "gillette", name: "Gillette Stadium", city: "Foxborough", country: "EUA", capacity: 65878, lat: 42.0909, lng: -71.2643, timezone: "America/New_York", climaHint: "Verão agradável" },
  { id: "arrowhead", name: "Arrowhead Stadium", city: "Kansas City", country: "EUA", capacity: 76416, lat: 39.0489, lng: -94.4839, timezone: "America/Chicago", climaHint: "Quente e úmido no verão" },
  { id: "levis", name: "Levi's Stadium", city: "Santa Clara", country: "EUA", capacity: 68500, lat: 37.4033, lng: -121.9694, timezone: "America/Los_Angeles", climaHint: "Seco e ensolarado" },
];

// ===== MATCHES (Official FIFA World Cup 2026 Schedule) =====
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

// All times in Eastern Time converted to UTC-like ISO strings (ET = UTC-4 in June/July)
export const matches: Match[] = [
  // ===== GROUP A =====
  // Matchday 1 - June 11
  { id: "a1", homeTeam: "MEX", awayTeam: "RSA", date: "2026-06-11T15:00:00-04:00", stadium: "azteca", status: "scheduled", phase: "groups", group: "A" },
  { id: "a2", homeTeam: "KOR", awayTeam: "EPD", date: "2026-06-11T22:00:00-04:00", stadium: "akron", status: "scheduled", phase: "groups", group: "A" },
  // Matchday 2 - June 18
  { id: "a3", homeTeam: "EPD", awayTeam: "RSA", date: "2026-06-18T12:00:00-04:00", stadium: "mercedes", status: "scheduled", phase: "groups", group: "A" },
  { id: "a4", homeTeam: "MEX", awayTeam: "KOR", date: "2026-06-18T21:00:00-04:00", stadium: "akron", status: "scheduled", phase: "groups", group: "A" },
  // Matchday 3 - June 24
  { id: "a5", homeTeam: "EPD", awayTeam: "MEX", date: "2026-06-24T21:00:00-04:00", stadium: "azteca", status: "scheduled", phase: "groups", group: "A" },
  { id: "a6", homeTeam: "RSA", awayTeam: "KOR", date: "2026-06-24T21:00:00-04:00", stadium: "bbva", status: "scheduled", phase: "groups", group: "A" },

  // ===== GROUP B =====
  // Matchday 1 - June 12-13
  { id: "b1", homeTeam: "CAN", awayTeam: "EPA", date: "2026-06-12T15:00:00-04:00", stadium: "bmo", status: "scheduled", phase: "groups", group: "B" },
  { id: "b2", homeTeam: "QAT", awayTeam: "SUI", date: "2026-06-13T15:00:00-04:00", stadium: "levis", status: "scheduled", phase: "groups", group: "B" },
  // Matchday 2 - June 18
  { id: "b3", homeTeam: "SUI", awayTeam: "EPA", date: "2026-06-18T15:00:00-04:00", stadium: "sofi", status: "scheduled", phase: "groups", group: "B" },
  { id: "b4", homeTeam: "CAN", awayTeam: "QAT", date: "2026-06-18T18:00:00-04:00", stadium: "bc-place", status: "scheduled", phase: "groups", group: "B" },
  // Matchday 3 - June 24
  { id: "b5", homeTeam: "SUI", awayTeam: "CAN", date: "2026-06-24T15:00:00-04:00", stadium: "bc-place", status: "scheduled", phase: "groups", group: "B" },
  { id: "b6", homeTeam: "EPA", awayTeam: "QAT", date: "2026-06-24T15:00:00-04:00", stadium: "lumen", status: "scheduled", phase: "groups", group: "B" },

  // ===== GROUP C =====
  // Matchday 1 - June 13
  { id: "c1", homeTeam: "BRA", awayTeam: "MAR", date: "2026-06-13T18:00:00-04:00", stadium: "metlife", status: "scheduled", phase: "groups", group: "C" },
  { id: "c2", homeTeam: "HAI", awayTeam: "SCO", date: "2026-06-13T21:00:00-04:00", stadium: "gillette", status: "scheduled", phase: "groups", group: "C" },
  // Matchday 2 - June 19
  { id: "c3", homeTeam: "SCO", awayTeam: "MAR", date: "2026-06-19T18:00:00-04:00", stadium: "gillette", status: "scheduled", phase: "groups", group: "C" },
  { id: "c4", homeTeam: "BRA", awayTeam: "HAI", date: "2026-06-19T21:00:00-04:00", stadium: "lincoln", status: "scheduled", phase: "groups", group: "C" },
  // Matchday 3 - June 24
  { id: "c5", homeTeam: "SCO", awayTeam: "BRA", date: "2026-06-24T18:00:00-04:00", stadium: "hard-rock", status: "scheduled", phase: "groups", group: "C" },
  { id: "c6", homeTeam: "MAR", awayTeam: "HAI", date: "2026-06-24T18:00:00-04:00", stadium: "mercedes", status: "scheduled", phase: "groups", group: "C" },

  // ===== GROUP D =====
  // Matchday 1 - June 12-13
  { id: "d1", homeTeam: "USA", awayTeam: "PAR", date: "2026-06-12T21:00:00-04:00", stadium: "sofi", status: "scheduled", phase: "groups", group: "D" },
  { id: "d2", homeTeam: "AUS", awayTeam: "EPC", date: "2026-06-13T00:00:00-04:00", stadium: "bc-place", status: "scheduled", phase: "groups", group: "D" },
  // Matchday 2 - June 19
  { id: "d3", homeTeam: "EPC", awayTeam: "PAR", date: "2026-06-19T00:00:00-04:00", stadium: "levis", status: "scheduled", phase: "groups", group: "D" },
  { id: "d4", homeTeam: "USA", awayTeam: "AUS", date: "2026-06-19T15:00:00-04:00", stadium: "lumen", status: "scheduled", phase: "groups", group: "D" },
  // Matchday 3 - June 25
  { id: "d5", homeTeam: "EPC", awayTeam: "USA", date: "2026-06-25T22:00:00-04:00", stadium: "sofi", status: "scheduled", phase: "groups", group: "D" },
  { id: "d6", homeTeam: "PAR", awayTeam: "AUS", date: "2026-06-25T22:00:00-04:00", stadium: "levis", status: "scheduled", phase: "groups", group: "D" },

  // ===== GROUP E =====
  // Matchday 1 - June 14
  { id: "e1", homeTeam: "GER", awayTeam: "CUR", date: "2026-06-14T13:00:00-04:00", stadium: "nrg", status: "scheduled", phase: "groups", group: "E" },
  { id: "e2", homeTeam: "CIV", awayTeam: "ECU", date: "2026-06-14T19:00:00-04:00", stadium: "lincoln", status: "scheduled", phase: "groups", group: "E" },
  // Matchday 2 - June 20
  { id: "e3", homeTeam: "GER", awayTeam: "CIV", date: "2026-06-20T16:00:00-04:00", stadium: "bmo", status: "scheduled", phase: "groups", group: "E" },
  { id: "e4", homeTeam: "ECU", awayTeam: "CUR", date: "2026-06-20T20:00:00-04:00", stadium: "arrowhead", status: "scheduled", phase: "groups", group: "E" },
  // Matchday 3 - June 25
  { id: "e5", homeTeam: "ECU", awayTeam: "GER", date: "2026-06-25T16:00:00-04:00", stadium: "metlife", status: "scheduled", phase: "groups", group: "E" },
  { id: "e6", homeTeam: "CUR", awayTeam: "CIV", date: "2026-06-25T16:00:00-04:00", stadium: "lincoln", status: "scheduled", phase: "groups", group: "E" },

  // ===== GROUP F =====
  // Matchday 1 - June 14
  { id: "f1", homeTeam: "NED", awayTeam: "JPN", date: "2026-06-14T16:00:00-04:00", stadium: "att", status: "scheduled", phase: "groups", group: "F" },
  { id: "f2", homeTeam: "EPB", awayTeam: "TUN", date: "2026-06-14T22:00:00-04:00", stadium: "bbva", status: "scheduled", phase: "groups", group: "F" },
  // Matchday 2 - June 20
  { id: "f3", homeTeam: "NED", awayTeam: "EPB", date: "2026-06-20T13:00:00-04:00", stadium: "nrg", status: "scheduled", phase: "groups", group: "F" },
  { id: "f4", homeTeam: "TUN", awayTeam: "JPN", date: "2026-06-20T00:00:00-04:00", stadium: "bbva", status: "scheduled", phase: "groups", group: "F" },
  // Matchday 3 - June 25
  { id: "f5", homeTeam: "TUN", awayTeam: "NED", date: "2026-06-25T19:00:00-04:00", stadium: "att", status: "scheduled", phase: "groups", group: "F" },
  { id: "f6", homeTeam: "JPN", awayTeam: "EPB", date: "2026-06-25T19:00:00-04:00", stadium: "arrowhead", status: "scheduled", phase: "groups", group: "F" },

  // ===== GROUP G =====
  // Matchday 1 - June 15
  { id: "g1", homeTeam: "BEL", awayTeam: "EGY", date: "2026-06-15T15:00:00-04:00", stadium: "lumen", status: "scheduled", phase: "groups", group: "G" },
  { id: "g2", homeTeam: "IRN", awayTeam: "NZL", date: "2026-06-15T21:00:00-04:00", stadium: "sofi", status: "scheduled", phase: "groups", group: "G" },
  // Matchday 2 - June 21
  { id: "g3", homeTeam: "BEL", awayTeam: "IRN", date: "2026-06-21T15:00:00-04:00", stadium: "sofi", status: "scheduled", phase: "groups", group: "G" },
  { id: "g4", homeTeam: "NZL", awayTeam: "EGY", date: "2026-06-21T21:00:00-04:00", stadium: "bc-place", status: "scheduled", phase: "groups", group: "G" },
  // Matchday 3 - June 26
  { id: "g5", homeTeam: "NZL", awayTeam: "BEL", date: "2026-06-26T23:00:00-04:00", stadium: "bc-place", status: "scheduled", phase: "groups", group: "G" },
  { id: "g6", homeTeam: "EGY", awayTeam: "IRN", date: "2026-06-26T23:00:00-04:00", stadium: "lumen", status: "scheduled", phase: "groups", group: "G" },

  // ===== GROUP H =====
  // Matchday 1 - June 15
  { id: "h1", homeTeam: "ESP", awayTeam: "CPV", date: "2026-06-15T12:00:00-04:00", stadium: "mercedes", status: "scheduled", phase: "groups", group: "H" },
  { id: "h2", homeTeam: "SAU", awayTeam: "URU", date: "2026-06-15T18:00:00-04:00", stadium: "hard-rock", status: "scheduled", phase: "groups", group: "H" },
  // Matchday 2 - June 21
  { id: "h3", homeTeam: "ESP", awayTeam: "SAU", date: "2026-06-21T12:00:00-04:00", stadium: "mercedes", status: "scheduled", phase: "groups", group: "H" },
  { id: "h4", homeTeam: "URU", awayTeam: "CPV", date: "2026-06-21T18:00:00-04:00", stadium: "hard-rock", status: "scheduled", phase: "groups", group: "H" },
  // Matchday 3 - June 26
  { id: "h5", homeTeam: "URU", awayTeam: "ESP", date: "2026-06-26T20:00:00-04:00", stadium: "nrg", status: "scheduled", phase: "groups", group: "H" },
  { id: "h6", homeTeam: "CPV", awayTeam: "SAU", date: "2026-06-26T20:00:00-04:00", stadium: "akron", status: "scheduled", phase: "groups", group: "H" },

  // ===== GROUP I =====
  // Matchday 1 - June 16
  { id: "i1", homeTeam: "FRA", awayTeam: "SEN", date: "2026-06-16T15:00:00-04:00", stadium: "metlife", status: "scheduled", phase: "groups", group: "I" },
  { id: "i2", homeTeam: "FP2", awayTeam: "NOR", date: "2026-06-16T18:00:00-04:00", stadium: "gillette", status: "scheduled", phase: "groups", group: "I" },
  // Matchday 2 - June 22
  { id: "i3", homeTeam: "FRA", awayTeam: "FP2", date: "2026-06-22T17:00:00-04:00", stadium: "lincoln", status: "scheduled", phase: "groups", group: "I" },
  { id: "i4", homeTeam: "NOR", awayTeam: "SEN", date: "2026-06-22T20:00:00-04:00", stadium: "metlife", status: "scheduled", phase: "groups", group: "I" },
  // Matchday 3 - June 26
  { id: "i5", homeTeam: "NOR", awayTeam: "FRA", date: "2026-06-26T15:00:00-04:00", stadium: "gillette", status: "scheduled", phase: "groups", group: "I" },
  { id: "i6", homeTeam: "SEN", awayTeam: "FP2", date: "2026-06-26T15:00:00-04:00", stadium: "bmo", status: "scheduled", phase: "groups", group: "I" },

  // ===== GROUP J =====
  // Matchday 1 - June 16-17
  { id: "j1", homeTeam: "ARG", awayTeam: "ALG", date: "2026-06-16T21:00:00-04:00", stadium: "arrowhead", status: "scheduled", phase: "groups", group: "J" },
  { id: "j2", homeTeam: "AUT", awayTeam: "JOR", date: "2026-06-17T00:00:00-04:00", stadium: "levis", status: "scheduled", phase: "groups", group: "J" },
  // Matchday 2 - June 22
  { id: "j3", homeTeam: "ARG", awayTeam: "AUT", date: "2026-06-22T13:00:00-04:00", stadium: "att", status: "scheduled", phase: "groups", group: "J" },
  { id: "j4", homeTeam: "JOR", awayTeam: "ALG", date: "2026-06-22T23:00:00-04:00", stadium: "levis", status: "scheduled", phase: "groups", group: "J" },
  // Matchday 3 - June 27
  { id: "j5", homeTeam: "JOR", awayTeam: "ARG", date: "2026-06-27T22:00:00-04:00", stadium: "att", status: "scheduled", phase: "groups", group: "J" },
  { id: "j6", homeTeam: "ALG", awayTeam: "AUT", date: "2026-06-27T22:00:00-04:00", stadium: "arrowhead", status: "scheduled", phase: "groups", group: "J" },

  // ===== GROUP K =====
  // Matchday 1 - June 17
  { id: "k1", homeTeam: "POR", awayTeam: "FP1", date: "2026-06-17T13:00:00-04:00", stadium: "nrg", status: "scheduled", phase: "groups", group: "K" },
  { id: "k2", homeTeam: "UZB", awayTeam: "COL", date: "2026-06-17T22:00:00-04:00", stadium: "azteca", status: "scheduled", phase: "groups", group: "K" },
  // Matchday 2 - June 23
  { id: "k3", homeTeam: "POR", awayTeam: "UZB", date: "2026-06-23T13:00:00-04:00", stadium: "nrg", status: "scheduled", phase: "groups", group: "K" },
  { id: "k4", homeTeam: "COL", awayTeam: "FP1", date: "2026-06-23T22:00:00-04:00", stadium: "akron", status: "scheduled", phase: "groups", group: "K" },
  // Matchday 3 - June 27
  { id: "k5", homeTeam: "COL", awayTeam: "POR", date: "2026-06-27T19:30:00-04:00", stadium: "hard-rock", status: "scheduled", phase: "groups", group: "K" },
  { id: "k6", homeTeam: "FP1", awayTeam: "UZB", date: "2026-06-27T19:30:00-04:00", stadium: "mercedes", status: "scheduled", phase: "groups", group: "K" },

  // ===== GROUP L =====
  // Matchday 1 - June 17
  { id: "l1", homeTeam: "ENG", awayTeam: "CRO", date: "2026-06-17T16:00:00-04:00", stadium: "att", status: "scheduled", phase: "groups", group: "L" },
  { id: "l2", homeTeam: "GHA", awayTeam: "PAN", date: "2026-06-17T19:00:00-04:00", stadium: "bmo", status: "scheduled", phase: "groups", group: "L" },
  // Matchday 2 - June 23
  { id: "l3", homeTeam: "ENG", awayTeam: "GHA", date: "2026-06-23T16:00:00-04:00", stadium: "gillette", status: "scheduled", phase: "groups", group: "L" },
  { id: "l4", homeTeam: "PAN", awayTeam: "CRO", date: "2026-06-23T19:00:00-04:00", stadium: "bmo", status: "scheduled", phase: "groups", group: "L" },
  // Matchday 3 - June 27
  { id: "l5", homeTeam: "PAN", awayTeam: "ENG", date: "2026-06-27T16:00:00-04:00", stadium: "gillette", status: "scheduled", phase: "groups", group: "L" },
  { id: "l6", homeTeam: "CRO", awayTeam: "GHA", date: "2026-06-27T16:00:00-04:00", stadium: "bmo", status: "scheduled", phase: "groups", group: "L" },
];

export const getTodayMatches = () => {
  const todayStr = new Date().toISOString().split("T")[0];
  return matches.filter(m => m.date.startsWith(todayStr));
};

export const getTomorrowMatches = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  return matches.filter(m => m.date.startsWith(tomorrowStr));
};

export const getMatchesByDate = (dateStr: string) => matches.filter(m => m.date.startsWith(dateStr));

// ===== GROUP STANDINGS (Pre-tournament - all zeroed, with probability estimates) =====
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
    { teamCode: "MEX", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 72 },
    { teamCode: "KOR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 55 },
    { teamCode: "RSA", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 25 },
    { teamCode: "EPD", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 48 },
  ],
  B: [
    { teamCode: "SUI", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 65 },
    { teamCode: "CAN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 55 },
    { teamCode: "EPA", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 50 },
    { teamCode: "QAT", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 15 },
  ],
  C: [
    { teamCode: "BRA", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 90 },
    { teamCode: "MAR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 70 },
    { teamCode: "SCO", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 28 },
    { teamCode: "HAI", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 5 },
  ],
  D: [
    { teamCode: "USA", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 78 },
    { teamCode: "PAR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 40 },
    { teamCode: "AUS", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 35 },
    { teamCode: "EPC", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 45 },
  ],
  E: [
    { teamCode: "GER", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 92 },
    { teamCode: "ECU", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 50 },
    { teamCode: "CIV", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 40 },
    { teamCode: "CUR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 3 },
  ],
  F: [
    { teamCode: "NED", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 75 },
    { teamCode: "JPN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 68 },
    { teamCode: "TUN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 25 },
    { teamCode: "EPB", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 30 },
  ],
  G: [
    { teamCode: "BEL", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 72 },
    { teamCode: "EGY", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 40 },
    { teamCode: "IRN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 35 },
    { teamCode: "NZL", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 10 },
  ],
  H: [
    { teamCode: "ESP", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 85 },
    { teamCode: "URU", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 70 },
    { teamCode: "SAU", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 20 },
    { teamCode: "CPV", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 8 },
  ],
  I: [
    { teamCode: "FRA", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 88 },
    { teamCode: "NOR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 45 },
    { teamCode: "SEN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 42 },
    { teamCode: "FP2", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 10 },
  ],
  J: [
    { teamCode: "ARG", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 90 },
    { teamCode: "AUT", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 48 },
    { teamCode: "ALG", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 30 },
    { teamCode: "JOR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 15 },
  ],
  K: [
    { teamCode: "POR", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 82 },
    { teamCode: "COL", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 72 },
    { teamCode: "UZB", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 18 },
    { teamCode: "FP1", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 12 },
  ],
  L: [
    { teamCode: "ENG", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 78 },
    { teamCode: "CRO", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 62 },
    { teamCode: "GHA", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 28 },
    { teamCode: "PAN", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, probability: 12 },
  ],
};

// ===== BOLÕES =====
export interface BolaoParticipant {
  name: string;
  avatar: string;
  points: number;
  delta: number;
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
  progress: number;
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
    progress: 0,
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
    progress: 0,
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
    progress: 0,
    distribution: [],
    participants: [
      { name: "Você", avatar: "🧑", points: 60, delta: 0, rank: 1 },
      { name: "Thiago", avatar: "👨", points: 55, delta: 0, rank: 2 },
      { name: "Beatriz", avatar: "👩", points: 50, delta: 0, rank: 3 },
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
  { id: "r32-1", round: "Oitavas", homeTeam: null, awayTeam: null, status: "scheduled" },
  { id: "r32-2", round: "Oitavas", homeTeam: null, awayTeam: null, status: "scheduled" },
  { id: "r32-3", round: "Oitavas", homeTeam: null, awayTeam: null, status: "scheduled" },
  { id: "r32-4", round: "Oitavas", homeTeam: null, awayTeam: null, status: "scheduled" },
  { id: "q1", round: "Quartas", homeTeam: null, awayTeam: null, status: "scheduled" },
  { id: "q2", round: "Quartas", homeTeam: null, awayTeam: null, status: "scheduled" },
  { id: "s1", round: "Semi", homeTeam: null, awayTeam: null, status: "scheduled" },
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
