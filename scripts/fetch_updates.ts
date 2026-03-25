/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // Requires: npm install dotenv

// If running locally, load env from .env file or process.env
// Ensure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (for writing)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Service role preferred for updates

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Types (simplified for script)
interface NewsItem {
    title: string;
    summary: string;
    url: string;
    source: string;
    category: string;
    image_url?: string;
}

// --- MOCK DATA GENERATORS (Replace with real APIs) ---

async function fetchLatestNews(): Promise<NewsItem[]> {
    console.log("📡 Fetching latest news (simulated)...");
    // In a real scenario, use NewsAPI, FIFA RSS, or similar.
    // Example: const res = await fetch('https://newsapi.org/v2/...');

    const mockNews: NewsItem[] = [
        {
            title: "FIFA confirma horários da abertura da Copa 2026",
            summary: "A partida inaugural no Estádio Azteca terá cerimônia especial às 14h locais.",
            url: "https://fifa.com/news/opening-match-schedule",
            source: "FIFA Official",
            category: "schedule",
            image_url: "https://images.unsplash.com/photo-1522778119026-d647f0565c6a"
        },
        {
            title: "Obras no SoFi Stadium avançam para o mundial",
            summary: "O estádio em Los Angeles recebe melhorias no gramado para atender aos padrões da FIFA.",
            url: "https://espn.com/soccer/worldcup2026",
            source: "ESPN",
            category: "venue",
            image_url: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5"
        },
        {
            title: "Brasil define base de treinamento nos EUA",
            summary: "A seleção brasileira deve ficar na Flórida durante a fase de grupos.",
            url: "https://globoesporte.globo.com/futebol/selecao-brasileira",
            source: "GloboEsporte",
            category: "team",
            image_url: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6"
        }
    ];
    return mockNews;
}

async function fetchCuriosities() {
    console.log("🔍 Fetching new curiosities...");
    return [
        {
            content: "O Estádio Azteca será o primeiro a sediar três aberturas de Copa do Mundo (1970, 1986, 2026).",
            category: "history",
            image_url: "https://images.unsplash.com/photo-1628178651817-64df7a192663",
            displayed_count: 0
        },
        {
            content: "A Copa de 2026 terá o maior número de viagens para as seleções devido à extensão territorial.",
            category: "stats",
            displayed_count: 0
        }
    ];
}

async function fetchTeamUpdates() {
    console.log("🚑 Fetching team updates (simulated)...");
    return [
        {
            team_code: "BRA",
            content: "Neymar Jr. confirmado para o próximo treino aberto.",
            type: "news",
            source_url: "cbf.com.br"
        },
        {
            team_code: "FRA",
            content: "Mbappé sente desconforto muscular e é dúvida para a estreia.",
            type: "injury",
            source_url: "lequipe.fr"
        }
    ];
}

async function updateCityWeather() {
    console.log("🌤️ Updating host city weather...");
    // List of cities (matching IDs in guiaData.ts)
    const cities = [
        'mex-cdmx', 'mex-mty', 'mex-gdl',
        'usa-ny', 'usa-la', 'usa-dal', 'usa-atl', 'usa-mia',
        'can-tor', 'can-van'
    ];

    for (const city of cities) {
        // Mock weather data
        const temp = Math.floor(Math.random() * 15) + 15; // 15-30 degrees
        const condition = ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)];

        const { error } = await supabase
            .from('city_status')
            .upsert({
                city_id: city,
                temperature: temp,
                condition: condition,
                last_updated: new Date().toISOString()
            });

        if (error) console.error(`Error updating ${city}:`, error.message);
    }
}

async function updateStadiumStatus() {
    console.log("🏟️ Updating stadium status...");
    const stadiums = [
        'estadio-azteca', 'estadio-bbva', 'estadio-akron',
        'metlife-stadium', 'sofi-stadium', 'att-stadium', 'mercedes-benz-stadium', 'hard-rock-stadium',
        'bmo-field', 'bc-place'
    ];

    for (const stadium of stadiums) {
        const statuses = ['operational', 'maintenance', 'match-day'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        const { error } = await supabase
            .from('stadium_status')
            .upsert({
                stadium_id: stadium,
                status: status,
                next_match_id: null, // Could link to a match ID if available
                last_updated: new Date().toISOString()
            });

        if (error) console.error(`Error updating stadium ${stadium}:`, error.message);
    }
}

// --- MAIN EXECUTION ---

async function main() {
    console.log("🚀 Starting Daily Update Script for ArenaCup...");

    // 1. Update News
    const news = await fetchLatestNews();
    for (const item of news) {
        // Check if exists by title to avoid duplicates (naive check)
        const { data: existing } = await supabase.from('news').select('id').eq('title', item.title).single();
        if (!existing) {
            const { error } = await supabase.from('news').insert(item);
            if (error) console.error("Error inserting news:", error.message);
            else console.log(`✅ News added: ${item.title}`);
        }
    }

    // 2. Update Curiosities
    const curiosities = await fetchCuriosities();
    for (const item of curiosities) {
        const { data: existing } = await supabase.from('curiosities').select('id').eq('content', item.content).single();
        if (!existing) {
            const { error } = await supabase.from('curiosities').insert(item);
            if (error) console.error("Error inserting curiosity:", error.message);
            else console.log(`✅ Curiosity added: ${item.content.substring(0, 30)}...`);
        }
    }

    // 3. Update Team Updates
    const teamUpdates = await fetchTeamUpdates();
    for (const update of teamUpdates) {
        const { data: existing } = await supabase
            .from('team_updates')
            .select('id')
            .eq('content', update.content)
            .eq('team_code', update.team_code)
            .single();

        if (!existing) {
            const { error } = await supabase.from('team_updates').insert(update);
            if (error) console.error(`Error inserting team update for ${update.team_code}:`, error.message);
            else console.log(`✅ Team update added: [${update.team_code}] ${update.content}`);
        }
    }

    // 4. Update Weather
    await updateCityWeather();

    // 5. Update Stadium Status
    await updateStadiumStatus();

    console.log("🏁 Update complete. Have a great day!");
}

main().catch(console.error);
