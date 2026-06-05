/**
 * seed-amistosos-2026.mjs
 * Adiciona amistosos pré-Copa do Mundo 2026 no Firestore.
 *
 * Uso: node scripts/seed-amistosos-2026.mjs (da raiz do projeto)
 *
 * Dados baseados no calendário oficial da ESPN (junho/2026).
 * Inclui apenas partidas com ao menos uma seleção participante da Copa 2026.
 * Para atualizar resultados: edite home_score/away_score e status → "finished".
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const admin = require("firebase-admin");

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env");
const envVars = {};
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  envVars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
}

const PROJECT_ID = envVars.VITE_FIREBASE_PROJECT_ID;
if (!PROJECT_ID) { console.error("Missing VITE_FIREBASE_PROJECT_ID"); process.exit(1); }

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

// Crests via flagcdn.com (ISO 3166-1 alpha-2). Atualizável posteriormente.
const F = (code) => `https://flagcdn.com/48x36/${code}.png`;

// ─────────────────────────────────────────────────────────────────────────────
// Partidas reais do período 05–10/jun/2026 (fonte: ESPN, atualizado 05/06/2026)
// Apenas partidas com ≥1 seleção classificada para a Copa 2026.
//
// Grupos da Copa 2026 (para referência de códigos):
// A: MEX RSA KOR   B: CAN QAT SUI   C: BRA MAR HAI SCO   D: USA PAR AUS
// E: GER CIV ECU   F: NED JPN TUN   G: BEL EGY IRN NZL   H: ESP SAU URU
// I: FRA SEN NOR   J: ARG ALG AUT JOR   K: POR UZB COL   L: ENG CRO GHA
//
// status: "scheduled" | "finished"
// Para "finished" preencha home_score e away_score.
// ─────────────────────────────────────────────────────────────────────────────
const AMISTOSOS = [
  // ── 5 de junho (Brasil: madrugada 6/jun) ────────────────────────────────────
  {
    id: "friendly_20260605_PAR_NCA",
    home_team_code: "PAR", away_team_code: "NCA",
    home_team_name: "Paraguai", away_team_name: "Nicarágua",
    home_crest: F("py"), away_crest: F("ni"),
    match_date: "2026-06-05T23:15:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260606_CAN_IRL",
    home_team_code: "CAN", away_team_code: "IRL",
    home_team_name: "Canadá", away_team_name: "Rep. da Irlanda",
    home_crest: F("ca"), away_crest: F("ie"),
    match_date: "2026-06-06T00:30:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260606_SAU_PRI",
    home_team_code: "SAU", away_team_code: "PRI",
    home_team_name: "Arábia Saudita", away_team_name: "Porto Rico",
    home_crest: F("sa"), away_crest: F("pr"),
    match_date: "2026-06-06T01:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260606_HAI_PER",
    home_team_code: "HAI", away_team_code: "PER",
    home_team_name: "Haiti", away_team_name: "Peru",
    home_crest: F("ht"), away_crest: F("pe"),
    match_date: "2026-06-06T01:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },

  // ── 6 de junho ───────────────────────────────────────────────────────────────
  {
    id: "friendly_20260606_POR_CHI",
    home_team_code: "POR", away_team_code: "CHI",
    home_team_name: "Portugal", away_team_name: "Chile",
    home_crest: F("pt"), away_crest: F("cl"),
    match_date: "2026-06-06T13:45:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260606_BEL_TUN",
    home_team_code: "BEL", away_team_code: "TUN",
    home_team_name: "Bélgica", away_team_name: "Tunísia",
    home_crest: F("be"), away_crest: F("tn"),
    match_date: "2026-06-06T14:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260606_USA_GER",
    home_team_code: "USA", away_team_code: "GER",
    home_team_name: "Estados Unidos", away_team_name: "Alemanha",
    home_crest: F("us"), away_crest: F("de"),
    match_date: "2026-06-06T20:30:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260606_SCO_BOL",
    home_team_code: "SCO", away_team_code: "BOL",
    home_team_name: "Escócia", away_team_name: "Bolívia",
    home_crest: F("gb-sct"), away_crest: F("bo"),
    match_date: "2026-06-06T21:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260606_ENG_NZL",
    home_team_code: "ENG", away_team_code: "NZL",
    home_team_name: "Inglaterra", away_team_name: "Nova Zelândia",
    home_crest: F("gb-eng"), away_crest: F("nz"),
    match_date: "2026-06-06T21:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260606_SUI_AUS",
    home_team_code: "SUI", away_team_code: "AUS",
    home_team_name: "Suíça", away_team_name: "Austrália",
    home_crest: F("ch"), away_crest: F("au"),
    match_date: "2026-06-06T23:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260606_BRA_EGY",
    home_team_code: "BRA", away_team_code: "EGY",
    home_team_name: "Brasil", away_team_name: "Egito",
    home_crest: F("br"), away_crest: F("eg"),
    match_date: "2026-06-06T23:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260607_QAT_SLV",
    home_team_code: "QAT", away_team_code: "SLV",
    home_team_name: "Catar", away_team_name: "El Salvador",
    home_crest: F("qa"), away_crest: F("sv"),
    match_date: "2026-06-07T00:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260607_ARG_HON",
    home_team_code: "ARG", away_team_code: "HON",
    home_team_name: "Argentina", away_team_name: "Honduras",
    home_crest: F("ar"), away_crest: F("hn"),
    match_date: "2026-06-07T02:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },

  // ── 7 de junho ───────────────────────────────────────────────────────────────
  {
    id: "friendly_20260607_CRO_SLO",
    home_team_code: "CRO", away_team_code: "SLO",
    home_team_name: "Croácia", away_team_name: "Eslovênia",
    home_crest: F("hr"), away_crest: F("si"),
    match_date: "2026-06-07T13:45:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260607_MAR_NOR",
    home_team_code: "MAR", away_team_code: "NOR",
    home_team_name: "Marrocos", away_team_name: "Noruega",
    home_crest: F("ma"), away_crest: F("no"),
    match_date: "2026-06-07T20:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260607_ECU_GUA",
    home_team_code: "ECU", away_team_code: "GUA",
    home_team_name: "Equador", away_team_name: "Guatemala",
    home_crest: F("ec"), away_crest: F("gt"),
    match_date: "2026-06-07T21:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260608_COL_JOR",
    home_team_code: "COL", away_team_code: "JOR",
    home_team_name: "Colômbia", away_team_name: "Jordânia",
    home_crest: F("co"), away_crest: F("jo"),
    match_date: "2026-06-08T03:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },

  // ── 8 de junho ───────────────────────────────────────────────────────────────
  {
    id: "friendly_20260608_FRA_NIR",
    home_team_code: "FRA", away_team_code: "NIR",
    home_team_name: "França", away_team_name: "Irlanda do Norte",
    home_crest: F("fr"), away_crest: F("gb-nir"),
    match_date: "2026-06-08T14:10:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260608_NED_UZB",
    home_team_code: "NED", away_team_code: "UZB",
    home_team_name: "Holanda", away_team_name: "Uzbequistão",
    home_crest: F("nl"), away_crest: F("uz"),
    match_date: "2026-06-08T19:45:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260609_PER_ESP",
    home_team_code: "PER", away_team_code: "ESP",
    home_team_name: "Peru", away_team_name: "Espanha",
    home_crest: F("pe"), away_crest: F("es"),
    match_date: "2026-06-09T04:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },

  // ── 9 de junho ───────────────────────────────────────────────────────────────
  {
    id: "friendly_20260610_SAU_SEN",
    home_team_code: "SAU", away_team_code: "SEN",
    home_team_name: "Arábia Saudita", away_team_name: "Senegal",
    home_crest: F("sa"), away_crest: F("sn"),
    match_date: "2026-06-10T01:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260610_ARG_ISL",
    home_team_code: "ARG", away_team_code: "ISL",
    home_team_name: "Argentina", away_team_name: "Islândia",
    home_crest: F("ar"), away_crest: F("is"),
    match_date: "2026-06-10T02:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },

  // ── 10 de junho ──────────────────────────────────────────────────────────────
  {
    id: "friendly_20260610_BOL_ALG",
    home_team_code: "BOL", away_team_code: "ALG",
    home_team_name: "Bolívia", away_team_name: "Argélia",
    home_crest: F("bo"), away_crest: F("dz"),
    match_date: "2026-06-10T16:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260610_POR_NGA",
    home_team_code: "POR", away_team_code: "NGA",
    home_team_name: "Portugal", away_team_name: "Nigéria",
    home_crest: F("pt"), away_crest: F("ng"),
    match_date: "2026-06-10T15:45:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
  {
    id: "friendly_20260610_ENG_CRC",
    home_team_code: "ENG", away_team_code: "CRC",
    home_team_name: "Inglaterra", away_team_name: "Costa Rica",
    home_crest: F("gb-eng"), away_crest: F("cr"),
    match_date: "2026-06-10T21:00:00Z",
    venue_id: null, stage: "friendly", status: "scheduled",
    home_score: null, away_score: null,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
async function seedAmistosos() {
  console.log(`\nProject: ${PROJECT_ID}`);
  console.log(`Seeding ${AMISTOSOS.length} amistosos pré-Copa 2026...\n`);

  const CHUNK = 499;
  let done = 0;

  for (let i = 0; i < AMISTOSOS.length; i += CHUNK) {
    const batch = db.batch();
    for (const match of AMISTOSOS.slice(i, i + CHUNK)) {
      const { id, ...data } = match;
      batch.set(db.collection("matches").doc(id), {
        ...data,
        championship_id: "amistosos2026",
        group_id: null,
        round: null,
      });
    }
    await batch.commit();
    done += AMISTOSOS.slice(i, i + CHUNK).length;
    console.log(`  ✅ ${done}/${AMISTOSOS.length} escritos`);
  }

  console.log(`\n✅ Seed concluído! ${AMISTOSOS.length} amistosos em "${PROJECT_ID}"`);
  console.log("   championship_id: amistosos2026");
  console.log("\n⚠️  Atualize home_score/away_score após cada jogo (status → 'finished').");
  process.exit(0);
}

seedAmistosos().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
