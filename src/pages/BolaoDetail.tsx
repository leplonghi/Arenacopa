import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Trophy, Zap, Info, ArrowLeft, Settings, Share2, Crown, Swords, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { teams } from "@/data/mockData";
import { Flag } from "@/components/Flag";

// Tabs
import { JogosTab } from "@/components/copa/bolao/JogosTab";
import { RealtimeRankingTab } from "@/components/copa/bolao/RealtimeRankingTab";
import { PublicPalpitesTab } from "@/components/copa/bolao/PublicPalpitesTab";

export default function BolaoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [bolao, setBolao] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [championOpen, setChampionOpen] = useState(false);
  const [championSelection, setChampionSelection] = useState("");
  const [myChampion, setMyChampion] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("ranking");

  const loadBolao = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      // Load Bolao
      const { data: bData, error } = await supabase
        .from('boloes')
        .select('*, bolao_members(count)')
        .eq('id', id)
        .single();

      if (error || !bData) throw new Error("Bolão não encontrado");

      setBolao(bData);
      setMemberCount(bData.bolao_members[0].count);

      // Check if user is member
      const { data: member } = await supabase.from('bolao_members').select('*').eq('bolao_id', id).eq('user_id', user.id).single();
      if (!member) {
        toast({ title: "Você não é membro desta liga." });
        navigate('/boloes');
        return;
      }

      // Check my champion
      const { data: champ } = await supabase.from('bolao_champion_predictions').select('*').eq('bolao_id', id).eq('user_id', user.id).single();
      if (champ) setMyChampion(champ.team_code);

    } catch (error) {
      toast({ title: "Erro ao carregar detalhes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadBolao();
  }, [loadBolao]);

  const saveChampion = async () => {
    if (!championSelection) return;
    try {
      await supabase.from('bolao_champion_predictions').insert({
        bolao_id: bolao.id,
        user_id: user!.id,
        team_code: championSelection
      });
      setMyChampion(championSelection);
      setChampionOpen(false);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast({ title: "Aposta registrada!", className: "bg-emerald-500 text-white font-black" });
    } catch (e) {
      toast({ title: "Erro ao salvar campeão.", variant: "destructive" });
    }
  };

  const isCreator = bolao?.creator_id === user?.id;

  if (loading) return <BolaoDetailSkeleton />;
  if (!bolao) return <div className="py-20"><EmptyState icon="😕" title="Não encontrado" description="O bolão não existe ou foi removido." /></div>;

  const tabs = [
    { id: "ranking", label: "Ranking (Líderes)", icon: <Trophy className="w-4 h-4" /> },
    { id: "jogos", label: "Seus Palpites", icon: <Swords className="w-4 h-4" /> },
    { id: "palpites", label: "Resenha (Palpites Rivais)", icon: <Zap className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen pb-24 bg-[#050505]">
      {/* Immersive Header */}
      <div className="relative pt-8 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none opacity-40" />
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        <div className="flex items-center justify-between relative z-10 mb-8 max-w-screen-xl mx-auto">
          <motion.button onClick={() => navigate('/boloes')} className="w-12 h-12 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center transition-all backdrop-blur-xl hover:bg-white/10">
            <ArrowLeft className="w-6 h-6 text-white" />
          </motion.button>

          <div className="flex items-center gap-2">
            {!myChampion && (
              <button
                onClick={() => setChampionOpen(true)}
                className="px-4 h-12 rounded-[20px] bg-primary text-black font-black uppercase text-[10px] tracking-widest flex items-center gap-2 animate-pulse shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              >
                <Crown className="w-4 h-4" /> APOSTAR CAMPEÃO
              </button>
            )}
            {myChampion && (
              <div className="px-4 h-12 rounded-[20px] bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase flex items-center gap-2">
                <span className="text-gray-400 font-normal">Meu Campeão:</span> <Flag code={myChampion} size="sm" /> {myChampion}
              </div>
            )}
            <button onClick={() => setInfoOpen(true)} className="w-12 h-12 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"><Info className="w-5 h-5 text-gray-400 hover:text-white" /></button>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col items-center max-w-screen-xl mx-auto text-center">
          <div className="text-5xl mb-4">{bolao.avatar_url || '🏆'}</div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] mb-4">
            {bolao.name}
          </h1>
          {bolao.description && <p className="text-gray-400 font-medium max-w-lg mb-8 leading-relaxed text-sm px-4">{bolao.description}</p>}
          <div className="flex gap-4">
            <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 text-xs font-bold uppercase tracking-widest text-primary">Membros: {memberCount}</div>
            <div className="bg-white/5 px-4 py-2 rounded-2xl border border-white/10 text-xs font-bold uppercase tracking-widest text-blue-400">Tipo: {bolao.category}</div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-3xl border-b border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth items-center">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all relative shrink-0", activeTab === tab.id ? "bg-white text-black shadow-[0_10px_25px_rgba(255,255,255,0.15)] scale-105 z-10" : "text-gray-500 hover:text-white hover:bg-white/5")}>
              <span className={cn("transition-transform", activeTab === tab.id && "scale-125")}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-6 mt-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {activeTab === "ranking" && <RealtimeRankingTab bolaoId={bolao.id} rules={bolao.scoring_rules} />}
            {activeTab === "jogos" && <JogosTab bolaoId={bolao.id} rules={bolao.scoring_rules} />}
            {activeTab === "palpites" && <PublicPalpitesTab bolaoId={bolao.id} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Champion Modal */}
      <Dialog open={championOpen} onOpenChange={setChampionOpen}>
        <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 rounded-[40px] p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-6">QUEM LEVA A TAÇA?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto pr-2">
            {teams.map(t => (
              <button key={t.code} onClick={() => setChampionSelection(t.code)} className={cn("flex flex-col items-center p-3 rounded-2xl border transition-all", championSelection === t.code ? "bg-primary/20 border-primary scale-105" : "bg-white/5 border-white/5 opacity-70 hover:bg-white/10")}>
                <Flag code={t.code} size="md" className={cn(championSelection === t.code && "scale-110")} />
                <span className={cn("text-[10px] mt-2 font-bold", championSelection === t.code ? "text-primary" : "text-gray-400")}>{t.code}</span>
              </button>
            ))}
          </div>
          <button onClick={saveChampion} disabled={!championSelection} className="w-full mt-6 py-4 rounded-xl bg-primary text-black font-black uppercase tracking-widest disabled:opacity-50">
            CONFIRMAR APOSTA (IRREVERSÍVEL)
          </button>
        </DialogContent>
      </Dialog>

      {/* INFO MODAL */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-md bg-[#0a0a0a] border-white/10 rounded-[32px] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">REGRAS DA ARENA</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-6">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
              <span className="font-bold text-gray-400 uppercase text-xs">Placar Exato</span>
              <span className="text-primary font-black text-2xl">{bolao.scoring_rules.exact} pts</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
              <span className="font-bold text-gray-400 uppercase text-xs">Acertou Resultado (V/E/D)</span>
              <span className="text-blue-400 font-black text-2xl">{bolao.scoring_rules.winner} pts</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
              <span className="font-bold text-gray-400 uppercase text-xs">Participação</span>
              <span className="text-emerald-400 font-black text-2xl">{bolao.scoring_rules.participation} pts</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BolaoDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#050505] p-8 space-y-12 animate-pulse">
      <div className="flex justify-between items-center max-w-screen-xl mx-auto">
        <Skeleton className="w-12 h-12 rounded-[20px] bg-white/5" />
      </div>
      <div className="flex flex-col items-center gap-6">
        <Skeleton className="h-20 w-3/4 rounded-3xl bg-white/5" />
      </div>
    </div>
  );
}
