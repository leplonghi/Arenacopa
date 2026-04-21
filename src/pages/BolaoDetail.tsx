import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, Crown, Info, Share2, Trophy, Users } from "lucide-react";
import confetti from "canvas-confetti";
import type { TFunction } from "i18next";
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
import { getSiteUrl } from "@/utils/site-url";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPublicProfilesByIds } from "@/services/profile/profile.service";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { teams } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { saveBolaoPrediction } from "@/services/boloes/bolao-prediction.service";
import { BolaoEditPanel } from "@/features/boloes/edit/BolaoEditPanel";
import type { BolaoActivity, BolaoData, BolaoMarket, BolaoOnboardingState, BolaoPrediction, MemberData, Palpite } from "@/types/bolao";

type BolaoDetailTab = "palpites" | "ranking" | "pessoas" | "resumo";

const JogosTab = lazy(() =>
  import("@/components/copa/bolao/JogosTab").then((module) => ({ default: module.JogosTab }))
);
const RealtimeRankingTab = lazy(() =>
  import("@/components/copa/bolao/RealtimeRankingTab").then((module) => ({
    default: module.RealtimeRankingTab,
  }))
);
const CaixinhaPanel = lazy(() =>
  import("@/components/CaixinhaPanel").then((module) => ({ default: module.CaixinhaPanel }))
);
const GrupoLinkPanel = lazy(() =>
  import("@/components/copa/bolao/GrupoLinkPanel").then((module) => ({
    default: module.GrupoLinkPanel,
  }))
);
const PublicPalpitesTab = lazy(() =>
  import("@/components/copa/bolao/PublicPalpitesTab").then((module) => ({
    default: module.PublicPalpitesTab,
  }))
);
const OverviewTab = lazy(() =>
  import("@/components/copa/bolao/OverviewTab").then((module) => ({ default: module.OverviewTab }))
);
const MembrosTab = lazy(() =>
  import("@/components/copa/bolao/MembrosTab").then((module) => ({ default: module.MembrosTab }))
);
const ExtrasTab = lazy(() =>
  import("@/components/copa/bolao/ExtrasTab").then((module) => ({ default: module.ExtrasTab }))
);
const PhaseMarketsTab = lazy(() =>
  import("@/components/copa/bolao/markets/PhaseMarketsTab").then((module) => ({
    default: module.PhaseMarketsTab,
  }))
);
const SpecialMarketsTab = lazy(() =>
  import("@/components/copa/bolao/markets/SpecialMarketsTab").then((module) => ({
    default: module.SpecialMarketsTab,
  }))
);
const BolaoIntroModal = lazy(() =>
  import("@/components/copa/bolao/onboarding/BolaoIntroModal").then((module) => ({
    default: module.BolaoIntroModal,
  }))
);
const BolaoTour = lazy(() =>
  import("@/components/copa/bolao/onboarding/BolaoTour").then((module) => ({
    default: module.BolaoTour,
  }))
);

function normalizeBolaoTab(tab: string | null): BolaoDetailTab | null {
  switch (tab) {
    case "palpitar":
    case "palpites":
      return "palpites";
    case "ranking":
      return "ranking";
    case "galera":
    case "pessoas":
      return "pessoas";
    case "config":
    case "resumo":
      return "resumo";
    default:
      return null;
  }
}

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation('bolao');
  const { user } = useAuth();
  const { toast } = useToast();

  const requestedTab = normalizeBolaoTab(searchParams.get("tab"));
  const highlightedMatch = searchParams.get("match");

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
  const [activeTab, setActiveTab] = useState<BolaoDetailTab>(requestedTab ?? (highlightedMatch ? "palpites" : "resumo"));
  const initialTabHydratedRef = useRef(false);

  const [showEditPanel, setShowEditPanel] = useState(false);

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
  const predictionMarketIds = useMemo(
    () => new Set(myMarketPredictions.map((prediction) => prediction.market_id)),
    [myMarketPredictions]
  );
  const savedLegacyMatchIds = useMemo(
    () =>
      new Set(
        myPalpites
          .filter((palpite) => palpite.home_score != null && palpite.away_score != null)
          .map((palpite) => palpite.match_id)
      ),
    [myPalpites]
  );
  const pendingOverview = useMemo(() => {
    const openMatchMap = new Map<string, BolaoMarket[]>();

    matchMarkets.forEach((market) => {
      if (!market.match_id || market.status !== "open") return;
      const existing = openMatchMap.get(market.match_id) ?? [];
      existing.push(market);
      openMatchMap.set(market.match_id, existing);
    });

    const pendingMatches = Array.from(openMatchMap.entries()).filter(([matchId, marketsForMatch]) => {
      const scoreSaved =
        savedLegacyMatchIds.has(matchId) ||
        marketsForMatch.some(
          (market) => market.slug === "exact_score" && predictionMarketIds.has(market.id)
        );

      return marketsForMatch.some((market) =>
        market.slug === "exact_score" ? !scoreSaved : !predictionMarketIds.has(market.id)
      );
    }).length;

    const openPhase = phaseMarkets.filter((market) => market.status === "open");
    const openTournament = tournamentMarkets.filter((market) => market.status === "open");
    const openSpecial = specialMarkets.filter((market) => market.status === "open");

    const pendingPhase = openPhase.filter((market) => !predictionMarketIds.has(market.id)).length;
    const pendingTournament = openTournament.filter((market) => !predictionMarketIds.has(market.id)).length;
    const pendingSpecial = openSpecial.filter((market) => !predictionMarketIds.has(market.id)).length;

    const totalOpen =
      openMatchMap.size +
      openPhase.length +
      openTournament.length +
      openSpecial.length;
    const totalPending =
      pendingMatches +
      pendingPhase +
      pendingTournament +
      pendingSpecial;

    const summaryParts = [
      pendingMatches > 0 ? `${pendingMatches} ${pendingMatches === 1 ? "jogo" : "jogos"}` : null,
      pendingPhase > 0 ? `${pendingPhase} ${pendingPhase === 1 ? "mercado de fase" : "mercados de fase"}` : null,
      pendingTournament > 0 ? `${pendingTournament} ${pendingTournament === 1 ? "mercado de campeonato" : "mercados de campeonato"}` : null,
      pendingSpecial > 0 ? `${pendingSpecial} ${pendingSpecial === 1 ? "especial" : "especiais"}` : null,
    ].filter(Boolean) as string[];

    return {
      pendingMatches,
      pendingPhase,
      pendingTournament,
      pendingSpecial,
      totalOpen,
      totalPending,
      completed: Math.max(totalOpen - totalPending, 0),
      summary: summaryParts.join(" • "),
    };
  }, [matchMarkets, phaseMarkets, predictionMarketIds, savedLegacyMatchIds, specialMarkets, tournamentMarkets]);

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
        grupo_id: bData.grupo_id ?? null,
        visibility_mode: bData.visibility_mode,
        cutoff_mode: bData.cutoff_mode,
        schema_version: bData.schema_version,
        editable_sections: bData.editable_sections,
        lifecycle: bData.lifecycle,
        integrity: bData.integrity,
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
  }, [id, navigate, t, toast, user]);

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
      const publicProfiles = await getPublicProfilesByIds(profileIds);
      const profilesMap: Record<string, { name: string | null; avatar_url: string | null }> = {};
      publicProfiles.forEach((profile, profileId) => {
        profilesMap[profileId] = {
          name: profile.name ?? null,
          avatar_url: profile.avatar_url ?? null,
        };
      });

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

    const inviteUrl = `${getSiteUrl()}/b/${bolao.invite_code}`;
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
    setActiveTab("palpites");
    setShowBolaoIntro(false);
  }, [persistBolaoIntroState]);

  const activeTourTab = useMemo(() => {
    if (showBolaoIntro) return null;

    if (activeTab === "ranking" && !onboardingState?.seen_ranking) {
      return "ranking" as const;
    }

    if (activeTab === "palpites" && !onboardingState?.seen_markets) {
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
      {
        id: "palpites" as const,
        label: highlightedMatch
          ? t('bolao_detail.tab_palpitar_pending', { defaultValue: "Palpites pendentes" })
          : t('bolao_detail.tab_palpite', { defaultValue: "Palpites" }),
      },
      { id: "ranking" as const, label: t('bolao_detail.tab_ranking', { defaultValue: "Ranking" }) },
      { id: "pessoas" as const, label: t('bolao_detail.tab_people', { defaultValue: "Pessoas" }) },
      { id: "resumo" as const, label: t('bolao_detail.tab_summary', { defaultValue: "Resumo" }) },
    ],
    [highlightedMatch, t]
  );

  const [galeraView, setGaleraView] = useState("rivais");

  useEffect(() => {
    if (highlightedMatch) {
      setActiveTab("palpites");
    }
  }, [highlightedMatch]);

  useEffect(() => {
    const fallbackTab: BolaoDetailTab =
      highlightedMatch || pendingOverview.totalPending > 0 ? "palpites" : "resumo";
    const nextTab = requestedTab ?? fallbackTab;

    if (!initialTabHydratedRef.current || requestedTab) {
      setActiveTab(nextTab);
      initialTabHydratedRef.current = true;
    }
  }, [highlightedMatch, pendingOverview.totalPending, requestedTab]);

  if (loading) return <BolaoDetailSkeleton t={t} />;
  if (!bolao) return <EmptyState icon="🏆" title={t('bolao_detail.not_found_title')} description={t('bolao_detail.not_found_desc')} />;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 text-white">
      <Suspense fallback={null}>
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
      </Suspense>

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
            <div className="mt-2 flex items-start gap-4">
              <BolaoAvatar
                avatarUrl={bolao.avatar_url}
                alt={bolao.name}
                className="surface-card-soft flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] text-3xl"
              />
              <div className="flex-1">
                <div className="group relative pr-8">
                  <h1 className="text-3xl font-black leading-tight sm:text-4xl">{bolao.name}</h1>
                  {bolao.description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400">{bolao.description}</p>}

                  {isCreator && (
                    <button
                      onClick={() => setShowEditPanel(true)}
                      className="absolute right-0 top-1 rounded-lg p-2 text-zinc-500 opacity-100 transition-opacity hover:bg-white/5 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                      title="Editar bolão"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                    </button>
                  )}
                </div>
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

      <div className="mb-6 flex flex-wrap gap-2 text-sm text-zinc-300">
        <div className="surface-chip rounded-xl px-4 py-2 flex items-center gap-2 border border-white/5 bg-white/5">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-bold text-white">{memberCount}</span>
          <span className="text-xs">{t('bolao_detail.members_label')}</span>
        </div>
        <div className="surface-chip rounded-xl px-4 py-2 flex items-center gap-2 border border-white/5 bg-white/5">
          <Share2 className="h-4 w-4 text-primary" />
          <span className="font-black tracking-widest text-white">{bolao.invite_code}</span>
        </div>
        
        {isCreator && (
          <button 
            onClick={() => setActiveTab('resumo')}
            className="surface-chip rounded-xl px-4 py-2 flex items-center gap-2 border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 transition-colors"
          >
            <Crown className="h-4 w-4 text-orange-500" />
            <span className="font-black text-orange-500 uppercase tracking-wider text-[10px]">{t('bolao_detail.admin_badge')}</span>
          </button>
        )}
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

      <div className="mb-6 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,198,0,0.16),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
              {t("bolao_detail.next_play_kicker", { defaultValue: "Próxima jogada" })}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {pendingOverview.totalPending > 0
                ? t("bolao_detail.pending_title", {
                    defaultValue: "Você ainda tem {{count}} pendências abertas",
                    count: pendingOverview.totalPending,
                  })
                : t("bolao_detail.caught_up_title", {
                    defaultValue: "Você está em dia neste bolão",
                  })}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              {pendingOverview.totalPending > 0
                ? pendingOverview.summary || t("bolao_detail.pending_desc_fallback", { defaultValue: "Abra seus palpites e feche tudo antes do próximo prazo." })
                : t("bolao_detail.caught_up_desc", {
                    defaultValue: "Agora você pode acompanhar o ranking, a galera e os mercados resolvidos sem correr contra o relógio.",
                  })}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-3 text-left sm:min-w-[150px] sm:text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                {t("bolao_detail.progress_label", { defaultValue: "Progresso" })}
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {pendingOverview.totalOpen > 0 ? `${pendingOverview.completed}/${pendingOverview.totalOpen}` : "0/0"}
              </p>
              <p className="text-xs text-zinc-400">
                {pendingOverview.totalPending > 0
                  ? t("bolao_detail.progress_pending", {
                      defaultValue: "Faltam {{count}} para fechar",
                      count: pendingOverview.totalPending,
                    })
                  : t("bolao_detail.progress_done", { defaultValue: "Tudo salvo por enquanto" })}
              </p>
            </div>
            <button
              onClick={() => setActiveTab(pendingOverview.totalPending > 0 ? "palpites" : "ranking")}
              className="rounded-[24px] bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              {pendingOverview.totalPending > 0
                ? t("bolao_detail.go_to_predictions", { defaultValue: "Palpitar agora" })
                : t("bolao_detail.go_to_ranking", { defaultValue: "Ver ranking" })}
            </button>
          </div>
        </div>
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
        <Suspense fallback={null}>
          {activeTourTab && <BolaoTour tab={activeTourTab} onDismiss={dismissTour} />}
      </Suspense>

      <BolaoEditPanel
        bolao={bolao}
        open={showEditPanel}
        onOpenChange={setShowEditPanel}
        onBolaoUpdated={(patch) =>
          setBolao((currentBolao) =>
            currentBolao
              ? {
                  ...currentBolao,
                  ...patch,
                }
              : currentBolao,
          )
        }
      />

        {/* ── Palpites: jogos + fases collapsíveis ── */}
        {activeTab === "palpites" && (
          <Suspense fallback={<DetailSectionFallback />}>
            <div className="space-y-4">
              <JogosTab bolaoId={bolao.id} bolao={bolao} highlightedMatchId={highlightedMatch || undefined} markets={bolaoMarkets} predictions={myMarketPredictions} />
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
          </Suspense>
        )}

        {/* ── Ranking ── */}
        {activeTab === "ranking" && (
          <Suspense fallback={<DetailSectionFallback />}>
            <RealtimeRankingTab bolaoId={bolao.id} rules={bolao.scoring_rules} />
          </Suspense>
        )}

        {/* ── Pessoas: Rivais + Membros ── */}
        {activeTab === "pessoas" && (
          <Suspense fallback={<DetailSectionFallback />}>
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
          </Suspense>
        )}

        {/* ── Resumo: Overview + Admin ── */}
        {activeTab === "resumo" && bolao && (
          <Suspense fallback={<DetailSectionFallback />}>
            <div className="space-y-6">
              <OverviewTab bolao={bolao} members={members} palpites={myPalpites} userId={user!.id} isCreator={isCreator} markets={bolaoMarkets} marketPredictions={allMarketPredictions} activityFeed={activityFeed} onShare={handleShareInvite} />
              <div className="border-t border-white/10 pt-6">
                 <p className="mb-4 text-xs font-black uppercase tracking-widest text-zinc-400">{t('bolao_detail.caixinha_header')}</p>
                <CaixinhaPanel bolao={bolao} isCreator={isCreator} />
              </div>
              {isCreator && (
                <div className="border-t border-white/10 pt-6">
                  <GrupoLinkPanel
                    bolaoId={bolao.id}
                    currentGrupoId={bolao.grupo_id || null}
                    onLinkedGroupChange={(grupoId) =>
                      setBolao((currentBolao) =>
                        currentBolao ? { ...currentBolao, grupo_id: grupoId } : currentBolao
                      )
                    }
                  />
                </div>
              )}
            </div>
          </Suspense>
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

function BolaoDetailSkeleton({ t }: { t: TFunction<"bolao"> }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Skeleton className="mb-4 h-16 rounded-3xl bg-white/10" />
      <Skeleton className="mb-4 h-10 rounded-2xl bg-white/10" />
      <Skeleton className="h-[420px] rounded-[32px] bg-white/10" />
    </div>
  );
}
