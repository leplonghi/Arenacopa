
export interface HostCity {
    id: string;
    name: string;
    countryCode: "USA" | "MEX" | "CAN";
    population: string;
    description: string;
    highlights: string[];
    stadiumName: string;
    stadiumId: string;
    stadiumCapacity: number;
    stadiumImage?: string;
    image?: string;
    geoCoordinates: [number, number];
    curiosities: string[];
    weather: string;
    // Extended Travelers Guide
    travelGuide?: {
        heroImage: string;
        transport: {
            airport: string;
            publicTransport: string;
            taxiUber: string;
        };
        gastronomy: {
            title: string;
            dishes: { name: string; description: string; priceLevel: "low" | "medium" | "high" }[];
            tips: string[];
        };
        tourism: {
            topAttractions: { name: string; description: string; image?: string }[];
            hiddenGems: string[];
        };
        accommodation: {
            avgHotelPrice: string;
            avgAirbnbPrice: string;
            bestAreas: string[];
        };
        safety: {
            level: "safe" | "caution" | "risk";
            tips: string[];
            emergencyNumbers: string[];
        };
    };
    // Tech data
    altitude?: number;
    timezone?: string;
    avgTempSummer?: string;
    gdp?: string;
    mainEconomicActivities?: string[];
    nearestAirport?: string;
    wcMatches?: number;
    wcRole?: string;
    stadiumYearBuilt?: number;
    stadiumCost?: string;
    historicFact?: string;
    demographics?: string;
}

export interface HostCountry {
    code: "USA" | "MEX" | "CAN";
    name: string;
    flag: string;
    description: string;
    capital: string;
    population: string;
    currency: string;
    footballHistory: string;
    travelTips: string[];
    cities: HostCity[];
    // Extended data
    gdp?: string;
    area?: string;
    officialLanguage?: string;
    hdi?: string;
    continent?: string;
    fifaRanking?: string;
    wcParticipations?: number;
    wcBestResult?: string;
    timezone?: string;
    majorReligion?: string;
}

export const hostCountries: HostCountry[] = [
    {
        code: "MEX",
        name: "México",
        flag: "🇲🇽",
        description: "O México se tornará o primeiro país a sediar a Copa do Mundo três vezes. Conhecido por sua paixão vibrante pelo futebol, culinária rica e história milenar.",
        capital: "Cidade do México",
        population: "~128 milhões",
        currency: "Peso Mexicano (MXN)",
        gdp: "$1.3 trilhão (USD)",
        area: "1.973.000 km²",
        officialLanguage: "Espanhol",
        hdi: "0.758 (Alto)",
        continent: "América do Norte",
        fifaRanking: "~15°",
        wcParticipations: 17,
        wcBestResult: "Quartas de Final (1970, 1986)",
        timezone: "UTC-6 (CST)",
        majorReligion: "Catolicismo",
        footballHistory: "Anfitrião das Copas de 1970 e 1986. A seleção 'El Tri' é uma potência da CONCACAF. Em 2026, será o único país a sediar 3 Copas.",
        travelTips: [
            "Prove a autêntica gastronomia de rua (tacos al pastor, tamales, elotes).",
            "Visite os sítios arqueológicos (Teotihuacán, Chichén Itzá, Palenque).",
            "O metrô da Cidade do México é eficiente e muito barato (~R$1,50).",
            "Cuidado com a altitude na Cidade do México (2.240m) — hidrate-se bem."
        ],
        cities: [
            {
                id: "mex-cdmx", name: "Cidade do México", countryCode: "MEX",
                population: "~22 milhões (Zona Metropolitana)", description: "Uma das maiores e mais vibrantes cidades do mundo, misturando ruínas astecas, arquitetura colonial e modernidade. Capital política, econômica e cultural do México.",
                highlights: ["Culinária Mundial", "História Asteca", "Estádio Azteca", "Museus de Classe Mundial"],
                stadiumName: "Estádio Azteca (Banorte)",
                stadiumId: "azteca",
                stadiumCapacity: 83000,
                // Using placeholder initially, will replace with real Unsplash search
                image: "https://images.unsplash.com/photo-1512813195386-6cf811ad3542?auto=format&fit=crop&w=800&q=80",
                geoCoordinates: [19.3029, -99.1505],
                curiosities: [
                    "Construído sobre o antigo lago de Texcoco",
                    "A cidade afunda cerca de 10cm por ano",
                    "Maior número de museus nas Américas",
                    "Berço da civilização Asteca (Tenochtitlán)"
                ],
                weather: "Chuvoso à tarde (24°C)",
                travelGuide: {
                    heroImage: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80",
                    transport: {
                        airport: "Aeroporto Internacional Benito Juárez (MEX) - 5km do centro",
                        publicTransport: "Metrô extenso e barato (5 pesos/viagem), mas lotado nos picos. Metrobús é excelente opção.",
                        taxiUber: "Uber funciona muito bem e é seguro. Evite táxis de rua não registrados."
                    },
                    gastronomy: {
                        title: "A Capital Mundial do Taco",
                        dishes: [
                            { name: "Tacos al Pastor", description: "Carne de porco marinada em espeto vertical com abacaxi.", priceLevel: "low" },
                            { name: "Mole Poblano", description: "Frango com molho complexo de chocolate e pimentas.", priceLevel: "medium" },
                            { name: "Chiles en Nogada", description: "Pimentão recheado com molho de nozes (sazonal/patriótico).", priceLevel: "high" }
                        ],
                        tips: ["Coma onde tiver fila de locais.", "Cuidado com o picante ('pica poco' = pica muito)."]
                    },
                    tourism: {
                        topAttractions: [
                            { name: "Zócalo & Catedral", description: "O coração histórico da cidade e ruínas do Templo Mayor." },
                            { name: "Museu de Antropologia", description: "Um dos museus mais importantes do mundo sobre pré-colombianos." },
                            { name: "Xochimilco", description: "Canais antigos navegáveis em barcos coloridos (trajinera)." }
                        ],
                        hiddenGems: ["Coyoacán (Bairro da Frida Kahlo)", "Castelo de Chapultepec", "Mercado de San Juan"]
                    },
                    accommodation: {
                        avgHotelPrice: "R$ 400 - R$ 800 / noite",
                        avgAirbnbPrice: "R$ 250 - R$ 500 / noite",
                        bestAreas: ["Roma Norte", "Condesa", "Polanco", "Centro Histórico"]
                    },
                    safety: {
                        level: "caution",
                        tips: [
                            "Evite caminhar sozinho à noite fora das zonas turísticas.",
                            "Mantenha pertences próximos no metrô.",
                            "Use Uber ou táxis de ponto seguro (sitio)."
                        ],
                        emergencyNumbers: ["911 (Geral)", "55 5250 8221 (Polícia Turística)"]
                    }
                },
                // Extended data
                altitude: 2240,
                timezone: "UTC-6 (Central Standard Time)",
                avgTempSummer: "24°C (Máx) / 13°C (Mín) - Chuvas frequentes",
                gdp: "$411 bilhões (PPC)",
                mainEconomicActivities: ["Serviços", "Turismo", "Manufatura", "Finanças"],
                nearestAirport: "MEX (Benito Juárez) e NLU (Felipe Ángeles)",
                wcMatches: 5, // Estimativa baseada no formato
                wcRole: "Partida de Abertura (Confirmado) + Grupo + 32avos",
                stadiumYearBuilt: 1966,
                stadiumCost: "Original: ~US$ 20mi / Renovação 2024: US$ 150mi",
                historicFact: "Único estádio a sediar DUAS finais de Copa (1970 com Pelé, 1986 com Maradona).",
                demographics: "Uma das maiores aglomerações urbanas do mundo (22mi+ habitantes na RM)."
            },
            {
                id: "mex-mty", name: "Monterrey", countryCode: "MEX",
                population: "~5.3 milhões (Área Metropolitana)", description: "Centro industrial e de negócios cercado por montanhas impressionantes. Moderna e apaixonada por futebol com dois grandes clubes.",
                highlights: ["Parque Fundidora", "Paseo Santa Lucía", "Cerro de la Silla", "Macroplaza"],
                stadiumName: "Estádio BBVA", stadiumId: "estadio-bbva", stadiumCapacity: 53500,
                geoCoordinates: [25.6686, -100.2449],
                curiosities: [
                    "Conhecido como 'O Gigante de Aço' por sua estrutura metálica.",
                    "Vista espetacular do Cerro de la Silla de dentro do estádio.",
                    "Primeiro estádio LEED Silver certificado nas Américas.",
                    "Casa do Rayados de Monterrey, multicampeão mexicano."
                ],
                weather: "Quente e semi-árido (30-38°C no verão).",
                altitude: 540, timezone: "UTC-6 (CST)", avgTempSummer: "30°C a 38°C",
                gdp: "$130 bilhões", mainEconomicActivities: ["Indústria Pesada", "Siderurgia", "Cimento", "Cervejarias", "Tecnologia"],
                nearestAirport: "Monterrey Intl (MTY)", wcMatches: 4, wcRole: "Fase de Grupos",
                stadiumYearBuilt: 2015, stadiumCost: "$200M",
                historicFact: "Conhecida como 'A Sultana do Norte', é o centro econômico mais importante do norte do México.",
                demographics: "3ª maior cidade do México, polo industrial e educacional"
            },
            {
                id: "mex-gdl", name: "Guadalajara", countryCode: "MEX",
                population: "~5 milhões (Área Metropolitana)", description: "Berço dos mariachis e da tequila. Representa a alma tradicional do México com uma cena tecnológica crescente.",
                highlights: ["Catedral de Guadalajara", "Hospicio Cabañas (UNESCO)", "Tlaquepaque", "Mercado San Juan de Dios"],
                stadiumName: "Estádio Akron", stadiumId: "estadio-akron", stadiumCapacity: 49850,
                geoCoordinates: [20.6820, -103.4625],
                curiosities: [
                    "Sede dos Jogos Pan-Americanos de 2011.",
                    "Conhecida como o 'Vale do Silício mexicano'.",
                    "Cidade natal das Chivas, o clube mais popular do México.",
                    "Patrimônio Cultural Imaterial da Humanidade (mariachi)."
                ],
                weather: "Quente, com chuvas no verão (22-28°C).",
                altitude: 1550, timezone: "UTC-6 (CST)", avgTempSummer: "22°C a 28°C",
                gdp: "$90 bilhões", mainEconomicActivities: ["Tequila/Agave", "Tecnologia", "Calçados/Moda", "Turismo", "Gastronomia"],
                nearestAirport: "Guadalajara Intl (GDL)", wcMatches: 4, wcRole: "Fase de Grupos",
                stadiumYearBuilt: 2010, stadiumCost: "$200M",
                historicFact: "A tequila só pode ser oficialmente produzida na região de Guadalajara.",
                demographics: "2ª maior cidade do México, capital do estado de Jalisco"
            }
        ]
    },
    {
        code: "USA",
        name: "Estados Unidos",
        flag: "🇺🇸",
        description: "Os EUA voltam a sediar a Copa após o sucesso de 1994 (recorde de público). Infraestrutura de ponta e 11 cidades-sede.",
        capital: "Washington, D.C.",
        population: "~334 milhões",
        currency: "Dólar Americano (USD)",
        gdp: "$25.5 trilhões (maior do mundo)",
        area: "9.834.000 km²",
        officialLanguage: "Inglês",
        hdi: "0.921 (Muito Alto)",
        continent: "América do Norte",
        fifaRanking: "~11°",
        wcParticipations: 11,
        wcBestResult: "3° Lugar (1930)",
        timezone: "UTC-5 a UTC-8",
        majorReligion: "Cristianismo",
        footballHistory: "O 'soccer' cresceu exponencialmente desde 94. A MLS é a liga que mais cresce no mundo. A seleção busca surpreender em casa.",
        travelTips: [
            "Alugar um carro é essencial na maioria das cidades americanas.",
            "As gorjetas (15-20%) são esperadas em restaurantes e serviços.",
            "Verifique os vistos (ESTA ou B1/B2) com antecedência.",
            "O sistema métrico não é usado — prepare-se para milhas e Fahrenheit.",
            "Wi-Fi gratuito é comum em cafés e espaços públicos."
        ],
        cities: [
            {
                id: "usa-ny", name: "Nova York / Nova Jersey", countryCode: "USA",
                population: "~20 milhões (Área Metropolitana)", description: "O centro financeiro e cultural do mundo. Palco da FINAL da Copa 2026. Hub global de mídia, moda e finanças.",
                highlights: ["Estátua da Liberdade", "Times Square", "Central Park", "Brooklyn Bridge", "Broadway"],
                stadiumName: "MetLife Stadium", stadiumId: "metlife-stadium", stadiumCapacity: 82500,
                geoCoordinates: [40.8128, -74.0742],
                curiosities: [
                    "Sede da FINAL da Copa 2026 (19 de julho).",
                    "Mais de 800 linguas são faladas na região.",
                    "O MetLife é o maior estádio da NFL.",
                    "Receberá jogos de Brasil, França, Alemanha e Inglaterra."
                ],
                weather: "Quente e úmido no verão (24-30°C).",
                altitude: 5, timezone: "UTC-5 (EST)", avgTempSummer: "24°C a 30°C",
                gdp: "$1.8 trilhão", mainEconomicActivities: ["Finanças (Wall Street)", "Tecnologia", "Moda", "Entretenimento", "Mídia"],
                nearestAirport: "Newark Liberty (EWR)", wcMatches: 8,
                wcRole: "🏆 Final da Copa (19/jul)",
                stadiumYearBuilt: 2010, stadiumCost: "$1.6 bilhões",
                historicFact: "Dois times da NFL dividem o estádio: Giants e Jets. Será a sede da maior final da história.",
                demographics: "A maior cidade dos EUA, centro econômico global"
            },
            {
                id: "usa-la", name: "Los Angeles", countryCode: "USA",
                population: "~13 milhões (Área Metropolitana)", description: "A capital mundial do entretenimento. Cinema, praias e diversidade. Sede das Olimpíadas 2028.",
                highlights: ["Hollywood", "Santa Monica Pier", "Griffith Observatory", "Venice Beach", "Getty Center"],
                stadiumName: "SoFi Stadium", stadiumId: "sofi-stadium", stadiumCapacity: 70240,
                geoCoordinates: [33.9535, -118.3392],
                curiosities: [
                    "O estádio mais caro já construído no mundo ($5.5 bilhões).",
                    "Sede da final da Copa de 1994 (Rose Bowl).",
                    "USMNT jogará seus jogos de grupo aqui.",
                    "Receberá 8 jogos incluindo quartas de final."
                ],
                weather: "Ensolarado e seco (20-27°C).",
                altitude: 27, timezone: "UTC-8 (PST)", avgTempSummer: "20°C a 27°C",
                gdp: "$1.0 trilhão", mainEconomicActivities: ["Cinema/TV", "Tecnologia", "Turismo", "Aeroespacial", "Moda"],
                nearestAirport: "Los Angeles Intl (LAX)", wcMatches: 8, wcRole: "Quartas de Final",
                stadiumYearBuilt: 2020, stadiumCost: "$5.5 bilhões",
                historicFact: "O SoFi Stadium, inaugurado em 2020, é o edifício esportivo mais caro da história.",
                demographics: "2ª maior cidade dos EUA, megacidade multicultural"
            },
            {
                id: "usa-dal", name: "Dallas", countryCode: "USA",
                population: "~7.6 milhões (Área Metropolitana)", description: "Uma metrópole moderna no Texas. Receberá MAIS JOGOS que qualquer outro estádio (9 jogos).",
                highlights: ["Arts District", "Reunion Tower", "Deep Ellum", "Dealey Plaza", "AT&T Stadium"],
                stadiumName: "AT&T Stadium", stadiumId: "att-stadium", stadiumCapacity: 80000,
                geoCoordinates: [32.7473, -97.0945],
                curiosities: [
                    "Possui um dos maiores telões de LED do mundo (49m x 22m).",
                    "Receberá 9 jogos — mais que qualquer outra sede.",
                    "Sede de uma Semifinal da Copa 2026.",
                    "Argentina (campeã) jogará aqui na fase de grupos."
                ],
                weather: "Muito quente (30-38°C).",
                altitude: 162, timezone: "UTC-6 (CST)", avgTempSummer: "30°C a 38°C",
                gdp: "$570 bilhões", mainEconomicActivities: ["Energia", "Telecomunicações", "Defesa", "Saúde", "Finanças"],
                nearestAirport: "Dallas/Fort Worth (DFW)", wcMatches: 9, wcRole: "⭐ Semifinal + mais jogos",
                stadiumYearBuilt: 2009, stadiumCost: "$1.3 bilhões",
                historicFact: "A sede com mais jogos de toda a Copa 2026. O telão de LED é um dos maiores do mundo.",
                demographics: "4ª maior área metropolitana dos EUA"
            },
            {
                id: "usa-atl", name: "Atlanta", countryCode: "USA",
                population: "~6.1 milhões (Área Metropolitana)", description: "Centro cultural do sul americano. Berço dos direitos civis e sede de grandes marcas como Coca-Cola e CNN.",
                highlights: ["World of Coca-Cola", "Centennial Olympic Park", "Aquário da Geórgia", "Martin Luther King Jr. Center"],
                stadiumName: "Mercedes-Benz Stadium", stadiumId: "mercedes-benz-stadium", stadiumCapacity: 71000,
                geoCoordinates: [33.7553, -84.4006],
                curiosities: [
                    "Teto retrátil único em forma de lente de câmera.",
                    "Preços de alimentação mais baixos da NFL.",
                    "Receberá 8 jogos da Copa 2026.",
                    "O Atlanta United é um dos maiores públicos da MLS."
                ],
                weather: "Quente e úmido (27-33°C).",
                altitude: 320, timezone: "UTC-5 (EST)", avgTempSummer: "27°C a 33°C",
                gdp: "$400 bilhões", mainEconomicActivities: ["Logística", "Mídia (CNN/Turner)", "Alimentos (Coca-Cola)", "Tecnologia"],
                nearestAirport: "Hartsfield-Jackson (ATL) — mais movimentado do mundo", wcMatches: 8, wcRole: "Grupos + Mata-mata",
                stadiumYearBuilt: 2017, stadiumCost: "$1.6 bilhões",
                historicFact: "Sede das Olimpíadas de 1996. O aeroporto Hartsfield-Jackson é o mais movimentado do planeta.",
                demographics: "Centro de negócios do Sudeste americano"
            },
            {
                id: "usa-mia", name: "Miami", countryCode: "USA",
                population: "~6.2 milhões (Área Metropolitana)", description: "Porta de entrada para a América Latina, com praias famosas e vida noturna agitada. Sede da disputa de 3° lugar.",
                highlights: ["South Beach", "Wynwood Walls", "Little Havana", "Art Basel", "Brickell"],
                stadiumName: "Hard Rock Stadium", stadiumId: "hard-rock-stadium", stadiumCapacity: 64767,
                geoCoordinates: [25.9580, -80.2389],
                curiosities: [
                    "Sede da disputa de TERCEIRO LUGAR da Copa 2026.",
                    "Casa do Inter Miami de Lionel Messi.",
                    "Receberá jogos de Brasil e Portugal na fase de grupos.",
                    "Também sede do Super Bowl, F1 e Miami Open."
                ],
                weather: "Tropical e úmido (28-33°C).",
                altitude: 4, timezone: "UTC-5 (EST)", avgTempSummer: "28°C a 33°C",
                gdp: "$380 bilhões", mainEconomicActivities: ["Turismo", "Comércio Internacional", "Finanças", "Imobiliário", "Cruzeiros"],
                nearestAirport: "Miami International (MIA)", wcMatches: 7, wcRole: "🥉 Disputa de 3° Lugar",
                stadiumYearBuilt: 1987, stadiumCost: "$550M (renovação 2016)",
                historicFact: "Conhecida como a 'Cidade Mágica'. O estádio recebeu 6 Super Bowls e agora receberá a Copa.",
                demographics: "Hub multicultural com forte influência caribenha e latina"
            },
            {
                id: "usa-hou", name: "Houston", countryCode: "USA",
                population: "~7 milhões (Área Metropolitana)", description: "Capital energética dos EUA e sede da NASA. Quarta maior cidade do país.",
                highlights: ["Space Center Houston (NASA)", "Museum District", "Buffalo Bayou Park", "Galleria"],
                stadiumName: "NRG Stadium", stadiumId: "nrg-stadium", stadiumCapacity: 72220,
                geoCoordinates: [29.6847, -95.4107],
                curiosities: [
                    "O primeiro estádio da NFL com teto retrátil.",
                    "Sede de múltiplos Super Bowls.",
                    "Cidade-sede da NASA e do programa espacial americano.",
                    "Maior diversidade étnica dos EUA."
                ],
                weather: "Muito quente e úmido (30-36°C).",
                altitude: 12, timezone: "UTC-6 (CST)", avgTempSummer: "30°C a 36°C",
                gdp: "$500 bilhões", mainEconomicActivities: ["Energia (petróleo/gás)", "Aeroespacial (NASA)", "Saúde", "Engenharia"],
                nearestAirport: "George Bush Intercontinental (IAH)", wcMatches: 7, wcRole: "Grupos + Mata-mata",
                stadiumYearBuilt: 2002, stadiumCost: "$474M",
                historicFact: "Famosa pelo 'Houston, we have a problem'. Maior centro médico do mundo (Texas Medical Center).",
                demographics: "4ª maior cidade dos EUA, extremamente diversa etnicamente"
            },
            {
                id: "usa-phi", name: "Filadélfia", countryCode: "USA",
                population: "~6.2 milhões (Área Metropolitana)", description: "Berço da Independência Americana. Cidade histórica com cena gastronômica e cultural vibrante.",
                highlights: ["Liberty Bell", "Independence Hall", "Philadelphia Museum of Art", "Rocky Steps"],
                stadiumName: "Lincoln Financial Field", stadiumId: "lincoln-financial-field", stadiumCapacity: 69176,
                geoCoordinates: [39.9012, -75.1676],
                curiosities: [
                    "100% alimentado por energia renovável.",
                    "Berço da Constituição dos EUA e da Declaração de Independência.",
                    "O 'Philly cheesesteak' é tradição obrigatória.",
                    "Torcida conhecida como uma das mais apaixonadas da NFL."
                ],
                weather: "Quente no verão (24-31°C).",
                altitude: 9, timezone: "UTC-5 (EST)", avgTempSummer: "24°C a 31°C",
                gdp: "$440 bilhões", mainEconomicActivities: ["Farmacêutica", "Educação", "Saúde", "Finanças", "Tecnologia"],
                nearestAirport: "Philadelphia Intl (PHL)", wcMatches: 6, wcRole: "Grupos + Oitavas",
                stadiumYearBuilt: 2003, stadiumCost: "$512M",
                historicFact: "A Declaração de Independência dos EUA foi assinada aqui em 1776.",
                demographics: "6ª maior cidade dos EUA, rica herança histórica"
            },
            {
                id: "usa-sea", name: "Seattle", countryCode: "USA",
                population: "~4 milhões (Área Metropolitana)", description: "Hub tecnológico na costa noroeste. Sede da Amazon, Microsoft e Starbucks. Natureza impressionante.",
                highlights: ["Space Needle", "Pike Place Market", "Mt. Rainier", "Museum of Pop Culture"],
                stadiumName: "Lumen Field", stadiumId: "lumen-field", stadiumCapacity: 69000,
                geoCoordinates: [47.5952, -122.3316],
                curiosities: [
                    "Recordista do 'barulho mais alto do mundo' em estádio (137.6 dB).",
                    "Seattle Sounders é um dos maiores clubes da MLS.",
                    "Home da Amazon, Microsoft e Starbucks.",
                    "Cercada por montanhas e água por todos os lados."
                ],
                weather: "Temperado e ameno (18-24°C).",
                altitude: 5, timezone: "UTC-8 (PST)", avgTempSummer: "18°C a 24°C",
                gdp: "$370 bilhões", mainEconomicActivities: ["Tecnologia (Amazon, Microsoft)", "Aeroespacial (Boeing)", "Café", "Comércio"],
                nearestAirport: "Seattle-Tacoma (SEA)", wcMatches: 6, wcRole: "Grupos + Oitavas",
                stadiumYearBuilt: 2002, stadiumCost: "$430M",
                historicFact: "O Lumen Field tem design acústico que amplifica o som da torcida.",
                demographics: "Uma das cidades que mais cresce nos EUA"
            },
            {
                id: "usa-sf", name: "São Francisco / Santa Clara", countryCode: "USA",
                population: "~4.7 milhões (Bay Area)", description: "No coração do Vale do Silício. Capital global da inovação e tecnologia.",
                highlights: ["Golden Gate Bridge", "Alcatraz", "Fisherman's Wharf", "Silicon Valley"],
                stadiumName: "Levi's Stadium", stadiumId: "levis-stadium", stadiumCapacity: 71000,
                geoCoordinates: [37.4033, -121.9694],
                curiosities: [
                    "No coração do Vale do Silício.",
                    "Estádio com forte identidade sustentável.",
                    "Receberá quartas de final da Copa 2026.",
                    "Sede do Super Bowl 50 (2016)."
                ],
                weather: "Ameno, pouca chuva (18-25°C).",
                altitude: 11, timezone: "UTC-8 (PST)", avgTempSummer: "18°C a 25°C",
                gdp: "$580 bilhões", mainEconomicActivities: ["Tecnologia (Apple, Google, Meta)", "Biotecnologia", "Capital de Risco", "Turismo"],
                nearestAirport: "San Jose Intl (SJC)", wcMatches: 6, wcRole: "Grupos + Quartas",
                stadiumYearBuilt: 2014, stadiumCost: "$1.3 bilhões",
                historicFact: "A Bay Area concentra mais empresas de tecnologia do que qualquer outro lugar no mundo.",
                demographics: "Centro global da inovação tecnológica"
            },
            {
                id: "usa-kc", name: "Kansas City", countryCode: "USA",
                population: "~2.2 milhões (Área Metropolitana)", description: "O coração da América. Famosa por seu churrasco (BBQ), jazz e enorme paixão esportiva.",
                highlights: ["BBQ Kansas City", "National WWI Museum", "Nelson-Atkins Museum", "Country Club Plaza"],
                stadiumName: "GEHA Field at Arrowhead", stadiumId: "arrowhead-stadium", stadiumCapacity: 73000,
                geoCoordinates: [39.0489, -94.4839],
                curiosities: [
                    "Um dos estádios mais barulhentos da NFL.",
                    "Casa dos Kansas City Chiefs, tricampeões do Super Bowl.",
                    "O BBQ de Kansas City é considerado o melhor dos EUA.",
                    "O Arrowhead é o estádio mais antigo da Copa 2026 (1972)."
                ],
                weather: "Quente no verão (26-33°C).",
                altitude: 275, timezone: "UTC-6 (CST)", avgTempSummer: "26°C a 33°C",
                gdp: "$140 bilhões", mainEconomicActivities: ["Agronegócio", "Logística", "Automotivo", "Saúde"],
                nearestAirport: "Kansas City Intl (MCI)", wcMatches: 6, wcRole: "Grupos + Oitavas",
                stadiumYearBuilt: 1972, stadiumCost: "$375M (renovação 2010)",
                historicFact: "Arrowhead Stadium detém o recorde Guinness de barulho de estádio.",
                demographics: "Localizada na divisa de Missouri e Kansas"
            },
            {
                id: "usa-bos", name: "Boston / Foxborough", countryCode: "USA",
                population: "~4.9 milhões (Área Metropolitana)", description: "A cidade mais antiga dos EUA, berço da Revolução Americana. Hub de educação (Harvard, MIT) e inovação.",
                highlights: ["Freedom Trail", "Harvard/MIT", "Fenway Park", "Boston Harbor", "Beacon Hill"],
                stadiumName: "Gillette Stadium", stadiumId: "gillette-stadium", stadiumCapacity: 65878,
                geoCoordinates: [42.0909, -71.2643],
                curiosities: [
                    "Região berço da Revolução Americana.",
                    "Harvard e MIT ficam na Grande Boston.",
                    "O New England Revolution (MLS) joga aqui.",
                    "Receberá 7 jogos da Copa 2026."
                ],
                weather: "Agradável no verão (22-28°C).",
                altitude: 55, timezone: "UTC-5 (EST)", avgTempSummer: "22°C a 28°C",
                gdp: "$460 bilhões", mainEconomicActivities: ["Educação (Harvard, MIT)", "Saúde/Biotecnologia", "Finanças", "Tecnologia"],
                nearestAirport: "Boston Logan Intl (BOS)", wcMatches: 7, wcRole: "Grupos + Mata-mata",
                stadiumYearBuilt: 2002, stadiumCost: "$325M",
                historicFact: "A Boston Tea Party de 1773 foi um dos eventos que iniciou a Revolução Americana.",
                demographics: "Centro acadêmico e de inovação de classe mundial"
            }
        ]
    },
    {
        code: "CAN",
        name: "Canadá",
        flag: "🇨🇦",
        description: "Estreando como anfitrião da Copa masculina. Uma nação vasta, multicultural e conhecida por sua natureza espetacular.",
        capital: "Ottawa",
        population: "~39 milhões",
        currency: "Dólar Canadense (CAD)",
        gdp: "$2.1 trilhões (CAD)",
        area: "9.985.000 km² (2° maior do mundo)",
        officialLanguage: "Inglês e Francês",
        hdi: "0.936 (Muito Alto)",
        continent: "América do Norte",
        fifaRanking: "~43°",
        wcParticipations: 2,
        wcBestResult: "Fase de Grupos (2022)",
        timezone: "UTC-3.5 a UTC-8",
        majorReligion: "Cristianismo",
        footballHistory: "Em ascensão meteórica com a geração de Alphonso Davies. Voltou à Copa em 2022 após 36 anos e agora é anfitrião.",
        travelTips: [
            "Prepare-se para grandes distâncias entre as cidades.",
            "Explore os parques nacionais se tiver tempo.",
            "Culinária multicultural incrível nas grandes cidades.",
            "O país é extremamente seguro e acolhedor.",
            "Se visitar Quebec, o francês é útil."
        ],
        cities: [
            {
                id: "can-tor", name: "Toronto", countryCode: "CAN",
                population: "~6.2 milhões (Greater Toronto Area)", description: "A maior cidade do Canadá, incrivelmente diversa e cosmopolita. Centro financeiro e cultural.",
                highlights: ["CN Tower", "Royal Ontario Museum", "Toronto Islands", "Kensington Market", "Distillery District"],
                stadiumName: "BMO Field", stadiumId: "bmo-field", stadiumCapacity: 45000,
                geoCoordinates: [43.6332, -79.4186],
                curiosities: [
                    "A cidade mais multicultural do mundo — 200+ nacionalidades.",
                    "Sede do Hall da Fama do Hockey.",
                    "O BMO Field foi expandido para 45.000 lugares para a Copa.",
                    "Maior sede das filmagens de Hollywood fora dos EUA."
                ],
                weather: "Agradável no verão (20-27°C).",
                altitude: 76, timezone: "UTC-5 (EST)", avgTempSummer: "20°C a 27°C",
                gdp: "$320 bilhões (CAD)", mainEconomicActivities: ["Finanças", "Mineração", "Imobiliário", "Cinema", "Tecnologia"],
                nearestAirport: "Toronto Pearson (YYZ)", wcMatches: 5, wcRole: "Grupos + Oitavas",
                stadiumYearBuilt: 2007, stadiumCost: "$150M (expansão 2025)",
                historicFact: "Mais de 200 línguas e dialetos são falados em Toronto — a cidade mais diversa do mundo.",
                demographics: "Maior cidade do Canadá, centro financeiro nacional"
            },
            {
                id: "can-van", name: "Vancouver", countryCode: "CAN",
                population: "~2.6 milhões (Greater Vancouver)", description: "Jóia da costa oeste, cercada por montanhas e oceano. Consistentemente eleita uma das melhores cidades do mundo para se viver.",
                highlights: ["Stanley Park", "Granville Island", "Capilano Bridge", "Gastown", "Whistler (1h)"],
                stadiumName: "BC Place", stadiumId: "bc-place", stadiumCapacity: 54500,
                geoCoordinates: [49.2768, -123.1120],
                curiosities: [
                    "Sediou a final da Copa Feminina de 2015.",
                    "Cerimônia de Abertura das Olimpíadas de Inverno 2010.",
                    "Cenário de centenas de filmes e séries ('Hollywood North').",
                    "Rodeada por montanhas cobertas de neve e o Pacífico."
                ],
                weather: "Ameno, pode chover (17-23°C).",
                altitude: 1, timezone: "UTC-8 (PST)", avgTempSummer: "17°C a 23°C",
                gdp: "$140 bilhões (CAD)", mainEconomicActivities: ["Cinema", "Mineração", "Tecnologia", "Silvicultura", "Turismo"],
                nearestAirport: "Vancouver Intl (YVR)", wcMatches: 5, wcRole: "Grupos + Oitavas",
                stadiumYearBuilt: 1983, stadiumCost: "$563M (renovação teto retrátil)",
                historicFact: "Sede da final da Copa do Mundo Feminina de 2015. Nomeada 3x como 'Melhor Cidade para Viver'.",
                demographics: "3ª maior cidade do Canadá, grande comunidade asiática"
            }
        ]
    }
];

export const generalCuriosities = [
    {
        title: "Copa Gigante",
        description: "A primeira com 48 seleções e 104 jogos. O maior evento esportivo já realizado na história.",
        icon: "Globe"
    },
    {
        title: "Três Anfitriões",
        description: "Inédito: EUA, México e Canadá dividem a sede, unindo a América do Norte pela primeira vez.",
        icon: "Map"
    },
    {
        title: "Impacto Bilionário",
        description: "Previsão de mais de $14 bilhões em atividade econômica. Mais de 5 milhões de turistas esperados.",
        icon: "TrendingUp"
    },
    {
        title: "Sustentabilidade",
        description: "Nenhum estádio novo foi construído. Foco total em reutilizar a infraestrutura existente.",
        icon: "Leaf"
    },
    {
        title: "16 Cidades-Sede",
        description: "11 nos EUA, 3 no México e 2 no Canadá. A Copa mais geograficamente diversa da história.",
        icon: "Map"
    },
    {
        title: "Fuso Horário",
        description: "5 fusos horários diferentes entre as sedes. De Vancouver (-8h) a Nova York (-5h).",
        icon: "Globe"
    }
];
