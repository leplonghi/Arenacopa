import { auth } from "@/integrations/firebase/client";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  updateProfile,
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";

const AUTH_FAILURE_WINDOW_MS = 60_000;
const AUTH_MAX_FAILURES_PER_WINDOW = 10;
const AUTH_RATE_LIMIT_KEY = "arenacopa:auth-failures";

type NativeGoogleSignInResult = {
  credential?: {
    idToken?: string | null;
  } | null;
};

type NativeGoogleSignInFn = (options: {
  useCredentialManager: boolean;
}) => Promise<NativeGoogleSignInResult>;

function readAuthFailures() {
  try {
    const raw = localStorage.getItem(AUTH_RATE_LIMIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is number => typeof value === "number") : [];
  } catch {
    return [];
  }
}

function writeAuthFailures(values: number[]) {
  localStorage.setItem(AUTH_RATE_LIMIT_KEY, JSON.stringify(values));
}

function getRecentAuthFailures() {
  const now = Date.now();
  return readAuthFailures().filter((timestamp) => now - timestamp < AUTH_FAILURE_WINDOW_MS);
}

function assertAuthAttemptsAllowed() {
  const recentFailures = getRecentAuthFailures();
  if (recentFailures.length >= AUTH_MAX_FAILURES_PER_WINDOW) {
    throw new Error("Muitas tentativas de login. Aguarde um minuto e tente novamente.");
  }
}

function registerAuthFailure() {
  const updatedFailures = [...getRecentAuthFailures(), Date.now()];
  writeAuthFailures(updatedFailures);
}

function resetAuthFailures() {
  localStorage.removeItem(AUTH_RATE_LIMIT_KEY);
}

export async function signInWithPassword(email: string, password: string) {
  assertAuthAttemptsAllowed();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    resetAuthFailures();
    return userCredential.user;
  } catch (error) {
    registerAuthFailure();
    throw error;
  }
}

export async function signUpWithPassword(email: string, password: string, name: string) {
  assertAuthAttemptsAllowed();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    resetAuthFailures();
    return userCredential.user;
  } catch (error) {
    registerAuthFailure();
    throw error;
  }
}

export async function signInWithGoogle() {
  // On Android/iOS use the native Capacitor plugin — avoids WebView OAuth issues
  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    // useCredentialManager: false forces the traditional full-screen Google Sign-In intent.
    // The default (true) uses Android Credential Manager which fails with
    // "No credentials available" in some devices/configurations.
    const signInWithGoogleNative = FirebaseAuthentication.signInWithGoogle as NativeGoogleSignInFn;
    const result = await signInWithGoogleNative({
      useCredentialManager: false,
    });
    if (!result.credential?.idToken) throw new Error("Google Sign-In: idToken ausente");
    const credential = GoogleAuthProvider.credential(result.credential.idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  }

  // On web, keep using signInWithPopup normally
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutUser() {
  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    await FirebaseAuthentication.signOut();
  }
  await signOut(auth);
}
