import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: "AIzaSyBDGM-km8sVo-IYVPtCGcTCV2uwzBAYdrk",
  authDomain: "arenacup-web-2026.firebaseapp.com",
  projectId: "arenacup-web-2026",
  storageBucket: "arenacup-web-2026.firebasestorage.app",
  messagingSenderId: "388695676084",
  appId: "1:388695676084:web:e43e4a73b3645e0b68b3e1"
};

console.log("🔥 Initializando Firebase Client SDK para Teste...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runGamificationTest() {
  const testUserId = "test-user-999";
  const bolaoId = "test-bolao-x1";
  const matchId = "match-1"; // BRA x SRB

  console.log("📝 1. Criando usuário e bolão de teste...");
  
  // Criar uma entrada de perfil simples
  await setDoc(doc(db, "profiles", testUserId), {
    name: "Tester Gamification"
  });

  // Criar bolão de teste
  await setDoc(doc(db, "boloes", bolaoId), {
    name: "Bolão de Teste Automatizado",
    creator_id: testUserId,
    createdAt: new Date().toISOString()
  });

  // Adicionar o membro manualmente para testar o rank
  // A Cloud function 'onNewBolaoMember' criaria o RANK caso estivesse em trigger completo, mas vamos garantir o member
  await setDoc(doc(db, "bolao_members", `${bolaoId}_${testUserId}`), {
    bolao_id: bolaoId,
    user_id: testUserId,
    joinedAt: new Date().toISOString()
  });

  console.log("🎯 2. Realizando palpite: BRA 2 x 0 SRB...");
  // O usuário está dando o palpite como BRA 2x0 SRB.
  await setDoc(doc(db, "bolao_palpites", `${bolaoId}_${matchId}_${testUserId}`), {
    bolao_id: bolaoId,
    match_id: matchId,
    user_id: testUserId,
    home_score: 2,
    away_score: 0,
    timestamp: new Date().toISOString()
  });

  // Simulando que o rank começava em zero para termos a base antes da finalização
  const rankingRef = doc(db, "bolao_rankings", `${testUserId}_${bolaoId}`);
  await setDoc(rankingRef, {
    bolao_id: bolaoId,
    user_id: testUserId,
    total_points: 0,
    exact_scores: 0,
    correct_winners: 0
  });

  console.log("⚽ 3. Resetando e depois Finalizando a Partida match-1 com BRA 2 x 0 SRB...");
  const matchRef = doc(db, "matches", matchId);
  // Garante que mudamos de um estado de não-finalizado para finalizado
  await setDoc(matchRef, {
    home_score: null,
    away_score: null,
    status: "SCHEDULED"
  }, { merge: true });

  await sleep(2000);

  // Agora sim atualiza com o resultado
  await setDoc(matchRef, {
    home_score: 2,
    away_score: 0,
    status: "FINISHED"
  }, { merge: true });

  console.log("⏳ 4. Aguardando 10 segundos para a Cloud Function processar os pontos...");
  await sleep(10000);

  console.log("📊 5. Verificando o resultado no Ranking...");
  const rankSnap = await getDoc(rankingRef);
  if (rankSnap.exists()) {
    const data = rankSnap.data();
    console.log("===== RESULTADO DO TESTE =====");
    console.log(`Pontos Totais: ${data.total_points}`);
    console.log(`Placares Exatos: ${data.exact_scores}`);
    console.log(`Vencedores Corretos: ${data.correct_winners}`);
    console.log("==============================");
    
    if (data.total_points === 5) {
      console.log("✅ SUCESSO! A Cloud Function processou o DEZ Exato (5 pontos) corretamente.");
    } else {
      console.log("❌ FALHOU! A pontuação não foi calculada ou a regra falhou. Verifique os logs do Firebase Functions.");
    }
  } else {
    console.log("❌ FALHOU! O documento de ranking não foi encontrado. Cloud Function pode ter falhado silenciosamente.");
  }
  
  process.exit(0);
}

runGamificationTest().catch(console.error);
