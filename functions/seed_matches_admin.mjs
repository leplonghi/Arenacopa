/**
 * seed_matches_admin.mjs  — uses firebase-admin (bypasses security rules)
 * Run from: cd functions && node seed_matches_admin.mjs
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
console.log(`\nProject: ${PROJECT_ID}`);
if (!PROJECT_ID) { console.error("Missing VITE_FIREBASE_PROJECT_ID"); process.exit(1); }

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

// ── Copa 2026 Groups ──────────────────────────────────────────
const GROUPS = {
  A:["MEX","RSA","KOR","EPD"], B:["CAN","EPA","QAT","SUI"],
  C:["BRA","MAR","HAI","SCO"], D:["USA","PAR","AUS","EPC"],
  E:["GER","CUR","CIV","ECU"], F:["NED","JPN","EPB","TUN"],
  G:["BEL","EGY","IRN","NZL"], H:["ESP","CPV","SAU","URU"],
  I:["FRA","SEN","FP2","NOR"], J:["ARG","ALG","AUT","JOR"],
  K:["POR","FP1","UZB","COL"], L:["ENG","CRO","GHA","PAN"],
};
const GROUP_VENUE = {
  A:"azteca", B:"bc-place", C:"metlife", D:"sofi", E:"att", F:"lumen",
  G:"mercedes", H:"hard-rock", I:"lincoln", J:"nrg", K:"gillette", L:"akron",
};
const groupKeys = Object.keys(GROUPS);
const MD1 = new Date("2026-06-11T21:00:00Z").getTime();
const MD2 = new Date("2026-06-18T21:00:00Z").getTime();
const MD3 = new Date("2026-06-25T21:00:00Z").getTime();
const MATCH_PAIRS = [[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]];
const DAY = 86400000, HOUR = 3600000;

const matches = [];
groupKeys.forEach((grp, gIdx) => {
  const teams = GROUPS[grp], venue = GROUP_VENUE[grp];
  const dayOff = Math.floor(gIdx/2), slot = gIdx%2;
  [MD1,MD2,MD3].forEach((base, mdIdx) => {
    const [[ia,ib],[ic,id]] = MATCH_PAIRS[mdIdx];
    const msA = base + dayOff*DAY + slot*3*HOUR;
    const msB = mdIdx===2 ? msA : msA+2*HOUR;
    matches.push({id:`g${grp}_md${mdIdx+1}_1`, home_team_code:teams[ia], away_team_code:teams[ib], home_score:null, away_score:null, match_date:new Date(msA).toISOString(), venue_id:venue, status:"upcoming", stage:"GROUP_STAGE", group_id:grp});
    matches.push({id:`g${grp}_md${mdIdx+1}_2`, home_team_code:teams[ic], away_team_code:teams[id], home_score:null, away_score:null, match_date:new Date(msB).toISOString(), venue_id:venue, status:"upcoming", stage:"GROUP_STAGE", group_id:grp});
  });
});

[
  {stage:"round_of_32",count:16,start:"2026-07-04T21:00:00Z",spread:4},
  {stage:"round_of_16",count:8, start:"2026-07-10T21:00:00Z",spread:4},
  {stage:"qf",         count:4, start:"2026-07-16T21:00:00Z",spread:2},
  {stage:"sf",         count:2, start:"2026-07-21T21:00:00Z",spread:1},
  {stage:"third_place",count:1, start:"2026-07-25T21:00:00Z",spread:0},
  {stage:"final",      count:1, start:"2026-07-26T21:00:00Z",spread:0},
].forEach(({stage,count,start,spread}) => {
  const venues=["metlife","sofi","att","nrg","mercedes","lincoln","hard-rock","lumen"];
  const base=new Date(start).getTime();
  for(let i=0;i<count;i++){
    const dOff=spread>0?Math.floor(i/(count/(spread+1))):0;
    matches.push({id:`${stage}_${i+1}`,home_team_code:"TBD",away_team_code:"TBD",home_score:null,away_score:null,match_date:new Date(base+dOff*DAY+(i%2)*3*HOUR).toISOString(),venue_id:venues[i%venues.length],status:"upcoming",stage,group_id:null});
  }
});

console.log(`Seeding ${matches.length} matches...`);

// Batch write (admin SDK max 500/batch)
async function batchWrite(docs) {
  const CHUNK = 499;
  let done = 0;
  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = db.batch();
    for (const item of docs.slice(i, i+CHUNK)) {
      const {id, ...data} = item;
      batch.set(db.collection("matches").doc(id), data);
    }
    await batch.commit();
    done += docs.slice(i,i+CHUNK).length;
    console.log(`  matches: ${done}/${docs.length}`);
  }
}

try {
  await batchWrite(matches);
  console.log(`\nDone! ${matches.length} matches written to ${PROJECT_ID}`);
  process.exit(0);
} catch(e) {
  console.error("Error:", e.message);
  process.exit(1);
}
