import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Lock, Globe, CheckCircle2, Loader2, Trophy, Zap, Sparkles, Target, Send, Share2, QrCode, ShieldCheck, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { type ScoringRules } from "@/types/bolao";
import { motion, AnimatePresence } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { supabase } from "@/integrations/supabase/client";
import { teams } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { useMonetization } from "@/contexts/MonetizationContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PRESETS_VALUES = {
  standard: { exact: 10, winner: 3, draw: 3, participation: 1 },
  risky: { exact: 20, winner: 5, draw: 5, participation: 0 },
  conservative: { exact: 5, winner: 2, draw: 2, participation: 1 },
};

const emojisList = ["🏆", "⚽", "⭐", "🔥", "⚡", "👑", "🚀", "🎯"];

const CriarBolao = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);

  // Form Data
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏆");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"private" | "public">("private");
  const [scoringRules, setScoringRules] = useState<ScoringRules>(PRESETS_VALUES.standard);
  const [champion, setChampion] = useState<string>("");

  // Success State
  const [createdBolaoId, setCreatedBolaoId] = useState<string | null>(null);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);

  // Premium Limit
  const { isPremium, purchasePremium, isLoading: isPurchasing } = useMonetization();
  const [createdCount, setCreatedCount] = useState<number | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('boloes')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);

      if (!error && count !== null) {
        setCreatedCount(count);
        if (count >= 2 && !isPremium) {
          setShowPaywall(true);
        }
      }
    };
    fetchCount();
  }, [user, isPremium]);

  const handleNext = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) { console.warn(e); }
    setStep(step + 1);
  };

  const handleBack = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) { console.warn(e); }
    setStep(step - 1);
  };

  const handleCreate = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch (e) { console.warn(e); }
    if (!user || !name.trim() || !champion) return;
    setCreating(true);

    try {
      const inviteCodeVal = Math.random().toString(36).substring(2, 8).toUpperCase();

      const insertData: any = {
        name: name.trim(),
        description: description.trim(),
        creator_id: user.id,
        category,
        is_paid: false,
        scoring_rules: scoringRules,
        status: 'open',
        invite_code: inviteCodeVal,
      };

      // Se a coluna avatar_url não existe no BD, vai quebrar aqui caso tentemos inserir
      // Para o app não "crushar", omitiremos o avatar_url até a tabela ser atualizada
      // insertData.avatar_url = emoji;

      const { data: bolaoData, error: bolaoError } = await supabase.from('boloes').insert(insertData).select().single();

      if (bolaoError) throw bolaoError;

      // O trigger auto_join_bolao_creator no Supabase já cadastra o criador como admin automaticamente
      // Então vamos tentar inserir sem dar throw se falhar por duplicidade:
      await supabase.from('bolao_members').insert({
        bolao_id: bolaoData.id,
        user_id: user.id,
        role: "admin",
        payment_status: 'exempt'
      });

      await supabase.from('bolao_champion_predictions').insert({
        bolao_id: bolaoData.id,
        user_id: user.id,
        team_code: champion
      });

      toast({
        title: "Bolão Criado!",
        description: "Regras definidas e campeão escolhido.",
        className: "bg-emerald-500 text-white border-none font-black"
      });
      setCreatedBolaoId(bolaoData.id);
      setCreatedInviteCode(inviteCodeVal);

      if (window.plausible) {
        window.plausible('Bolão Created', { props: { category } });
      }

      setStep(3); // Go to share screen
    } catch (error: any) {
      console.error("Erro ao criar bolão:", error);
      toast({ title: "Erro", description: `Detalhes: ${error?.message || JSON.stringify(error)}`, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length >= 3;
    if (step === 2) return !!champion;
    return true;
  };

  const stepsCount = 3;
  const currentProgress = ((step + 1) / stepsCount) * 100;

  if (step === 3 && createdBolaoId) {
    const inviteUrl = `https://arenacup.tech/boloes/join/${createdInviteCode}`;
    const message = `Vem pro meu bolão "${name}" no ArenaCopa! Código secreto: ${createdInviteCode}`;

    const handleShareNative = async () => {
      try {
        await Share.share({ title: 'ArenaCopa Bolão', text: message, url: inviteUrl });
      } catch (e) {
        navigator.clipboard.writeText(inviteUrl);
        toast({ title: 'Copiado!', description: 'Link copiado para a área de transferência.' });
      }
    };

    const handleWhatsApp = () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(message + ' ' + inviteUrl)}`, '_blank');
    };

    return (
      <div className="min-h-screen bg-[#050505] pb-32 text-white overflow-hidden flex flex-col items-center justify-center px-4 relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent opacity-40" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm sm:max-w-md bg-white/[0.02] border border-white/10 rounded-[40px] p-6 sm:p-10 text-center shadow-2xl backdrop-blur-3xl"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
            className="w-20 h-20 mx-auto bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </motion.div>
          <h2 className="text-3xl font-black mb-2 tracking-tighter">Arena Criada!</h2>

          <div className="mt-6 mb-8 bg-white/5 border border-white/10 rounded-[24px] p-6 text-center">
            <div className="text-4xl mb-2">{emoji}</div>
            <div className="text-xl font-bold">{name}</div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-yellow-500/10 text-yellow-500 py-2 rounded-lg">
              <ShieldCheck className="w-4 h-4" /> Sem premiação em dinheiro
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button onClick={handleWhatsApp} className="py-4 px-2 bg-[#25D366] text-white font-black uppercase tracking-wider text-xs rounded-[20px] flex flex-col items-center gap-2 hover:bg-[#1ebd5a] transition">
              <Send className="w-6 h-6" /> WhatsApp
            </button>
            <button onClick={handleShareNative} className="py-4 px-2 bg-white/10 text-white font-black uppercase tracking-wider text-xs rounded-[20px] flex flex-col items-center gap-2 hover:bg-white/20 transition">
              <Share2 className="w-6 h-6" /> Mais Opções
            </button>
          </div>

          <button onClick={() => {
            navigator.clipboard.writeText(inviteUrl);
            toast({ title: 'Copiado!' });
          }}
            className="w-full py-4 bg-white/5 border border-white/10 text-gray-400 font-bold text-xs rounded-[20px] mb-6 flex items-center justify-center gap-2 truncate px-4"
          >
            <QrCode className="w-4 h-4" /> Copiar Link
          </button>

          <button
            onClick={() => navigate(`/boloes/${createdBolaoId}`)}
            className="w-full py-5 bg-primary text-black font-black uppercase tracking-[0.2em] text-[11px] rounded-[24px] hover:scale-[1.02] transition-transform shadow-xl shadow-primary/20"
          >
            ACESSAR BOLÃO
          </button>
        </motion.div>
      </div>
    );
  }

  if (showPaywall) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <Dialog open={true} onOpenChange={(open) => { if (!open) navigate(-1); }}>
          <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white rounded-[32px]">
            <DialogHeader>
              <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/30">
                <Crown className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black text-center tracking-tight">Limite Atingido</DialogTitle>
              <DialogDescription className="text-center text-gray-400">
                O plano gratuito permite criar no máximo 2 bolões. Faça o upgrade para Premium!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm">Bolões ilimitados</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm">Sem anúncios chatos</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm">Badge Torcedor Oficial</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => purchasePremium()} disabled={isPurchasing} className="w-full h-14 bg-primary text-black font-black rounded-xl uppercase tracking-widest text-xs hover:bg-primary/90">
                {isPurchasing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Desbloquear Premium - R$9,90"}
              </Button>
              <Button onClick={() => navigate(-1)} variant="outline" className="w-full h-12 bg-transparent text-gray-400 border-white/10 hover:text-white rounded-xl">
                Voltar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-32 text-white overflow-hidden">
      <div className="relative pt-8 pb-6 px-6 max-w-2xl mx-auto flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <motion.button onClick={() => navigate(-1)} className="w-12 h-12 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">Novo Bolão</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 mt-4 relative z-20">
        <div className="relative mb-8 p-6 rounded-[32px] bg-white/5 border border-white/5 backdrop-blur-3xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">ETAPA {step + 1} DE {stepsCount}</span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{Math.round(currentProgress)}%</span>
          </div>
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div animate={{ width: `${currentProgress}%` }} className="h-full bg-primary rounded-full" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 0: IDENTITY */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-white tracking-tighter">Identidade</h2>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-black">Emoji da Liga</Label>
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide mask-edges">
                  {emojisList.map(e => (
                    <button key={e} onClick={() => setEmoji(e)} className={cn("text-3xl p-3 bg-white/5 rounded-2xl border transition-all", emoji === e ? "border-primary bg-primary/20 scale-110" : "border-transparent opacity-50")}>{e}</button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-black">Nome da Liga</Label>
                <div className="relative mt-2">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Lenda do Qatar" className="w-full px-6 py-5 rounded-[24px] bg-white/[0.03] border border-white/10 text-xl font-black text-white outline-none focus:border-primary/50" />
                </div>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-black">Descrição</Label>
                <div className="relative mt-2">
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-6 py-4 rounded-[24px] bg-white/[0.03] border border-white/10 text-base font-medium outline-none focus:border-primary/50" />
                </div>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-black">Tipo de Acesso</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {[
                    { id: 'private', title: 'Privado', icon: <Lock className="w-5 h-5" /> },
                    { id: 'public', title: 'Público', icon: <Globe className="w-5 h-5" /> }
                  ].map(c => (
                    <button key={c.id} onClick={() => setCategory(c.id as any)} className={cn("p-4 rounded-3xl border flex flex-col items-center gap-2", category === c.id ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/5 text-gray-400")}>
                      {c.icon}
                      <span className="font-bold">{c.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1: RULES */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-white tracking-tighter">Pontuação</h2>
              </div>

              <div className="flex gap-2">
                {Object.entries(PRESETS_VALUES).map(([key, val]) => (
                  <button key={key} onClick={() => setScoringRules({ exact: val.exact, winner: val.winner, draw: val.draw, participation: val.participation })} className={cn("text-[10px] uppercase font-bold py-2 px-4 rounded-xl", scoringRules.exact === val.exact ? "bg-primary text-black" : "bg-white/10")}>
                    {key}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {[
                  { id: 'exact', label: 'Placar Exato', val: scoringRules.exact, max: 20 },
                  { id: 'winner', label: 'Fórmula (Vencedor/Empate)', val: scoringRules.winner, max: 10 },
                  { id: 'participation', label: 'Participação', val: scoringRules.participation ?? 0, max: 5 }
                ].map(rule => (
                  <div key={rule.id} className="p-6 rounded-[32px] bg-white/5 border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{rule.label}</span>
                      <span className="text-3xl font-black text-primary">{rule.val}</span>
                    </div>
                    <Slider value={[rule.val]} min={rule.id === 'participation' ? 0 : 1} max={rule.max} step={1} onValueChange={([v]) => setScoringRules(prev => ({ ...prev, [rule.id]: v }))} className="mt-6" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: CHAMPION */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 h-full">
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-white tracking-tighter">O Campeão</h2>
                <p className="text-gray-400">Todo criador deve deixar a sua aposta para o título registrada. Não poderá ser alterada!</p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex gap-3 text-left">
                <ShieldCheck className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-500/90 leading-relaxed font-medium">
                  <strong>O ArenaCopa não intermedia apostas em dinheiro.</strong> Bolões aqui são sociais e de entretenimento. Qualquer acordo financeiro entre participantes é de responsabilidade exclusiva dos envolvidos.
                </p>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[45vh] overflow-y-auto pr-2 pb-10">
                {teams.map(t => (
                  <button key={t.code} onClick={() => setChampion(t.code)} className={cn("flex flex-col items-center p-3 rounded-2xl border transition-all", champion === t.code ? "bg-primary/20 border-primary scale-105" : "bg-white/5 border-white/5 opacity-70")}>
                    <Flag code={t.code} size="md" />
                    <span className={cn("text-[10px] mt-2 font-bold", champion === t.code ? "text-primary" : "text-gray-400")}>{t.code}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#050505] z-40">
        <div className="max-w-md mx-auto flex gap-4">
          {step > 0 && (
            <button onClick={handleBack} className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <button onClick={step === 2 ? handleCreate : handleNext} disabled={!canProceed() || creating} className={cn("flex-1 h-16 rounded-2xl font-black uppercase text-xs transition", step === 2 ? "bg-white text-black" : "bg-primary text-black disabled:opacity-50")}>
            {step === 2 ? (creating ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : "FINALIZAR ARENA") : "PRÓXIMO PASSO"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CriarBolao;
