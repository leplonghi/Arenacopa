/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';

/**
 * ARENA CUP - SEDES DATA GENERATOR (V2 - Data Driven)
 * Este script gera o arquivo de dados mestre para as sedes da Copa 2026.
 * Lê de scripts/rich_sedes_data.json para evitar poluição no script.
 */

// Interfaces base para tipagem do script
interface RawCity {
    id: string;
    name: string;
    countryCode: 'USA' | 'MEX' | 'CAN';
    population: string;
    description: string;
    highlights: string[];
    stadium: {
        name: string;
        id: string;
        capacity: number;
        yearBuilt: number;
        cost: string;
        historicFact: string;
        image: string;
    };
    travel: {
        airport: string;
        transport: string;
        dishes: { name: string; description: string }[];
        attractions: { name: string; description: string }[];
    };
    trivia: string[];
    economics: string;
    coordinates: [number, number];
    climate: string;
    wcMatches?: number;
    wcRole?: string;
}

// Carrega os dados ricos
const richDataPath = path.resolve('scripts/rich_sedes_data.json');
const sedes: RawCity[] = JSON.parse(fs.readFileSync(richDataPath, 'utf8'));

const content = `
// ARENA CUP - GUIA DATA (MASTER)
// Este arquivo é gerado automaticamente via scripts/generate_sedes_data.ts
// Não edite manualmente.

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
    gdp?: string;
    wcParticipations?: number;
}

const rawCities: HostCity[] = ${JSON.stringify(sedes.map(s => ({
    id: s.id,
    name: s.name,
    countryCode: s.countryCode,
    population: s.population,
    description: s.description,
    highlights: s.highlights,
    stadiumName: s.stadium.name,
    stadiumId: s.stadium.id,
    stadiumCapacity: s.stadium.capacity,
    image: s.stadium.image,
    geoCoordinates: s.coordinates,
    curiosities: s.trivia,
    weather: s.climate,
    travelGuide: {
        heroImage: s.stadium.image,
        transport: {
            airport: s.travel.airport,
            publicTransport: s.travel.transport,
            taxiUber: "Uber e Lyft amplamente disponíveis em todas as sedes."
        },
        gastronomy: {
            title: "Culinária Local",
            dishes: s.travel.dishes.map(d => ({ ...d, priceLevel: "medium" })),
            tips: ["Não deixe de provar os pratos locais em mercados tradicionais.", "A gorjeta sugerida nos EUA é de 18-20%."]
        },
        tourism: {
            topAttractions: s.travel.attractions,
            hiddenGems: ["Passeios alternativos pela manhã", "Vista privilegiada do pôr do sol local"]
        },
        accommodation: {
            avgHotelPrice: "US$ 180 - 450 / noite",
            avgAirbnbPrice: "US$ 120 - 250 / noite",
            bestAreas: ["Centro da Cidade", "Áreas próximas ao estádio"]
        },
        safety: {
            level: "safe",
            tips: ["Mantenha atenção dobrada em locais de grande aglomeração.", "Siga as orientações das autoridades locais nos estádios."],
            emergencyNumbers: ["911"]
        }
    },
    stadiumYearBuilt: s.stadium.yearBuilt,
    stadiumCost: s.stadium.cost,
    historicFact: s.stadium.historicFact,
    gdp: s.economics,
    wcMatches: s.wcMatches,
    wcRole: s.wcRole
})), null, 4)};

export const hostCountries: HostCountry[] = [
    {
        code: "MEX",
        name: "México",
        flag: "🇲🇽",
        description: "O México se tornará o primeiro país a sediar a Copa do Mundo três vezes.",
        capital: "Cidade do México",
        population: "~128 milhões",
        currency: "Peso Mexicano (MXN)",
        footballHistory: "Anfitrião em 1970 e 1986. Berço de Pelé e Maradona campeões.",
        travelTips: ["Prove os tacos legítimos.", "Cuidado com a altitude na Cidade do México."],
        cities: rawCities.filter(c => c.countryCode === 'MEX'),
        gdp: "US$ 1.3 Trilhões",
        wcParticipations: 17
    },
    {
        code: "USA",
        name: "Estados Unidos",
        flag: "🇺🇸",
        description: "Os EUA voltam a sediar a Copa após 1994, agora com 11 cidades.",
        capital: "Washington, D.C.",
        population: "~334 milhões",
        currency: "Dólar Americano (USD)",
        footballHistory: "O esporte cresceu muito desde 94. MLS é hoje uma grande liga.",
        travelTips: ["Alugue um carro para distâncias longas.", "O seguro viagem é altamente recomendado."],
        cities: rawCities.filter(c => c.countryCode === 'USA'),
        gdp: "US$ 23 Trilhões",
        wcParticipations: 11
    },
    {
        code: "CAN",
        name: "Canadá",
        flag: "🇨🇦",
        description: "Primeira vez que o Canadá sedia o mundial masculino.",
        capital: "Ottawa",
        population: "~39 milhões",
        currency: "Dólar Canadense (CAD)",
        footballHistory: "Geração de ouro com Alphonso Davies levando país à Copa.",
        travelTips: ["Prepare-se para o clima variável no litoral.", "O transporte público em Toronto é exemplar."],
        cities: rawCities.filter(c => c.countryCode === 'CAN'),
        gdp: "US$ 2 Trilhões",
        wcParticipations: 2
    }
];

export const generalCuriosities = [
    { title: "Copa Gigante", description: "A primeira com 48 seleções e 104 jogos.", icon: "Globe" },
    { title: "Três Anfitriões", description: "EUA, México e Canadá dividem a sede pela primeira vez.", icon: "Map" },
    { title: "Sustentabilidade", description: "Vários estádios utilizam energia 100% renovável.", icon: "Leaf" }
];
`;

const dataPath = path.resolve('src/data/guiaData.ts');
fs.writeFileSync(dataPath, content);

// --- GENERATE TRANSLATIONS ---
const locales = ['pt-BR', 'en', 'es'];
locales.forEach(locale => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translation: any = {
        ui: {
            title: locale === 'pt-BR' ? "Copa do Mundo 2026" : (locale === 'es' ? "Copa del Mundo 2026" : "2026 World Cup"),
            subtitle: locale === 'pt-BR' ? "3 países anfitriões • 16 cidades-sede • 104 jogos" : (locale === 'es' ? "3 países anfitriones • 16 ciudades sede • 104 juegos" : "3 host countries • 16 host cities • 104 matches"),
            stadiumsCount: locale === 'pt-BR' ? "16 Estádios" : (locale === 'es' ? "16 Estadios" : "16 Stadiums"),
            teamsCount: locale === 'pt-BR' ? "48 Seleções" : (locale === 'es' ? "48 Selecciones" : "48 Teams"),
            exploring: locale === 'pt-BR' ? "Explorando" : (locale === 'es' ? "Explorando" : "Exploring"),
            curiosity: locale === 'pt-BR' ? "Você Sabia?" : (locale === 'es' ? "¿Sabías que?" : "Did You Know?"),
            historicFact: locale === 'pt-BR' ? "Fato Histórico" : (locale === 'es' ? "Hecho Histórico" : "Historic Fact"),
            planTrip: locale === 'pt-BR' ? "Planejar Viagem para" : (locale === 'es' ? "Planear viaje a" : "Plan Trip to"),
            population: locale === 'pt-BR' ? "População" : (locale === 'es' ? "Población" : "Population"),
            currency: locale === 'pt-BR' ? "Moeda" : (locale === 'es' ? "Moneda" : "Currency"),
            gdp: locale === 'pt-BR' ? "PIB Est." : (locale === 'es' ? "PIB Est." : "Est. GDP"),
            wcCount: locale === 'pt-BR' ? "Copa" : (locale === 'es' ? "Copa" : "WC"),
            stadiums: locale === 'pt-BR' ? "Estádios" : (locale === 'es' ? "Estadios" : "Stadiums"),
            cityGuide: locale === 'pt-BR' ? "Guia da Cidade" : (locale === 'es' ? "Guía de la Ciudad" : "City Guide"),
            weather: locale === 'pt-BR' ? "Clima" : (locale === 'es' ? "Clima" : "Weather"),
            tabs: {
                general: locale === 'pt-BR' ? "Geral" : (locale === 'es' ? "General" : "General"),
                tourism: locale === 'pt-BR' ? "Turismo" : (locale === 'es' ? "Turismo" : "Tourism"),
                gastronomy: locale === 'pt-BR' ? "Gastronomia" : (locale === 'es' ? "Gastronomía" : "Gastronomy")
            },
            modal: {
                seats: locale === 'pt-BR' ? "Lugares" : (locale === 'es' ? "Asientos" : "Seats"),
                safety: locale === 'pt-BR' ? "Segurança" : (locale === 'es' ? "Seguridad" : "Safety"),
                transport: locale === 'pt-BR' ? "Transporte" : (locale === 'es' ? "Transporte" : "Transport"),
                transportDesc: locale === 'pt-BR' ? "Oferece uma malha eficiente para torcedores e turistas." : (locale === 'es' ? "Ofrece una red eficiente para aficionados y turistas." : "Offers an efficient network for fans and tourists."),
                attractions: locale === 'pt-BR' ? "Principais Atrações" : (locale === 'es' ? "Principales Atracciones" : "Top Attractions"),
                hiddenGems: locale === 'pt-BR' ? "Joias Escondidas" : (locale === 'es' ? "Joyas Ocultas" : "Hidden Gems"),
                mustEat: locale === 'pt-BR' ? "Pratos Imperdíveis" : (locale === 'es' ? "Platos Imperdibles" : "Must-Try Dishes"),
                localTips: locale === 'pt-BR' ? "Dicas de Local" : (locale === 'es' ? "Consejos de Locales" : "Local Tips")
            }
        },
        cities: {}
    };

    // Carrega traduções extras se não for PT
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let extraTranslations: any = {};
    const translationsPathEn = path.resolve('scripts/translations_en.json');
    const translationsPathEs = path.resolve('scripts/translations_es.json');
    if (locale === 'en') {
        try { extraTranslations = JSON.parse(fs.readFileSync(translationsPathEn, 'utf-8')); } catch { console.error("EN translation file not found"); }
    } else if (locale === 'es') {
        try { extraTranslations = JSON.parse(fs.readFileSync(translationsPathEs, 'utf-8')); } catch { console.error("ES translation file not found"); }
    }

    sedes.forEach((city: RawCity) => {
        const extra = extraTranslations[city.id] || {};

        translation.cities[city.id] = {
            name: extra.name || city.name,
            description: extra.description || city.description,
            highlights: extra.highlights || city.highlights,
            stadium: {
                name: (extra.stadium && extra.stadium.name) || city.stadium.name,
                historicFact: (extra.stadium && extra.stadium.historicFact) || city.stadium.historicFact
            },
            travel: {
                airport: (extra.travel && extra.travel.airport) || city.travel.airport,
                transport: (extra.travel && extra.travel.transport) || city.travel.transport,
                dishes: (extra.travel && extra.travel.dishes) || city.travel.dishes,
                attractions: (extra.travel && extra.travel.attractions) || city.travel.attractions
            },
            trivia: extra.trivia || city.trivia,
            economics: extra.economics || city.economics,
            weather: extra.weather || city.climate
        };
    });

    const localeDir = path.join(process.cwd(), 'public/locales', locale);
    if (!fs.existsSync(localeDir)) fs.mkdirSync(localeDir, { recursive: true });

    fs.writeFileSync(
        path.join(localeDir, 'sedes.json'),
        JSON.stringify(translation, null, 2)
    );
});

console.log("Success! Sedes data and translations updated for 16 cities.");
