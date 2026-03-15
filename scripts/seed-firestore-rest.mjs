/**
 * Firestore Seed Script — ArenaCopa 2026
 * Uses Firebase REST API with the CLI token (no service account needed)
 * Usage: node scripts/seed-firestore-rest.mjs
 */

import { execSync } from "child_process";
import https from "https";

const PROJECT_ID = "arenacopa-web-2026";
const BASE_URL = `firestore.googleapis.com`;
const DB_PATH = `projects/${PROJECT_ID}/databases/(default)/documents`;

// Get access token from Firebase CLI
function getToken() {
  try {
    const token = execSync("firebase --token . 2>nul || gcloud auth print-access-token 2>nul", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return token;
  } catch {
    return null;
  }
}

function httpsRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: BASE_URL,
      path: `/v1/${path}`,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => (responseData += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseData || "{}"));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

// Convert JS value to Firestore Value
function toValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function toDocument(obj) {
  const fields = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toValue(v);
  }
  return { fields };
}

async function createDocument(collection, docId, docObj, token) {
  const doc = toDocument(docObj);
  const path = `${DB_PATH}/${collection}?documentId=${encodeURIComponent(docId)}`;
  return httpsRequest("POST", path, doc, token);
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const news = [
  {
    id: "news-1",
    title: "Brasil confirma convocação para a Copa do Mundo 2026",
    content: "A CBF divulgou a lista dos 26 convocados do Brasil. Vinicius Jr. lidera o ataque ao lado de Rodrygo e Endrick.",
    category: "Brasil",
    source_name: "GE",
    published_at: "2026-05-01T10:00:00Z",
    url_to_image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800",
    url: "https://ge.globo.com",
    views: 12400,
  },
  {
    id: "news-2",
    title: "Argentina apresenta elenco com Messi como capitão",
    content: "Messi confirmado como capitão da Argentina. Lautaro Martínez e Julian Álvarez completam o ataque albiceleste.",
    category: "Argentina",
    source_name: "TyC Sports",
    published_at: "2026-05-02T12:00:00Z",
    url_to_image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&q=80&w=800",
    url: "https://tycsports.com",
    views: 9800,
  },
  {
    id: "news-3",
    title: "MetLife Stadium: o palco da grande final no Nova Jersey",
    content: "Com 82.500 torcedores, o MetLife será o palco da final da Copa 2026 em 19 de julho.",
    category: "Sedes",
    source_name: "FIFA",
    published_at: "2026-04-28T09:00:00Z",
    url_to_image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800",
    url: "https://fifa.com",
    views: 7200,
  },
  {
    id: "news-4",
    title: "Copa do Mundo 2026: como funciona o novo formato?",
    content: "48 seleções em 12 grupos de 4. Os dois primeiros e os 8 melhores terceiros avançam para o mata-mata.",
    category: "Formato",
    source_name: "ESPN",
    published_at: "2026-04-20T15:00:00Z",
    url_to_image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&q=80&w=800",
    url: "https://espn.com",
    views: 15300,
  },
  {
    id: "news-5",
    title: "Portugal e Cristiano Ronaldo: a última Copa?",
    content: "Com 41 anos, Cristiano Ronaldo é convocado para sua potencial última Copa. Mais motivado do que nunca.",
    category: "Portugal",
    source_name: "Record",
    published_at: "2026-04-30T11:00:00Z",
    url_to_image: "https://images.unsplash.com/photo-1613379932201-9dc0c54e84f1?auto=format&fit=crop&q=80&w=800",
    url: "https://record.pt",
    views: 11100,
  },
  {
    id: "news-6",
    title: "França: bicampeã em busca do tri",
    content: "Mbappé lidera a França na busca pelo terceiro título. O elenco é jovem e promete dominar a Copa 2026.",
    category: "França",
    source_name: "L'Équipe",
    published_at: "2026-04-25T14:00:00Z",
    url_to_image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&q=80&w=800",
    url: "https://lequipe.fr",
    views: 8900,
  },
];

const matchesData = [
  { id: "c1", home_team_code: "BRA", away_team_code: "SRB", match_date: "2026-06-13T17:00:00-04:00", venue_id: "metlife", status: "scheduled", stage: "group", group_id: "C", home_score: null, away_score: null },
  { id: "c2", home_team_code: "MEX", away_team_code: "RSA", match_date: "2026-06-13T20:00:00-04:00", venue_id: "gillette", status: "scheduled", stage: "group", group_id: "A", home_score: null, away_score: null },
  { id: "c3", home_team_code: "USA", away_team_code: "COL", match_date: "2026-06-11T17:00:00-04:00", venue_id: "att", status: "scheduled", stage: "group", group_id: "B", home_score: null, away_score: null },
  { id: "j1", home_team_code: "ARG", away_team_code: "ALG", match_date: "2026-06-16T21:00:00-04:00", venue_id: "arrowhead", status: "scheduled", stage: "group", group_id: "J", home_score: null, away_score: null },
  { id: "k1", home_team_code: "POR", away_team_code: "FP1", match_date: "2026-06-17T13:00:00-04:00", venue_id: "nrg", status: "scheduled", stage: "group", group_id: "K", home_score: null, away_score: null },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 ArenaCopa Firestore Seed\n");
  console.log("⚙️  Getting Firebase auth token...");

  let token;
  try {
    token = execSync("firebase experiments:list --json 2>nul || firebase --version 2>nul", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    // Use gcloud token
    token = execSync("gcloud auth print-access-token", {
      encoding: "utf8",
    }).trim();
    console.log("✅ Token obtained via gcloud\n");
  } catch {
    console.error(
      "❌ Could not get auth token.\n\nTo fix, run:\n  gcloud auth application-default login\n  gcloud config set project arenacopa-web-2026\n"
    );
    process.exit(1);
  }

  // Seed copa_news
  console.log("📰 Seeding copa_news...");
  for (const article of news) {
    const { id, ...data } = article;
    try {
      await createDocument("copa_news", id, data, token);
      console.log(`  ✅ ${article.title.substring(0, 50)}...`);
    } catch (e) {
      console.log(`  ⚠️  Skipped (may already exist): ${id}`);
    }
  }

  // Seed matches
  console.log("\n⚽ Seeding matches...");
  for (const match of matchesData) {
    const { id, ...data } = match;
    try {
      await createDocument("matches", id, data, token);
      console.log(`  ✅ ${match.home_team_code} vs ${match.away_team_code}`);
    } catch (e) {
      console.log(`  ⚠️  Skipped (may already exist): ${id}`);
    }
  }

  console.log("\n🎉 Seed complete!");
  console.log(`  📰 copa_news: ${news.length} articles`);
  console.log(`  ⚽ matches: ${matchesData.length} matches`);
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
