import { auth } from "@/integrations/firebase/client";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";

export async function signInWithPassword(email: string, password: string) {
  // Ensure persistence is set for mobile sessions
  await setPersistence(auth, browserLocalPersistence);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signUpWithPassword(email: string, password: string, name: string) {
  await setPersistence(auth, browserLocalPersistence);
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update display name
  await updateProfile(userCredential.user, {
    displayName: name
  });

  return userCredential.user;
}

export async function signInWithGoogle() {
  await setPersistence(auth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  // We specify custom parameters to try and prevent certain redirect issues
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error("Auth error:", error.code, error.message);
    throw error;
  }
}

export async function signOutUser() {
  await signOut(auth);
}
