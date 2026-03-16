
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newsItems = [
  {
    title: "Ancelotti fará convocação decisiva para a Seleção nesta segunda-feira",
    category: "Seleção Brasileira",
    description: "Técnico da Seleção Brasileira define os 23 nomes que enfrentarão França e Croácia nos últimos testes antes da Copa do Mundo de 2026.",
    country_filter: "BRA",
    published_at: new Date("2026-03-15T10:00:00Z").toISOString(),
    url_to_image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800",
    url: "https://www.band.uol.com.br/esportes",
    source_name: "Band Esportes",
    views: 12500
  },
  {
    title: "Lista de Ancelotti: 13 jogadores já estão garantidos para o Mundial de 2026",
    category: "Copa 2026",
    description: "Base da Seleção está montada; remanescentes de 2022 e novos talentos como Estêvão garantem vaga no grupo final para o hexa.",
    country_filter: "BRA",
    published_at: new Date("2026-03-15T09:30:00Z").toISOString(),
    url_to_image: "https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=800",
    url: "https://www.diariodepernambuco.com.br/esportes",
    source_name: "Diário de Pernambuco",
    views: 8400
  },
  {
    title: "Grupo C definido: Brasil enfrentará Marrocos, Haiti e Escócia na primeira fase",
    category: "Tabela",
    description: "Caminho do Brasil na fase de grupos é considerado favorável, com jogos em Nova York, Filadélfia e Miami.",
    published_at: new Date("2026-03-15T08:15:00Z").toISOString(),
    url_to_image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800",
    url: "https://www.estadao.com.br/esportes",
    source_name: "Estadão",
    views: 25000
  },
  {
    title: "Nike e Jordan lançam novo uniforme azul da Seleção para a Copa de 2026",
    category: "Equipamento",
    description: "Novo manto 'Away' traz detalhes inovadores em parceria com a marca Jordan; estreia será contra a França em Boston.",
    country_filter: "BRA",
    published_at: new Date("2026-03-15T07:45:00Z").toISOString(),
    url_to_image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800",
    url: "https://www.cnnbrasil.com.br/esportes",
    source_name: "CNN Brasil",
    views: 15700
  },
  {
    title: "Estreia da Copa 2026: Estádio Azteca receberá primeiro jogo em 11 de junho",
    category: "Copa 2026",
    description: "Palco histórico no México será o epicentro da abertura do primeiro mundial com 48 seleções.",
    published_at: new Date("2026-03-14T20:00:00Z").toISOString(),
    url_to_image: "https://images.unsplash.com/photo-1431324155629-1a6eda1eedfa?q=80&w=800",
    url: "https://www.fifa.com",
    source_name: "FIFA News",
    views: 42000
  }
];

async function seedNews() {
  console.log("Iniciando semeadura de notícias...");
  const newsRef = collection(db, "copa_news");
  
  for (const item of newsItems) {
    try {
      await addDoc(newsRef, {
        ...item,
        created_at: serverTimestamp()
      });
      console.log(`✅ Notícia adicionada: ${item.title}`);
    } catch (e) {
      console.error(`❌ Erro ao adicionar notícia: ${item.title}`, e);
    }
  }
  
  console.log("Semeadura concluída!");
  process.exit(0);
}

seedNews();
