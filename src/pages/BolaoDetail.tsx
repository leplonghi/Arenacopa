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
  const { t } = useTranslation('bolao');
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
            </div>
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

function BolaoDetailSkeleton({ t }: { t: TFunction<"bolao"> }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Skeleton className="mb-4 h-16 rounded-3xl bg-white/10" />
      <Skeleton className="mb-4 h-10 rounded-2xl bg-white/10" />
      <Skeleton className="h-[420px] rounded-[32px] bg-white/10" />
    </div>
  );
}
