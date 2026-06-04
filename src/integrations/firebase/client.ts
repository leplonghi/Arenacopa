import { initializeApp } from "firebase/app";
import { connectAuthEmulator, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { Capacitor } from "@capacitor/core";

declare global {
  interface Window {
    __ARENA_FIREBASE_EMULATORS_CONNECTED__?: boolean;
  }
}

// Public Firebase web config. These values are NOT secret — Firebase ships them
// to every browser and Google documents them as safe to expose (security is
// enforced by Firestore Rules + App Check, not key secrecy). Hardcoding them as
// fallbacks makes the app zero-config: a fresh clone in any IDE, or a CI/build
// without a .env, still boots instead of crashing with auth/invalid-api-key.
// A .env still wins when present (useful for staging / a different project).
const FIREBASE_FALLBACK = {
  apiKey: "AIzaSyBDGM-km8sVo-IYVPtCGcTCV2uwzBAYdrk",
  authDomain: "arenacopa-web-2026.firebaseapp.com",
  projectId: "arenacopa-web-2026",
  storageBucket: "arenacopa-web-2026.firebasestorage.app",
  messagingSenderId: "388695676084",
  appId: "1:388695676084:web:e43e4a73b3645e0b68b3e1",
} as const;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || FIREBASE_FALLBACK.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_FALLBACK.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_FALLBACK.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FIREBASE_FALLBACK.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_FALLBACK.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || FIREBASE_FALLBACK.appId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check (web only, native uses different mechanisms)
/* 
if (typeof window !== "undefined" && !Capacitor.isNativePlatform()) {
  try {
    if (import.meta.env.DEV) {
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (siteKey && siteKey !== "missing-site-key") {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
    } else {
      console.warn("App Check initialization skipped: VITE_RECAPTCHA_SITE_KEY is missing.");
    }
  } catch (err) {
    console.warn("Could not initialize App Check:", err);
  }
}
*/

// On native Capacitor (Android/iOS), use indexedDB to avoid sessionStorage
// issues with Custom Chrome Tabs. On web, use standard getAuth.
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    })
  : getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

const useFirebaseEmulators =
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true" &&
  typeof window !== "undefined" &&
  !Capacitor.isNativePlatform();

if (useFirebaseEmulators && !window.__ARENA_FIREBASE_EMULATORS_CONNECTED__) {
  connectAuthEmulator(
    auth,
    import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099",
    { disableWarnings: true },
  );
  connectFirestoreEmulator(
    db,
    import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || "127.0.0.1",
    Number(import.meta.env.VITE_FIRESTORE_EMULATOR_PORT || 8280),
  );
  connectStorageEmulator(
    storage,
    import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1",
    Number(import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_PORT || 9199),
  );
  window.__ARENA_FIREBASE_EMULATORS_CONNECTED__ = true;
}

export default app;
