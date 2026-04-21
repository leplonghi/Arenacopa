// ===== TEAMS (Official FIFA World Cup 2026 Draw) =====
export interface Team {
  code: string;
  name: string;
  flag: string;
  group: string;
  confederation: string;
  fifaRanking?: number;
  fifaTitles?: number;
  demographics?: {
    capital?: string;
    population?: string;
    currency?: string;
    language?: string;
    coordinates?: { lat: number; lng: number }; // Capital coordinates
  };
  stats?: {
    titles: number; // World Cup titles
    appearances: number;
    firstAppearance: number;
    bestResult: string;
    hdi: number;
    area: number; // km2
    gdp: number; // billion USD
  };
  qualifiers?: string;
}

export const teams: Team[] = [
  // Group A
  {
    code: "MEX", name: "México", flag: "🇲🇽", group: "A", confederation: "CONCACAF",
    fifaRanking: 16, fifaTitles: 0,
    demographics: { capital: "Cidade do México", population: "128 milhões", currency: "Peso Mexicano", language: "Espanhol", coordinates: { lat: 19.4326, lng: -99.1332 } },
    stats: { titles: 0, appearances: 17, firstAppearance: 1930, bestResult: "Quartas (1970, 1986)", hdi: 0.758, area: 1964375, gdp: 1272 },
    qualifiers: "Classificado como país-sede (anfitrião)"
  },
  {
    code: "RSA", name: "África do Sul", flag: "🇿🇦", group: "A", confederation: "CAF",
    fifaRanking: 66, fifaTitles: 0,
    demographics: { capital: "Pretória", population: "60 milhões", currency: "Rand", language: "11 línguas oficiais", coordinates: { lat: -25.7479, lng: 28.2293 } },
    stats: { titles: 0, appearances: 3, firstAppearance: 1998, bestResult: "Fase de Grupos", hdi: 0.713, area: 1221037, gdp: 405 },
    qualifiers: "Vencedor do Grupo C das Eliminatórias Africanas"
  },
  {
    code: "KOR", name: "Coreia do Sul", flag: "🇰🇷", group: "A", confederation: "AFC",
    fifaRanking: 23, fifaTitles: 0,
    demographics: { capital: "Seul", population: "51 milhões", currency: "Won", language: "Coreano", coordinates: { lat: 37.5665, lng: 126.9780 } },
    stats: { titles: 0, appearances: 11, firstAppearance: 1954, bestResult: "4º Lugar (2002)", hdi: 0.925, area: 100210, gdp: 1810 },
    qualifiers: "2º lugar no Grupo B das Eliminatórias Asiáticas"
  },
  { code: "EPD", name: "Playoff Euro D", flag: "🏳️", group: "A", confederation: "UEFA" },
  // Group B
  {
    code: "CAN", name: "Canadá", flag: "🇨🇦", group: "B", confederation: "CONCACAF",
    fifaRanking: 48, fifaTitles: 0,
    demographics: { capital: "Ottawa", population: "38 milhões", currency: "Dólar Canadense", language: "Inglês/Francês", coordinates: { lat: 45.4215, lng: -75.6972 } },
    stats: { titles: 0, appearances: 2, firstAppearance: 1986, bestResult: "Fase de Grupos", hdi: 0.936, area: 9984670, gdp: 2140 },
    qualifiers: "Classificado como país-sede (anfitrião)"
  },
  { code: "EPA", name: "Playoff Euro A", flag: "🏳️", group: "B", confederation: "UEFA" },
  {
    code: "QAT", name: "Catar", flag: "🇶🇦", group: "B", confederation: "AFC",
    demographics: { capital: "Doha", population: "3.2 milhões", currency: "Qatari riyal", language: "Arabic", coordinates: { lat: 25.2854, lng: 51.5310 } },
    stats: { titles: 0, appearances: 1, firstAppearance: 2022, bestResult: "Fase de Grupos", hdi: 0.855, area: 11586, gdp: 237 }
  },
  {
    code: "SUI", name: "Suíça", flag: "🇨🇭", group: "B", confederation: "UEFA",
    demographics: { capital: "Bern", population: "9.1 milhões", currency: "Swiss franc", language: "French, Swiss German, Italian, Romansh", coordinates: { lat: 46.9480, lng: 7.4474 } },
    stats: { titles: 0, appearances: 12, firstAppearance: 1934, bestResult: "Quartas (1934, 1938, 1954)", hdi: 0.962, area: 41285, gdp: 808 }
  },
  // Group C
  {
    code: "BRA", name: "Brasil", flag: "🇧🇷", group: "C", confederation: "CONMEBOL",
    fifaRanking: 5, fifaTitles: 5,
    demographics: { capital: "Brasília", population: "214 milhões", currency: "Real", language: "Português", coordinates: { lat: -15.7801, lng: -47.9292 } },
    stats: { titles: 5, appearances: 22, firstAppearance: 1930, bestResult: "Campeão (1958, 1962, 1970, 1994, 2002)", hdi: 0.754, area: 8515767, gdp: 1608 },
    qualifiers: "1º lugar nas Eliminatórias Sul-Americanas com campanha invicta em casa."
  },
  {
    code: "MAR", name: "Marrocos", flag: "🇲🇦", group: "C", confederation: "CAF",
    demographics: { capital: "Rabat", population: "36.8 milhões", currency: "Moroccan dirham", language: "Arabic, Berber", coordinates: { lat: 34.0209, lng: -6.8416 } },
    stats: { titles: 0, appearances: 6, firstAppearance: 1970, bestResult: "4º Lugar (2022)", hdi: 0.686, area: 446550, gdp: 134 }
  },
  {
    code: "HAI", name: "Haiti", flag: "🇭🇹", group: "C", confederation: "CONCACAF",
    demographics: { capital: "Port-au-Prince", population: "11.9 milhões", currency: "Haitian gourde", language: "French, Haitian Creole", coordinates: { lat: 18.5944, lng: -72.3074 } },
    stats: { titles: 0, appearances: 1, firstAppearance: 1974, bestResult: "Fase de Grupos", hdi: 0.535, area: 27750, gdp: 21 }
  },
  {
    code: "SCO", name: "Escócia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C", confederation: "UEFA",
    demographics: { capital: "Edinburgh", population: "5.5 milhões", currency: "British pound", language: "English", coordinates: { lat: 55.9533, lng: -3.1883 } },
    stats: { titles: 0, appearances: 8, firstAppearance: 1954, bestResult: "Fase de Grupos", hdi: 0.929, area: 77933, gdp: 3165 } // Using UK GDP/HDI roughly or specific if available
  },
  // Group D
  {
    code: "USA", name: "Estados Unidos", flag: "🇺🇸", group: "D", confederation: "CONCACAF",
    fifaRanking: 11, fifaTitles: 0,
    demographics: { capital: "Washington, D.C.", population: "332 milhões", currency: "Dólar Americano", language: "Inglês", coordinates: { lat: 38.9072, lng: -77.0369 } },
    stats: { titles: 0, appearances: 11, firstAppearance: 1930, bestResult: "3º Lugar (1930)", hdi: 0.921, area: 9833520, gdp: 25460 },
    qualifiers: "Classificado como país-sede (anfitrião)"
  },
  {
    code: "PAR", name: "Paraguai", flag: "🇵🇾", group: "D", confederation: "CONMEBOL",
    demographics: { capital: "Asunción", population: "6.1 milhões", currency: "Paraguayan guaraní", language: "Guaraní, Spanish", coordinates: { lat: -25.2637, lng: -57.5759 } },
    stats: { titles: 0, appearances: 8, firstAppearance: 1930, bestResult: "Quartas (2010)", hdi: 0.717, area: 406752, gdp: 41 }
  },
  {
    code: "AUS", name: "Austrália", flag: "🇦🇺", group: "D", confederation: "AFC",
    demographics: { capital: "Canberra", population: "27.5 milhões", currency: "Australian dollar", language: "English", coordinates: { lat: -35.2809, lng: 149.1300 } },
    stats: { titles: 0, appearances: 6, firstAppearance: 1974, bestResult: "Oitavas (2006, 2022)", hdi: 0.951, area: 7692024, gdp: 1675 }
  },
  { code: "EPC", name: "Playoff Euro C", flag: "🏳️", group: "D", confederation: "UEFA" },
  // Group E
  {
    code: "GER", name: "Alemanha", flag: "🇩🇪", group: "E", confederation: "UEFA",
    fifaRanking: 10, fifaTitles: 4,
    demographics: { capital: "Berlim", population: "84 milhões", currency: "Euro", language: "Alemão", coordinates: { lat: 52.5200, lng: 13.4050 } },
    stats: { titles: 4, appearances: 20, firstAppearance: 1934, bestResult: "Campeão (1954, 1974, 1990, 2014)", hdi: 0.942, area: 357022, gdp: 4260 },
    qualifiers: "Vencedor do Grupo J das Eliminatórias Europeias"
  },
  {
    code: "CUR", name: "Curaçao", flag: "🇨🇼", group: "E", confederation: "CONCACAF",
    demographics: { capital: "Willemstad", population: "155 mil", currency: "Florim das Antilhas", language: "Holandês, Papiamento, Inglês", coordinates: { lat: 12.1224, lng: -68.9324 } },
    stats: { titles: 0, appearances: 0, firstAppearance: 2026, bestResult: "Estreante", hdi: 0.760, area: 444, gdp: 3 }
  },
  {
    code: "CIV", name: "Costa do Marfim", flag: "🇨🇮", group: "E", confederation: "CAF",
    demographics: { capital: "Yamoussoukro", population: "31.7 milhões", currency: "West African CFA franc", language: "French", coordinates: { lat: 6.8276, lng: -5.2893 } },
    stats: { titles: 0, appearances: 3, firstAppearance: 2006, bestResult: "Fase de Grupos", hdi: 0.550, area: 322463, gdp: 70 }
  },
  {
    code: "ECU", name: "Equador", flag: "🇪🇨", group: "E", confederation: "CONMEBOL",
    demographics: { capital: "Quito", population: "18.1 milhões", currency: "United States dollar", language: "Spanish", coordinates: { lat: -0.1807, lng: -78.4678 } },
    stats: { titles: 0, appearances: 4, firstAppearance: 2002, bestResult: "Oitavas (2006)", hdi: 0.740, area: 283561, gdp: 115 }
  },
  // Group F
  {
    code: "NED", name: "Holanda", flag: "🇳🇱", group: "F", confederation: "UEFA",
    demographics: { capital: "Amsterdam", population: "18.1 milhões", currency: "euro", language: "Dutch", coordinates: { lat: 52.3676, lng: 4.9041 } },
    stats: { titles: 0, appearances: 11, firstAppearance: 1934, bestResult: "Vice-campeão (1974, 1978, 2010)", hdi: 0.941, area: 41543, gdp: 991 }
  },
  {
    code: "JPN", name: "Japão", flag: "🇯🇵", group: "F", confederation: "AFC",
    demographics: { capital: "Tokyo", population: "123.2 milhões", currency: "Japanese yen", language: "Japanese", coordinates: { lat: 35.6762, lng: 139.6503 } },
    stats: { titles: 0, appearances: 7, firstAppearance: 1998, bestResult: "Oitavas (2002, 2010, 2018, 2022)", hdi: 0.925, area: 377975, gdp: 4230 }
  },
  { code: "EPB", name: "Playoff Euro B", flag: "🏳️", group: "F", confederation: "UEFA" },
  {
    code: "TUN", name: "Tunísia", flag: "🇹🇳", group: "F", confederation: "CAF",
    demographics: { capital: "Tunis", population: "12.0 milhões", currency: "Tunisian dinar", language: "Arabic", coordinates: { lat: 36.8065, lng: 10.1815 } },
    stats: { titles: 0, appearances: 6, firstAppearance: 1978, bestResult: "Fase de Grupos", hdi: 0.731, area: 163610, gdp: 46 }
  },
  // Group G
  {
    code: "BEL", name: "Bélgica", flag: "🇧🇪", group: "G", confederation: "UEFA",
    demographics: { capital: "Brussels", population: "11.8 milhões", currency: "euro", language: "German, French, Dutch", coordinates: { lat: 50.8503, lng: 4.3517 } },
    stats: { titles: 0, appearances: 14, firstAppearance: 1930, bestResult: "3º Lugar (2018)", hdi: 0.937, area: 30528, gdp: 578 }
  },
  {
    code: "EGY", name: "Egito", flag: "🇪🇬", group: "G", confederation: "CAF",
    demographics: { capital: "Cairo", population: "107.3 milhões", currency: "Egyptian pound", language: "Arabic", coordinates: { lat: 30.0444, lng: 31.2357 } },
    stats: { titles: 0, appearances: 3, firstAppearance: 1934, bestResult: "Fase de Grupos", hdi: 0.731, area: 1001450, gdp: 476 }
  },
  {
    code: "IRN", name: "Irã", flag: "🇮🇷", group: "G", confederation: "AFC",
    demographics: { capital: "Tehran", population: "86.0 milhões", currency: "Iranian rial", language: "Persian (Farsi)", coordinates: { lat: 35.6892, lng: 51.3890 } },
    stats: { titles: 0, appearances: 6, firstAppearance: 1978, bestResult: "Fase de Grupos", hdi: 0.774, area: 1648195, gdp: 388 }
  },
  {
    code: "NZL", name: "Nova Zelândia", flag: "🇳🇿", group: "G", confederation: "OFC",
    demographics: { capital: "Wellington", population: "5.3 milhões", currency: "New Zealand dollar", language: "English, Māori", coordinates: { lat: -41.2865, lng: 174.7762 } },
    stats: { titles: 0, appearances: 2, firstAppearance: 1982, bestResult: "Fase de Grupos", hdi: 0.937, area: 268021, gdp: 247 }
  },
  // Group H
  {
    code: "ESP", name: "Espanha", flag: "🇪🇸", group: "H", confederation: "UEFA",
    fifaRanking: 8, fifaTitles: 1,
    demographics: { capital: "Madri", population: "47 milhões", currency: "Euro", language: "Espanhol", coordinates: { lat: 40.4168, lng: -3.7038 } },
    stats: { titles: 1, appearances: 16, firstAppearance: 1934, bestResult: "Campeão (2010)", hdi: 0.905, area: 505990, gdp: 1425 },
    qualifiers: "Vencedor do Grupo B das Eliminatórias Europeias"
  },
  {
    code: "CPV", name: "Cabo Verde", flag: "🇨🇻", group: "H", confederation: "CAF",
    demographics: { capital: "Praia", population: "491,233", currency: "Cape Verdean escudo", language: "Portuguese", coordinates: { lat: 14.9330, lng: -23.5133 } },
    stats: { titles: 0, appearances: 0, firstAppearance: 2026, bestResult: "Estreante", hdi: 0.662, area: 4033, gdp: 2 }
  },
  {
    code: "SAU", name: "Arábia Saudita", flag: "🇸🇦", group: "H", confederation: "AFC",
    demographics: { capital: "Riyadh", population: "35.3 milhões", currency: "Saudi riyal", language: "Arabic", coordinates: { lat: 24.7136, lng: 46.6753 } },
    stats: { titles: 0, appearances: 6, firstAppearance: 1994, bestResult: "Oitavas (1994)", hdi: 0.875, area: 2149690, gdp: 1108 }
  },
  {
    code: "URU", name: "Uruguai", flag: "🇺🇾", group: "H", confederation: "CONMEBOL",
    fifaRanking: 14, fifaTitles: 2,
    demographics: { capital: "Montevidéu", population: "3.5 milhões", currency: "Peso Uruguaio", language: "Espanhol", coordinates: { lat: -34.9011, lng: -56.1645 } },
    stats: { titles: 2, appearances: 14, firstAppearance: 1930, bestResult: "Campeão (1930, 1950)", hdi: 0.817, area: 176215, gdp: 59 },
    qualifiers: "2º lugar nas Eliminatórias Sul-Americanas"
  },
  // Group I
  {
    code: "FRA", name: "França", flag: "🇫🇷", group: "I", confederation: "UEFA",
    fifaRanking: 2, fifaTitles: 2,
    demographics: { capital: "Paris", population: "67 milhões", currency: "Euro", language: "Francês", coordinates: { lat: 48.8566, lng: 2.3522 } },
    stats: { titles: 2, appearances: 16, firstAppearance: 1930, bestResult: "Campeão (1998, 2018)", hdi: 0.903, area: 551695, gdp: 2937 },
    qualifiers: "Vencedor do Grupo D das Eliminatórias Europeias"
  },
  {
    code: "SEN", name: "Senegal", flag: "🇸🇳", group: "I", confederation: "CAF",
    demographics: { capital: "Dakar", population: "18.6 milhões", currency: "West African CFA franc", language: "French", coordinates: { lat: 14.7167, lng: -17.4677 } },
    stats: { titles: 0, appearances: 3, firstAppearance: 2002, bestResult: "Quartas (2002)", hdi: 0.512, area: 196722, gdp: 31 }
  },
  { code: "FP2", name: "Playoff FIFA 2", flag: "🏳️", group: "I", confederation: "CONMEBOL" },
  {
    code: "NOR", name: "Noruega", flag: "🇳🇴", group: "I", confederation: "UEFA",
    demographics: { capital: "Oslo", population: "5.6 milhões", currency: "Norwegian krone", language: "Norwegian", coordinates: { lat: 59.9139, lng: 10.7522 } },
    stats: { titles: 0, appearances: 3, firstAppearance: 1938, bestResult: "Oitavas (1998)", hdi: 0.961, area: 385207, gdp: 485 }
  },
  // Group J
  {
    code: "ARG", name: "Argentina", flag: "🇦🇷", group: "J", confederation: "CONMEBOL",
    fifaRanking: 1, fifaTitles: 3,
    demographics: { capital: "Buenos Aires", population: "46 milhões", currency: "Peso Argentino", language: "Espanhol", coordinates: { lat: -34.6037, lng: -58.3816 } },
    stats: { titles: 3, appearances: 18, firstAppearance: 1930, bestResult: "Campeão (1978, 1986, 2022)", hdi: 0.842, area: 2780400, gdp: 487 },
    qualifiers: "Líder invicto das Eliminatórias Sul-Americanas"
  },
  {
    code: "ALG", name: "Argélia", flag: "🇩🇿", group: "J", confederation: "CAF",
    demographics: { capital: "Algiers", population: "47.4 milhões", currency: "Algerian dinar", language: "Arabic", coordinates: { lat: 36.7538, lng: 3.0588 } },
    stats: { titles: 0, appearances: 4, firstAppearance: 1982, bestResult: "Oitavas (2014)", hdi: 0.745, area: 2381741, gdp: 191 }
  },
  {
    code: "AUT", name: "Áustria", flag: "🇦🇹", group: "J", confederation: "UEFA",
    demographics: { capital: "Vienna", population: "9.2 milhões", currency: "euro", language: "German", coordinates: { lat: 48.2082, lng: 16.3738 } },
    stats: { titles: 0, appearances: 7, firstAppearance: 1934, bestResult: "3º Lugar (1954)", hdi: 0.916, area: 83871, gdp: 471 }
  },
  {
    code: "JOR", name: "Jordânia", flag: "🇯🇴", group: "J", confederation: "AFC",
    demographics: { capital: "Amman", population: "11.7 milhões", currency: "Jordanian dinar", language: "Arabic", coordinates: { lat: 31.9454, lng: 35.9284 } },
    stats: { titles: 0, appearances: 0, firstAppearance: 2026, bestResult: "Estreante", hdi: 0.736, area: 89342, gdp: 48 }
  },
  // Group K
  {
    code: "POR", name: "Portugal", flag: "🇵🇹", group: "K", confederation: "UEFA",
    fifaRanking: 7, fifaTitles: 0,
    demographics: { capital: "Lisboa", population: "10 milhões", currency: "Euro", language: "Português", coordinates: { lat: 38.7223, lng: -9.1393 } },
    stats: { titles: 0, appearances: 8, firstAppearance: 1966, bestResult: "3º Lugar (1966)", hdi: 0.866, area: 92212, gdp: 251 },
    qualifiers: "Vencedor do Grupo J das Eliminatórias Europeias com 100% de aproveitamento"
  },
  { code: "FP1", name: "Playoff FIFA 1", flag: "🏳️", group: "K", confederation: "CONCACAF" },
  {
    code: "UZB", name: "Uzbequistão", flag: "🇺🇿", group: "K", confederation: "AFC",
    demographics: { capital: "Tashkent", population: "37.9 milhões", currency: "Uzbekistani soʻm", language: "Russian, Uzbek", coordinates: { lat: 41.2995, lng: 69.2401 } },
    stats: { titles: 0, appearances: 0, firstAppearance: 2026, bestResult: "Estreante", hdi: 0.727, area: 447400, gdp: 80 }
  },
  {
    code: "COL", name: "Colômbia", flag: "🇨🇴", group: "K", confederation: "CONMEBOL",
    demographics: { capital: "Bogotá", population: "53.1 milhões", currency: "Colombian peso", language: "Spanish", coordinates: { lat: 4.7110, lng: -74.0721 } },
    stats: { titles: 0, appearances: 6, firstAppearance: 1962, bestResult: "Quartas (2014)", hdi: 0.752, area: 1141748, gdp: 343 }
  },
  // Group L
  {
    code: "ENG", name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L", confederation: "UEFA",
    fifaRanking: 3, fifaTitles: 1,
    demographics: { capital: "Londres", population: "56 milhões", currency: "Libra Esterlina", language: "Inglês", coordinates: { lat: 51.5074, lng: -0.1278 } },
    stats: { titles: 1, appearances: 16, firstAppearance: 1950, bestResult: "Campeão (1966)", hdi: 0.929, area: 130279, gdp: 3100 },
    qualifiers: "Vencedor do Grupo I das Eliminatórias Europeias"
  },
  {
    code: "CRO", name: "Croácia", flag: "🇭🇷", group: "L", confederation: "UEFA",
    demographics: { capital: "Zagreb", population: "3.9 milhões", currency: "euro", language: "Croatian", coordinates: { lat: 45.8150, lng: 15.9819 } },
    stats: { titles: 0, appearances: 6, firstAppearance: 1998, bestResult: "Vice-campeão (2018)", hdi: 0.858, area: 56594, gdp: 71 }
  },
  {
    code: "GHA", name: "Gana", flag: "🇬🇭", group: "L", confederation: "CAF",
    demographics: { capital: "Accra", population: "33.7 milhões", currency: "Ghanaian cedi", language: "English", coordinates: { lat: 5.6037, lng: -0.1870 } },
    stats: { titles: 0, appearances: 4, firstAppearance: 2006, bestResult: "Quartas (2010)", hdi: 0.632, area: 238533, gdp: 77 }
  },
  {
    code: "PAN", name: "Panamá", flag: "🇵🇦", group: "L", confederation: "CONCACAF",
    demographics: { capital: "Panama City", population: "4.1 milhões", currency: "Panamanian balboa, United States dollar", language: "Spanish", coordinates: { lat: 8.9824, lng: -79.5199 } },
    stats: { titles: 0, appearances: 1, firstAppearance: 2018, bestResult: "Fase de Grupos", hdi: 0.805, area: 75417, gdp: 76 }
  },
];

function createFallbackTeam(code: string): Team {
  const normalizedCode = code?.trim().toUpperCase() || "---";

  return {
    code: normalizedCode,
    name: normalizedCode,
    flag: "🏳️",
    group: "?",
    confederation: "Unknown",
    demographics: {
      population: "-",
      currency: "-",
      language: "-",
    },
    stats: {
      titles: 0,
      appearances: 0,
      firstAppearance: 0,
      bestResult: "-",
      hdi: 0,
      area: 0,
      gdp: 0,
    },
  };
}

export const getTeam = (code: string) => teams.find(t => t.code === code) ?? createFallbackTeam(code);
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
  details: {
    yearBuilt: number;
    roofType: 'open' | 'retractable' | 'fixed';
    avgTempHigh: number; // Celsius
    avgRainfall: number; // mm
    description: string;
    image?: string;
  };
}

export const stadiums: Stadium[] = [
  {
    id: "metlife", name: "MetLife Stadium", city: "East Rutherford", country: "EUA", capacity: 82500, lat: 40.8135, lng: -74.0745, timezone: "America/New_York", climaHint: "Quente e úmido no verão",
    details: { yearBuilt: 2010, roofType: 'open', avgTempHigh: 28, avgRainfall: 105, description: "Palco da Final. Localizado próximo a Nova York, é um dos maiores estádios da NFL." }
  },
  {
    id: "sofi", name: "SoFi Stadium", city: "Inglewood", country: "EUA", capacity: 70240, lat: 33.9535, lng: -118.3392, timezone: "America/Los_Angeles", climaHint: "Coberto, clima agradável",
    details: { yearBuilt: 2020, roofType: 'fixed', avgTempHigh: 24, avgRainfall: 2, description: "O estádio mais caro já construído, com uma cobertura translúcida e tela 360º." }
  },
  {
    id: "att", name: "AT&T Stadium", city: "Arlington", country: "EUA", capacity: 80000, lat: 32.7473, lng: -97.0945, timezone: "America/Chicago", climaHint: "Ar condicionado (coberto)",
    details: { yearBuilt: 2009, roofType: 'retractable', avgTempHigh: 33, avgRainfall: 95, description: "Conhecido por seu telão gigantesco, é a casa dos Dallas Cowboys." }
  },
  {
    id: "azteca", name: "Estádio Azteca", city: "Cidade do México", country: "México", capacity: 87523, lat: 19.3029, lng: -99.1506, timezone: "America/Mexico_City", climaHint: "Altitude elevada, ameno",
    details: { yearBuilt: 1966, roofType: 'open', avgTempHigh: 26, avgRainfall: 140, description: "Lendário! O primeiro a receber três Aberturas de Copa. Altitude de 2.200m." }
  },
  {
    id: "bmo", name: "BMO Field", city: "Toronto", country: "Canadá", capacity: 45736, lat: 43.6335, lng: -79.4186, timezone: "America/Toronto", climaHint: "Agradável no verão",
    details: { yearBuilt: 2007, roofType: 'open', avgTempHigh: 25, avgRainfall: 70, description: "Expandido para a Copa, oferece vista para o skyline de Toronto." }
  },
  {
    id: "lumen", name: "Lumen Field", city: "Seattle", country: "EUA", capacity: 69000, lat: 47.5952, lng: -122.3316, timezone: "America/Los_Angeles", climaHint: "Temperado, possível chuva leve",
    details: { yearBuilt: 2002, roofType: 'open', avgTempHigh: 22, avgRainfall: 40, description: "Famoso pela acústica ensurdecedora criada pela arquitetura das arquibancadas." }
  },
  {
    id: "lincoln", name: "Lincoln Financial Field", city: "Filadélfia", country: "EUA", capacity: 69328, lat: 39.9008, lng: -75.1675, timezone: "America/New_York", climaHint: "Quente no verão",
    details: { yearBuilt: 2003, roofType: 'open', avgTempHigh: 29, avgRainfall: 96, description: "Estádio sustentável com turbinas eólicas e painéis solares." }
  },
  {
    id: "hard-rock", name: "Hard Rock Stadium", city: "Miami Gardens", country: "EUA", capacity: 65326, lat: 25.958, lng: -80.2389, timezone: "America/New_York", climaHint: "Tropical, quente e úmido",
    details: { yearBuilt: 1987, roofType: 'open', avgTempHigh: 31, avgRainfall: 200, description: "Renovado com uma cobertura para proteger a torcida do sol intenso da Flórida." }
  },
  {
    id: "akron", name: "Estádio Akron", city: "Zapopan", country: "México", capacity: 49850, lat: 20.6822, lng: -103.4623, timezone: "America/Mexico_City", climaHint: "Quente, temporada de chuvas",
    details: { yearBuilt: 2010, roofType: 'open', avgTempHigh: 30, avgRainfall: 160, description: "Design moderno que se assemelha a um vulcão, integrado à paisagem." }
  },
  {
    id: "bbva", name: "Estádio BBVA", city: "Guadalupe", country: "México", capacity: 53500, lat: 25.6694, lng: -100.2444, timezone: "America/Monterrey", climaHint: "Muito quente",
    details: { yearBuilt: 2015, roofType: 'open', avgTempHigh: 34, avgRainfall: 60, description: "'El Gigante de Acero', com vista espetacular para a montanha Cerro de la Silla." }
  },
  {
    id: "bc-place", name: "BC Place", city: "Vancouver", country: "Canadá", capacity: 54500, lat: 49.2768, lng: -123.112, timezone: "America/Vancouver", climaHint: "Agradável (coberto)",
    details: { yearBuilt: 1983, roofType: 'retractable', avgTempHigh: 20, avgRainfall: 50, description: "Possui um dos maiores tetos retráteis do mundo suportados por cabos." }
  },
  {
    id: "mercedes", name: "Mercedes-Benz Stadium", city: "Atlanta", country: "EUA", capacity: 71000, lat: 33.7554, lng: -84.4005, timezone: "America/New_York", climaHint: "Coberto, ar condicionado",
    details: { yearBuilt: 2017, roofType: 'retractable', avgTempHigh: 30, avgRainfall: 110, description: "Teto retrátil icônico em formato de obturador de câmera." }
  },
  {
    id: "nrg", name: "NRG Stadium", city: "Houston", country: "EUA", capacity: 72220, lat: 29.6847, lng: -95.4107, timezone: "America/Chicago", climaHint: "Coberto, quente e úmido",
    details: { yearBuilt: 2002, roofType: 'retractable', avgTempHigh: 33, avgRainfall: 150, description: "Primeiro estádio da NFL com teto retrátil. Climatizado." }
  },
  {
    id: "gillette", name: "Gillette Stadium", city: "Foxborough", country: "EUA", capacity: 65878, lat: 42.0909, lng: -71.2643, timezone: "America/New_York", climaHint: "Verão agradável",
    details: { yearBuilt: 2002, roofType: 'open', avgTempHigh: 25, avgRainfall: 90, description: "Casa dos Patriots. Conhecido pelo farol icônico na entrada." }
  },
  {
    id: "arrowhead", name: "Arrowhead Stadium", city: "Kansas City", country: "EUA", capacity: 76416, lat: 39.0489, lng: -94.4839, timezone: "America/Chicago", climaHint: "Quente e úmido no verão",
    details: { yearBuilt: 1972, roofType: 'open', avgTempHigh: 30, avgRainfall: 130, description: "Detém o recorde mundial de estádio mais barulhento (142.2 dB)." }
  },
  {
    id: "levis", name: "Levi's Stadium", city: "Santa Clara", country: "EUA", capacity: 68500, lat: 37.4033, lng: -121.9694, timezone: "America/Los_Angeles", climaHint: "Seco e ensolarado",
    details: { yearBuilt: 2014, roofType: 'open', avgTempHigh: 26, avgRainfall: 0, description: "Estádio tecnológico no coração do Vale do Silício." }
  },
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
// Helper
export const formatMatchTime = (dateStr: string, locale: string = 'pt-BR') => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
};

export const formatMatchDate = (dateStr: string, locale: string = 'pt-BR') => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
};

export const getStadium = (id: string) => stadiums.find(s => s.id === id) ?? {
  id: id || "unknown",
  name: "Stadium TBD",
  city: "Unknown city",
  country: "Unknown country",
  capacity: 0,
  lat: 0,
  lng: 0,
  timezone: "UTC",
  climaHint: "-",
  details: {
    yearBuilt: 0,
    roofType: "open",
    avgTempHigh: 0,
    avgRainfall: 0,
    description: "Venue information is not available yet.",
  },
};

export const phaseLabels: Record<MatchPhase, string> = {
  "groups": "Fase de Grupos",
  "round-of-32": "32 avos",
  "round-of-16": "Oitavas",
  "quarter": "Quartas",
  "semi": "Semifinal",
  "third": "3º Lugar",
  "final": "Final",
};
