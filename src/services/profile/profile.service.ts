import { db, storage } from "@/integrations/firebase/client";
import { doc, getDoc, setDoc, updateDoc, type UpdateData } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { PreferredLanguage, ProfileRecord, ProfileUpdateInput } from "@/services/profile/profile.types";

type EnsureProfileUser = {
  id: string;
  email: string | null;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
  };
};

export async function getProfile(userId: string) {
  const docRef = doc(db, "profiles", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as ProfileRecord;
  }
  return null;
}

export async function ensureProfile(user: EnsureProfileUser) {
  const docRef = doc(db, "profiles", user.id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    const payload = {
      user_id: user.id,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Torcedor",
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: new Date().toISOString(),
    };
    await setDoc(docRef, payload);
  }
}

export async function updateProfile(userId: string, updates: ProfileUpdateInput) {
  const docRef = doc(db, "profiles", userId);
  const existingProfile = await getDoc(docRef);

  if (!existingProfile.exists()) {
    await setDoc(docRef, {
      user_id: userId,
      name: "Torcedor",
      avatar_url: null,
      created_at: new Date().toISOString(),
      ...updates,
    });
  } else {
    await updateDoc(docRef, updates as UpdateData<ProfileRecord>);
  }
  
  const updatedSnap = await getDoc(docRef);
  return updatedSnap.data() as ProfileRecord | null;
}

export async function updatePreferredLanguage(userId: string, language: PreferredLanguage) {
  return updateProfile(userId, { preferred_language: language });
}

export async function updateFavoriteTeam(userId: string, favoriteTeam: string) {
  return updateProfile(userId, { favorite_team: favoriteTeam });
}

export async function acceptTerms(userId: string) {
  const now = new Date().toISOString();
  return updateProfile(userId, {
    terms_accepted: true,
    terms_accepted_at: now,
    accepted_terms_at: now,
  });
}

export async function uploadAvatar(userId: string, file: File) {
  const extension = file.name.split(".").pop() || "png";
  const filePath = `avatars/${userId}/${crypto.randomUUID()}.${extension}`;
  const storageRef = ref(storage, filePath);
  
  await uploadBytes(storageRef, file);
  const publicUrl = await getDownloadURL(storageRef);

  await updateProfile(userId, { avatar_url: publicUrl });
  return publicUrl;
}
