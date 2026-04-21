import { db, storage } from "@/integrations/firebase/client";
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type UpdateData,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDefaultProfileName } from "@/i18n/language";
import type {
  PreferredLanguage,
  ProfileRecord,
  ProfileUpdateInput,
  PublicProfileRecord,
} from "@/services/profile/profile.types";

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_AVATAR_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const DEFAULT_PROFILE_NAME = getDefaultProfileName();

function buildPublicProfilePayload(input: {
  userId: string;
  name?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
}) {
  return {
    user_id: input.userId,
    name: input.name ?? null,
    nickname: input.nickname ?? null,
    avatar_url: input.avatar_url ?? null,
    created_at: input.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } satisfies PublicProfileRecord;
}

async function syncPublicProfile(userId: string, input: {
  name?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
}) {
  const publicRef = doc(db, "public_profiles", userId);
  await setDoc(publicRef, buildPublicProfilePayload({ userId, ...input }), { merge: true });
}

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
  const resolvedName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    DEFAULT_PROFILE_NAME;
  const createdAt = new Date().toISOString();

  if (!docSnap.exists()) {
    const payload = {
      user_id: user.id,
      name: resolvedName,
      avatar_url: user.user_metadata?.avatar_url || null,
      created_at: createdAt,
    };
    await setDoc(docRef, payload);
  }

  await syncPublicProfile(user.id, {
    name: resolvedName,
    avatar_url: user.user_metadata?.avatar_url || null,
    created_at: createdAt,
  });
}

export async function updateProfile(userId: string, updates: ProfileUpdateInput) {
  const docRef = doc(db, "profiles", userId);
  const existingProfile = await getDoc(docRef);
  let nextProfile: ProfileRecord | null = null;

  if (!existingProfile.exists()) {
    const createdProfile = {
      user_id: userId,
      name: DEFAULT_PROFILE_NAME,
      avatar_url: null,
      created_at: new Date().toISOString(),
      ...updates,
    };
    await setDoc(docRef, createdProfile);
    nextProfile = createdProfile as ProfileRecord;
  } else {
    await updateDoc(docRef, updates as UpdateData<ProfileRecord>);
    nextProfile = {
      ...(existingProfile.data() as ProfileRecord),
      ...updates,
    };
  }
  
  const updatedSnap = await getDoc(docRef);
  const updatedProfile = (updatedSnap.data() as ProfileRecord | null) ?? nextProfile;

  if (updatedProfile) {
    await syncPublicProfile(userId, {
      name: updatedProfile.name,
      nickname: updatedProfile.nickname,
      avatar_url: updatedProfile.avatar_url,
      created_at: "created_at" in updatedProfile ? String((updatedProfile as Record<string, unknown>).created_at ?? "") : undefined,
    });
  }

  return updatedProfile;
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
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    throw new Error("Formato de imagem não permitido.");
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }

  const extension = (file.name.split(".").pop() || "png").toLowerCase();
  if (!ALLOWED_AVATAR_EXTENSIONS.has(extension)) {
    throw new Error("Extensão de imagem não permitida.");
  }

  const filePath = `avatars/${userId}/${crypto.randomUUID()}.${extension}`;
  const storageRef = ref(storage, filePath);
  
  await uploadBytes(storageRef, file);
  const publicUrl = await getDownloadURL(storageRef);

  await updateProfile(userId, { avatar_url: publicUrl });
  return publicUrl;
}

export async function getPublicProfilesByIds(userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const profilesMap = new Map<string, PublicProfileRecord>();

  for (let index = 0; index < uniqueIds.length; index += 30) {
    const chunkIds = uniqueIds.slice(index, index + 30);
    if (!chunkIds.length) continue;

    const snapshot = await getDocs(
      query(collection(db, "public_profiles"), where(documentId(), "in", chunkIds))
    );

    snapshot.forEach((profileDoc) => {
      const data = profileDoc.data() as Partial<PublicProfileRecord>;
      profilesMap.set(profileDoc.id, {
        user_id: profileDoc.id,
        name: data.name ?? null,
        nickname: data.nickname ?? null,
        avatar_url: data.avatar_url ?? null,
        created_at: data.created_at ?? null,
        updated_at: data.updated_at ?? null,
      });
    });
  }

  return profilesMap;
}
