import { useEffect, useMemo, useState } from "react";
import { Award, Crown, Medal, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";

type RankingRow = {
  user_id: string;
  total_points: number;
  profiles?: {
    favorite_team?: string | null;
    name?: string | null;
    nickname?: string | null;
    avatar_url?: string | null;
  } | null;
};

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
        const { data: rankings } = await supabase
          .from("bolao_rankings")
          .select("user_id, total_points")
          .order("total_points", { ascending: false })
          .limit(200);

        const totals = new Map<string, number>();
        (rankings || []).forEach((row: any) => {
          totals.set(row.user_id, (totals.get(row.user_id) || 0) + (row.total_points || 0));
        });

        const userIds = [...totals.keys()];
        if (!userIds.length) {
          setGlobalRows([]);
          return;
        }

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, favorite_team, name, nickname, avatar_url")
          .in("id", userIds);

        const profileMap = new Map<string, any>();
        (profiles || []).forEach((profile: any) => profileMap.set(profile.id, profile));

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
