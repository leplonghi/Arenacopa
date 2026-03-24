/**
 * Firestore Seed usando Firebase Admin + credenciais do Firebase CLI
 * Usa FIREBASE_TOKEN do ambiente ou firebase login para auth
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SA_PATH = resolve(__dirname, "../serviceAccountKey.json");

let app;
if (existsSync(SA_PATH)) {
  const sa = JSON.parse(readFileSync(SA_PATH, "utf8"));
  app = initializeApp({ credential: cert(sa) });
  console.log("✅ Usando serviceAccountKey.json");
} else {
  // Use project ID only — works with GOOGLE_APPLICATION_CREDENTIALS or
  // when running inside Firebase Functions emulator
  process.env.FIRESTORE_EMULATOR_HOST = undefined;
  app = initializeApp({ projectId: "arenacup-web-2026" });
  console.log("ℹ️  Usando Application Default Credentials (projeto arenacup-web-2026)");
}

const db = getFirestore(app);

const news = [
  {
    id: "news-1",
    title: "Brasil confirma convocação para a Copa do Mundo 2026",
    content: "A CBF divulgou a lista dos 26 convocados do Brasil. Vinicius Jr. lidera o ataque ao lado de Rodrygo e Endrick.",
    category: "Brasil",
    source_name: "GE",
    published_at: "2026-05-01T10:00:00Z",
    url_to_image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
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
    url_to_image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&q=80&w=1200",
    url: "https://tycsports.com",
    views: 9800,
  },
  {
    id: "news-3",
    title: "MetLife Stadium: o palco da grande final em Nova Jersey",
    content: "Com capacidade para 82.500 torcedores, o MetLife será o palco da final da Copa 2026 em 19 de julho.",
    category: "Sedes",
    source_name: "FIFA",
    published_at: "2026-04-28T09:00:00Z",
    url_to_image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1200",
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
    url_to_image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&q=80&w=1200",
    url: "https://espn.com",
    views: 15300,
  },
  {
    id: "news-5",
    title: "Portugal e Cristiano Ronaldo: a última Copa?",
    content: "Com 41 anos, Ronaldo é convocado para sua potencial última Copa. Mais motivado do que nunca.",
    category: "Portugal",
    source_name: "Record",
    published_at: "2026-04-30T11:00:00Z",
    url_to_image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=1200",
    url: "https://record.pt",
    views: 11100,
  },
  {
    id: "news-6",
    title: "França: bicampeã em busca do tri",
    content: "Mbappé lidera a França na busca pelo terceiro título. O elenco jovem promete dominar a Copa 2026.",
    category: "França",
    source_name: "L'Équipe",
    published_at: "2026-04-25T14:00:00Z",
    url_to_image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&q=80&w=1200",
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
  { id: "l1", home_team_code: "ENG", away_team_code: "CRO", match_date: "2026-06-17T16:00:00-04:00", venue_id: "att", status: "scheduled", stage: "group", group_id: "L", home_score: null, away_score: null },
];

async function setDocWithCheck(collection, id, data) {
  const ref = db.collection(collection).doc(id);
  await ref.set(data, { merge: true });
}

async function seed() {
  console.log("\n🌱 Starting Firestore seed for arenacup-web-2026...\n");

  console.log("📰 Seeding copa_news...");
  for (const { id, ...data } of news) {
    await setDocWithCheck("copa_news", id, data);
    console.log(`  ✅ [${data.category}] ${data.title.substring(0, 50)}`);
  }

  console.log("\n⚽ Seeding matches...");
  for (const { id, ...data } of matchesData) {
    await setDocWithCheck("matches", id, data);
    console.log(`  ✅ ${data.home_team_code} vs ${data.away_team_code} (${data.stage} / ${data.status})`);
  }

  console.log("\n🎉 Seed completo!");
  console.log(`   📰 copa_news: ${news.length} artigos`);
  console.log(`   ⚽ matches: ${matchesData.length} jogos`);
  console.log("\n💡 Acesse o Firebase Console para verificar:");
  console.log("   https://console.firebase.google.com/project/arenacup-web-2026/firestore\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("\n❌ Seed falhou:", err.message || err);
  console.error("\nSolução: Gere um serviceAccountKey.json e salve na raiz do projeto");
  console.error("  1. Acesse: https://console.firebase.google.com/project/arenacup-web-2026/settings/serviceaccounts/adminsdk");
  console.error("  2. Clique em 'Gerar nova chave privada'");
  console.error("  3. Salve como serviceAccountKey.json na raiz do projeto\n");
  process.exit(1);
});
