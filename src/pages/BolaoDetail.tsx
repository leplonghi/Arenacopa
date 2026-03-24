import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { teams } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { JogosTab } from "@/components/copa/bolao/JogosTab";
import { RealtimeRankingTab } from "@/components/copa/bolao/RealtimeRankingTab";
import { CaixinhaPanel } from "@/components/CaixinhaPanel";
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
  const { t } = useTranslation('bolao');
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

  // Guard setState calls that happen after async operations finish.
  // If the user navigates away while loadBolao() is still in-flight, we must
  // not call setState on the unmounted component.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
        classic: t('bolao_detail.format_classic'),
        detailed: t('bolao_detail.format_detailed'),
        knockout: t('bolao_detail.format_knockout'),
        tournament: t('bolao_detail.format_tournament'),
        strategic: t('bolao_detail.format_strategic'),
      } as const)[bolao.format_id] ?? bolao.format_id
    : null;

  const loadBolao = useCallback(async () => {
    if (!id || !user) return;
    if (mountedRef.current) setLoading(true);

    try {
      // Check membership, bolao info, member count, and champion prediction in parallel
      const membershipRef = doc(db, "bolao_members", `${user.id}_${id}`);
      const bolaoRef = doc(db, "boloes", id);
      const champRef = doc(db, "bolao_champion_predictions", `${user.id}_${id}`);
      const membersQuery = query(collection(db, "bolao_members"), where("bolao_id", "==", id));

      const [membershipSnap, bolaoSnap, champSnap, countSnap] = await Promise.all([
        getDoc(membershipRef),
        getDoc(bolaoRef),
        getDoc(champRef),
        getCountFromServer(membersQuery),
      ]);

      if (!mountedRef.current) return; // component unmounted while fetching

      if (!membershipSnap.exists()) {
        toast({ title: t('bolao_detail.not_member') });
        navigate("/boloes");
        return;
      }

      if (!bolaoSnap.exists()) throw new Error(t('bolao_detail.not_found'));

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

      setMemberCount(countSnap.data().count);

      if (champSnap.exists()) {
        const champData = champSnap.data();
        setMyChampion(champData.team_code);
        setChampionSelection(champData.team_code);
      }
    } catch (error) {
      console.error(error);
      if (mountedRef.current) {
        toast({
          title: t('bolao_detail.load_error'),
          description: t('bolao_detail.load_error_desc'),
          variant: "destructive",
        });
      }
    } finally {
      if (mountedRef.current) setLoading(false);
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
        title: t('bolao_detail.champion_saved'),
        className: "bg-emerald-500 text-white font-black",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: t('bolao_detail.champion_error'),
        variant: "destructive",
      });
    }
  };

  const handleShareInvite = async () => {
    if (!bolao) return;

    const inviteUrl = `${window.location.origin}/b/${bolao.invite_code}`;
    const shareText = `Vem pro bolao "${bolao.name}" no Arena CUP. Usa o codigo ${bolao.invite_code} ou entra por aqui: ${inviteUrl}`;

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
          title: t('bolao_detail.link_copied'),
          description: t('bolao_detail.link_copied_desc'),
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error(error);
      toast({
        title: t('bolao_detail.share_error'),
        description: t('bolao_detail.share_error_desc'),
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
    setActiveTab("palpitar");
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
    () => [
      { id: "palpitar", label: highlightedMatch ? t('bolao_detail.tab_palpitar_pending') : t('bolao_detail.tab_palpitar') },
      { id: "ranking",  label: t('bolao_detail.tab_ranking') },
      { id: "galera",   label: t('bolao_detail.tab_galera') },
      { id: "config",   label: t('bolao_detail.tab_config') },
    ],
    [highlightedMatch]
  );

  const [galeraView, setGaleraView] = useState("rivais");

  useEffect(() => {
    if (highlightedMatch) {
      setActiveTab("palpitar");
    }
  }, [highlightedMatch]);

  useEffect(() => {
    if (validTabs.has(initialTab)) {
      setActiveTab(initialTab);
      return;
    }

    setActiveTab("palpitar");
  }, [initialTab, validTabs]);

  if (loading) return <BolaoDetailSkeleton t={t} />;
  if (!bolao) return <EmptyState icon="🏆" title={t('bolao_detail.not_found_title')} description={t('bolao_detail.not_found_desc')} />;

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
            aria-label={t('bolao_detail.back_button_aria')}
            onClick={() => navigate("/boloes")}
            className="surface-card-soft flex h-12 w-12 items-center justify-center rounded-[20px]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              {bolao.category === "public" ? t('bolao_detail.category_public') : t('bolao_detail.category_private')}
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
              {t('bolao_detail.bet_champion_btn')}
            </button>
          )}

          {championMarket && myChampion && (
            <div className="inline-flex h-12 items-center gap-2 rounded-[20px] border border-primary/30 bg-primary/10 px-4 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              <Trophy className="h-4 w-4" />
              {t('bolao_detail.my_champion_label', { champion: myChampion })}
            </div>
          )}

          <button
            aria-label={t('bolao_detail.info_button_aria')}
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
          {t('bolao_detail.members_count', { count: memberCount })}
        </div>
        <div className="surface-chip rounded-full px-4 py-2">
          <Share2 className="h-4 w-4 text-primary" />
          {t('bolao_detail.invite_code_label', { code: bolao.invite_code })}
        </div>
        {formatLabel && (
          <div className="surface-chip rounded-full px-4 py-2">
            <Trophy className="h-4 w-4 text-primary" />
            {t('bolao_detail.format_label', { format: formatLabel })}
          </div>
        )}
        {bolaoMarkets.length > 0 && (
          <div className="surface-chip rounded-full px-4 py-2">
            <Info className="h-4 w-4 text-primary" />
            {t('bolao_detail.active_markets_count', { count: bolaoMarkets.length })}
          </div>
        )}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "min-h-[52px] rounded-2xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] transition-all",
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

        {/* ── Palpitar: jogos + fases collapsíveis ── */}
        {activeTab === "palpitar" && (
          <div className="space-y-4">
            <JogosTab bolaoId={bolao.id} highlightedMatchId={highlightedMatch || undefined} markets={bolaoMarkets} predictions={myMarketPredictions} />
            {(phaseMarkets.length > 0 || tournamentMarkets.length > 0 || bolaoMarkets.length === 0 || specialMarkets.length > 0) && (
              <Accordion type="multiple" className="space-y-2">
                {phaseMarkets.length > 0 && (
                  <AccordionItem value="fase" className="rounded-2xl border-0 bg-white/5 overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 text-sm font-black uppercase tracking-widest text-zinc-400 hover:no-underline hover:text-zinc-200 [&>svg]:hidden">
                      <span className="flex items-center justify-between w-full">
                        {t('bolao_detail.group_stage_label')} <ChevronDown className="w-4 h-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      <PhaseMarketsTab bolaoId={bolao.id} userId={user!.id} markets={phaseMarkets} predictions={myMarketPredictions} canManage={isCreator} />
                    </AccordionContent>
                  </AccordionItem>
                )}
                {(tournamentMarkets.length > 0 || bolaoMarkets.length === 0) && (
                  <AccordionItem value="campeonato" className="rounded-2xl border-0 bg-white/5 overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 text-sm font-black uppercase tracking-widest text-zinc-400 hover:no-underline hover:text-zinc-200 [&>svg]:hidden">
                      <span className="flex items-center justify-between w-full">
                        {t('bolao_detail.championship_label')} <ChevronDown className="w-4 h-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      <ExtrasTab bolaoId={bolao.id} userId={user!.id} markets={bolaoMarkets} predictions={myMarketPredictions} canManage={isCreator} />
                    </AccordionContent>
                  </AccordionItem>
                )}
                {specialMarkets.length > 0 && (
                  <AccordionItem value="especiais" className="rounded-2xl border-0 bg-white/5 overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 text-sm font-black uppercase tracking-widest text-zinc-400 hover:no-underline hover:text-zinc-200 [&>svg]:hidden">
                      <span className="flex items-center justify-between w-full">
                        {t('bolao_detail.specials_label')} <ChevronDown className="w-4 h-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      <SpecialMarketsTab bolaoId={bolao.id} userId={user!.id} markets={specialMarkets} predictions={myMarketPredictions} phaseMarkets={phaseMarkets} canManage={isCreator} />
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            )}
          </div>
        )}

        {/* ── Ranking ── */}
        {activeTab === "ranking" && <RealtimeRankingTab bolaoId={bolao.id} rules={bolao.scoring_rules} />}

        {/* ── A Galera: Rivais + Membros ── */}
        {activeTab === "galera" && (
          <div>
            <div className="mb-4 flex gap-2">
              <button onClick={() => setGaleraView("rivais")}
                className={cn("rounded-2xl px-4 py-2 text-sm font-black transition-all", galeraView === "rivais" ? "bg-white text-black" : "surface-card-soft text-zinc-400")}>
                {t('bolao_detail.rivals_tab')}
              </button>
              <button onClick={() => setGaleraView("membros")}
                className={cn("rounded-2xl px-4 py-2 text-sm font-black transition-all", galeraView === "membros" ? "bg-white text-black" : "surface-card-soft text-zinc-400")}>
                {t('bolao_detail.members_tab')}
              </button>
            </div>
            {galeraView === "rivais" && <PublicPalpitesTab bolaoId={bolao.id} />}
            {galeraView === "membros" && <MembrosTab members={members} userId={user!.id} bolaoId={bolao.id} isCreator={isCreator} isPaid={isPaid} onRefresh={() => {}} />}
          </div>
        )}

        {/* ── Config: Overview + Caixinha ── */}
        {activeTab === "config" && bolao && (
          <div className="space-y-6">
            <OverviewTab bolao={bolao} members={members} palpites={myPalpites} userId={user!.id} isCreator={isCreator} markets={bolaoMarkets} marketPredictions={allMarketPredictions} activityFeed={activityFeed} onShare={handleShareInvite} />
            <div className="border-t border-white/10 pt-6">
               <p className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-400">{t('bolao_detail.caixinha_header')}</p>
              <CaixinhaPanel bolao={bolao} isCreator={isCreator} />
            </div>
          </div>
        )}
      </div>

      <Dialog open={championOpen} onOpenChange={setChampionOpen}>
        <DialogContent className="surface-dialog sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('bolao_detail.who_is_champion_title')}</DialogTitle>
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
            {t('bolao_detail.confirm_bet_btn')}
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="surface-dialog sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('bolao_detail.rules_modal_title')}</DialogTitle>
          </DialogHeader>

          <div className="surface-card-soft space-y-3 rounded-2xl p-4 text-sm">
            {formatLabel && <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_format')}</span><strong>{formatLabel}</strong></div>}
            {bolaoMarkets.length > 0 && <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_active_markets')}</span><strong>{bolaoMarkets.length}</strong></div>}
            {bolao.visibility_mode && <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_visibility')}</span><strong>{bolao.visibility_mode}</strong></div>}
            {bolao.cutoff_mode && <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_cutoff')}</span><strong>{bolao.cutoff_mode}</strong></div>}
            <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_exact_score')}</span><strong>{bolao.scoring_rules?.exact ?? 0} {t('bolao_detail.points')}</strong></div>
            <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_winner_result')}</span><strong>{bolao.scoring_rules?.winner ?? 0} {t('bolao_detail.points')}</strong></div>
            <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_draw')}</span><strong>{bolao.scoring_rules?.draw ?? 0} {t('bolao_detail.points')}</strong></div>
            <div className="flex justify-between gap-4"><span>{t('bolao_detail.rule_participation')}</span><strong>{bolao.scoring_rules?.participation ?? 0} {t('bolao_detail.points')}</strong></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BolaoDetailSkeleton({ t }: { t: any }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Skeleton className="mb-4 h-16 rounded-3xl bg-white/10" />
      <Skeleton className="mb-4 h-10 rounded-2xl bg-white/10" />
      <Skeleton className="h-[420px] rounded-[32px] bg-white/10" />
    </div>
  );
}
