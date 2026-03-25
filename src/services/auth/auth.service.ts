import { auth } from "@/integrations/firebase/client";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { mapFirebaseError } from "@/services/errors/AppError";

export async function signInWithPassword(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw mapFirebaseError(error, "AUTH_INVALID_CREDENTIALS");
  }
}

export async function signUpWithPassword(email: string, password: string, name: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return userCredential.user;
  } catch (error) {
    throw mapFirebaseError(error, "AUTH_UNKNOWN");
  }
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    throw mapFirebaseError(error, "AUTH_UNKNOWN");
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    throw mapFirebaseError(error, "AUTH_UNKNOWN");
  }
}
