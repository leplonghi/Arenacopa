import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Read .env manually
const envPath = path.join(rootDir, '.env');
let env = {};

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest.length > 0) {
            env[key.trim()] = rest.join('=').trim().replace(/"/g, '');
        }
    });
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Find the image in brain folder
const brainDir = path.join(process.env.USERPROFILE || 'C:\\Users\\eduar', '.gemini', 'antigravity', 'brain', 'b20168f4-648a-4835-9207-bc8466d3e3b3');
const files = fs.readdirSync(brainDir);
const imageFile = files.find(f => f.startsWith('official_soccer_ball_') && f.endsWith('.png'));

if (!imageFile) {
    console.error('Image not found in brain directory.');
    process.exit(1);
}

const imagePath = path.join(brainDir, imageFile);
const fileBuffer = fs.readFileSync(imagePath);

console.log(`Uploading ${imageFile} to Firebase Storage...`);
// convert Buffer to Uint8Array
const uint8Array = new Uint8Array(fileBuffer);

const storageRef = ref(storage, 'assets/bola_oficial.png');
uploadBytes(storageRef, uint8Array, { contentType: 'image/png' })
  .then(async (snapshot) => {
    console.log('✅ Uploaded a blob or file!');
    const url = await getDownloadURL(storageRef);
    console.log('Public URL:', url);
    process.exit(0);
  })
  .catch((e) => {
    console.error('Error uploading:', e);
    process.exit(1);
  });
