import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

async function uploadImage() {
  try {
    const imagePath = process.argv[2];
    if (!imagePath) throw new Error("Por favor, forneça o caminho da imagem");
    
    console.log(`Lendo arquivo em: ${imagePath}`);
    const fileBuffer = fs.readFileSync(imagePath);
    const storageRef = ref(storage, 'assets/bola_oficial_bw.png');
    
    console.log('Iniciando upload...');
    const metadata = { contentType: 'image/png' };
    await uploadBytes(storageRef, fileBuffer, metadata);
    console.log('Upload concluído com sucesso!');
    
    const downloadURL = await getDownloadURL(storageRef);
    console.log(`\nURL DE DOWNLOAD: ${downloadURL}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro no upload:', error);
    process.exit(1);
  }
}

uploadImage();
