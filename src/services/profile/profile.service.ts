import { supabase } from "@/services/supabase/client";
import type { PreferredLanguage, ProfileRecord, ProfileUpdateInput } from "@/services/profile/profile.types";

const profileColumns = "*";

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
  const { data, error } = await supabase
    .from("profiles")
    .select(profileColumns)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as ProfileRecord | null;
}

export async function ensureProfile(user: EnsureProfileUser) {
  const payload = {
    user_id: user.id,
    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Torcedor",
    avatar_url: user.user_metadata?.avatar_url || null,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" });

  if (error) throw error;
}

export async function updateProfile(userId: string, updates: ProfileUpdateInput) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select(profileColumns)
    .maybeSingle();

  if (error) throw error;
  return data as ProfileRecord | null;
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
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  await updateProfile(userId, { avatar_url: publicUrl });

  return publicUrl;
}
