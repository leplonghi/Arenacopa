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
  onSnapshot,
  orderBy,
  limit,
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
import { PhaseMarketsTab } from "@/components/copa/bolao/markets/PhaseMarketsTab";
import { SpecialMarketsTab } from "@/components/copa/bolao/markets/SpecialMarketsTab";
import { BolaoIntroModal } from "@/components/copa/bolao/onboarding/BolaoIntroModal";
import { BolaoTour } from "@/components/copa/bolao/onboarding/BolaoTour";
import { EmptyState } from "@/components/EmptyState";
import { saveBolaoPrediction } from "@/services/boloes/bolao-prediction.service";
import type { BolaoActivity, BolaoData, BolaoMarket, BolaoOnboardingState, BolaoPrediction, MemberData, Palpite } from "@/types/bolao";

export default function BolaoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const initialTab = searchParams.get("tab") || "ranking";
  const highlightedMatch = searchParams.get("match");
  const validTabs = useMemo(
    () => new Set(["overview", "ranking", "jogos", "fase", "palpites", "membros", "extras", "especiais"]),
    []
  );

  const [bolao, setBolao] = useState<BolaoData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [myPalpites, setMyPalpites] = useState<Palpite[]>([]);
  const [bolaoMarkets, setBolaoMarkets] = useState<BolaoMarket[]>([]);
  const [myMarketPredictions, setMyMarketPredictions] = useState<BolaoPrediction[]>([]);
  const [allMarketPredictions, setAllMarketPredictions] = useState<BolaoPrediction[]>([]);
  const [activityFeed, setActivityFeed] = useState<BolaoActivity[]>([]);
  const [onboardingState, setOnboardingState] = useState<BolaoOnboardingState | null>(null);
  const [showBolaoIntro, setShowBolaoIntro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [championOpen, setChampionOpen] = useState(false);
  const [championSelection, setChampionSelection] = useState("");
  const [myChampion, setMyChampion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(validTabs.has(initialTab) ? initialTab : "ranking");

  const isCreator = bolao?.creator_id === user?.id;
  const myMember = members.find(m => m.user_id === user?.id);
  const isPaid = myMember?.payment_status === 'paid' || myMember?.payment_status === 'exempt' || isCreator;
  const championMarket = bolaoMarkets.find((market) => market.slug === "champion");
  const matchMarkets = bolaoMarkets.filter((market) => market.scope === "match");
  const phaseMarkets = bolaoMarkets.filter((market) => market.scope === "phase");
  const specialMarkets = bolaoMarkets.filter((market) => market.scope === "special");
  const tournamentMarkets = bolaoMarkets.filter((market) => market.scope === "tournament");
  const formatLabel = bolao?.format_id
    ? ({
        classic: "Clássico",
        detailed: "Detalhado",
        knockout: "Mata-mata",
        tournament: "Campeonato",
        strategic: "Estratégico",
      } as const)[bolao.format_id] ?? bolao.format_id
    : null;

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
        format_id: bData.format_id,
        scoring_mode: bData.scoring_mode,
        visibility_mode: bData.visibility_mode,
        cutoff_mode: bData.cutoff_mode,
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
        const qProfiles = query(collection(db, "profiles"), where("user_id", "in", chunk));
        const pSnap = await getDocs(qProfiles);
        pSnap.forEach(d => {
          const profileData = d.data();
          const profileKey = typeof profileData.user_id === "string" ? profileData.user_id : d.id;
          profilesMap[profileKey] = {
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

    const marketsRef = collection(db, "bolao_markets");
    const qMarkets = query(marketsRef, where("bolao_id", "==", id));

    const unsubscribeMarkets = onSnapshot(qMarkets, (snapshot) => {
      const marketList = snapshot.docs
        .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }) as BolaoMarket)
        .sort((a, b) => a.order_index - b.order_index);

      setBolaoMarkets(marketList);
    });

    const predictionsRef = collection(db, "bolao_predictions");
    const qPredictions = query(predictionsRef, where("bolao_id", "==", id), where("user_id", "==", user.id));

    const unsubscribePredictions = onSnapshot(qPredictions, (snapshot) => {
      const predictionList = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data(),
      })) as BolaoPrediction[];

      setMyMarketPredictions(predictionList);
    });

    const qAllPredictions = query(predictionsRef, where("bolao_id", "==", id));
    const unsubscribeAllPredictions = onSnapshot(qAllPredictions, (snapshot) => {
      const predictionList = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data(),
      })) as BolaoPrediction[];

      setAllMarketPredictions(predictionList);
    });

    const activityRef = collection(db, "bolao_activity");
    const qActivity = query(activityRef, where("bolao_id", "==", id), orderBy("created_at", "desc"), limit(12));
    const unsubscribeActivity = onSnapshot(qActivity, (snapshot) => {
      const rows = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data(),
        created_at:
          typeof snapshotDoc.data().created_at?.toDate === "function"
            ? snapshotDoc.data().created_at.toDate().toISOString()
            : snapshotDoc.data().created_at,
      })) as BolaoActivity[];

      setActivityFeed(rows);
    });

    const onboardingRef = doc(db, "bolao_onboarding_state", `${user.id}_${id}`);
    const unsubscribeOnboarding = onSnapshot(onboardingRef, (snapshot) => {
      if (!snapshot.exists()) {
        setOnboardingState(null);
        setShowBolaoIntro(true);
        return;
      }

      const data = snapshot.data() as Omit<BolaoOnboardingState, "id">;
      const nextState = { id: snapshot.id, ...data } as BolaoOnboardingState;
      setOnboardingState(nextState);
      setShowBolaoIntro(!nextState.seen_intro);
    });

    return () => {
      unsubscribeMembers();
      unsubscribePalpites();
      unsubscribeMarkets();
      unsubscribePredictions();
      unsubscribeAllPredictions();
      unsubscribeActivity();
      unsubscribeOnboarding();
    };
  }, [id, user]);

  useEffect(() => {
    if (!championMarket) return;

    const prediction = myMarketPredictions.find((item) => item.market_id === championMarket.id);
    const predictionValue = prediction?.prediction_value;

    if (typeof predictionValue === "string" && predictionValue) {
      setMyChampion(predictionValue);
      setChampionSelection(predictionValue);
    }
  }, [championMarket, myMarketPredictions]);

  const saveChampion = async () => {
    if (!championSelection || !user || !bolao) return;

    try {
      const legacyChampionPromise = setDoc(doc(db, "bolao_champion_predictions", `${user.id}_${bolao.id}`), {
        bolao_id: bolao.id,
        user_id: user.id,
        team_code: championSelection,
        updated_at: new Date().toISOString()
      });

      const predictionPromise = championMarket
        ? saveBolaoPrediction({
            bolaoId: bolao.id,
            marketId: championMarket.id,
            userId: user.id,
            predictionValue: championSelection,
          })
        : Promise.resolve(null);

      await Promise.all([legacyChampionPromise, predictionPromise]);

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

  const handleShareInvite = async () => {
    if (!bolao) return;

    const inviteUrl = `${window.location.origin}/b/${bolao.invite_code}`;
    const shareText = `Vem pro bolao "${bolao.name}" no ArenaCopa. Usa o codigo ${bolao.invite_code} ou entra por aqui: ${inviteUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Convite para ${bolao.name}`,
          text: shareText,
          url: inviteUrl,
        });
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        toast({
          title: "Link copiado.",
          description: "Agora é só compartilhar com a galera.",
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error(error);
      toast({
        title: "Não consegui compartilhar agora.",
        description: "Tenta novamente em alguns segundos.",
        variant: "destructive",
      });
    }
  };

  const persistBolaoIntroState = useCallback(
    async (nextValues?: Partial<BolaoOnboardingState>) => {
      if (!id || !user) return;

      const onboardingId = `${user.id}_${id}`;
      const basePayload = {
        id: onboardingId,
        bolao_id: id,
        user_id: user.id,
        seen_intro: true,
        seen_scoring: onboardingState?.seen_scoring ?? false,
        seen_markets: onboardingState?.seen_markets ?? false,
        seen_ranking: onboardingState?.seen_ranking ?? false,
        completed_at: onboardingState?.completed_at ?? null,
        updated_at: new Date().toISOString(),
        ...nextValues,
      };

      await setDoc(doc(db, "bolao_onboarding_state", onboardingId), basePayload, { merge: true });
    },
    [id, onboardingState, user]
  );

  const closeBolaoIntro = useCallback(() => {
    void persistBolaoIntroState();
    setShowBolaoIntro(false);
  }, [persistBolaoIntroState]);

  const handleBolaoIntroToPredictions = useCallback(() => {
    void persistBolaoIntroState({ seen_markets: true });
    setActiveTab("jogos");
    setShowBolaoIntro(false);
  }, [persistBolaoIntroState]);

  const activeTourTab = useMemo(() => {
    if (showBolaoIntro) return null;

    if (activeTab === "ranking" && !onboardingState?.seen_ranking) {
      return "ranking" as const;
    }

    if (
      (activeTab === "jogos" || activeTab === "fase" || activeTab === "extras" || activeTab === "especiais") &&
      !onboardingState?.seen_markets
    ) {
      return activeTab;
    }

    return null;
  }, [activeTab, onboardingState, showBolaoIntro]);

  const dismissTour = useCallback(() => {
    if (activeTourTab === "ranking") {
      void persistBolaoIntroState({ seen_ranking: true });
      return;
    }

    if (activeTourTab) {
      void persistBolaoIntroState({ seen_markets: true });
    }
  }, [activeTourTab, persistBolaoIntroState]);

  const tabs = useMemo(
    () => {
      const baseTabs = [
        { id: "overview", label: "Visão Geral" },
        { id: "ranking", label: "Ranking" },
        { id: "jogos", label: highlightedMatch ? "Palpite pendente" : "Seus palpites" },
      ];

      if (phaseMarkets.length > 0) {
        baseTabs.push({ id: "fase", label: "Por fase" });
      }

      baseTabs.push({ id: "palpites", label: "Palpites rivais" });
      baseTabs.push({ id: "membros", label: "Membros" });

      if (tournamentMarkets.length > 0 || bolaoMarkets.length === 0) {
        baseTabs.push({ id: "extras", label: tournamentMarkets.length > 0 ? "Campeonato" : "Extras" });
      }

      if (specialMarkets.length > 0) {
        baseTabs.push({ id: "especiais", label: "Especiais" });
      }

      return baseTabs;
    },
    [highlightedMatch, phaseMarkets.length, specialMarkets.length, tournamentMarkets.length, bolaoMarkets.length]
  );

  useEffect(() => {
    if (highlightedMatch) {
      setActiveTab("jogos");
    }
  }, [highlightedMatch]);

  useEffect(() => {
    if (validTabs.has(initialTab)) {
      setActiveTab(initialTab);
      return;
    }

    setActiveTab("ranking");
  }, [initialTab, validTabs]);

  if (loading) return <BolaoDetailSkeleton />;
  if (!bolao) return <EmptyState icon="🏆" title="Bolão não encontrado" description="Confira o link ou volte para a lista." />;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 text-white">
      <BolaoIntroModal
        open={showBolaoIntro && Boolean(bolao)}
        bolaoName={bolao.name}
        formatLabel={formatLabel}
        matchMarketsCount={matchMarkets.length}
        phaseMarketsCount={phaseMarkets.length}
        tournamentMarketsCount={tournamentMarkets.length}
        specialMarketsCount={specialMarkets.length}
        onClose={closeBolaoIntro}
        onGoToPredictions={handleBolaoIntroToPredictions}
      />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            aria-label="Voltar para bolões"
            onClick={() => navigate("/boloes")}
            className="surface-card-soft flex h-12 w-12 items-center justify-center rounded-[20px]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              {bolao.category === "public" ? "Bolão público" : "Bolão privado"}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="surface-card-soft flex h-14 w-14 items-center justify-center rounded-[22px] text-2xl">
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
          {championMarket && !myChampion && (
            <button
              onClick={() => setChampionOpen(true)}
              className="inline-flex h-12 items-center gap-2 rounded-[20px] bg-primary px-4 text-[11px] font-black uppercase tracking-[0.18em] text-black"
            >
              <Crown className="h-4 w-4" />
              Apostar campeão
            </button>
          )}

          {championMarket && myChampion && (
            <div className="inline-flex h-12 items-center gap-2 rounded-[20px] border border-primary/30 bg-primary/10 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              <Trophy className="h-4 w-4" />
              Meu campeão: {myChampion}
            </div>
          )}

          <button
            aria-label="Abrir informações do bolão"
            onClick={() => setInfoOpen(true)}
            className="surface-card-soft flex h-12 w-12 items-center justify-center rounded-[20px]"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 text-sm text-zinc-300">
        <div className="surface-chip rounded-full px-4 py-2">
          <Users className="h-4 w-4 text-primary" />
          {memberCount} membros
        </div>
        <div className="surface-chip rounded-full px-4 py-2">
          <Share2 className="h-4 w-4 text-primary" />
          Código: {bolao.invite_code}
        </div>
        {formatLabel && (
          <div className="surface-chip rounded-full px-4 py-2">
            <Trophy className="h-4 w-4 text-primary" />
            Formato: {formatLabel}
          </div>
        )}
        {bolaoMarkets.length > 0 && (
          <div className="surface-chip rounded-full px-4 py-2">
            <Info className="h-4 w-4 text-primary" />
            {bolaoMarkets.length} mercados ativos
          </div>
        )}
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
                : "surface-card-soft text-zinc-400 hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="surface-card-strong rounded-[32px] p-4 md:p-6">
        {activeTourTab && <BolaoTour tab={activeTourTab} onDismiss={dismissTour} />}
        {activeTab === "overview" && bolao && (
          <OverviewTab 
            bolao={bolao} 
            members={members} 
            palpites={myPalpites} 
            userId={user!.id} 
            isCreator={isCreator}
            markets={bolaoMarkets}
            marketPredictions={allMarketPredictions}
            activityFeed={activityFeed}
            onShare={handleShareInvite} 
          />
        )}
        {activeTab === "ranking" && <RealtimeRankingTab bolaoId={bolao.id} rules={bolao.scoring_rules} />}
        {activeTab === "jogos" && (
          <JogosTab
            bolaoId={bolao.id}
            highlightedMatchId={highlightedMatch || undefined}
            markets={bolaoMarkets}
            predictions={myMarketPredictions}
          />
        )}
        {activeTab === "fase" && (
          <PhaseMarketsTab
            bolaoId={bolao.id}
            userId={user!.id}
            markets={phaseMarkets}
            predictions={myMarketPredictions}
            canManage={isCreator}
          />
        )}
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
        {activeTab === "extras" && (
          <ExtrasTab
            bolaoId={bolao.id}
            userId={user!.id}
            markets={bolaoMarkets}
            predictions={myMarketPredictions}
            canManage={isCreator}
          />
        )}
        {activeTab === "especiais" && (
          <SpecialMarketsTab
            bolaoId={bolao.id}
            userId={user!.id}
            markets={specialMarkets}
            predictions={myMarketPredictions}
            phaseMarkets={phaseMarkets}
            canManage={isCreator}
          />
        )}
      </div>

      <Dialog open={championOpen} onOpenChange={setChampionOpen}>
        <DialogContent className="surface-dialog sm:max-w-[425px]">
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
        <DialogContent className="surface-dialog sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Regras da arena</DialogTitle>
          </DialogHeader>

          <div className="surface-card-soft space-y-3 rounded-2xl p-4 text-sm">
            {formatLabel && <div className="flex justify-between gap-4"><span>Formato</span><strong>{formatLabel}</strong></div>}
            {bolaoMarkets.length > 0 && <div className="flex justify-between gap-4"><span>Mercados ativos</span><strong>{bolaoMarkets.length}</strong></div>}
            {bolao.visibility_mode && <div className="flex justify-between gap-4"><span>Visibilidade</span><strong>{bolao.visibility_mode}</strong></div>}
            {bolao.cutoff_mode && <div className="flex justify-between gap-4"><span>Fechamento</span><strong>{bolao.cutoff_mode}</strong></div>}
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
