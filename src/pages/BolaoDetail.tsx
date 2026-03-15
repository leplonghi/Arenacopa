import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Crown, Info, Share2, Trophy, Users } from "lucide-react";
import confetti from "canvas-confetti";
import { db } from "@/integrations/firebase/client";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  getCountFromServer,
  onSnapshot
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { teams } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { JogosTab } from "@/components/copa/bolao/JogosTab";
import { RealtimeRankingTab } from "@/components/copa/bolao/RealtimeRankingTab";
import { PublicPalpitesTab } from "@/components/copa/bolao/PublicPalpitesTab";
import { OverviewTab } from "@/components/copa/bolao/OverviewTab";
import { MembrosTab } from "@/components/copa/bolao/MembrosTab";
import { ExtrasTab } from "@/components/copa/bolao/ExtrasTab";
import { EmptyState } from "@/components/EmptyState";
import type { BolaoData, MemberData, Palpite } from "@/types/bolao";

export default function BolaoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const initialTab = searchParams.get("tab") || "ranking";
  const highlightedMatch = searchParams.get("match");

  const [bolao, setBolao] = useState<BolaoData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [myPalpites, setMyPalpites] = useState<Palpite[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [championOpen, setChampionOpen] = useState(false);
  const [championSelection, setChampionSelection] = useState("");
  const [myChampion, setMyChampion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);

  const isCreator = bolao?.creator_id === user?.id;
  const myMember = members.find(m => m.user_id === user?.id);
  const isPaid = myMember?.payment_status === 'paid' || myMember?.payment_status === 'exempt' || isCreator;

  const loadBolao = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);

    try {
      // Check membership
      const membershipRef = doc(db, "bolao_members", `${user.id}_${id}`);
      const membershipSnap = await getDoc(membershipRef);

      if (!membershipSnap.exists()) {
        toast({ title: "Você não é membro deste bolão." });
        navigate("/boloes");
        return;
      }

      // Fetch bolao info
      const bolaoRef = doc(db, "boloes", id);
      const bolaoSnap = await getDoc(bolaoRef);

      if (!bolaoSnap.exists()) throw new Error("Bolão não encontrado");

      const bData = bolaoSnap.data();
      setBolao({
        id: bolaoSnap.id,
        name: bData.name,
        description: bData.description,
        creator_id: bData.creator_id,
        category: bData.category,
        invite_code: bData.invite_code,
        avatar_url: bData.avatar_url,
        scoring_rules: bData.scoring_rules,
        created_at: bData.created_at || new Date().toISOString(),
        is_paid: bData.is_paid || false,
        entry_fee: bData.entry_fee || null,
        payment_details: bData.payment_details || null,
        prize_distribution: bData.prize_distribution || null,
        status: bData.status || 'active',
      } as BolaoData);

      // Fetch member count
      const membersRef = collection(db, "bolao_members");
      const membersQuery = query(membersRef, where("bolao_id", "==", id));
      const countSnap = await getCountFromServer(membersQuery);
      setMemberCount(countSnap.data().count);

      // Fetch champion prediction
      const champRef = doc(db, "bolao_champion_predictions", `${user.id}_${id}`);
      const champSnap = await getDoc(champRef);

      if (champSnap.exists()) {
        const champData = champSnap.data();
        setMyChampion(champData.team_code);
        setChampionSelection(champData.team_code);
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
    if (!id || !user) return;
    loadBolao();
  }, [id, user, loadBolao]);

  useEffect(() => {
    if (!id || !user) return;

    // Listen to members
    const membersRef = collection(db, "bolao_members");
    const qMembers = query(membersRef, where("bolao_id", "==", id));

    const unsubscribeMembers = onSnapshot(qMembers, async (snapshot) => {
      const membersList: MemberData[] = [];
      
      const profileIds = Array.from(new Set(snapshot.docs.map(doc => doc.data().user_id)));
      
      // Fetch profiles in chunks
      const profilesMap: Record<string, { name: string | null; avatar_url: string | null }> = {};
      const chunkSize = 10;
      for (let i = 0; i < profileIds.length; i += chunkSize) {
        const chunk = profileIds.slice(i, i + chunkSize);
        if (chunk.length === 0) continue;
        const qProfiles = query(collection(db, "profiles"), where("id", "in", chunk));
        const pSnap = await getDocs(qProfiles);
        pSnap.forEach(d => {
          const profileData = d.data();
          profilesMap[d.id] = {
            name: profileData.displayName || profileData.name || null,
            avatar_url: profileData.photoURL || profileData.avatar_url || null,
          };
        });
      }

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        membersList.push({
          id: doc.id,
          bolao_id: data.bolao_id,
          user_id: data.user_id,
          role: data.role,
          payment_status: data.payment_status,
          joined_at: data.joined_at || new Date().toISOString(),
          profile: profilesMap[data.user_id] || null
        } as MemberData);
      });

      setMembers(membersList);
      setMemberCount(membersList.length);
    });

    // Listen to MY palpites
    const palpitesRef = collection(db, "bolao_palpites");
    const qPalpites = query(palpitesRef, where("bolao_id", "==", id), where("user_id", "==", user.id));
    
    const unsubscribePalpites = onSnapshot(qPalpites, (snapshot) => {
      const pList = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Palpite[];
      setMyPalpites(pList);
    });

    return () => {
      unsubscribeMembers();
      unsubscribePalpites();
    };
  }, [id, user]);

  const saveChampion = async () => {
    if (!championSelection || !user || !bolao) return;

    try {
      await setDoc(doc(db, "bolao_champion_predictions", `${user.id}_${bolao.id}`), {
        bolao_id: bolao.id,
        user_id: user.id,
        team_code: championSelection,
        updated_at: new Date().toISOString()
      });

      setMyChampion(championSelection);
      setChampionOpen(false);

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      toast({
        title: "Aposta de campeão registrada.",
        className: "bg-emerald-500 text-white font-black",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar campeão.",
        variant: "destructive",
      });
    }
  };

  const tabs = useMemo(
    () => [
      { id: "overview", label: "Visão Geral" },
      { id: "ranking", label: "Ranking" },
      { id: "jogos", label: highlightedMatch ? "Palpite pendente" : "Seus palpites" },
      { id: "palpites", label: "Palpites rivais" },
      { id: "membros", label: "Membros" },
      { id: "extras", label: "Extras" },
    ],
    [highlightedMatch]
  );

  useEffect(() => {
    if (highlightedMatch) {
      setActiveTab("jogos");
    }
  }, [highlightedMatch]);

  if (loading) return <BolaoDetailSkeleton />;
  if (!bolao) return <EmptyState icon="🏆" title="Bolão não encontrado" description="Confira o link ou volte para a lista." />;

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

      <div className="mb-8 flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "whitespace-nowrap rounded-2xl px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all",
              activeTab === tab.id
                ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                : "border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-[32px] border border-white/10 bg-zinc-950 p-4 md:p-6">
        {activeTab === "overview" && bolao && (
          <OverviewTab 
            bolao={bolao} 
            members={members} 
            palpites={myPalpites} 
            userId={user!.id} 
            isCreator={isCreator}
            onShare={() => {}} 
          />
        )}
        {activeTab === "ranking" && <RealtimeRankingTab bolaoId={bolao.id} />}
        {activeTab === "jogos" && <JogosTab bolaoId={bolao.id} highlightedMatchId={highlightedMatch || undefined} />}
        {activeTab === "palpites" && <PublicPalpitesTab bolaoId={bolao.id} />}
        {activeTab === "membros" && (
          <MembrosTab 
            members={members} 
            userId={user!.id} 
            bolaoId={bolao.id} 
            isCreator={isCreator} 
            isPaid={isPaid}
            onRefresh={() => {}} 
          />
        )}
        {activeTab === "extras" && <ExtrasTab bolaoId={bolao.id} userId={user!.id} />}
      </div>

      <Dialog open={championOpen} onOpenChange={setChampionOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Quem será o campeão?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2 py-4">
            {teams.map((team) => (
              <button
                key={team.code}
                onClick={() => setChampionSelection(team.code)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl p-2 transition-all",
                  championSelection === team.code ? "bg-primary/20 ring-1 ring-primary" : "bg-white/5 hover:bg-white/10"
                )}
              >
                <Flag code={team.code} className="h-8 w-12" />
                <span className="text-[10px] font-bold uppercase">{team.code}</span>
              </button>
            ))}
          </div>
          <button
            onClick={saveChampion}
            disabled={!championSelection}
            className="w-full rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-black disabled:opacity-50"
          >
            Confirmar palpite
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 text-white sm:max-w-[425px]">
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
