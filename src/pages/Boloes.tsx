import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Plus, Users, Search, UserPlus, Trophy, ChevronRight, X, DollarSign, AlertTriangle, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { type BolaoRowResponse } from "@/types/bolao";

interface BolaoRow {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  invite_code: string;
  created_at: string;
  memberCount: number;
  isCreator: boolean;
  is_paid: boolean;
  entry_fee: number | null;
  pendingCount?: number;
}

const Boloes = () => {
  const { t } = useTranslation('bolao');
  const { user } = useAuth();
  const { toast } = useToast();
  const [boloes, setBoloes] = useState<BolaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Join Confirmation State
  const [pendingJoinBolao, setPendingJoinBolao] = useState<BolaoRow | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const loadBoloes = useCallback(async () => {
    if (!user) return;

    // Demo Mode Handler
    const isDemo = localStorage.getItem("demo_mode") === "true";
    if (isDemo) {
      setBoloes([
        {
          id: "demo-bolao-1",
          name: t('list.demo_1_name'),
          description: t('list.demo_1_desc'),
          creator_id: "demo-user-id",
          invite_code: "DEMO123",
          created_at: new Date().toISOString(),
          memberCount: 5,
          isCreator: true,
          is_paid: false,
          entry_fee: null
        },
        {
          id: "demo-bolao-2",
          name: t('list.demo_2_name'),
          description: t('list.demo_2_desc'),
          creator_id: "other-user",
          invite_code: "FIRMA26",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          memberCount: 12,
          isCreator: false,
          is_paid: true,
          entry_fee: 50.00
        }
      ]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("boloes")
      .select("*, bolao_members(count)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const typedData = data as unknown as BolaoRowResponse[];
      setBoloes(typedData.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        creator_id: b.creator_id,
        invite_code: b.invite_code,
        created_at: b.created_at,
        memberCount: b.bolao_members?.[0]?.count || 0,
        isCreator: b.creator_id === user.id,
        is_paid: b.is_paid,
        entry_fee: b.entry_fee
      })));
    }
    setLoading(false);
  }, [user, t]);

  useEffect(() => {
    if (!user) return;
    loadBoloes();
  }, [user, loadBoloes]);

  const verifyAndPrepareJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);

    try {
      const { data: bolao, error: findError } = await supabase
        .from("boloes")
        .select("id, name, is_paid, entry_fee")
        .eq("invite_code", joinCode.trim().toLowerCase())
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bolaoData = bolao as any;

      if (findError || !bolao) throw new Error(t('list.error_invalid_code'));

      const { data: existing } = await supabase
        .from("bolao_members")
        .select("id")
        .eq("bolao_id", bolaoData.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        toast({ title: t('list.already_member'), description: bolaoData.name });
        setJoinCode("");
        setShowJoin(false);
        setJoining(false);
        return;
      }

      if (bolaoData.is_paid) {
        const pending = bolaoData as BolaoRow;
        setPendingJoinBolao(pending);
        setDisclaimerAccepted(false);
        setJoining(false); // Stop generic loading, open modal
      } else {
        // Proceed directly
        completeJoin(bolaoData.id, bolaoData.name);
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast({ title: "Erro", description: message, variant: "destructive" });
      setJoining(false);
    }
  };

  const completeJoin = async (bolaoId: string, bolaoName: string) => {
    try {
      const { error: joinError } = await supabase
        .from("bolao_members")
        .insert({ bolao_id: bolaoId, user_id: user!.id, role: "member", payment_status: 'pending' });

      if (joinError) throw joinError;

      toast({ title: t('list.success_join'), description: bolaoName });
      setJoinCode("");
      setShowJoin(false);
      setPendingJoinBolao(null);
      loadBoloes();
    } catch (error) {
      console.error(error);
      toast({ title: t('list.error_join'), description: "Tente novamente.", variant: "destructive" });
    } finally {
      setJoining(false);
    }
  }

  const filtered = boloes.filter(b =>
    !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myBoloes = filtered.filter(b => b.isCreator);
  const joinedBoloes = filtered.filter(b => !b.isCreator);

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold block">{t('list.my_leagues')}</span>
          <h1 className="text-2xl font-black">{t('list.title')}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(!showJoin)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-colors",
              showJoin ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <Link
            to="/boloes/criar"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> {t('list.create')}
          </Link>
        </div>
      </div>

      {/* Join by code */}
      <AnimatePresence>
        {showJoin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: "auto" }}
            className="overflow-hidden mb-4"
          >
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{t('list.join_code_title')}</span>
                <button onClick={() => setShowJoin(false)} className="p-1 rounded-md bg-secondary"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  placeholder={t('list.join_code_placeholder')}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={verifyAndPrepareJoin}
                  disabled={joining || !joinCode.trim()}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                >
                  {joining ? "..." : t('list.btn_join')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search (when has bolões) */}
      {!loading && boloes.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('list.search_placeholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/60 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : boloes.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon="🏆" title={t('list.empty_title')} description={t('list.empty_desc')} />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Created by me */}
          {myBoloes.length > 0 && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> {t('list.section_mine')}
              </h3>
              <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
                {myBoloes.map(b => (
                  <BolaoCard key={b.id} bolao={b} />
                ))}
              </div>
            </section>
          )}

          {/* Joined */}
          {joinedBoloes.length > 0 && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {t('list.section_participating')}
              </h3>
              <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
                {joinedBoloes.map(b => (
                  <BolaoCard key={b.id} bolao={b} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && searchQuery && (
            <EmptyState icon="🔍" title={t('list.no_results')} description="" />
          )}
        </div>
      )}

      {/* Confirmation Dialog for Paid Bolões */}
      <Dialog open={!!pendingJoinBolao} onOpenChange={(open) => !open && setPendingJoinBolao(null)}>
        <DialogContent className="max-w-xs rounded-2xl p-0 overflow-hidden gap-0">
          <div className="bg-primary/5 p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle>{t('join_modal.title')}</DialogTitle>
            <DialogDescription className="text-center mt-1">{t('join_modal.desc')}</DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Bolão</span>
                <span className="font-bold">{pendingJoinBolao?.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('join_modal.fee_label')}</span>
                <span className="font-bold text-green-500">R$ {pendingJoinBolao?.entry_fee?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg border border-border/50">
              <Checkbox id="terms" checked={disclaimerAccepted} onCheckedChange={(c) => setDisclaimerAccepted(!!c)} className="mt-0.5" />
              <Label htmlFor="terms" className="text-[10px] leading-relaxed cursor-pointer text-muted-foreground">
                <strong className="block mb-1">{t('join_modal.terms')}</strong>
              </Label>
            </div>
          </div>

          <div className="p-4 bg-secondary/30 flex gap-3">
            <button onClick={() => setPendingJoinBolao(null)} className="flex-1 py-3 rounded-xl font-bold text-xs hover:bg-secondary transition-colors">{t('list.btn_cancel')}</button>
            <button
              onClick={() => pendingJoinBolao && completeJoin(pendingJoinBolao.id, pendingJoinBolao.name)}
              disabled={!disclaimerAccepted}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs disabled:opacity-50 transition-all"
            >
              {t('list.btn_confirm')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function BolaoCard({ bolao }: { bolao: BolaoRow }) {
  const { t } = useTranslation('bolao');
  return (
    <div className="glass-card-hover p-4 block relative">
      <Link to={`/boloes/${bolao.id}`} className="flex items-center gap-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 relative",
          bolao.isCreator ? "bg-primary/20" : "bg-secondary"
        )}>
          ⚽
          {bolao.is_paid && (
            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-background shadow-sm">
              <DollarSign className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black truncate">{bolao.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
              bolao.isCreator ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            )}>
              {bolao.isCreator ? t('list.card_admin') : t('list.card_member')}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> {bolao.memberCount}
            </span>
            {(bolao.pendingCount ?? 0) > 0 && (
              <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                {bolao.pendingCount} {t('list.card_pending')}
              </span>
            )}
          </div>
          {bolao.description && (
            <p className="text-[10px] text-muted-foreground truncate mt-1">{bolao.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </Link>
      {(bolao.pendingCount ?? 0) > 0 && (
        <Link
          to={`/boloes/${bolao.id}?tab=palpites`}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Trophy className="w-3.5 h-3.5" />
          {t('list.card_bet_now')}
        </Link>
      )}
    </div>
  );
}

export default Boloes;

