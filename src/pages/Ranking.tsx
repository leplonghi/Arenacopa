import { useEffect, useMemo, useState } from "react";
import { Award, Crown, Medal, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, getDocs, where, documentId } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useTranslation } from "react-i18next";

type UserStanding = {
  userId: string;
  name: string;
  avatar: string;
  favoriteTeam: string | null;
  points: number;
};

type ProfileSummary = {
  user_id: string;
  name?: string;
  nickname?: string;
  avatar_url?: string;
  favorite_team?: string | null;
};

export default function Ranking() {
  const { t } = useTranslation('ranking');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [globalRows, setGlobalRows] = useState<UserStanding[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const rankingsRef = collection(db, "bolao_rankings");
        const q = query(rankingsRef, orderBy("total_points", "desc"));
        const querySnapshot = await getDocs(q);
        
        const rankings = querySnapshot.docs.map(doc => doc.data());

        const totals = new Map<string, number>();
        rankings.forEach((row) => {
          totals.set(row.user_id, (totals.get(row.user_id) || 0) + (row.total_points || 0));
        });

        const userIds = [...totals.keys()];
        if (!userIds.length) {
          setGlobalRows([]);
          return;
        }

        // Firestore 'in' query supports up to 30 values. Filtering here for simplicity or using multiple queries.
        // For a global ranking, it's better to fetch profiles. 
        // Here we'll fetch profiles in chunks if needed, but for the top 50 it's manageable.
        const profilesRef = collection(db, "profiles");
        // Simple case: fetch profiles for the users we found
        const profileMap = new Map<string, ProfileSummary>();
        
        // Fetching profiles in batches of 30 due to Firestore limits
        const batches = [];
        for (let i = 0; i < userIds.length; i += 30) {
          batches.push(userIds.slice(i, i + 30));
        }

        for (const batch of batches) {
          const pq = query(profilesRef, where("user_id", "in", batch));
          const ps = await getDocs(pq);
          ps.docs.forEach(doc => {
            const data = doc.data();
            profileMap.set(data.user_id, data as ProfileSummary);
          });
        }

        const rows = userIds
          .map((userId) => {
            const profile = profileMap.get(userId);
            return {
              userId,
              name: profile?.name || profile?.nickname || t('label'),
              avatar: profile?.avatar_url || "🏆",
              favoriteTeam: profile?.favorite_team || null,
              points: totals.get(userId) || 0,
            } satisfies UserStanding;
          })
          .sort((a, b) => b.points - a.points)
          .slice(0, 50);

        setGlobalRows(rows);
      } catch (error) {
        console.error("Error loading global ranking:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Bolão filter ──────────────────────────────────────────────────────────
  const [selectedBolaoId, setSelectedBolaoId] = useState<string | null>(null);
  const [userBoloes, setUserBoloes] = useState<{ id: string; name: string }[]>([]);
  const [bolaoRows, setBolaoRows] = useState<UserStanding[]>([]);
  const [bolaoLoading, setBolaoLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const fetchBoloes = async () => {
      try {
        const membSnap = await getDocs(
          query(collection(db, "bolao_members"), where("user_id", "==", user.id))
        );
        const bolaoIds = membSnap.docs.map((d) => d.data().bolao_id as string);
        if (!bolaoIds.length) return;
        const names: { id: string; name: string }[] = [];
        for (let i = 0; i < bolaoIds.length; i += 30) {
          const batch = bolaoIds.slice(i, i + 30);
          const snap = await getDocs(
            query(collection(db, "boloes"), where(documentId(), "in", batch))
          );
          snap.docs.forEach((d) => names.push({ id: d.id, name: d.data().name as string }));
        }
        setUserBoloes(names);
      } catch (e) {
        console.error("Error fetching user boloes:", e);
      }
    };
    fetchBoloes();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedBolaoId) return;
    const fetchBolaoRanking = async () => {
      setBolaoLoading(true);
      try {
        const rankSnap = await getDocs(
          query(
            collection(db, "bolao_rankings"),
            where("bolao_id", "==", selectedBolaoId),
            orderBy("total_points", "desc")
          )
        );
        const totalsMap = new Map<string, number>();
        rankSnap.docs.forEach((d) => {
          const uid = d.data().user_id as string;
          totalsMap.set(uid, (totalsMap.get(uid) || 0) + ((d.data().total_points as number) || 0));
        });
        const uids = [...totalsMap.entries()].sort((a, b) => b[1] - a[1]);
        if (!uids.length) { setBolaoRows([]); setBolaoLoading(false); return; }
        const profileMap = new Map<string, ProfileSummary>();
        for (let i = 0; i < uids.length; i += 30) {
          const batch = uids.slice(i, i + 30).map(([id]) => id);
          const ps = await getDocs(
            query(collection(db, "profiles"), where("user_id", "in", batch))
          );
          ps.docs.forEach((doc) => {
            const data = doc.data();
            profileMap.set(data.user_id as string, data as ProfileSummary);
          });
        }
        setBolaoRows(
          uids.map(([userId, points]) => {
            const p = profileMap.get(userId);
            return {
              userId,
              name: p?.name || p?.nickname || t("label"),
              avatar: p?.avatar_url || "?",
              favoriteTeam: p?.favorite_team || null,
              points,
            };
          })
        );
      } catch (e) {
        console.error("Error fetching bolao ranking:", e);
        setBolaoRows([]);
      } finally {
        setBolaoLoading(false);
      }
    };
    fetchBolaoRanking();
  }, [selectedBolaoId, t]);

  const displayRows = selectedBolaoId ? bolaoRows : globalRows;
  const isLoadingDisplay = loading || bolaoLoading;

  const myPosition = useMemo(() => {
    if (!user?.id) return null;
    const index = displayRows.findIndex((row) => row.userId === user.id);
    if (index === -1) return null;
    return { rank: index + 1, ...displayRows[index] };
  }, [displayRows, user?.id]);

  if (isLoadingDisplay) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Skeleton className="mb-4 h-20 rounded-3xl bg-white/10" />
        <Skeleton className="mb-4 h-32 rounded-3xl bg-white/10" />
        <Skeleton className="h-[420px] rounded-3xl bg-white/10" />
      </div>
    );
  }

  if (!displayRows.length && !isLoadingDisplay) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <EmptyState
          icon="🏆"
          {...{ title: t('empty_title') }}
          description={t('empty_desc')}
        />
      </div>
    );
  }

  const podium = displayRows.slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 text-white">
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{t('page_label')}</p>
        <h1 className="mt-1 text-3xl font-black">{t('page_title')}</h1>
        <p className="mt-2 text-sm text-zinc-400">{t('page_desc')}</p>
      </div>

      {/* Bolão filter pills */}
      {userBoloes.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 pb-1">
          <button
            onClick={() => setSelectedBolaoId(null)}
            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-colors ${
              selectedBolaoId === null ? "bg-primary text-black" : "bg-white/10 text-zinc-400 hover:bg-white/20"
            }`}
          >
            {t('filter_global')}
          </button>
          {userBoloes.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBolaoId(b.id)}
              className={`max-w-[160px] truncate rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-colors ${
                selectedBolaoId === b.id ? "bg-primary text-black" : "bg-white/10 text-zinc-400 hover:bg-white/20"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      {myPosition && (
        <div className="mb-6 rounded-[28px] border border-primary/30 bg-primary/10 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{t('my_position')}</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">#{myPosition.rank}</h2>
              <p className="text-sm text-zinc-300">{myPosition.name}</p>
            </div>
            <div className="rounded-full bg-primary px-4 py-2 text-sm font-black text-black">
              {myPosition.points} pts
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {podium.map((row, index) => (
          <div key={row.userId} className="surface-card p-5">
            <div className="mb-3 inline-flex rounded-full bg-primary/15 p-3 text-primary">
              {index === 0 ? <Crown className="h-5 w-5" /> : index === 1 ? <Trophy className="h-5 w-5" /> : <Medal className="h-5 w-5" />}
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              {index === 0 ? t('leader') : index === 1 ? t('vice_leader') : t('top3')}
            </p>
            <h2 className="mt-2 text-xl font-black">{row.name}</h2>
            <p className="mt-1 text-sm text-zinc-400">{row.favoriteTeam ? t('favorite_team', { team: row.favoriteTeam }) : t('no_favorite_team')}</p>
            <div className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-black">
              {row.points} pts
            </div>
          </div>
        ))}
      </div>

      <div className="surface-card-strong rounded-[32px] p-4 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-primary">{t('overall_title')}</h2>
        </div>

        <div className="space-y-3">
          {displayRows.map((row, index) => (
            <div
              key={row.userId}
              className="surface-card-soft flex items-center justify-between gap-4 rounded-2xl px-4 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 text-center text-lg font-black text-primary">#{index + 1}</div>
                <div>
                  <div className="font-black">{row.name}</div>
                  <div className="text-sm text-zinc-400">{row.favoriteTeam ? t('favorite_team_short', { team: row.favoriteTeam }) : t('no_favorite_team_short')}</div>
                </div>
              </div>
              <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-black">{row.points} pts</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
