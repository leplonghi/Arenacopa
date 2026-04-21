import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env");
const envVars = {};

for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex === -1) continue;
  envVars[trimmed.slice(0, separatorIndex).trim()] = trimmed
    .slice(separatorIndex + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const projectId = envVars.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const seedToken = envVars.SEED_ADMIN_TOKEN || process.env.SEED_ADMIN_TOKEN;
const functionsBaseUrl =
  envVars.SEED_FUNCTIONS_BASE_URL ||
  process.env.SEED_FUNCTIONS_BASE_URL ||
  (projectId ? `https://us-central1-${projectId}.cloudfunctions.net` : "");

if (!projectId || !functionsBaseUrl) {
  console.error("\n❌ Projeto Firebase não configurado.");
  console.error("   Verifique VITE_FIREBASE_PROJECT_ID ou SEED_FUNCTIONS_BASE_URL no .env.\n");
  process.exit(1);
}

if (!seedToken) {
  console.error("\n❌ SEED_ADMIN_TOKEN não encontrado.");
  console.error("   Adicione ao .env: SEED_ADMIN_TOKEN=seu_token_admin\n");
  process.exit(1);
}

const championshipIdArg = process.argv
  .slice(2)
  .find((arg) => arg.startsWith("--championship="));
const championshipId = championshipIdArg
  ? championshipIdArg.split("=")[1]?.trim() || null
  : null;

async function postJson(path, body = {}) {
  const response = await fetch(`${functionsBaseUrl}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-seed-token": seedToken,
    },
    body: JSON.stringify({
      seedToken,
      ...body,
    }),
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.raw || `Falha HTTP ${response.status}`);
  }

  return data;
}

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🌎 ArenaCopa — Seed Admin dos Campeonatos");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🔥 Projeto: ${projectId}`);
  console.log(`🌐 Functions: ${functionsBaseUrl}`);
  if (championshipId) {
    console.log(`🏆 Campeonato filtrado: ${championshipId}`);
  }

  console.log("\n📰 Sincronizando catálogo de fontes...");
  const newsSources = await postJson("syncNewsSourcesCatalog");
  console.log(`   ✅ ${newsSources.sources || 0} fontes sincronizadas`);

  console.log("\n⚽ Popularizando campeonatos...");
  const seedResult = await postJson("seedLeagueData", championshipId ? { championshipId } : {});
  console.log("   ✅ Seed concluído");
  console.log(JSON.stringify(seedResult, null, 2));
}

main().catch((error) => {
  console.error("\n❌ Seed admin falhou:", error.message || error);
  process.exit(1);
});
