import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Crown, Info, Share2, Trophy, Users } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { teams } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { JogosTab } from "@/components/copa/bolao/JogosTab";
import { RealtimeRankingTab } from "@/components/copa/bolao/RealtimeRankingTab";
import { PublicPalpitesTab } from "@/components/copa/bolao/PublicPalpitesTab";

type BolaoData = {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  category: "public" | "private";
  invite_code: string;
  avatar_url?: string | null;
  scoring_rules: {
    exact: number;
    winner: number;
    draw: number;
    participation: number;
  };
};

export default function BolaoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const initialTab = searchParams.get("tab") || "ranking";
  const highlightedMatch = searchParams.get("match");

  const [bolao, setBolao] = useState<BolaoData | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [championOpen, setChampionOpen] = useState(false);
  const [championSelection, setChampionSelection] = useState("");
  const [myChampion, setMyChampion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  const loadBolao = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);

    try {
      const { data: membership, error: membershipError } = await supabase
        .from("bolao_members")
        .select("id")
        .eq("bolao_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (membershipError) throw membershipError;
      if (!membership) {
        toast({ title: "Você não é membro deste bolão." });
        navigate("/boloes");
        return;
      }

      const { data: bData, error } = await supabase
        .from("boloes")
        .select("id, name, description, creator_id, category, invite_code, avatar_url, scoring_rules, bolao_members(count)")
        .eq("id", id)
        .single();

      if (error || !bData) throw new Error("Bolão não encontrado");

      setBolao({
        id: bData.id,
        name: bData.name,
        description: bData.description,
        creator_id: bData.creator_id,
        category: bData.category,
        invite_code: bData.invite_code,
        avatar_url: bData.avatar_url,
        scoring_rules: bData.scoring_rules,
      });

      setMemberCount(bData.bolao_members?.[0]?.count ?? 0);

      const { data: champ } = await supabase
        .from("bolao_champion_predictions")
        .select("team_code")
        .eq("bolao_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (champ?.team_code) {
        setMyChampion(champ.team_code);
        setChampionSelection(champ.team_code);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao carregar o bolão.",
        description: "Tenta novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast, user]);

  useEffect(() => {
    loadBolao();
  }, [loadBolao]);

  const saveChampion = async () => {
    if (!championSelection || !user || !bolao) return;

    try {
      const { error } = await supabase.from("bolao_champion_predictions").upsert(
        {
          bolao_id: bolao.id,
          user_id: user.id,
          team_code: championSelection,
        },
        { onConflict: "bolao_id,user_id" as any }
      );

      if (error) throw error;

      setMyChampion(championSelection);
      setChampionOpen(false);

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      toast({
        title: "Aposta de campeão registrada.",
        className: "bg-emerald-500 text-white font-black",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar campeão.",
        variant: "destructive",
      });
    }
  };

  const tabs = useMemo(
    () => [
      { id: "ranking", label: "Ranking" },
      { id: "jogos", label: highlightedMatch ? "Palpite pendente" : "Seus palpites" },
      { id: "palpites", label: "Palpites rivais" },
    ],
    [highlightedMatch]
  );

  useEffect(() => {
    if (highlightedMatch) {
      setActiveTab("jogos");
    }
  }, [highlightedMatch]);

  if (loading) return <BolaoDetailSkeleton />;
  if (!bolao) return <EmptyState title="Bolão não encontrado" description="Confira o link ou volte para a lista." />;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 text-white">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate("/boloes")}
            className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/10 bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              {bolao.category === "public" ? "Bolão público" : "Bolão privado"}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-white/10 bg-black/20 text-2xl">
                {bolao.avatar_url || "🏆"}
              </div>
              <div>
                <h1 className="text-3xl font-black">{bolao.name}</h1>
                {bolao.description && <p className="mt-1 max-w-2xl text-sm text-zinc-400">{bolao.description}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!myChampion && (
            <button
              onClick={() => setChampionOpen(true)}
              className="inline-flex h-12 items-center gap-2 rounded-[20px] bg-primary px-4 text-[11px] font-black uppercase tracking-[0.18em] text-black"
            >
              <Crown className="h-4 w-4" />
              Apostar campeão
            </button>
          )}

          {myChampion && (
            <div className="inline-flex h-12 items-center gap-2 rounded-[20px] border border-primary/30 bg-primary/10 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              <Trophy className="h-4 w-4" />
              Meu campeão: {myChampion}
            </div>
          )}

          <button
            onClick={() => setInfoOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/10 bg-white/5"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 text-sm text-zinc-300">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <Users className="h-4 w-4 text-primary" />
          {memberCount} membros
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <Share2 className="h-4 w-4 text-primary" />
          Código: {bolao.invite_code}
        </div>
      </div>

      <div className="mb-6 flex gap-3 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "shrink-0 rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all",
              activeTab === tab.id ? "bg-white text-black" : "border border-white/10 bg-white/5 text-zinc-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-[32px] border border-white/10 bg-zinc-950 p-4 md:p-6">
        {activeTab === "ranking" && <RealtimeRankingTab bolaoId={bolao.id} />}
        {activeTab === "jogos" && <JogosTab bolaoId={bolao.id} highlightedMatchId={highlightedMatch || undefined} />}
        {activeTab === "palpites" && <PublicPalpitesTab bolaoId={bolao.id} />}
      </div>

      <Dialog open={championOpen} onOpenChange={setChampionOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle>Quem leva a taça?</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {teams.map((team: any) => (
              <button
                key={team.code}
                onClick={() => setChampionSelection(team.code)}
                className={cn(
                  "rounded-[20px] border p-3 transition-all",
                  championSelection === team.code ? "scale-[1.03] border-primary bg-primary/10" : "border-white/10 bg-white/5"
                )}
              >
                <div className="mb-2 flex justify-center">
                  <Flag code={team.code} />
                </div>
                <div className="text-center text-xs font-black">{team.code}</div>
              </button>
            ))}
          </div>

          <button
            onClick={saveChampion}
            disabled={!championSelection}
            className="mt-4 w-full rounded-2xl bg-primary px-4 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
          >
            Confirmar aposta
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 text-white">
          <DialogHeader>
            <DialogTitle>Regras da arena</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
            <div className="flex justify-between gap-4"><span>Placar exato</span><strong>{bolao.scoring_rules?.exact ?? 0} pts</strong></div>
            <div className="flex justify-between gap-4"><span>Resultado (vitória/empate/derrota)</span><strong>{bolao.scoring_rules?.winner ?? 0} pts</strong></div>
            <div className="flex justify-between gap-4"><span>Empate</span><strong>{bolao.scoring_rules?.draw ?? 0} pts</strong></div>
            <div className="flex justify-between gap-4"><span>Participação</span><strong>{bolao.scoring_rules?.participation ?? 0} pt</strong></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BolaoDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Skeleton className="mb-4 h-16 rounded-3xl bg-white/10" />
      <Skeleton className="mb-4 h-10 rounded-2xl bg-white/10" />
      <Skeleton className="h-[420px] rounded-[32px] bg-white/10" />
    </div>
  );
}
