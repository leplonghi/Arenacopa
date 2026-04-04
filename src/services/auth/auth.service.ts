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

export async function signInWithPassword(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signUpWithPassword(email: string, password: string, name: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  return userCredential.user;
}

export async function signInWithGoogle() {
  // On Android/iOS use the native Capacitor plugin — avoids WebView OAuth issues
  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
    const result = await FirebaseAuthentication.signInWithGoogle();
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
