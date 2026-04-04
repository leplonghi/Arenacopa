/**
 * seed-leagues.mjs
 * Busca dados REAIS de partidas, classificações e times
 * da API football-data.org e popula o Firestore.
 *
 * Uso:
 *   1. Cadastre-se GRÁTIS em: https://www.football-data.org/client/register
 *   2. Pegue sua API Key no painel
 *   3. Adicione ao .env:  FOOTBALL_DATA_API_KEY=sua_chave_aqui
 *   4. Execute: node scripts/seed-leagues.mjs
 *
 * Rate limit gratuito: 10 req/min → o script aguarda automaticamente.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  writeBatch,
  doc,
  setDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Lê .env ────────────────────────────────────────────────────
const envPath = resolve(__dir, "../.env");
const envVars = {};
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  envVars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
}

const FDO_KEY = process.env.FOOTBALL_DATA_API_KEY || envVars.FOOTBALL_DATA_API_KEY || "";
if (!FDO_KEY) {
  console.error("\n❌ FOOTBALL_DATA_API_KEY não encontrada!");
  console.error("   Cadastre-se em: https://www.football-data.org/client/register");
  console.error("   Adicione ao .env: FOOTBALL_DATA_API_KEY=sua_chave\n");
  process.exit(1);
}

// ── Firebase ────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            envVars.VITE_FIREBASE_API_KEY,
  authDomain:        envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             envVars.VITE_FIREBASE_APP_ID,
};
const fbApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

console.log(`\n🔥 Firebase: ${firebaseConfig.projectId}`);

// ── Campeonatos ─────────────────────────────────────────────────
const CHAMPS = [
  { id: "brasileirao2026", fdoId: 2013, name: "Brasileirão",       season: "2026"    },
  { id: "ucl2526",         fdoId: 2001, name: "Champions League",  season: "2025"    },
  { id: "laliga2526",      fdoId: 2014, name: "La Liga",           season: "2025"    },
  { id: "premier2526",     fdoId: 2021, name: "Premier League",    season: "2024"    },
];

// ── Helpers ─────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let reqCount = 0;
let windowStart = Date.now();

async function fdo(path) {
  // Rate limit: 10 req/min
  reqCount++;
  if (reqCount > 9) {
    const elapsed = Date.now() - windowStart;
    if (elapsed < 62000) {
      const wait = 62000 - elapsed;
      console.log(`   ⏳ Rate limit: aguardando ${Math.ceil(wait / 1000)}s...`);
      await sleep(wait);
    }
    reqCount = 1;
    windowStart = Date.now();
  }
  const url = `https://api.football-data.org/v4${path}`;
  const res = await fetch(url, { headers: { "X-Auth-Token": FDO_KEY } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`FDO ${res.status} ${path}: ${txt}`);
  }
  return res.json();
}

function mapStatus(s) {
  if (s === "FINISHED" || s === "AWARDED") return "finished";
  if (s === "IN_PLAY" || s === "PAUSED") return "live";
  return "upcoming";
}

// ── Batch write helper (max 500/batch) ─────────────────────────
async function batchWrite(items, collectionName, getId) {
  const chunks = [];
  for (let i = 0; i < items.length; i += 490) chunks.push(items.slice(i, i + 490));
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const item of chunk) {
      batch.set(doc(db, collectionName, getId(item)), item, { merge: true });
    }
    await batch.commit();
  }
  console.log(`   ✅ ${items.length} documentos → ${collectionName}`);
}

// ── Seed Teams ─────────────────────────────────────────────────
async function seedTeams(champId, fdoId, season) {
  console.log(`\n👕 Times: ${champId}`);
  try {
    const data = await fdo(`/competitions/${fdoId}/teams?season=${season}`);
    const teams = (data.teams || []).map((t) => ({
      id: String(t.id),
      name: t.name,
      short_name: t.shortName || t.name,
      tla: t.tla || t.name.slice(0, 3).toUpperCase(),
      crest: t.crest || "",
      country: t.area?.name || "",
      championships: [champId],
    }));
    await batchWrite(teams, "teams", (t) => t.id);
    return teams;
  } catch (e) {
    console.error(`   ⚠️  Erro times ${champId}: ${e.message}`);
    return [];
  }
}

// ── Seed Matches ──────────────────────────────────────────────
async function seedMatches(champId, fdoId, season) {
  console.log(`\n⚽ Partidas: ${champId}`);
  try {
    const data = await fdo(`/competitions/${fdoId}/matches?season=${season}`);
    const matches = (data.matches || []).map((m) => ({
      id: `fdo-${m.id}`,
      championship_id: champId,
      home_team_code: m.homeTeam?.tla || m.homeTeam?.shortName?.slice(0, 3).toUpperCase() || "???",
      away_team_code: m.awayTeam?.tla || m.awayTeam?.shortName?.slice(0, 3).toUpperCase() || "???",
      home_team_name: m.homeTeam?.name || "",
      away_team_name: m.awayTeam?.name || "",
      home_team_id: String(m.homeTeam?.id || ""),
      away_team_id: String(m.awayTeam?.id || ""),
      home_crest: m.homeTeam?.crest || "",
      away_crest: m.awayTeam?.crest || "",
      home_score: m.score?.fullTime?.home ?? null,
      away_score: m.score?.fullTime?.away ?? null,
      match_date: m.utcDate,
      status: mapStatus(m.status),
      stage: m.stage || "REGULAR_SEASON",
      round: m.matchday || null,
      group_id: m.group || null,
      venue_id: "",
    }));
    await batchWrite(matches, "matches", (m) => m.id);
    console.log(`   📊 ${matches.filter(m => m.status === "finished").length} finalizados, ${matches.filter(m => m.status === "upcoming").length} agendados`);
    return matches;
  } catch (e) {
    console.error(`   ⚠️  Erro partidas ${champId}: ${e.message}`);
    return [];
  }
}

// ── Seed Standings ────────────────────────────────────────────
async function seedStandings(champId, fdoId, season) {
  console.log(`\n📊 Classificação: ${champId}`);
  try {
    const data = await fdo(`/competitions/${fdoId}/standings?season=${season}`);
    const standing = (data.standings || []).find(
      (s) => s.type === "TOTAL" || s.stage === "REGULAR_SEASON"
    ) || data.standings?.[0];
    if (!standing?.table?.length) {
      console.log("   ⚠️  Sem tabela disponível");
      return;
    }
    const table = standing.table.map((row) => ({
      position: row.position,
      team_id: String(row.team?.id || ""),
      team_name: row.team?.name || "",
      team_short: row.team?.shortName || row.team?.name || "",
      team_tla: row.team?.tla || row.team?.name?.slice(0, 3).toUpperCase() || "???",
      crest: row.team?.crest || "",
      played: row.playedGames || 0,
      won: row.won || 0,
      drawn: row.draw || 0,
      lost: row.lost || 0,
      goals_for: row.goalsFor || 0,
      goals_against: row.goalsAgainst || 0,
      goal_difference: row.goalDifference || 0,
      points: row.points || 0,
      form: row.form || "",
    }));
    const doc_data = {
      id: champId,
      championship_id: champId,
      season: String(season),
      updated_at: new Date().toISOString(),
      table,
    };
    await setDoc(doc(db, "standings", champId), doc_data, { merge: true });
    console.log(`   ✅ ${table.length} times na tabela`);
  } catch (e) {
    console.error(`   ⚠️  Erro classificação ${champId}: ${e.message}`);
  }
}

// ── Seed News ─────────────────────────────────────────────────
async function seedLeagueNews() {
  console.log("\n📰 Notícias dos campeonatos");
  const now = new Date().toISOString();
  const newsItems = [
    {
      id: "news-brasileirao-1",
      championship_id: "brasileirao2026",
      title: "Brasileirão 2026: temporada começa com surpresas na rodada inaugural",
      content: "O Campeonato Brasileiro 2026 deu início com partidas emocionantes. Clubes tradicionais buscam o título nesta que promete ser uma das edições mais disputadas da história.",
      category: "Brasileirão",
      source_name: "GloboEsporte",
      published_at: now,
      url_to_image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&q=80&w=1200",
      url: "https://ge.globo.com",
      views: 8500,
    },
    {
      id: "news-brasileirao-2",
      championship_id: "brasileirao2026",
      title: "Flamengo e Palmeiras já miriam o hexa do Brasileirão",
      content: "Os dois gigantes do futebol brasileiro chegam reforçados para a temporada 2026 e são apontados como favoritos ao título.",
      category: "Brasileirão",
      source_name: "UOL Esporte",
      published_at: now,
      url_to_image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
      url: "https://esporte.uol.com.br",
      views: 6200,
    },
    {
      id: "news-ucl-1",
      championship_id: "ucl2526",
      title: "Champions League: quartas de final prometem duelos históricos",
      content: "Real Madrid, Barcelona, Manchester City e Bayern de Munique lutam pelas vagas na semifinal da Liga dos Campeões 2025-26.",
      category: "Champions",
      source_name: "ESPN",
      published_at: now,
      url_to_image: "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200",
      url: "https://espn.com.br",
      views: 14300,
    },
    {
      id: "news-ucl-2",
      championship_id: "ucl2526",
      title: "Novo formato da Champions League agrada torcedores e clubes",
      content: "O modelo Swiss com 36 equipes trouxe mais jogos e emoção à fase de grupos. UEFA considera ampliar o formato para 2028.",
      category: "Champions",
      source_name: "UEFA",
      published_at: now,
      url_to_image: "https://images.unsplash.com/photo-1555500578-24b1d65fa9a9?auto=format&fit=crop&q=80&w=1200",
      url: "https://uefa.com",
      views: 9800,
    },
    {
      id: "news-laliga-1",
      championship_id: "laliga2526",
      title: "La Liga 2025-26: temporada caminha para desfecho emocionante",
      content: "Com poucos pontos de diferença entre os líderes, o título espanhol pode ser decidido nas últimas rodadas desta temporada.",
      category: "La Liga",
      source_name: "Marca",
      published_at: now,
      url_to_image: "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200",
      url: "https://marca.com",
      views: 7600,
    },
    {
      id: "news-laliga-2",
      championship_id: "laliga2526",
      title: "Barcelona e Real Madrid: El Clásico define rumo do título",
      content: "O clássico espanhol desta temporada pode ser decisivo para a corrida pelo título da La Liga. Ambas as equipes chegam empatadas em pontos.",
      category: "La Liga",
      source_name: "AS",
      published_at: now,
      url_to_image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&q=80&w=1200",
      url: "https://as.com",
      views: 11200,
    },
    {
      id: "news-premier-1",
      championship_id: "premier2526",
      title: "Premier League: título em aberto nas últimas rodadas",
      content: "A Premier League 2025-26 mantém a tradição de incerteza. Manchester City, Arsenal e Liverpool ainda disputam o topo da tabela.",
      category: "Premier League",
      source_name: "BBC Sport",
      published_at: now,
      url_to_image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
      url: "https://bbc.co.uk/sport",
      views: 13100,
    },
    {
      id: "news-premier-2",
      championship_id: "premier2526",
      title: "Haaland e Salah disputam artilharia da Premier League",
      content: "O norueguês do City e o egípcio do Liverpool somam mais de 40 gols combinados nesta temporada, em uma das corridas mais disputadas pela artilharia do campeonato.",
      category: "Premier League",
      source_name: "Sky Sports",
      published_at: now,
      url_to_image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&q=80&w=1200",
      url: "https://skysports.com",
      views: 9400,
    },
  ];
  await batchWrite(newsItems, "news", (n) => n.id);
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log("━".repeat(55));
  console.log("🌎 ArenaCopa — Seed de Dados das Ligas");
  console.log("━".repeat(55));
  console.log(`🔑 API Key: ${FDO_KEY.slice(0, 6)}${"*".repeat(FDO_KEY.length - 6)}`);

  for (const champ of CHAMPS) {
    console.log(`\n${"─".repeat(50)}`);
    console.log(`🏆 ${champ.name} (${champ.id})`);
    await seedTeams(champ.id, champ.fdoId, champ.season);
    await seedMatches(champ.id, champ.fdoId, champ.season);
    await seedStandings(champ.id, champ.fdoId, champ.season);
    // Pausa entre campeonatos para não estourar rate limit
    console.log("   ⏸  Aguardando 10s antes do próximo campeonato...");
    await sleep(10000);
  }

  await seedLeagueNews();

  console.log("\n━".repeat(55));
  console.log("✅ Seed concluído! Dados disponíveis no Firestore.");
  console.log("   Abra o app e veja as partidas e classificações reais.");
  console.log("━".repeat(55) + "\n");
  process.exit(0);
}

main().catch((e) => { console.error("❌ Erro fatal:", e); process.exit(1); });
