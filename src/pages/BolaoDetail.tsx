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
import { AdmissionInbox } from "@/features/social/AdmissionInbox";
import { approveBolaoJoin, rejectBolaoJoin } from "@/services/groups/group-access.service";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import type { BolaoActivity, BolaoData, BolaoMarket, BolaoOnboardingState, BolaoPrediction, MemberData, Palpite } from "@/types/bolao";
import { ArenaMetric, ArenaPanel, ArenaTabPill } from "@/components/arena/ArenaPrimitives";

type BolaoDetailTab = "palpites" | "ranking" | "pessoas" | "resumo";

type PoolJoinRequestRow = {
  id: string;
  user_id: string;
  display_name: string;
  created_at: string | null;
  updated_at: string | null;
};

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
  const [joinRequests, setJoinRequests] = useState<PoolJoinRequestRow[]>([]);
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
  const isPaid =
    myMember?.payment_status === 'paid' ||
    myMember?.payment_status === 'exempt' ||
    myMember?.payment_status === 'confirmed' ||
    myMember?.payment_status === 'waived' ||
    isCreator;
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

  const joinRequestItems = useMemo(
    () =>
      joinRequests.map((request) => ({
        id: request.id,
        title: request.display_name,
        subtitle: "Quer entrar neste bolão.",
        meta: request.updated_at
          ? `Atualizado em ${new Date(request.updated_at).toLocaleString("pt-BR")}`
          : request.created_at
            ? `Solicitado em ${new Date(request.created_at).toLocaleString("pt-BR")}`
            : null,
        status: "Pendente",
        primaryActionLabel: "Aprovar",
        secondaryActionLabel: "Recusar",
        onPrimaryAction: () =>
          void (async () => {
            try {
              await approveBolaoJoin({
                payload: {
                  bolao_id: bolao?.id || "",
                  request_id: request.id,
                },
              });
              const latencyMinutes = request.created_at
                ? Math.max(Math.round((Date.now() - new Date(request.created_at).getTime()) / 60000), 0)
                : null;
              trackSocialEvent("approval_completed", { kind: "bolao" });
              if (latencyMinutes != null) {
                trackSocialEvent("approval_latency", {
                  kind: "bolao",
                  latency_minutes: latencyMinutes,
                });
              }
              toast({ title: "Solicitação aprovada" });
            } catch {
              toast({
                title: "Não foi possível aprovar",
                variant: "destructive",
              });
            }
          })(),
        onSecondaryAction: () =>
          void (async () => {
            try {
              await rejectBolaoJoin({
                payload: {
                  bolao_id: bolao?.id || "",
                  request_id: request.id,
                },
              });
              toast({ title: "Solicitação recusada" });
            } catch {
              toast({
                title: "Não foi possível recusar",
                variant: "destructive",
              });
            }
          })(),
      })),
    [bolao?.id, joinRequests, toast],
  );

  const loadBolao = useCallback(async () => {
    if (!id || !user) return;
    if (mountedRef.current) setLoading(true);

    try {
      // Keep the bolao and membership reads as the only critical path. Optional
      // documents can be missing or temporarily denied by rules without making
      // the whole bolao look like it does not exist.
      const membershipRef = doc(db, "bolao_members", `${user.id}_${id}`);
      const bolaoRef = doc(db, "boloes", id);

      const [membershipSnap, bolaoSnap] = await Promise.all([
        getDoc(membershipRef),
        getDoc(bolaoRef),
      ]);

      if (!mountedRef.current) return; // component unmounted while fetching

      const membershipStatus = membershipSnap.exists()
        ? String(membershipSnap.data().membership_status || "active")
        : null;

      if (!membershipSnap.exists() || ["left", "removed", "withdrawn_by_owner"].includes(String(membershipStatus))) {
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

      const membersQuery = query(collection(db, "bolao_members"), where("bolao_id", "==", id));
      const countResult = await getCountFromServer(membersQuery).catch((error) => {
        console.warn("Could not load bolao member count:", error);
        return null;
      });
      if (mountedRef.current && countResult) {
        setMemberCount(countResult.data().count);
      }

      const champRef = doc(db, "bolao_champion_predictions", `${user.id}_${id}`);
      const champSnap = await getDoc(champRef).catch((error) => {
        console.warn("Could not load legacy champion prediction:", error);
        return null;
      });
      if (mountedRef.current && champSnap?.exists()) {
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
    if (!id || !user || !bolao) return;
    loadBolao();
  }, [id, user, loadBolao]);

  useEffect(() => {
    if (!id || !user) return;

    // Listen to members
    const membersRef = collection(db, "bolao_members");
    const qMembers = query(membersRef, where("bolao_id", "==", id));

    const unsubscribeMembers = onSnapshot(qMembers, async (snapshot) => {
      const membersList: MemberData[] = [];

      const activeMemberDocs = snapshot.docs.filter((memberDoc) => {
        const membershipStatus = String(memberDoc.data().membership_status || "active");
        return !["left", "removed", "withdrawn_by_owner"].includes(membershipStatus);
      });

      const profileIds = Array.from(new Set(activeMemberDocs.map(doc => doc.data().user_id)));
      
      // Fetch profiles in chunks
      const publicProfiles = await getPublicProfilesByIds(profileIds);
      const profilesMap: Record<string, { name: string | null; avatar_url: string | null }> = {};
      publicProfiles.forEach((profile, profileId) => {
        profilesMap[profileId] = {
          name: profile.name ?? null,
          avatar_url: profile.avatar_url ?? null,
        };
      });

      activeMemberDocs.forEach(doc => {
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
    }, (error) => {
      console.error("Bolao members subscription error:", error);
    });

    let unsubscribeRequests: (() => void) | null = null;
    if (isCreator) {
      const requestsRef = collection(db, "bolao_join_requests");
      const qRequests = query(requestsRef, where("bolao_id", "==", id));
      unsubscribeRequests = onSnapshot(qRequests, async (snapshot) => {
        const pendingDocs = snapshot.docs.filter(
          (requestDoc) => String(requestDoc.data().request_status || "pending") === "pending",
        );
        const profileIds = Array.from(new Set(pendingDocs.map((requestDoc) => String(requestDoc.data().user_id))));
        const profiles = await getPublicProfilesByIds(profileIds);

        if (!mountedRef.current) {
          return;
        }

        setJoinRequests(
          pendingDocs.map((requestDoc) => {
            const userId = String(requestDoc.data().user_id);
            const profile = profiles.get(userId);
            return {
              id: requestDoc.id,
              user_id: userId,
              display_name: profile?.nickname || profile?.name || userId,
              created_at: (requestDoc.data().created_at as string | null) ?? null,
              updated_at: (requestDoc.data().updated_at as string | null) ?? null,
            };
          }),
        );
      }, (error) => {
        console.error("Bolao join requests subscription error:", error);
      });
    } else {
      setJoinRequests([]);
    }

    // Listen to MY palpites
    const palpitesRef = collection(db, "bolao_palpites");
    const qPalpites = query(palpitesRef, where("bolao_id", "==", id), where("user_id", "==", user.id));
    
    const unsubscribePalpites = onSnapshot(qPalpites, (snapshot) => {
      const pList = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Palpite[];
      setMyPalpites(pList);
    }, (error) => {
      console.error("My bolao palpites subscription error:", error);
    });

    const marketsRef = collection(db, "bolao_markets");
    const qMarkets = query(marketsRef, where("bolao_id", "==", id));

    const unsubscribeMarkets = onSnapshot(qMarkets, (snapshot) => {
      const marketList = snapshot.docs
        .map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }) as BolaoMarket)
        .sort((a, b) => a.order_index - b.order_index);

      setBolaoMarkets(marketList);
    }, (error) => {
      console.error("Bolao markets subscription error:", error);
    });

    const predictionsRef = collection(db, "bolao_predictions");
    const qPredictions = query(predictionsRef, where("bolao_id", "==", id), where("user_id", "==", user.id));

    const unsubscribePredictions = onSnapshot(qPredictions, (snapshot) => {
      const predictionList = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data(),
      })) as BolaoPrediction[];

      setMyMarketPredictions(predictionList);
    }, (error) => {
      console.error("My bolao predictions subscription error:", error);
    });

    const qAllPredictions = query(predictionsRef, where("bolao_id", "==", id));
    const unsubscribeAllPredictions = onSnapshot(qAllPredictions, (snapshot) => {
      const predictionList = snapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...snapshotDoc.data(),
      })) as BolaoPrediction[];

      setAllMarketPredictions(predictionList);
    }, (error) => {
      console.error("All bolao predictions subscription error:", error);
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
    }, (error) => {
      console.error("Bolao onboarding subscription error:", error);
    });

    return () => {
      unsubscribeMembers();
      unsubscribePalpites();
      unsubscribeMarkets();
      unsubscribePredictions();
      unsubscribeAllPredictions();
      unsubscribeActivity();
      unsubscribeOnboarding();
      unsubscribeRequests?.();
    };
  }, [bolao, id, isCreator, user]);

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

  const completionPercent = pendingOverview.totalOpen > 0
    ? Math.round((pendingOverview.completed / pendingOverview.totalOpen) * 100)
    : 100;

  return (
    <div className="arena-screen max-w-6xl pb-28 pt-6 text-white">
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

      <ArenaPanel tone="strong" className="mb-6 overflow-hidden p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,196,0,0.18),transparent_22%),radial-gradient(circle_at_15%_0%,rgba(145,255,59,0.12),transparent_28%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                aria-label={t('bolao_detail.back_button_aria')}
                onClick={() => navigate("/boloes")}
                className="surface-card-soft flex h-12 w-12 items-center justify-center rounded-[20px]"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex items-start gap-4">
                <BolaoAvatar
                  avatarUrl={bolao.avatar_url}
                  alt={bolao.name}
                  className="surface-card-soft flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] text-4xl"
                />
                <div className="min-w-0">
                  <p className="arena-kicker text-primary">
                    {bolao.category === "public" ? t('bolao_detail.category_public') : t('bolao_detail.category_private')}
                  </p>
                  <div className="group relative mt-2 pr-8">
                    <h1 className="font-display text-[3rem] font-black uppercase leading-[0.9] tracking-[0.02em] text-white sm:text-[3.8rem]">
                      {bolao.name}
                    </h1>
                    {bolao.description ? (
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                        {bolao.description}
                      </p>
                    ) : null}

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

            <div className="flex flex-wrap items-center gap-2">
              {championMarket && !myChampion && (
                <button
                  onClick={() => setChampionOpen(true)}
                  className="arena-button-gold px-4 py-3 text-sm"
                >
                  <Crown className="h-4 w-4" />
                  {t('bolao_detail.bet_champion_btn')}
                </button>
              )}

              {championMarket && myChampion && (
                <div className="arena-badge rounded-[18px] px-4 py-3 text-[11px]">
                  <Trophy className="h-4 w-4" />
                  {t('bolao_detail.my_champion_label', { champion: myChampion })}
                </div>
              )}

              <button
                onClick={handleShareInvite}
                className="arena-button-green px-4 py-3 text-sm"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </button>

              <button
                aria-label={t('bolao_detail.info_button_aria')}
                onClick={() => setInfoOpen(true)}
                className="surface-card-soft flex h-12 w-12 items-center justify-center rounded-[20px]"
              >
                <Info className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-sm text-zinc-300">
            <div className="arena-badge">
              <Users className="h-3.5 w-3.5" />
              {memberCount} {t('bolao_detail.members_label')}
            </div>
            <div className="arena-badge">
              <Share2 className="h-3.5 w-3.5" />
              código {bolao.invite_code}
            </div>
            {formatLabel ? (
              <div className="arena-badge">
                <Trophy className="h-3.5 w-3.5" />
                {t('bolao_detail.format_label', { format: formatLabel })}
              </div>
            ) : null}
            {bolaoMarkets.length > 0 ? (
              <div className="arena-badge">
                <Info className="h-3.5 w-3.5" />
                {t('bolao_detail.active_markets_count', { count: bolaoMarkets.length })}
              </div>
            ) : null}
            {isCreator ? (
              <button onClick={() => setActiveTab('resumo')} className="arena-badge border-orange-400/30 text-orange-300">
                <Crown className="h-3.5 w-3.5" />
                {t('bolao_detail.admin_badge')}
              </button>
            ) : null}
          </div>
        </div>
      </ArenaPanel>

      <div className="mb-6 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <ArenaPanel className="p-5">
          <p className="arena-kicker text-primary">
            {t("bolao_detail.next_play_kicker", { defaultValue: "Próxima jogada" })}
          </p>
          <h2 className="mt-2 font-display text-[2.5rem] font-black uppercase leading-[0.92] tracking-[0.02em] text-white sm:text-[3.2rem]">
            {pendingOverview.totalPending > 0
              ? t("bolao_detail.pending_title", {
                  defaultValue: "Você ainda tem {{count}} pendências abertas",
                  count: pendingOverview.totalPending,
                })
              : t("bolao_detail.caught_up_title", {
                  defaultValue: "Você está em dia neste bolão",
                })}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">
            {pendingOverview.totalPending > 0
              ? pendingOverview.summary || t("bolao_detail.pending_desc_fallback", { defaultValue: "Abra seus palpites e feche tudo antes do próximo prazo." })
              : t("bolao_detail.caught_up_desc", {
                  defaultValue: "Agora você pode acompanhar o ranking, a galera e os mercados resolvidos sem correr contra o relógio.",
                })}
          </p>
          <div className="mt-5">
            <button
              onClick={() => setActiveTab(pendingOverview.totalPending > 0 ? "palpites" : "ranking")}
              className={pendingOverview.totalPending > 0 ? "arena-button-gold" : "arena-button-green"}
            >
              {pendingOverview.totalPending > 0
                ? t("bolao_detail.go_to_predictions", { defaultValue: "Palpitar agora" })
                : t("bolao_detail.go_to_ranking", { defaultValue: "Ver ranking" })}
            </button>
          </div>
        </ArenaPanel>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <ArenaMetric
            label={t("bolao_detail.progress_label", { defaultValue: "Progresso" })}
            value={pendingOverview.totalOpen > 0 ? `${pendingOverview.completed}/${pendingOverview.totalOpen}` : "0/0"}
            accent
            icon={<Trophy className="h-5 w-5" />}
          />
          <ArenaMetric
            label="Pendências"
            value={pendingOverview.totalPending}
            icon={<Info className="h-5 w-5" />}
          />
          <ArenaMetric
            label="Cobertura"
            value={`${completionPercent}%`}
            icon={<Users className="h-5 w-5" />}
            className="sm:col-span-3 lg:col-span-1"
          />
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="text-left"
          >
            <ArenaTabPill
              active={activeTab === tab.id}
              className={cn(
                "flex min-h-[58px] w-full rounded-[22px] px-4 py-3 text-[11px] tracking-[0.16em]",
                activeTab !== tab.id && "hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
              )}
            >
              {tab.label}
            </ArenaTabPill>
          </button>
        ))}
      </div>

      <ArenaPanel tone="strong" className="p-4 md:p-6">
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
            <div className="space-y-4">
              {isCreator ? (
                <AdmissionInbox
                  title="Solicitações para entrar"
                  description="Quem pediu acesso a este bolão aparece aqui, sem se perder no resto da tela."
                  emptyTitle="Nenhuma solicitação pendente"
                  emptyDescription="Quando alguém pedir entrada, ela aparece aqui."
                  items={joinRequestItems}
                />
              ) : null}
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
      </ArenaPanel>

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
