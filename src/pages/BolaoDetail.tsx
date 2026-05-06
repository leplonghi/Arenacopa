import { Suspense, lazy, useState } from "react";
import { useParams } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import type { TFunction } from "i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { BolaoEditPanel } from "@/features/boloes/edit/BolaoEditPanel";
import { AdmissionInbox } from "@/features/social/AdmissionInbox";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";
import { BolaoSharePanel } from "@/components/copa/bolao/BolaoSharePanel";
import { buildBolaoInviteUrl, buildBolaoWhatsAppMessage } from "@/utils/bolao-share";

// Hook & Components
import { useBolaoDetail } from "@/features/boloes/hooks/useBolaoDetail";
import { BolaoHeader } from "@/features/boloes/components/BolaoHeader";
import { BolaoActionCenter } from "@/features/boloes/components/BolaoActionCenter";
import { BolaoTabs } from "@/features/boloes/components/BolaoTabs";
import { BolaoChampionDialog } from "@/features/boloes/components/BolaoChampionDialog";
import { BolaoRulesDialog } from "@/features/boloes/components/BolaoRulesDialog";
import { BolaoShareDialog } from "@/components/copa/bolao/BolaoShareDialog";

const JogosTab = lazy(() => import("@/components/copa/bolao/JogosTab").then(m => ({ default: m.JogosTab })));
const RealtimeRankingTab = lazy(() => import("@/components/copa/bolao/RealtimeRankingTab").then(m => ({ default: m.RealtimeRankingTab })));
const CaixinhaPanel = lazy(() => import("@/components/CaixinhaPanel").then(m => ({ default: m.CaixinhaPanel })));
const GrupoLinkPanel = lazy(() => import("@/components/copa/bolao/GrupoLinkPanel").then(m => ({ default: m.GrupoLinkPanel })));
const PublicPalpitesTab = lazy(() => import("@/components/copa/bolao/PublicPalpitesTab").then(m => ({ default: m.PublicPalpitesTab })));
const OverviewTab = lazy(() => import("@/components/copa/bolao/OverviewTab").then(m => ({ default: m.OverviewTab })));
const MembrosTab = lazy(() => import("@/components/copa/bolao/MembrosTab").then(m => ({ default: m.MembrosTab })));
const ExtrasTab = lazy(() => import("@/components/copa/bolao/ExtrasTab").then(m => ({ default: m.ExtrasTab })));
const PhaseMarketsTab = lazy(() => import("@/components/copa/bolao/markets/PhaseMarketsTab").then(m => ({ default: m.PhaseMarketsTab })));
const SpecialMarketsTab = lazy(() => import("@/components/copa/bolao/markets/SpecialMarketsTab").then(m => ({ default: m.SpecialMarketsTab })));
const BolaoIntroModal = lazy(() => import("@/components/copa/bolao/onboarding/BolaoIntroModal").then(m => ({ default: m.BolaoIntroModal })));
const BolaoTour = lazy(() => import("@/components/copa/bolao/onboarding/BolaoTour").then(m => ({ default: m.BolaoTour })));

function DetailSectionFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 rounded-3xl bg-white/10" />
      <Skeleton className="h-40 rounded-3xl bg-white/10" />
      <Skeleton className="h-32 rounded-3xl bg-white/10" />
    </div>
  );
}

export default function BolaoDetail() {
  const { id } = useParams();
  const { user } = useAuth();
<<<<<<< HEAD
  const { t } = useTranslation('bolao');
=======
  const { toast } = useToast();

  const initialTab = searchParams.get("tab") || "ranking";
  const highlightedMatch = searchParams.get("match");
  const validTabs = useMemo(
    () => new Set(["palpitar", "ranking", "galera", "config"]),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    }, (error) => {
      console.error("Activity feed subscription error (check index needs):", error);
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

    if (activeTab === "palpitar" && !onboardingState?.seen_markets) {
      return "jogos" as const;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [highlightedMatch]
  );

>>>>>>> origin/claude/analyze-app-layers-K1iaJ
  const [galeraView, setGaleraView] = useState("rivais");

  const {
    bolao, members, memberCount, joinRequests, myPalpites, bolaoMarkets, myMarketPredictions,
    allMarketPredictions, activityFeed, showBolaoIntro, loading, infoOpen,
    championOpen, championSelection, myChampion, activeTab, showEditPanel, setBolao,
    setInfoOpen, setChampionOpen, setChampionSelection, setActiveTab, setShowEditPanel,
    saveChampion, handleShareInvite, closeBolaoIntro, handleBolaoIntroToPredictions,
    dismissTour, activeTourTab, isCreator, formatLabel, pendingOverview, joinRequestItems,
    matchMarkets, phaseMarkets, specialMarkets, tournamentMarkets, championMarket, highlightedMatch
  } = useBolaoDetail(id);

  const [shareVipOpen, setShareVipOpen] = useState(false);

  if (loading) return <BolaoDetailSkeleton t={t} />;
  if (!bolao) return <EmptyState icon="🏆" title={t('bolao_detail.not_found_title')} description={t('bolao_detail.not_found_desc')} />;

  const completionPercent = pendingOverview.totalOpen > 0 ? Math.round((pendingOverview.completed / pendingOverview.totalOpen) * 100) : 100;
  const bolaoInviteUrl = buildBolaoInviteUrl(bolao.invite_code);
  const bolaoShareText = buildBolaoWhatsAppMessage({ name: bolao.name, inviteCode: bolao.invite_code, inviteUrl: bolaoInviteUrl, context: bolao.grupo_id ? "evento" : "turma" });

  const tabs = [
    { id: "palpites" as const, label: highlightedMatch ? t('bolao_detail.tab_palpitar_pending') : t('bolao_detail.tab_palpite'), badge: null },
    { id: "ranking" as const, label: t('bolao_detail.tab_ranking'), badge: null },
    { id: "turma" as const, label: t('bolao_detail.tab_turma'), badge: isCreator && bolao.category === "private" && joinRequests.length > 0 ? joinRequests.length : null },
  ];

  return (
    <div className="arena-screen max-w-6xl pb-28 pt-6 text-white">
      <Suspense fallback={null}>
        <BolaoIntroModal
          open={showBolaoIntro} bolaoName={bolao.name} formatLabel={formatLabel}
          matchMarketsCount={matchMarkets.length} phaseMarketsCount={phaseMarkets.length}
          tournamentMarketsCount={tournamentMarkets.length} specialMarketsCount={specialMarkets.length}
          onClose={closeBolaoIntro} onGoToPredictions={handleBolaoIntroToPredictions}
        />
      </Suspense>

      <BolaoHeader
        bolao={bolao} isCreator={isCreator} memberCount={memberCount} formatLabel={formatLabel}
        bolaoMarkets={bolaoMarkets} championMarket={championMarket} myChampion={myChampion}
        onEdit={() => setShowEditPanel(true)} onShare={handleShareInvite} onOpenInfo={() => setInfoOpen(true)}
      />

      <BolaoActionCenter pendingOverview={pendingOverview} completionPercent={completionPercent} onAction={setActiveTab} />

      <BolaoTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <ArenaPanel tone="strong" className="p-4 md:p-6">
        <Suspense fallback={null}>
          {activeTourTab && <BolaoTour tab={activeTourTab} onDismiss={dismissTour} />}
        </Suspense>

        <BolaoEditPanel
          bolao={bolao} open={showEditPanel} onOpenChange={setShowEditPanel}
          onBolaoUpdated={(patch) => setBolao(curr => curr ? { ...curr, ...patch } : curr)}
        />

        {activeTab === "palpites" && (
          <Suspense fallback={<DetailSectionFallback />}>
            <div className="space-y-4">
              <JogosTab bolaoId={bolao.id} bolao={bolao} highlightedMatchId={highlightedMatch || undefined} markets={bolaoMarkets} predictions={myMarketPredictions} />
              <Accordion type="multiple" className="space-y-2">
                {phaseMarkets.length > 0 && (
                  <AccordionItem value="fase" className="rounded-2xl border-0 bg-white/5 overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 text-sm font-black uppercase tracking-widest text-zinc-400 hover:no-underline hover:text-zinc-200 [&>svg]:hidden">
                      <span className="flex items-center justify-between w-full">
                        {t('bolao_detail.group_stage_label')} <ChevronDown className="w-4 h-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-0 pb-0">
                      <PhaseMarketsTab bolaoId={bolao.id} userId={user?.id ?? ""} markets={phaseMarkets} predictions={myMarketPredictions} canManage={isCreator} />
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
                      <ExtrasTab bolaoId={bolao.id} userId={user?.id ?? ""} markets={bolaoMarkets} predictions={myMarketPredictions} canManage={isCreator} />
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
                      <SpecialMarketsTab bolaoId={bolao.id} userId={user?.id ?? ""} markets={specialMarkets} predictions={myMarketPredictions} phaseMarkets={phaseMarkets} canManage={isCreator} />
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
<<<<<<< HEAD
          </Suspense>
        )}

        {activeTab === "ranking" && (
          <Suspense fallback={<DetailSectionFallback />}>
            <RealtimeRankingTab bolaoId={bolao.id} rules={bolao.scoring_rules} />
          </Suspense>
        )}

        {activeTab === "turma" && (
          <Suspense fallback={<DetailSectionFallback />}>
            <div className="space-y-6">
              <BolaoSharePanel 
                bolaoName={bolao.name} 
                inviteCode={bolao.invite_code} 
                inviteUrl={bolaoInviteUrl} 
                shareText={bolaoShareText} 
                onNativeShare={handleShareInvite} 
                onGenerateVipCard={() => setShareVipOpen(true)}
              />
              <OverviewTab bolao={bolao} members={members} palpites={myPalpites} userId={user!.id} isCreator={isCreator} markets={bolaoMarkets} marketPredictions={allMarketPredictions} activityFeed={activityFeed} onShare={handleShareInvite} />
              {isCreator && bolao.category === "private" && (
                <AdmissionInbox
                  title={joinRequests.length > 0 ? `${joinRequests.length} solicitação${joinRequests.length > 1 ? "ões" : ""} pendente${joinRequests.length > 1 ? "s" : ""}` : "Solicitações para entrar"}
                  description="Quem pediu acesso a este bolão aparece aqui." items={joinRequestItems}
                />
              )}
              <div className="space-y-4">
                <div className="mb-4 flex gap-2">
                  <button onClick={() => setGaleraView("rivais")} className={cn("rounded-2xl px-4 py-2 text-sm font-black transition-all", galeraView === "rivais" ? "bg-white text-black" : "surface-card-soft text-zinc-400")}>{t('bolao_detail.rivals_tab')}</button>
                  <button onClick={() => setGaleraView("membros")} className={cn("rounded-2xl px-4 py-2 text-sm font-black transition-all", galeraView === "membros" ? "bg-white text-black" : "surface-card-soft text-zinc-400")}>{t('bolao_detail.members_tab')}</button>
                </div>
                {galeraView === "rivais" && <PublicPalpitesTab bolaoId={bolao.id} />}
                {galeraView === "membros" && <MembrosTab members={members} userId={user!.id} bolaoId={bolao.id} isCreator={isCreator} isPaid={Boolean(bolao.is_paid)} onRefresh={() => {}} />}
              </div>
              <div className="border-t border-white/10 pt-6">
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-400">{t('bolao_detail.caixinha_header')}</p>
                <CaixinhaPanel bolao={bolao} isCreator={isCreator} />
              </div>
              {isCreator && (
                <div className="border-t border-white/10 pt-6">
                  <GrupoLinkPanel bolaoId={bolao.id} currentGrupoId={bolao.grupo_id || null} onLinkedGroupChange={(gid) => setBolao(curr => curr ? { ...curr, grupo_id: gid } : curr)} />
                </div>
              )}
=======
            {galeraView === "rivais" && <PublicPalpitesTab bolaoId={bolao.id} />}
            {galeraView === "membros" && <MembrosTab members={members} userId={user?.id ?? ""} bolaoId={bolao.id} isCreator={isCreator} isPaid={isPaid} onRefresh={() => {}} />}
          </div>
        )}

        {/* ── Config: Overview + Caixinha ── */}
        {activeTab === "config" && bolao && (
          <div className="space-y-6">
            <OverviewTab bolao={bolao} members={members} palpites={myPalpites} userId={user?.id ?? ""} isCreator={isCreator} markets={bolaoMarkets} marketPredictions={allMarketPredictions} activityFeed={activityFeed} onShare={handleShareInvite} />
            <div className="border-t border-white/10 pt-6">
               <p className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-400">{t('bolao_detail.caixinha_header')}</p>
              <CaixinhaPanel bolao={bolao} isCreator={isCreator} />
>>>>>>> origin/claude/analyze-app-layers-K1iaJ
            </div>
          </Suspense>
        )}
      </ArenaPanel>

      <BolaoChampionDialog open={championOpen} onOpenChange={setChampionOpen} championSelection={championSelection} onSelect={setChampionSelection} onConfirm={saveChampion} />
      <BolaoRulesDialog open={infoOpen} onOpenChange={setInfoOpen} bolao={bolao} formatLabel={formatLabel} bolaoMarkets={bolaoMarkets} />
      <BolaoShareDialog 
        open={shareVipOpen} 
        onOpenChange={setShareVipOpen} 
        bolao={{
          name: bolao.name,
          avatar_url: bolao.avatar_url,
          invite_code: bolao.invite_code,
          description: bolao.description,
          memberCount: memberCount,
          is_paid: Boolean(bolao.is_paid),
        }} 
      />
    </div>
  );
}

<<<<<<< HEAD
function BolaoDetailSkeleton({ t }: { t: TFunction<"bolao"> }) {
=======
function BolaoDetailSkeleton({ t: _t }: { t: (key: string) => string }) {
>>>>>>> origin/claude/analyze-app-layers-K1iaJ
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Skeleton className="mb-4 h-16 rounded-3xl bg-white/10" />
      <Skeleton className="mb-4 h-10 rounded-2xl bg-white/10" />
      <Skeleton className="h-[420px] rounded-[32px] bg-white/10" />
    </div>
  );
}
