import { postAuthedFunction } from "@/services/backend/functions-http";

export type BolaoListingCard = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  avatar_url: string | null;
  emoji?: string | null;
  category: "public" | "private";
  is_paid: boolean;
  is_creator?: boolean;
  status: string;
  lifecycle_status?: string;
  member_count: number;
  is_past?: boolean;
  is_archived?: boolean;
  archived_at?: string | null;
  finished_at?: string | null;
  latest_match_closes_at?: string | null;
};

export type BolaoListingRequestCard = {
  id: string;
  bolaoId: string;
  bolaoName: string;
  requestStatus: string;
  updatedAt: string | null;
};

export type UserBolaoListingResponse = {
  myBoloes: BolaoListingCard[];
  archivedBoloes: BolaoListingCard[];
  pendingRequests: BolaoListingRequestCard[];
  discoverBoloes: BolaoListingCard[];
};

// ─── In-memory cache com stale-while-revalidate ──────────────────────────────
// Guarda a última resposta por usuário. TTL de 90 segundos.
// Mostrar dados em cache imediatamente enquanto a refetch acontece em background.

const CACHE_TTL_MS = 90_000; // 90 segundos

type CacheEntry = {
  data: UserBolaoListingResponse;
  fetchedAt: number;
};

const listingCache = new Map<string, CacheEntry>();

export function invalidateBolaoListingCache(userId?: string) {
  if (userId) {
    listingCache.delete(userId);
  } else {
    listingCache.clear();
  }
}

async function fetchFromNetwork(token?: string): Promise<UserBolaoListingResponse> {
  const raw = await postAuthedFunction<UserBolaoListingResponse>("listUserBoloes", {}, token);
  // Guarantee archivedBoloes is always an array (older backend deployments won't have it)
  return {
    ...raw,
    archivedBoloes: Array.isArray(raw.archivedBoloes) ? raw.archivedBoloes : [],
  };
}

/**
 * Busca a listagem de bolões do usuário com cache stale-while-revalidate.
 * - Se tiver cache válido (< 90s), retorna imediatamente e revalida em background.
 * - Se o cache estiver stale (> 90s), aguarda a resposta fresca.
 * - onStale é chamado quando dados stale são retornados e a revalidação completa.
 */
export async function listUserBoloes(
  input: { token?: string; userId?: string } = {},
  onStale?: (fresh: UserBolaoListingResponse) => void,
): Promise<UserBolaoListingResponse> {
  const cacheKey = input.userId ?? "__anon__";
  const cached = listingCache.get(cacheKey);
  const now = Date.now();

  if (cached) {
    const isStale = now - cached.fetchedAt > CACHE_TTL_MS;

    if (!isStale) {
      // Cache still fresh – return immediately, no network call
      return cached.data;
    }

    // Cache stale – return old data right away and revalidate in background
    fetchFromNetwork(input.token)
      .then((fresh) => {
        listingCache.set(cacheKey, { data: fresh, fetchedAt: Date.now() });
        onStale?.(fresh);
      })
      .catch(() => {
        // Silently fail background revalidation – stale data is still usable
      });

    return cached.data;
  }

  // No cache – must wait for network
  const data = await fetchFromNetwork(input.token);
  listingCache.set(cacheKey, { data, fetchedAt: now });
  return data;
}
