import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Users, Trophy, BarChart3, TrendingUp, Star, Info, DollarSign, Scale } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { ShareSheet } from "@/components/copa/bolao/ShareSheet";
import { OverviewTab } from "@/components/copa/bolao/OverviewTab";
import { PalpitesTab } from "@/components/copa/bolao/PalpitesTab";
import { RankingTab } from "@/components/copa/bolao/RankingTab";
import { MembrosTab } from "@/components/copa/bolao/MembrosTab";
import { ExtrasTab } from "@/components/copa/bolao/ExtrasTab";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type BolaoData, type MemberData, type Palpite, type ExtraBet } from "@/types/bolao";

import { useTranslation } from "react-i18next";

const BolaoDetail = () => {
  const { t } = useTranslation('bolao');
  const { id } = useParams();
  const { user } = useAuth();
  const [bolao, setBolao] = useState<BolaoData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [palpites, setPalpites] = useState<Palpite[]>([]);
  const [extraBets, setExtras] = useState<ExtraBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const loadBolao = useCallback(async () => {
    if (!id || !user) return;
    const [bolaoRes, membersRes, palpitesRes, extrasRes] = await Promise.all([
      supabase.from("boloes").select("*").eq("id", id).single(),
      supabase.from("bolao_members").select("user_id, role, joined_at, payment_status, profiles(name, avatar_url)").eq("bolao_id", id),
      supabase.from("bolao_palpites").select("*").eq("bolao_id", id),
      // @ts-expect-error - table might be missing in generated types
      supabase.from("bolao_extra_bets").select("*").eq("bolao_id", id),
    ]);

    if (bolaoRes.data) setBolao(bolaoRes.data as unknown as BolaoData);
    if (membersRes.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMembers((membersRes.data as any).map((m: any) => ({
        ...m,
        profile: m.profiles,
        payment_status: (m.payment_status as "pending" | "paid" | "exempt") || "pending"
      })));
    }
    if (palpitesRes.data) setPalpites(palpitesRes.data);
    if (extrasRes.data) setExtras(extrasRes.data as unknown as ExtraBet[]);
    setLoading(false);
    setLoading(false);
  }, [id, user]);

  const tabs = [
    { id: "overview", label: t('detail.tabs.overview'), icon: BarChart3 },
    { id: "palpites", label: t('detail.tabs.palpites'), icon: Trophy },
    { id: "extras", label: t('detail.tabs.extras'), icon: Star },
    { id: "ranking", label: t('detail.tabs.ranking'), icon: TrendingUp },
    { id: "membros", label: t('detail.tabs.members'), icon: Users },
  ];

  useEffect(() => {
    if (!id || !user) return;
    loadBolao();
  }, [id, user, loadBolao]);

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-9 flex-1 rounded-lg" />)}</div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!bolao) return <EmptyState icon="🔍" title={t('detail.not_found')} description="" />;

  const isCreator = bolao.creator_id === user?.id;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[hsl(var(--copa-success))]/20 text-[hsl(var(--copa-success))] font-bold uppercase">Copa 2026</span>
            {isCreator && <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase">{t('list.card_admin')}</span>}
            {bolao.is_paid && <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold uppercase flex items-center gap-1"><DollarSign className="w-2.5 h-2.5" /> {t('detail.paid_badge')}</span>}
          </div>
          <h1 className="text-xl font-black">{bolao.name}</h1>
          {bolao.description && <p className="text-xs text-muted-foreground mt-0.5">{bolao.description}</p>}
        </div>
        <button onClick={() => setInfoOpen(true)} className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex justify-between gap-1 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex-1 min-w-[70px] py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1",
              activeTab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "overview" && <OverviewTab bolao={bolao} members={members} isCreator={isCreator} palpites={palpites} userId={user!.id} onShare={() => setShareOpen(true)} />}
          {activeTab === "palpites" && <PalpitesTab bolaoId={bolao.id} palpites={palpites} setPalpites={setPalpites} userId={user!.id} />}
          {activeTab === "extras" && <ExtrasTab bolaoId={bolao.id} userId={user!.id} />}
          {activeTab === "ranking" && <RankingTab members={members} palpites={palpites} extraBets={extraBets} scoringRules={bolao.scoring_rules} />}
          {activeTab === "membros" && <MembrosTab members={members} userId={user!.id} isCreator={isCreator} bolaoId={bolao.id} isPaid={bolao.is_paid} onRefresh={loadBolao} />}
        </motion.div>
      </AnimatePresence>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} bolao={bolao} />

      {/* Info Dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-md max-h-[85vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{t('detail.info_title')}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-full max-h-[60vh] px-6 pb-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-bold flex items-center gap-2"><Scale className="w-4 h-4 text-primary" /> {t('detail.rules_title')}</h3>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>{t('ranking.legend_exact')}: <span className="font-bold text-foreground">{bolao.scoring_rules?.exact ?? 5} pts</span></p>
                  <p>{t('ranking.legend_winner')}: <span className="font-bold text-foreground">{bolao.scoring_rules?.winner ?? 3} pts</span></p>
                  <p>{t('ranking.legend_draw')}: <span className="font-bold text-foreground">{bolao.scoring_rules?.draw ?? 2} pts</span></p>
                  <p>{t('create_bolao.rules.participation')}: <span className="font-bold text-foreground">{bolao.scoring_rules?.participation ?? 1} pts</span> ({t('create_bolao.rules.participation_desc')})</p>
                </div>
              </div>

              {bolao.is_paid && (
                <div className="space-y-2 pt-4 border-t border-border">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-green-500"><DollarSign className="w-4 h-4" /> {t('detail.financial_title')}</h3>

                  <div className="glass-card p-3 space-y-2 bg-green-500/5 border-green-500/20 text-xs">
                    <div>
                      <span className="text-muted-foreground block">{t('detail.entry_fee')}</span>
                      <span className="font-bold text-base text-foreground">{t('currency_symbol')} {bolao.entry_fee?.toFixed(2) ?? '0.00'}</span>
                    </div>
                    {bolao.payment_details && (
                      <div>
                        <span className="text-muted-foreground block">{t('detail.payment_data')}</span>
                        <p className="font-medium text-foreground mt-0.5 whitespace-pre-wrap">{bolao.payment_details}</p>
                      </div>
                    )}
                    {bolao.prize_distribution && (
                      <div>
                        <span className="text-muted-foreground block">{t('detail.prize_dist')}</span>
                        <p className="font-medium text-foreground mt-0.5 whitespace-pre-wrap">{bolao.prize_distribution}</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    {t('detail.disclaimer_payment')}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BolaoDetail;
