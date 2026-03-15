import { useEffect, useMemo, useState } from "react";
import { Award, Crown, Medal, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

type UserStanding = {
  userId: string;
  name: string;
  avatar: string;
  favoriteTeam: string | null;
  points: number;
};

export default function Ranking() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [globalRows, setGlobalRows] = useState<UserStanding[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const rankingsRef = collection(db, "bolao_rankings");
        const q = query(rankingsRef, orderBy("total_points", "desc"), limit(200));
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
        const profileMap = new Map<string, any>();
        
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
            profileMap.set(data.user_id, data);
          });
        }

        const rows = userIds
          .map((userId) => {
            const profile = profileMap.get(userId);
            return {
              userId,
              name: profile?.name || profile?.nickname || "Torcedor",
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
  }, []);

  const myPosition = useMemo(() => {
    if (!user?.id) return null;
    const index = globalRows.findIndex((row) => row.userId === user.id);
    if (index === -1) return null;
    return { rank: index + 1, ...globalRows[index] };
  }, [globalRows, user?.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Skeleton className="mb-4 h-20 rounded-3xl bg-white/10" />
        <Skeleton className="mb-4 h-32 rounded-3xl bg-white/10" />
        <Skeleton className="h-[420px] rounded-3xl bg-white/10" />
      </div>
    );
  }

  if (!globalRows.length) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <EmptyState
          icon="🏆"
          title="Ranking ainda vazio"
          description="Assim que os bolões começarem a pontuar, o ranking global aparece aqui com dados reais."
        />
      </div>
    );
  }

  const podium = globalRows.slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 text-white">
      <div className="mb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Ranking</p>
        <h1 className="mt-1 text-3xl font-black">Torcedores em alta</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Dados agregados dos bolões já pontuados. Nada de ranking cenográfico fantasiado de métrica.
        </p>
      </div>

      {myPosition && (
        <div className="mb-6 rounded-[28px] border border-primary/30 bg-primary/10 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Sua posição atual</p>
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
          <div key={row.userId} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="mb-3 inline-flex rounded-full bg-primary/15 p-3 text-primary">
              {index === 0 ? <Crown className="h-5 w-5" /> : index === 1 ? <Trophy className="h-5 w-5" /> : <Medal className="h-5 w-5" />}
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              {index === 0 ? "Líder" : index === 1 ? "Vice-líder" : "Top 3"}
            </p>
            <h2 className="mt-2 text-xl font-black">{row.name}</h2>
            <p className="mt-1 text-sm text-zinc-400">{row.favoriteTeam ? `Time favorito: ${row.favoriteTeam}` : "Time favorito não informado"}</p>
            <div className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-black">
              {row.points} pts
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[32px] border border-white/10 bg-zinc-950 p-4 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-primary">Classificação geral</h2>
        </div>

        <div className="space-y-3">
          {globalRows.map((row, index) => (
            <div
              key={row.userId}
              className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 text-center text-lg font-black text-primary">#{index + 1}</div>
                <div>
                  <div className="font-black">{row.name}</div>
                  <div className="text-sm text-zinc-400">{row.favoriteTeam ? `Time favorito: ${row.favoriteTeam}` : "Sem time favorito"}</div>
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
