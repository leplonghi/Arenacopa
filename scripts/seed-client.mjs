import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: "AIzaSyBDGM-km8sVo-IYVPtCGcTCV2uwzBAYdrk",
  authDomain: "arenacopa-web-2026.firebaseapp.com",
  projectId: "arenacopa-web-2026",
  storageBucket: "arenacopa-web-2026.firebasestorage.app",
  messagingSenderId: "388695676084",
  appId: "1:388695676084:web:e43e4a73b3645e0b68b3e1"
};

console.log("🔥 Initializing Firebase Client SDK...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const copaNews = [
  {
    category: "Brasil",
    content: "A CBF divulgou a lista dos 26 convocados do Brasil. Vinicius Jr. lidera o ataque ao lado de Rodrygo e Endrick. Dorival Júnior aposta na mescla de juventude e experiência para buscar o hexacampeonato.",
    published_at: new Date().toISOString(),
    source_name: "GE",
    title: "Brasil confirma convocação para a Copa do Mundo 2026",
    url: "https://ge.globo.com",
    url_to_image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
    views: 12400
  },
  {
    category: "Bastidores",
    content: "Os novos estádios na América do Norte prometem ser os mais tecnológicos da história das Copas. Destaque para o SoFi Stadium em Los Angeles, que receberá uma das semifinais.",
    published_at: new Date(Date.now() - 3600000).toISOString(),
    source_name: "O Globo",
    title: "Estádios da Copa 2026: Tecnologia e Inovação",
    url: "https://oglobo.globo.com",
    url_to_image: "https://images.unsplash.com/photo-1518605368461-1ee125230c57?auto=format&fit=crop&q=80&w=1200",
    views: 8430
  },
  {
    category: "Internacional",
    content: "Argentina, atual campeã mundial, chega embalada para tentar o tetracampeonato. Messi, agora em novo ritmo na MLS, confirmou que esta será sua Última Dança em Copas do Mundo.",
    published_at: new Date(Date.now() - 7200000).toISOString(),
    source_name: "UOL Esporte",
    title: "Argentina confirma favoritismo nas Eliminatórias",
    url: "https://colunadofla.com",
    url_to_image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&q=80&w=1200",
    views: 15200
  }
];

const matches = [
  {
    id: "match-1",
    home_team_code: "BRA",
    away_team_code: "SRB",
    match_date: "2026-06-11T16:00:00Z",
    venue_id: "stadium-la",
    status: "SCHEDULED",
    stage: "GROUP_STAGE",
    group_id: "G",
    home_score: null,
    away_score: null,
  },
  {
   id: "match-2",
   home_team_code: "ARG",
   away_team_code: "MEX",
   match_date: "2026-06-12T19:00:00Z",
   venue_id: "stadium-azteca",
   status: "SCHEDULED",
   stage: "GROUP_STAGE",
   group_id: "C",
   home_score: null,
   away_score: null,
  }
];

async function seedData() {
  console.log("📰 Seeding copa_news...");
  for (let i = 0; i < copaNews.length; i++) {
    const news = copaNews[i];
    const docRef = doc(db, "copa_news", `news-${i+1}`);
    await setDoc(docRef, news);
    console.log(`✅ Adicionado news-${i+1}`);
  }

  console.log("⚽ Seeding matches...");
  for (const match of matches) {
    const docRef = doc(db, "matches", match.id);
    await setDoc(docRef, match);
    console.log(`✅ Adicionado ${match.id}`);
  }

  console.log("🎉 Seeding completo!");
  process.exit(0);
}

seedData().catch(console.error);
