import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Capacitor } from "@capacitor/core";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check (web only, native uses different mechanisms)
if (typeof window !== "undefined" && !Capacitor.isNativePlatform()) {
  try {
    if (import.meta.env.DEV) {
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    // We use a fallback key to not break local development if env var is missing
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "missing-site-key";
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    console.warn("Could not initialize App Check:", err);
  }
}

// On native Capacitor (Android/iOS), use indexedDB to avoid sessionStorage
// issues with Custom Chrome Tabs. On web, use standard getAuth.
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    })
  : getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
