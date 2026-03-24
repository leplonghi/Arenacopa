
// ═══════════════════════════════════════════
// HISTÓRIA DA COPA DO MUNDO - DADOS COMPLETOS
// ═══════════════════════════════════════════

export interface WorldCupEdition {
    year: number;
    hostCountry: string;
    hostCity: string;
    winner: string;
    winnerCode: string;
    runnerUp: string;
    runnerUpCode: string;
    thirdPlace: string;
    thirdPlaceCode: string;
    fourthPlace: string;
    fourthPlaceCode: string;
    totalGoals: number;
    totalMatches: number;
    topScorerName: string;
    topScorerGoals: number;
    topScorerCountry: string;
    totalAttendance: number;
    numberOfTeams: number;
    goldenBall?: string;
    mascot?: string;
}

export interface CountryStats {
    name: string;
    code: string;
    titles: number;
    titleYears: number[];
    participations: number;
    totalMatches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsScored: number;
    goalsConceded: number;
    bestResult: string;
}

export interface TopScorer {
    rank: number;
    name: string;
    country: string;
    countryCode: string;
    goals: number;
    matches: number;
    editions: string;
}

export interface StadiumDetail {
    id: string;
    name: string;
    city: string;
    country: string;
    countryCode: "USA" | "MEX" | "CAN";
    capacity: number;
    yearBuilt: number;
    yearRenovated?: number;
    estimatedCostUSD: string;
    surface: string;
    altitude: number;
    timezone: string;
    avgTempJuneJuly: string;
    cityPopulation: string;
    cityGDP: string;
    mainEconomicActivities: string[];
    nearestAirport: string;
    distanceFromAirportKm: number;
    wcMatches: number;
    wcRole: string;
    historicFact: string;
}

// ═══════════════════════════════════════════
// TODAS AS EDIÇÕES DA COPA DO MUNDO
// ═══════════════════════════════════════════

export const worldCupEditions: WorldCupEdition[] = [
    {
        year: 1930, hostCountry: "Uruguai", hostCity: "Montevidéu",
        winner: "Uruguai", winnerCode: "URU", runnerUp: "Argentina", runnerUpCode: "ARG",
        thirdPlace: "Estados Unidos", thirdPlaceCode: "USA", fourthPlace: "Iugoslávia", fourthPlaceCode: "YUG",
        totalGoals: 70, totalMatches: 18, topScorerName: "Guillermo Stábile", topScorerGoals: 8, topScorerCountry: "ARG",
        totalAttendance: 434396, numberOfTeams: 13, mascot: "N/A"
    },
    {
        year: 1934, hostCountry: "Itália", hostCity: "Roma",
        winner: "Itália", winnerCode: "ITA", runnerUp: "Tchecoslováquia", runnerUpCode: "CZE",
        thirdPlace: "Áustria", thirdPlaceCode: "AUT", fourthPlace: "Alemanha", fourthPlaceCode: "GER",
        totalGoals: 70, totalMatches: 17, topScorerName: "Oldřich Nejedlý", topScorerGoals: 5, topScorerCountry: "CZE",
        totalAttendance: 350000, numberOfTeams: 16, mascot: "N/A"
    },
    {
        year: 1938, hostCountry: "França", hostCity: "Paris",
        winner: "Itália", winnerCode: "ITA", runnerUp: "Hungria", runnerUpCode: "HUN",
        thirdPlace: "Brasil", thirdPlaceCode: "BRA", fourthPlace: "Suécia", fourthPlaceCode: "SWE",
        totalGoals: 84, totalMatches: 18, topScorerName: "Leônidas", topScorerGoals: 7, topScorerCountry: "BRA",
        totalAttendance: 488360, numberOfTeams: 15, mascot: "N/A"
    },
    {
        year: 1950, hostCountry: "Brasil", hostCity: "Rio de Janeiro",
        winner: "Uruguai", winnerCode: "URU", runnerUp: "Brasil", runnerUpCode: "BRA",
        thirdPlace: "Suécia", thirdPlaceCode: "SWE", fourthPlace: "Espanha", fourthPlaceCode: "ESP",
        totalGoals: 88, totalMatches: 22, topScorerName: "Ademir", topScorerGoals: 9, topScorerCountry: "BRA",
        totalAttendance: 1043089, numberOfTeams: 13, mascot: "N/A"
    },
    {
        year: 1954, hostCountry: "Suíça", hostCity: "Berna",
        winner: "Alemanha", winnerCode: "GER", runnerUp: "Hungria", runnerUpCode: "HUN",
        thirdPlace: "Áustria", thirdPlaceCode: "AUT", fourthPlace: "Uruguai", fourthPlaceCode: "URU",
        totalGoals: 140, totalMatches: 26, topScorerName: "Sándor Kocsis", topScorerGoals: 11, topScorerCountry: "HUN",
        totalAttendance: 768315, numberOfTeams: 16, mascot: "N/A"
    },
    {
        year: 1958, hostCountry: "Suécia", hostCity: "Estocolmo",
        winner: "Brasil", winnerCode: "BRA", runnerUp: "Suécia", runnerUpCode: "SWE",
        thirdPlace: "França", thirdPlaceCode: "FRA", fourthPlace: "Alemanha", fourthPlaceCode: "GER",
        totalGoals: 126, totalMatches: 35, topScorerName: "Just Fontaine", topScorerGoals: 13, topScorerCountry: "FRA",
        totalAttendance: 868000, numberOfTeams: 16, goldenBall: "Pelé", mascot: "N/A"
    },
    {
        year: 1962, hostCountry: "Chile", hostCity: "Santiago",
        winner: "Brasil", winnerCode: "BRA", runnerUp: "Tchecoslováquia", runnerUpCode: "CZE",
        thirdPlace: "Chile", thirdPlaceCode: "CHI", fourthPlace: "Iugoslávia", fourthPlaceCode: "YUG",
        totalGoals: 89, totalMatches: 32, topScorerName: "Garrincha e 5 outros", topScorerGoals: 4, topScorerCountry: "BRA",
        totalAttendance: 893172, numberOfTeams: 16, goldenBall: "Garrincha", mascot: "N/A"
    },
    {
        year: 1966, hostCountry: "Inglaterra", hostCity: "Londres",
        winner: "Inglaterra", winnerCode: "ENG", runnerUp: "Alemanha", runnerUpCode: "GER",
        thirdPlace: "Portugal", thirdPlaceCode: "POR", fourthPlace: "União Soviética", fourthPlaceCode: "RUS",
        totalGoals: 89, totalMatches: 32, topScorerName: "Eusébio", topScorerGoals: 9, topScorerCountry: "POR",
        totalAttendance: 1578591, numberOfTeams: 16, mascot: "Willie"
    },
    {
        year: 1970, hostCountry: "México", hostCity: "Cidade do México",
        winner: "Brasil", winnerCode: "BRA", runnerUp: "Itália", runnerUpCode: "ITA",
        thirdPlace: "Alemanha", thirdPlaceCode: "GER", fourthPlace: "Uruguai", fourthPlaceCode: "URU",
        totalGoals: 95, totalMatches: 32, topScorerName: "Gerd Müller", topScorerGoals: 10, topScorerCountry: "GER",
        totalAttendance: 1603975, numberOfTeams: 16, goldenBall: "Pelé", mascot: "Juanito"
    },
    {
        year: 1974, hostCountry: "Alemanha", hostCity: "Munique",
        winner: "Alemanha", winnerCode: "GER", runnerUp: "Holanda", runnerUpCode: "NED",
        thirdPlace: "Polônia", thirdPlaceCode: "POL", fourthPlace: "Brasil", fourthPlaceCode: "BRA",
        totalGoals: 97, totalMatches: 38, topScorerName: "Grzegorz Lato", topScorerGoals: 7, topScorerCountry: "POL",
        totalAttendance: 1864278, numberOfTeams: 16, mascot: "Tip & Tap"
    },
    {
        year: 1978, hostCountry: "Argentina", hostCity: "Buenos Aires",
        winner: "Argentina", winnerCode: "ARG", runnerUp: "Holanda", runnerUpCode: "NED",
        thirdPlace: "Brasil", thirdPlaceCode: "BRA", fourthPlace: "Itália", fourthPlaceCode: "ITA",
        totalGoals: 102, totalMatches: 38, topScorerName: "Mario Kempes", topScorerGoals: 6, topScorerCountry: "ARG",
        totalAttendance: 1545791, numberOfTeams: 16, goldenBall: "Mario Kempes", mascot: "Gauchito"
    },
    {
        year: 1982, hostCountry: "Espanha", hostCity: "Madri",
        winner: "Itália", winnerCode: "ITA", runnerUp: "Alemanha", runnerUpCode: "GER",
        thirdPlace: "Polônia", thirdPlaceCode: "POL", fourthPlace: "França", fourthPlaceCode: "FRA",
        totalGoals: 146, totalMatches: 52, topScorerName: "Paolo Rossi", topScorerGoals: 6, topScorerCountry: "ITA",
        totalAttendance: 2109723, numberOfTeams: 24, goldenBall: "Paolo Rossi", mascot: "Naranjito"
    },
    {
        year: 1986, hostCountry: "México", hostCity: "Cidade do México",
        winner: "Argentina", winnerCode: "ARG", runnerUp: "Alemanha", runnerUpCode: "GER",
        thirdPlace: "França", thirdPlaceCode: "FRA", fourthPlace: "Bélgica", fourthPlaceCode: "BEL",
        totalGoals: 132, totalMatches: 52, topScorerName: "Gary Lineker", topScorerGoals: 6, topScorerCountry: "ENG",
        totalAttendance: 2393031, numberOfTeams: 24, goldenBall: "Diego Maradona", mascot: "Pique"
    },
    {
        year: 1990, hostCountry: "Itália", hostCity: "Roma",
        winner: "Alemanha", winnerCode: "GER", runnerUp: "Argentina", runnerUpCode: "ARG",
        thirdPlace: "Itália", thirdPlaceCode: "ITA", fourthPlace: "Inglaterra", fourthPlaceCode: "ENG",
        totalGoals: 115, totalMatches: 52, topScorerName: "Salvatore Schillaci", topScorerGoals: 6, topScorerCountry: "ITA",
        totalAttendance: 2516215, numberOfTeams: 24, goldenBall: "Salvatore Schillaci", mascot: "Ciao"
    },
    {
        year: 1994, hostCountry: "Estados Unidos", hostCity: "Pasadena",
        winner: "Brasil", winnerCode: "BRA", runnerUp: "Itália", runnerUpCode: "ITA",
        thirdPlace: "Suécia", thirdPlaceCode: "SWE", fourthPlace: "Bulgária", fourthPlaceCode: "BUL",
        totalGoals: 141, totalMatches: 52, topScorerName: "Stoichkov / Salenko", topScorerGoals: 6, topScorerCountry: "BUL",
        totalAttendance: 3587538, numberOfTeams: 24, goldenBall: "Romário", mascot: "Striker"
    },
    {
        year: 1998, hostCountry: "França", hostCity: "Paris",
        winner: "França", winnerCode: "FRA", runnerUp: "Brasil", runnerUpCode: "BRA",
        thirdPlace: "Croácia", thirdPlaceCode: "CRO", fourthPlace: "Holanda", fourthPlaceCode: "NED",
        totalGoals: 171, totalMatches: 64, topScorerName: "Davor Šuker", topScorerGoals: 6, topScorerCountry: "CRO",
        totalAttendance: 2785100, numberOfTeams: 32, goldenBall: "Ronaldo", mascot: "Footix"
    },
    {
        year: 2002, hostCountry: "Coreia / Japão", hostCity: "Yokohama",
        winner: "Brasil", winnerCode: "BRA", runnerUp: "Alemanha", runnerUpCode: "GER",
        thirdPlace: "Turquia", thirdPlaceCode: "TUR", fourthPlace: "Coreia do Sul", fourthPlaceCode: "KOR",
        totalGoals: 161, totalMatches: 64, topScorerName: "Ronaldo", topScorerGoals: 8, topScorerCountry: "BRA",
        totalAttendance: 2705197, numberOfTeams: 32, goldenBall: "Oliver Kahn", mascot: "Ato, Kaz & Nik"
    },
    {
        year: 2006, hostCountry: "Alemanha", hostCity: "Berlim",
        winner: "Itália", winnerCode: "ITA", runnerUp: "França", runnerUpCode: "FRA",
        thirdPlace: "Alemanha", thirdPlaceCode: "GER", fourthPlace: "Portugal", fourthPlaceCode: "POR",
        totalGoals: 147, totalMatches: 64, topScorerName: "Miroslav Klose", topScorerGoals: 5, topScorerCountry: "GER",
        totalAttendance: 3359439, numberOfTeams: 32, goldenBall: "Zinedine Zidane", mascot: "Goleo VI"
    },
    {
        year: 2010, hostCountry: "África do Sul", hostCity: "Joanesburgo",
        winner: "Espanha", winnerCode: "ESP", runnerUp: "Holanda", runnerUpCode: "NED",
        thirdPlace: "Alemanha", thirdPlaceCode: "GER", fourthPlace: "Uruguai", fourthPlaceCode: "URU",
        totalGoals: 145, totalMatches: 64, topScorerName: "Thomas Müller", topScorerGoals: 5, topScorerCountry: "GER",
        totalAttendance: 3178856, numberOfTeams: 32, goldenBall: "Diego Forlán", mascot: "Zakumi"
    },
    {
        year: 2014, hostCountry: "Brasil", hostCity: "Rio de Janeiro",
        winner: "Alemanha", winnerCode: "GER", runnerUp: "Argentina", runnerUpCode: "ARG",
        thirdPlace: "Holanda", thirdPlaceCode: "NED", fourthPlace: "Brasil", fourthPlaceCode: "BRA",
        totalGoals: 171, totalMatches: 64, topScorerName: "James Rodríguez", topScorerGoals: 6, topScorerCountry: "COL",
        totalAttendance: 3429873, numberOfTeams: 32, goldenBall: "Lionel Messi", mascot: "Fuleco"
    },
    {
        year: 2018, hostCountry: "Rússia", hostCity: "Moscou",
        winner: "França", winnerCode: "FRA", runnerUp: "Croácia", runnerUpCode: "CRO",
        thirdPlace: "Bélgica", thirdPlaceCode: "BEL", fourthPlace: "Inglaterra", fourthPlaceCode: "ENG",
        totalGoals: 169, totalMatches: 64, topScorerName: "Harry Kane", topScorerGoals: 6, topScorerCountry: "ENG",
        totalAttendance: 3031768, numberOfTeams: 32, goldenBall: "Luka Modrić", mascot: "Zabivaka"
    },
    {
        year: 2022, hostCountry: "Catar", hostCity: "Lusail",
        winner: "Argentina", winnerCode: "ARG", runnerUp: "França", runnerUpCode: "FRA",
        thirdPlace: "Croácia", thirdPlaceCode: "CRO", fourthPlace: "Marrocos", fourthPlaceCode: "MAR",
        totalGoals: 172, totalMatches: 64, topScorerName: "Kylian Mbappé", topScorerGoals: 8, topScorerCountry: "FRA",
        totalAttendance: 3404252, numberOfTeams: 32, goldenBall: "Lionel Messi", mascot: "La'eeb"
    }
];

// ═══════════════════════════════════════════
// RANKING DE SELEÇÕES POR TÍTULOS
// ═══════════════════════════════════════════

export const countryRankings: CountryStats[] = [
    {
        name: "Brasil", code: "BRA", titles: 5, titleYears: [1958, 1962, 1970, 1994, 2002],
        participations: 22, totalMatches: 114, wins: 76, draws: 19, losses: 19,
        goalsScored: 237, goalsConceded: 108, bestResult: "Campeão 5x"
    },
    {
        name: "Alemanha", code: "GER", titles: 4, titleYears: [1954, 1974, 1990, 2014],
        participations: 20, totalMatches: 112, wins: 68, draws: 21, losses: 23,
        goalsScored: 232, goalsConceded: 130, bestResult: "Campeão 4x"
    },
    {
        name: "Itália", code: "ITA", titles: 4, titleYears: [1934, 1938, 1982, 2006],
        participations: 18, totalMatches: 83, wins: 45, draws: 21, losses: 17,
        goalsScored: 153, goalsConceded: 77, bestResult: "Campeão 4x"
    },
    {
        name: "Argentina", code: "ARG", titles: 3, titleYears: [1978, 1986, 2022],
        participations: 18, totalMatches: 88, wins: 47, draws: 17, losses: 24,
        goalsScored: 156, goalsConceded: 100, bestResult: "Campeão 3x"
    },
    {
        name: "França", code: "FRA", titles: 2, titleYears: [1998, 2018],
        participations: 16, totalMatches: 73, wins: 39, draws: 13, losses: 21,
        goalsScored: 132, goalsConceded: 82, bestResult: "Campeão 2x"
    },
    {
        name: "Uruguai", code: "URU", titles: 2, titleYears: [1930, 1950],
        participations: 14, totalMatches: 59, wins: 24, draws: 12, losses: 23,
        goalsScored: 87, goalsConceded: 74, bestResult: "Campeão 2x"
    },
    {
        name: "Inglaterra", code: "ENG", titles: 1, titleYears: [1966],
        participations: 16, totalMatches: 74, wins: 32, draws: 22, losses: 20,
        goalsScored: 108, goalsConceded: 71, bestResult: "Campeão 1x"
    },
    {
        name: "Espanha", code: "ESP", titles: 1, titleYears: [2010],
        participations: 16, totalMatches: 67, wins: 30, draws: 16, losses: 21,
        goalsScored: 104, goalsConceded: 72, bestResult: "Campeão 1x"
    },
    {
        name: "Holanda", code: "NED", titles: 0, titleYears: [],
        participations: 11, totalMatches: 54, wins: 30, draws: 11, losses: 13,
        goalsScored: 95, goalsConceded: 56, bestResult: "Vice-campeão 3x"
    },
    {
        name: "Croácia", code: "CRO", titles: 0, titleYears: [],
        participations: 6, totalMatches: 33, wins: 14, draws: 6, losses: 13,
        goalsScored: 46, goalsConceded: 40, bestResult: "Vice-campeão 2018"
    }
];

// ═══════════════════════════════════════════
// ARTILHEIROS HISTÓRICOS
// ═══════════════════════════════════════════

export const allTimeTopScorers: TopScorer[] = [
    { rank: 1, name: "Miroslav Klose", country: "Alemanha", countryCode: "GER", goals: 16, matches: 24, editions: "2002-2014" },
    { rank: 2, name: "Ronaldo", country: "Brasil", countryCode: "BRA", goals: 15, matches: 19, editions: "1998-2006" },
    { rank: 3, name: "Gerd Müller", country: "Alemanha", countryCode: "GER", goals: 14, matches: 13, editions: "1970-1974" },
    { rank: 4, name: "Just Fontaine", country: "França", countryCode: "FRA", goals: 13, matches: 6, editions: "1958" },
    { rank: 5, name: "Pelé", country: "Brasil", countryCode: "BRA", goals: 12, matches: 14, editions: "1958-1970" },
    { rank: 6, name: "Kylian Mbappé", country: "França", countryCode: "FRA", goals: 12, matches: 14, editions: "2018-2022" },
    { rank: 7, name: "Sándor Kocsis", country: "Hungria", countryCode: "HUN", goals: 11, matches: 5, editions: "1954" },
    { rank: 8, name: "Jürgen Klinsmann", country: "Alemanha", countryCode: "GER", goals: 11, matches: 17, editions: "1990-1998" },
    { rank: 9, name: "Lionel Messi", country: "Argentina", countryCode: "ARG", goals: 13, matches: 26, editions: "2006-2022" },
    { rank: 10, name: "Helmut Rahn", country: "Alemanha", countryCode: "GER", goals: 10, matches: 10, editions: "1954-1958" },
];

// ═══════════════════════════════════════════
// RANKING DE PARTICIPAÇÕES
// ═══════════════════════════════════════════

export const participationRanking = [
    { name: "Brasil", code: "BRA", participations: 22, consecutive: 22, note: "Único a participar de todas" },
    { name: "Alemanha", code: "GER", participations: 20, consecutive: 17, note: "Ausente em 2 edições" },
    { name: "Itália", code: "ITA", participations: 18, consecutive: 14, note: "Fora em 2018 e 2022" },
    { name: "Argentina", code: "ARG", participations: 18, consecutive: 13, note: "Atual campeão" },
    { name: "México", code: "MEX", participations: 17, consecutive: 16, note: "Anfitrião 3x em 2026" },
    { name: "Inglaterra", code: "ENG", participations: 16, consecutive: 7, note: "Berço do futebol" },
    { name: "França", code: "FRA", participations: 16, consecutive: 7, note: "Bicampeão (1998, 2018)" },
    { name: "Espanha", code: "ESP", participations: 16, consecutive: 12, note: "Campeão em 2010" },
    { name: "Coreia do Sul", code: "KOR", participations: 11, consecutive: 10, note: "4° lugar em 2002" },
    { name: "Sérvia", code: "SRB", participations: 13, consecutive: 3, note: "Inclui Iugoslávia" },
];

// ═══════════════════════════════════════════
// RANKING DE GOLS POR SELEÇÃO
// ═══════════════════════════════════════════

export const goalRankings = [
    { name: "Brasil", code: "BRA", goals: 237, matches: 114, avg: 2.08 },
    { name: "Alemanha", code: "GER", goals: 232, matches: 112, avg: 2.07 },
    { name: "Argentina", code: "ARG", goals: 156, matches: 88, avg: 1.77 },
    { name: "Itália", code: "ITA", goals: 153, matches: 83, avg: 1.84 },
    { name: "França", code: "FRA", goals: 132, matches: 73, avg: 1.81 },
    { name: "Inglaterra", code: "ENG", goals: 108, matches: 74, avg: 1.46 },
    { name: "Espanha", code: "ESP", goals: 104, matches: 67, avg: 1.55 },
    { name: "Holanda", code: "NED", goals: 95, matches: 54, avg: 1.76 },
    { name: "Uruguai", code: "URU", goals: 87, matches: 59, avg: 1.47 },
    { name: "Hungria", code: "HUN", goals: 87, matches: 32, avg: 2.72 },
];

// ═══════════════════════════════════════════
// DADOS DETALHADOS DOS ESTÁDIOS 2026
// ═══════════════════════════════════════════

export const stadiumDetails: StadiumDetail[] = [
    {
        id: "metlife-stadium", name: "MetLife Stadium", city: "Nova York / Nova Jersey", country: "EUA", countryCode: "USA",
        capacity: 82500, yearBuilt: 2010, estimatedCostUSD: "$1.6 bilhões", surface: "Grama artificial",
        altitude: 5, timezone: "UTC-5 (EST)", avgTempJuneJuly: "24°C a 30°C",
        cityPopulation: "~20 milhões (área metropolitana)", cityGDP: "$1.8 trilhão",
        mainEconomicActivities: ["Finanças", "Tecnologia", "Moda", "Entretenimento", "Mídia"],
        nearestAirport: "Newark Liberty (EWR)", distanceFromAirportKm: 16,
        wcMatches: 8, wcRole: "🏆 Final da Copa (19/jul)",
        historicFact: "Sede dos New York Giants e Jets da NFL. Receberá a final da Copa 2026."
    },
    {
        id: "sofi-stadium", name: "SoFi Stadium", city: "Los Angeles", country: "EUA", countryCode: "USA",
        capacity: 70240, yearBuilt: 2020, estimatedCostUSD: "$5.5 bilhões", surface: "Grama artificial",
        altitude: 27, timezone: "UTC-8 (PST)", avgTempJuneJuly: "20°C a 27°C",
        cityPopulation: "~13 milhões (área metropolitana)", cityGDP: "$1.0 trilhão",
        mainEconomicActivities: ["Cinema/TV", "Tecnologia", "Turismo", "Aeroespacial", "Moda"],
        nearestAirport: "Los Angeles Intl (LAX)", distanceFromAirportKm: 5,
        wcMatches: 8, wcRole: "Quartas de Final",
        historicFact: "O estádio mais caro já construído no mundo. Inaugurado em 2020."
    },
    {
        id: "att-stadium", name: "AT&T Stadium", city: "Dallas", country: "EUA", countryCode: "USA",
        capacity: 80000, yearBuilt: 2009, estimatedCostUSD: "$1.3 bilhões", surface: "Grama artificial",
        altitude: 162, timezone: "UTC-6 (CST)", avgTempJuneJuly: "30°C a 38°C",
        cityPopulation: "~7.6 milhões (área metropolitana)", cityGDP: "$570 bilhões",
        mainEconomicActivities: ["Energia", "Telecomunicações", "Defesa", "Saúde", "Finanças"],
        nearestAirport: "Dallas/Fort Worth (DFW)", distanceFromAirportKm: 30,
        wcMatches: 9, wcRole: "Semifinal + mais jogos de qualquer sede",
        historicFact: "Possui um dos maiores telões de LED do mundo (49m x 22m). Receberá 9 jogos."
    },
    {
        id: "mercedes-benz-stadium", name: "Mercedes-Benz Stadium", city: "Atlanta", country: "EUA", countryCode: "USA",
        capacity: 71000, yearBuilt: 2017, estimatedCostUSD: "$1.6 bilhões", surface: "Grama natural",
        altitude: 320, timezone: "UTC-5 (EST)", avgTempJuneJuly: "27°C a 33°C",
        cityPopulation: "~6.1 milhões (área metropolitana)", cityGDP: "$400 bilhões",
        mainEconomicActivities: ["Logística", "Mídia (CNN/Turner)", "Alimentos (Coca-Cola)", "Tecnologia"],
        nearestAirport: "Hartsfield-Jackson (ATL)", distanceFromAirportKm: 15,
        wcMatches: 8, wcRole: "Fase de Grupos + Mata-mata",
        historicFact: "Teto retrátil em forma de lente de câmera. Comida mais barata da NFL."
    },
    {
        id: "hard-rock-stadium", name: "Hard Rock Stadium", city: "Miami", country: "EUA", countryCode: "USA",
        capacity: 64767, yearBuilt: 1987, yearRenovated: 2016, estimatedCostUSD: "$550 milhões (renovação)", surface: "Grama natural",
        altitude: 4, timezone: "UTC-5 (EST)", avgTempJuneJuly: "28°C a 33°C",
        cityPopulation: "~6.2 milhões (área metropolitana)", cityGDP: "$380 bilhões",
        mainEconomicActivities: ["Turismo", "Comércio Internacional", "Finanças", "Imobiliário", "Cruzeiros"],
        nearestAirport: "Miami Intl (MIA)", distanceFromAirportKm: 25,
        wcMatches: 7, wcRole: "🥉 Disputa de 3° Lugar",
        historicFact: "Casa do Inter Miami de Messi. Sede do Super Bowl e da F1 de Miami."
    },
    {
        id: "nrg-stadium", name: "NRG Stadium", city: "Houston", country: "EUA", countryCode: "USA",
        capacity: 72220, yearBuilt: 2002, estimatedCostUSD: "$474 milhões", surface: "Grama natural",
        altitude: 12, timezone: "UTC-6 (CST)", avgTempJuneJuly: "30°C a 36°C",
        cityPopulation: "~7 milhões (área metropolitana)", cityGDP: "$500 bilhões",
        mainEconomicActivities: ["Energia (petróleo/gás)", "Aeroespacial (NASA)", "Saúde", "Engenharia"],
        nearestAirport: "George Bush Intercontinental (IAH)", distanceFromAirportKm: 38,
        wcMatches: 7, wcRole: "Fase de Grupos + Mata-mata",
        historicFact: "Primeiro estádio da NFL com teto retrátil. Sede de múltiplos Super Bowls."
    },
    {
        id: "lincoln-financial-field", name: "Lincoln Financial Field", city: "Filadélfia", country: "EUA", countryCode: "USA",
        capacity: 69176, yearBuilt: 2003, estimatedCostUSD: "$512 milhões", surface: "Grama natural",
        altitude: 9, timezone: "UTC-5 (EST)", avgTempJuneJuly: "24°C a 31°C",
        cityPopulation: "~6.2 milhões (área metropolitana)", cityGDP: "$440 bilhões",
        mainEconomicActivities: ["Farmacêutica", "Educação", "Saúde", "Finanças", "Tecnologia"],
        nearestAirport: "Philadelphia Intl (PHL)", distanceFromAirportKm: 14,
        wcMatches: 6, wcRole: "Fase de Grupos + Oitavas",
        historicFact: "Berço da Independência Americana. Estádio 100% alimentado por energia renovável."
    },
    {
        id: "lumen-field", name: "Lumen Field", city: "Seattle", country: "EUA", countryCode: "USA",
        capacity: 69000, yearBuilt: 2002, estimatedCostUSD: "$430 milhões", surface: "Grama artificial",
        altitude: 5, timezone: "UTC-8 (PST)", avgTempJuneJuly: "18°C a 24°C",
        cityPopulation: "~4 milhões (área metropolitana)", cityGDP: "$370 bilhões",
        mainEconomicActivities: ["Tecnologia (Amazon, Microsoft)", "Aeroespacial (Boeing)", "Comércio", "Café"],
        nearestAirport: "Seattle-Tacoma (SEA)", distanceFromAirportKm: 24,
        wcMatches: 6, wcRole: "Fase de Grupos + Oitavas",
        historicFact: "Conhecido pelo 'barulho mais alto do mundo' gerado pelos torcedores (137.6 dB)."
    },
    {
        id: "levis-stadium", name: "Levi's Stadium", city: "São Francisco / Santa Clara", country: "EUA", countryCode: "USA",
        capacity: 71000, yearBuilt: 2014, estimatedCostUSD: "$1.3 bilhões", surface: "Grama natural",
        altitude: 11, timezone: "UTC-8 (PST)", avgTempJuneJuly: "18°C a 25°C",
        cityPopulation: "~4.7 milhões (São Francisco Bay Area)", cityGDP: "$580 bilhões",
        mainEconomicActivities: ["Tecnologia (Silicon Valley)", "Biotecnologia", "Capital de Risco", "Turismo"],
        nearestAirport: "San Jose Intl (SJC)", distanceFromAirportKm: 8,
        wcMatches: 6, wcRole: "Fase de Grupos + Quartas de Final",
        historicFact: "No coração do Vale do Silício. Estádio com forte identidade sustentável."
    },
    {
        id: "arrowhead-stadium", name: "GEHA Field at Arrowhead", city: "Kansas City", country: "EUA", countryCode: "USA",
        capacity: 73000, yearBuilt: 1972, yearRenovated: 2010, estimatedCostUSD: "$375 milhões (renovação)", surface: "Grama natural",
        altitude: 275, timezone: "UTC-6 (CST)", avgTempJuneJuly: "26°C a 33°C",
        cityPopulation: "~2.2 milhões (área metropolitana)", cityGDP: "$140 bilhões",
        mainEconomicActivities: ["Agronegócio", "Logística", "Automotivo", "Saúde"],
        nearestAirport: "Kansas City Intl (MCI)", distanceFromAirportKm: 30,
        wcMatches: 6, wcRole: "Fase de Grupos + Oitavas",
        historicFact: "Casa dos Kansas City Chiefs. Um dos estádios mais barulhentos da NFL."
    },
    {
        id: "gillette-stadium", name: "Gillette Stadium", city: "Boston / Foxborough", country: "EUA", countryCode: "USA",
        capacity: 65878, yearBuilt: 2002, estimatedCostUSD: "$325 milhões", surface: "Grama artificial",
        altitude: 55, timezone: "UTC-5 (EST)", avgTempJuneJuly: "22°C a 28°C",
        cityPopulation: "~4.9 milhões (área metropolitana)", cityGDP: "$460 bilhões",
        mainEconomicActivities: ["Educação (Harvard, MIT)", "Saúde", "Biotecnologia", "Finanças", "Tecnologia"],
        nearestAirport: "Boston Logan Intl (BOS)", distanceFromAirportKm: 50,
        wcMatches: 7, wcRole: "Fase de Grupos + Mata-mata",
        historicFact: "Região berço da Revolução Americana. Sede da New England Revolution (MLS)."
    },
    {
        id: "estadio-azteca", name: "Estádio Azteca (Banorte)", city: "Cidade do México", country: "México", countryCode: "MEX",
        capacity: 83000, yearBuilt: 1966, yearRenovated: 2024, estimatedCostUSD: "$400 milhões (renovação)", surface: "Grama natural",
        altitude: 2240, timezone: "UTC-6 (CST)", avgTempJuneJuly: "17°C a 23°C",
        cityPopulation: "~22 milhões (Zona Metropolitana)", cityGDP: "$380 bilhões",
        mainEconomicActivities: ["Governo", "Serviços Financeiros", "Turismo", "Manufatura", "Comércio"],
        nearestAirport: "Aeroporto Intl Cidade do México (MEX)", distanceFromAirportKm: 18,
        wcMatches: 5, wcRole: "⚽ Jogo de Abertura + Mata-mata",
        historicFact: "Único estádio com 2 finais de Copa (1970, 1986). Palco do 'Gol del Siglo' de Maradona."
    },
    {
        id: "estadio-bbva", name: "Estádio BBVA", city: "Monterrey", country: "México", countryCode: "MEX",
        capacity: 53500, yearBuilt: 2015, estimatedCostUSD: "$200 milhões", surface: "Grama natural",
        altitude: 540, timezone: "UTC-6 (CST)", avgTempJuneJuly: "30°C a 38°C",
        cityPopulation: "~5.3 milhões (área metropolitana)", cityGDP: "$130 bilhões",
        mainEconomicActivities: ["Indústria Pesada", "Siderurgia", "Cimento", "Cervejarias", "Tecnologia"],
        nearestAirport: "Monterrey Intl (MTY)", distanceFromAirportKm: 25,
        wcMatches: 4, wcRole: "Fase de Grupos",
        historicFact: "Conhecido como 'El Gigante de Acero'. Primeiro estádio LEED Silver nas Américas."
    },
    {
        id: "estadio-akron", name: "Estádio Akron (Guadalajara)", city: "Guadalajara", country: "México", countryCode: "MEX",
        capacity: 49850, yearBuilt: 2010, estimatedCostUSD: "$200 milhões", surface: "Grama natural",
        altitude: 1550, timezone: "UTC-6 (CST)", avgTempJuneJuly: "22°C a 28°C",
        cityPopulation: "~5 milhões (área metropolitana)", cityGDP: "$90 bilhões",
        mainEconomicActivities: ["Tequila/Agave", "Tecnologia", "Calçados", "Turismo cultural", "Gastronomia"],
        nearestAirport: "Guadalajara Intl (GDL)", distanceFromAirportKm: 20,
        wcMatches: 4, wcRole: "Fase de Grupos",
        historicFact: "Berço do mariachi e tequila. Funcionou como sede do Pan-Americano 2011."
    },
    {
        id: "bmo-field", name: "BMO Field", city: "Toronto", country: "Canadá", countryCode: "CAN",
        capacity: 45000, yearBuilt: 2007, yearRenovated: 2025, estimatedCostUSD: "$150 milhões (expansão)", surface: "Grama natural",
        altitude: 76, timezone: "UTC-5 (EST)", avgTempJuneJuly: "20°C a 27°C",
        cityPopulation: "~6.2 milhões (área metropolitana)", cityGDP: "$320 bilhões (CAD)",
        mainEconomicActivities: ["Finanças", "Mineração", "Imobiliário", "Cinema", "Tecnologia"],
        nearestAirport: "Toronto Pearson (YYZ)", distanceFromAirportKm: 25,
        wcMatches: 5, wcRole: "Fase de Grupos + Oitavas",
        historicFact: "A cidade mais multicultural do mundo. Casa do Toronto FC e Hall da Fama do Hockey."
    },
    {
        id: "bc-place", name: "BC Place", city: "Vancouver", country: "Canadá", countryCode: "CAN",
        capacity: 54500, yearBuilt: 1983, yearRenovated: 2011, estimatedCostUSD: "$563 milhões (renovação teto retrátil)", surface: "Grama artificial",
        altitude: 1, timezone: "UTC-8 (PST)", avgTempJuneJuly: "17°C a 23°C",
        cityPopulation: "~2.6 milhões (área metropolitana)", cityGDP: "$140 bilhões (CAD)",
        mainEconomicActivities: ["Cinema (Hollywood do Norte)", "Mineração", "Tecnologia", "Silvicultura", "Turismo"],
        nearestAirport: "Vancouver Intl (YVR)", distanceFromAirportKm: 14,
        wcMatches: 5, wcRole: "Fase de Grupos + Oitavas",
        historicFact: "Sede da Abertura dos Jogos Olímpicos de Inverno 2010. Final da Copa Feminina 2015."
    }
];

// ═══════════════════════════════════════════
// RECORDES E CURIOSIDADES HISTÓRICAS
// ═══════════════════════════════════════════

export const historicRecords = [
    // Recordes originais
    { category: "Maior goleada", record: "Hungria 10 × 1 El Salvador", year: 1982, icon: "Zap" },
    { category: "Mais gols em uma Copa", record: "171 gols — empatado entre 1998 e 2014", year: 2014, icon: "Target" },
    { category: "Final mais assistida", record: "∼1,5 bilhão de espectadores (Catar 2022)", year: 2022, icon: "Eye" },
    { category: "Jogador com mais Copas", record: "Carbajal, Matthäus e Márquez — 5 edições cada", year: 2022, icon: "User" },
    { category: "Campleã mais jovem da história", record: "Brasil 1958, com Pelé (17 anos)", year: 1958, icon: "Baby" },
    { category: "Hat-trick mais rápido", record: "László Kiss — 7 min (Hungria vs El Salvador, 1982)", year: 1982, icon: "Clock" },
    { category: "Gol mais rápido", record: "Hakan Şükür — 11 segundos (Türquia vs Coreia, 2002)", year: 2002, icon: "Bolt" },
    { category: "Maior público total", record: "EUA 1994 — 3.587.538 espectadores no total", year: 1994, icon: "Users" },
    // Novos recordes válidos e factíveis
    { category: "Único país em TODAS as Copas", record: "Brasil — presente nas 22 edições (1930–2022)", year: 2022, icon: "Globe" },
    { category: "Maior artilheiro de uma edição", record: "Just Fontaine — 13 gols (França, 1958)", year: 1958, icon: "Crosshair" },
    { category: "Jogo com mais gols", record: "Áustria 7 × 5 Suíça — 12 gols (quartas, 1954)", year: 1954, icon: "Hash" },
    { category: "Final com mais gols", record: "Brasil 5 × 2 Suécia — 7 gols (1958)", year: 1958, icon: "Trophy" },
    { category: "Seleção com mais finais", record: "Alemanha — 8 finais disputadas (4 títulos)", year: 2014, icon: "Medal" },
    { category: "Guarda-redes imbatível", record: "Walter Zenga (Itália) — 517 min sem sofrer gol (1990)", year: 1990, icon: "Swords" },
    { category: "Gol mais tardio em uma final", record: "Mario Götze (ALE) no 113º min vs Argentina (2014)", year: 2014, icon: "Clock" },
    { category: "Bicampeões consecutivos", record: "Itália (1934/38) e Brasil (1958/62)", year: 1962, icon: "Crown" },
    { category: "Copa 2026 — Inédito", record: "Primeiro torneio com 48 seleções e 3 países-sede", year: 2026, icon: "Star" },
    { category: "Primeira Copa do Mundo", record: "Urugüai 1930 — 13 seleções, 18 jogos, sem fase de grupos", year: 1930, icon: "Calendar" },
];
