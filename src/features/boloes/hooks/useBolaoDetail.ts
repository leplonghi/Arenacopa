import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { db } from "@/integrations/firebase/client";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getCountFromServer,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore";
import confetti from "canvas-confetti";
import type { BolaoActivity, BolaoData, BolaoMarket, BolaoOnboardingState, BolaoPrediction, MemberData, Palpite } from "@/types/bolao";
import { getPublicProfilesByIds } from "@/services/profile/profile.service";
import { approveBolaoJoin, rejectBolaoJoin } from "@/services/groups/group-access.service";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import { saveBolaoPrediction } from "@/services/boloes/bolao-prediction.service";
import { buildBolaoInviteUrl, buildBolaoWhatsAppMessage } from "@/utils/bolao-share";

export type BolaoDetailTab = "palpites" | "ranking" | "turma";

type PoolJoinRequestRow = {
  id: string;
  user_id: string;
  display_name: string;
  created_at: string | null;
  updated_at: string | null;
};

function normalizeBolaoTab(tab: string | null): BolaoDetailTab | null {
  switch (tab) {
    case "palpitar":
    case "palpites":
      return "palpites";
    case "ranking":
      return "ranking";
    case "galera":
    case "pessoas":
    case "config":
    case "resumo":
    case "share":
    case "compartilhar":
      return "turma";
    default:
      return null;
  }
}

export function useBolaoDetail(id: string | undefined) {
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
  const [activeTab, setActiveTab] = useState<BolaoDetailTab>(requestedTab ?? (highlightedMatch ? "palpites" : "turma"));
  const [showEditPanel, setShowEditPanel] = useState(false);
  const initialTabHydratedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (searchParams.get("created") === "true") {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
      toast({
        title: "Bolão criado com sucesso!",
        description: "Convide seus amigos para participarem.",
      });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("created");
      navigate(`?${newParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate, toast]);

  const isCreator = bolao?.creator_id === user?.id;
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
      pendingPhase > 0 ? `${pendingPhase} ${pendingPhase === 1 ? "desafio de fase" : "desafios de fase"}` : null,
      pendingTournament > 0 ? `${pendingTournament} ${pendingTournament === 1 ? "desafio de campeonato" : "desafios de campeonato"}` : null,
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
        createdAt: request.created_at,
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
            } catch (error) {
              toast({
                title: "Não foi possível aprovar",
                description:
                  error instanceof Error && error.message === "commercial_participant_limit_reached"
                    ? "Este pacote atingiu o limite de participantes."
                    : undefined,
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
      const membershipRef = doc(db, "bolao_members", `${user.id}_${id}`);
      const bolaoRef = doc(db, "boloes", id);

      const [membershipSnap, bolaoSnap] = await Promise.all([
        getDoc(membershipRef),
        getDoc(bolaoRef),
      ]);

      if (!mountedRef.current) return;

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
      if (bData.lifecycle?.status === "deleted" || bData.status === "deleted") {
        toast({ title: "Este bolão foi apagado" });
        navigate("/boloes", { replace: true });
        return;
      }

      setBolao({
        id: bolaoSnap.id,
        ...bData,
        created_at: bData.created_at || new Date().toISOString(),
      } as BolaoData);

      const membersQuery = query(collection(db, "bolao_members"), where("bolao_id", "==", id));
      const countResult = await getCountFromServer(membersQuery).catch(() => null);
      if (mountedRef.current && countResult) {
        setMemberCount(countResult.data().count);
      }

      const champRef = doc(db, "bolao_champion_predictions", `${user.id}_${id}`);
      const champSnap = await getDoc(champRef).catch(() => null);
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

    const unsubscribeMembers = onSnapshot(query(collection(db, "bolao_members"), where("bolao_id", "==", id)), async (snapshot) => {
      const activeMemberDocs = snapshot.docs.filter((memberDoc) => {
        const status = String(memberDoc.data().membership_status || "active");
        return !["left", "removed", "withdrawn_by_owner"].includes(status);
      });

      const profileIds = Array.from(new Set(activeMemberDocs.map(doc => doc.data().user_id)));
      const publicProfiles = await getPublicProfilesByIds(profileIds);
      const profilesMap: Record<string, any> = {};
      publicProfiles.forEach((profile, profileId) => {
        profilesMap[profileId] = { name: profile.name ?? null, avatar_url: profile.avatar_url ?? null };
      });

      const membersList = activeMemberDocs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        profile: profilesMap[doc.data().user_id] || null
      })) as MemberData[];

      setMembers(membersList);
      setMemberCount(membersList.length);
    });

    let unsubscribeRequests: (() => void) | null = null;
    if (isCreator) {
      unsubscribeRequests = onSnapshot(query(collection(db, "bolao_join_requests"), where("bolao_id", "==", id), where("request_status", "==", "pending")), async (snapshot) => {
        const profileIds = Array.from(new Set(snapshot.docs.map(d => String(d.data().user_id))));
        const profiles = await getPublicProfilesByIds(profileIds);
        setJoinRequests(snapshot.docs.map(doc => {
          const profile = profiles.get(String(doc.data().user_id));
          return {
            id: doc.id,
            user_id: String(doc.data().user_id),
            display_name: profile?.nickname || profile?.name || String(doc.data().user_id),
            created_at: doc.data().created_at,
            updated_at: doc.data().updated_at,
          };
        }));
      });
    }

    const unsubscribePalpites = onSnapshot(query(collection(db, "bolao_palpites"), where("bolao_id", "==", id), where("user_id", "==", user.id)), (snapshot) => {
      setMyPalpites(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Palpite[]);
    });

    const unsubscribeMarkets = onSnapshot(query(collection(db, "bolao_markets"), where("bolao_id", "==", id)), (snapshot) => {
      setBolaoMarkets(snapshot.docs.map(d => ({ id: d.id, ...d.data() }) as BolaoMarket).sort((a, b) => a.order_index - b.order_index));
    });

    const unsubscribePredictions = onSnapshot(query(collection(db, "bolao_predictions"), where("bolao_id", "==", id), where("user_id", "==", user.id)), (snapshot) => {
      setMyMarketPredictions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BolaoPrediction[]);
    });

    const unsubscribeAllPredictions = onSnapshot(query(collection(db, "bolao_predictions"), where("bolao_id", "==", id)), (snapshot) => {
      setAllMarketPredictions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as BolaoPrediction[]);
    });

    const unsubscribeActivity = onSnapshot(query(collection(db, "bolao_activity"), where("bolao_id", "==", id), orderBy("created_at", "desc"), limit(12)), (snapshot) => {
      setActivityFeed(snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        created_at: typeof d.data().created_at?.toDate === "function" ? d.data().created_at.toDate().toISOString() : d.data().created_at,
      })) as BolaoActivity[]);
    });

    const unsubscribeOnboarding = onSnapshot(doc(db, "bolao_onboarding_state", `${user.id}_${id}`), (snapshot) => {
      if (!snapshot.exists()) {
        setOnboardingState(null);
        setShowBolaoIntro(true);
      } else {
        const data = snapshot.data() as any;
        setOnboardingState({ id: snapshot.id, ...data });
        setShowBolaoIntro(!data.seen_intro);
      }
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
    const predictionValue = myMarketPredictions.find((item) => item.market_id === championMarket.id)?.prediction_value;
    if (typeof predictionValue === "string" && predictionValue) {
      setMyChampion(predictionValue);
      setChampionSelection(predictionValue);
    }
  }, [championMarket, myMarketPredictions]);

  const saveChampion = async () => {
    if (!championSelection || !user || !bolao) return;
    try {
      const legacy = setDoc(doc(db, "bolao_champion_predictions", `${user.id}_${bolao.id}`), {
        bolao_id: bolao.id, user_id: user.id, team_code: championSelection, updated_at: new Date().toISOString()
      });
      const prediction = championMarket ? saveBolaoPrediction({
        bolaoId: bolao.id, marketId: championMarket.id, userId: user.id, predictionValue: championSelection,
      }) : Promise.resolve(null);
      await Promise.all([legacy, prediction]);
      setMyChampion(championSelection);
      setChampionOpen(false);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast({ title: t('bolao_detail.champion_saved'), className: "bg-emerald-500 text-white font-black" });
    } catch {
      toast({ title: t('bolao_detail.champion_error'), variant: "destructive" });
    }
  };

  const handleShareInvite = async () => {
    if (!bolao) return;
    const inviteUrl = buildBolaoInviteUrl(bolao.invite_code);
    const shareText = buildBolaoWhatsAppMessage({ name: bolao.name, inviteCode: bolao.invite_code, inviteUrl, context: bolao.grupo_id ? "evento" : "turma" });
    try {
      if (navigator.share) {
        await navigator.share({ title: `Convite para ${bolao.name}`, text: shareText, url: inviteUrl });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({ title: t('bolao_detail.link_copied'), description: t('bolao_detail.link_copied_desc') });
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") toast({ title: t('bolao_detail.share_error'), variant: "destructive" });
    }
  };

  const persistBolaoIntroState = useCallback(async (nextValues?: Partial<BolaoOnboardingState>) => {
    if (!id || !user) return;
    const onboardingId = `${user.id}_${id}`;
    await setDoc(doc(db, "bolao_onboarding_state", onboardingId), {
      id: onboardingId, bolao_id: id, user_id: user.id, seen_intro: true,
      seen_scoring: onboardingState?.seen_scoring ?? false,
      seen_markets: onboardingState?.seen_markets ?? false,
      seen_ranking: onboardingState?.seen_ranking ?? false,
      updated_at: new Date().toISOString(), ...nextValues,
    }, { merge: true });
  }, [id, onboardingState, user]);

  const activeTourTab = useMemo(() => {
    if (showBolaoIntro) return null;
    if (activeTab === "ranking" && !onboardingState?.seen_ranking) return "ranking" as const;
    if (activeTab === "palpites" && !onboardingState?.seen_markets) return "jogos" as const;
    return null;
  }, [activeTab, onboardingState, showBolaoIntro]);

  const dismissTour = useCallback(() => {
    if (activeTourTab === "ranking") void persistBolaoIntroState({ seen_ranking: true });
    else if (activeTourTab) void persistBolaoIntroState({ seen_markets: true });
  }, [activeTourTab, persistBolaoIntroState]);

  useEffect(() => {
    if (highlightedMatch) setActiveTab("palpites");
  }, [highlightedMatch]);

  useEffect(() => {
    const fallbackTab: BolaoDetailTab = highlightedMatch || pendingOverview.totalPending > 0 ? "palpites" : "turma";
    const nextTab = requestedTab ?? fallbackTab;
    if (!initialTabHydratedRef.current || requestedTab) {
      setActiveTab(nextTab);
      initialTabHydratedRef.current = true;
    }
  }, [highlightedMatch, pendingOverview.totalPending, requestedTab]);

  return {
    bolao, members, memberCount, joinRequests, myPalpites, bolaoMarkets, myMarketPredictions,
    allMarketPredictions, activityFeed, onboardingState, showBolaoIntro, loading, infoOpen,
    championOpen, championSelection, myChampion, activeTab, showEditPanel, setBolao,
    setInfoOpen, setChampionOpen, setChampionSelection, setActiveTab, setShowEditPanel,
    saveChampion, handleShareInvite, closeBolaoIntro: () => { void persistBolaoIntroState(); setShowBolaoIntro(false); },
    handleBolaoIntroToPredictions: () => { void persistBolaoIntroState({ seen_markets: true }); setActiveTab("palpites"); setShowBolaoIntro(false); },
    dismissTour, activeTourTab, isCreator, formatLabel, pendingOverview, joinRequestItems,
    matchMarkets, phaseMarkets, specialMarkets, tournamentMarkets, championMarket, highlightedMatch
  };
}
