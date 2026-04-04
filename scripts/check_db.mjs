/**
 * check_db.mjs — Quick Firestore data verification (public collections only)
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env");
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const idx = l.indexOf("="); return [l.slice(0,idx).trim(), l.slice(idx+1).trim()]; })
);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const db = getFirestore(app);

async function main() {
  console.log("=== ARENACOPA DB CHECK (public reads) ===\n");
  console.log(`Project: ${env.VITE_FIREBASE_PROJECT_ID}`);
  console.log(`Now: ${new Date().toISOString()}\n`);

  // matches is allow read: if true — no auth needed
  const allMatchesSnap = await getDocs(
    query(collection(db, "matches"), orderBy("match_date", "asc"), limit(5))
  );
  console.log(`✓ First 5 matches (ordered by date):`);
  allMatchesSnap.forEach((d) => {
    const data = d.data();
    console.log(`  [${d.id}] ${data.home_team_code} vs ${data.away_team_code} @ ${(data.match_date||"").substring(0,16)} status=${data.status}`);
  });

  // Next 7 days upcoming matches
  const now = new Date();
  const from = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const cutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const upcomingSnap = await getDocs(
    query(
      collection(db, "matches"),
      where("match_date", ">=", from),
      where("match_date", "<=", cutoff),
      orderBy("match_date", "asc"),
      limit(10)
    )
  );
  console.log(`\n✓ Upcoming matches (next 7d, for BolaoRapido): ${upcomingSnap.size}`);
  if (upcomingSnap.size === 0) {
    console.log("  ⚠️  NO UPCOMING MATCHES — BolaoRapido will show empty state");
    // Show nearest future matches
    const futureSnap = await getDocs(
      query(
        collection(db, "matches"),
        where("match_date", ">=", now.toISOString()),
        orderBy("match_date", "asc"),
        limit(3)
      )
    );
    console.log(`  Next available matches after today:`);
    futureSnap.forEach((d) => {
      const data = d.data();
      console.log(`    ${data.home_team_code} vs ${data.away_team_code} @ ${(data.match_date||"").substring(0,10)}`);
    });
  } else {
    upcomingSnap.forEach((d) => {
      const data = d.data();
      console.log(`  ${data.home_team_code} vs ${data.away_team_code} @ ${(data.match_date||"").substring(0,16)} [${data.status}]`);
    });
  }

  // News (also public)
  const newsSnap = await getDocs(
    query(collection(db, "copa_news"), orderBy("published_at", "desc"), limit(3))
  );
  console.log(`\n✓ Latest news articles: ${newsSnap.size} (showing up to 3)`);
  newsSnap.forEach((d) => {
    const data = d.data();
    console.log(`  "${(data.title||"").substring(0,60)}" @ ${(data.published_at||"").substring(0,10)}`);
  });

  console.log("\n=== CHECK COMPLETE ===");
  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
