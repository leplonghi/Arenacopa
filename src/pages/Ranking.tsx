import { useEffect, useMemo, useState } from "react";
import { Award, ShieldCheck, Trophy, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, getDocs, where, documentId } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useTranslation } from "react-i18next";
import { getPublicProfilesByIds } from "@/services/profile/profile.service";
import { ArenaMetric, ArenaPanel, ArenaSectionHeader, ArenaTabPill } from "@/components/arena/ArenaPrimitives";
import { getArenaLevel } from "@/lib/profile-level";
import { RankingPodium } from "@/components/ranking/RankingPodium";
import { RankingListRow } from "@/components/ranking/RankingListRow";
import { RewardProgressCard } from "@/components/ranking/RewardProgressCard";

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
        const profileMap = new Map<string, ProfileSummary>();
        const publicProfiles = await getPublicProfilesByIds(userIds);
        publicProfiles.forEach((profile, profileId) => {
          profileMap.set(profileId, profile as ProfileSummary);
        });

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
  }, [t]);

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
        const nameGroups = await Promise.all(
          Array.from({ length: Math.ceil(bolaoIds.length / 30) }, (_, index) => {
            const batch = bolaoIds.slice(index * 30, index * 30 + 30);
            return getDocs(
              query(collection(db, "boloes"), where(documentId(), "in", batch))
            );
          })
        );
        const names = nameGroups.flatMap((snap) =>
          snap.docs.map((d) => ({ id: d.id, name: d.data().name as string }))
        );
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
        const publicProfiles = await getPublicProfilesByIds(uids.map(([id]) => id));
        publicProfiles.forEach((profile, profileId) => {
          profileMap.set(profileId, profile as ProfileSummary);
        });
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
  const myLevel = getArenaLevel(myPosition?.points);

  return (
    <div className="arena-screen">
      <ArenaPanel tone="strong" className="relative overflow-hidden p-5 md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,193,7,0.1),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(145,255,59,0.1),transparent_28%)]" />
        <ArenaSectionHeader
          eyebrow={t('page_label')}
          title={t('page_title')}
          action={
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-display text-lg font-bold uppercase text-zinc-200">
              Temporada 2026
            </div>
          }
        />

        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => setSelectedBolaoId(null)}>
            <ArenaTabPill active={selectedBolaoId === null}>{t('filter_global')}</ArenaTabPill>
          </button>
          {userBoloes.map((b) => (
            <button key={b.id} onClick={() => setSelectedBolaoId(b.id)}>
              <ArenaTabPill active={selectedBolaoId === b.id} className="max-w-[12rem] truncate">
                {b.name}
              </ArenaTabPill>
            </button>
          ))}
        </div>

        <div className="relative mt-7 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.9fr)]">
          <RankingPodium entries={podium} currentUserId={user?.id} />

          <div className="space-y-4">
            <ArenaPanel className="p-5">
              <p className="arena-kicker text-primary">Recorte da temporada</p>
              <h3 className="mt-2 font-display text-[2rem] font-semibold uppercase leading-[0.92] text-white">
                Competição global com foco no seu progresso
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Acompanhe o topo, compare sua posição e veja quanto falta para alcançar a próxima recompensa.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ArenaMetric
                  label="Competidores"
                  value={displayRows.length.toLocaleString("pt-BR")}
                  icon={<Users className="h-5 w-5" />}
                />
                <ArenaMetric
                  label="Seu nível"
                  value={`N${myLevel.level}`}
                  accent={!!myPosition}
                  icon={<ShieldCheck className="h-5 w-5" />}
                />
              </div>
            </ArenaPanel>

            {myPosition ? (
              <ArenaPanel className="p-5">
                <p className="arena-kicker text-primary">Sua corrida</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ArenaMetric
                    label={t('my_position')}
                    value={`${myPosition.rank}º`}
                    accent
                    icon={<Trophy className="h-5 w-5" />}
                  />
                  <ArenaMetric
                    label="Pontos atuais"
                    value={myPosition.points.toLocaleString("pt-BR")}
                    icon={<Award className="h-5 w-5" />}
                  />
                </div>
              </ArenaPanel>
            ) : null}
          </div>
        </div>
      </ArenaPanel>

      <ArenaPanel className="mt-6 p-4 md:p-5">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h2 className="font-display text-2xl font-black uppercase tracking-[0.08em] text-white">
              {t('overall_title')}
            </h2>
          </div>
          <div className="hidden text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500 md:block">
            posição • jogador • pontos
          </div>
        </div>

        <div className="space-y-2">
          {displayRows.map((row, index) => {
            const rowLevel = getArenaLevel(row.points).level;
            const isCurrentUser = row.userId === user?.id;

            return (
              <RankingListRow
                key={row.userId}
                row={row}
                rank={index + 1}
                level={rowLevel}
                isCurrentUser={isCurrentUser}
              />
            );
          })}
        </div>
      </ArenaPanel>

      {myPosition ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ArenaMetric label={t('my_position')} value={`${myPosition.rank}º`} accent icon={<Trophy className="h-6 w-6" />} />
          <ArenaMetric label="Entre jogadores" value={displayRows.length.toLocaleString("pt-BR")} icon={<Users className="h-6 w-6" />} />
          <RewardProgressCard current={myPosition.points} target={5000} rewardLabel="Baú épico" rewardValue="5.000 pts" />
        </div>
      ) : null}
    </div>
  );
}
