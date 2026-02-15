import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Lock, Globe, DollarSign, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { type ScoringRules } from "@/types/bolao";

// Moved steps and PRESETS inside component to use translation hook
// or define keys here and translate inside render
const PRESET_KEYS = {
  standard: "create_bolao.rules.presets.standard",
  risky: "create_bolao.rules.presets.risky",
  conservative: "create_bolao.rules.presets.conservative",
};

const PRESETS_VALUES = {
  standard: { exact: 5, winner: 3, draw: 2, participation: 1 },
  risky: { exact: 10, winner: 5, draw: 2, participation: 0 },
  conservative: { exact: 3, winner: 1, draw: 1, participation: 1 },
};

const CriarBolao = () => {
  const { t } = useTranslation('bolao');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);

  // Form Data
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"private" | "public">("private");
  const [isPaid, setIsPaid] = useState(false);
  const [scoringRules, setScoringRules] = useState<ScoringRules>(PRESETS_VALUES.standard);
  const [entryFee, setEntryFee] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [prizeDistribution, setPrizeDistribution] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const handleNext = () => {
    if (step === 1 && category === 'public') {
      // Skip Financials for public
      setIsPaid(false);
      setEntryFee("");
      setPaymentDetails("");
      setPrizeDistribution("");
      setStep(step + 1); // Go to Rules
    } else if (step === 2) {
      // After Rules
      if (isPaid) setStep(3); // Go to Financials
      else setStep(4); // Go to Review
    } else if (step === 3) {
      setStep(4); // Go to Review
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 4) {
      if (isPaid) setStep(3);
      else setStep(2);
    } else {
      setStep(step - 1);
    }
  };

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    if (isPaid && !disclaimerAccepted) {
      toast({ title: t('create_bolao.attention'), description: t('create_bolao.disclaimer_required'), variant: "destructive" });
      return;
    }
    setCreating(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("boloes")
        .insert({
          name: name.trim(),
          description: description.trim(),
          creator_id: user.id,
          category,
          is_paid: isPaid,
          entry_fee: isPaid ? parseFloat(entryFee) : null,
          payment_details: isPaid ? paymentDetails : null,
          prize_distribution: isPaid ? prizeDistribution : null,
          scoring_rules: scoringRules,
          status: 'open'
        })
        .select("id")
        .single();

      if (error) throw error;

      await supabase.from("bolao_members").insert({
        bolao_id: data.id,
        user_id: user.id,
        role: "admin",
        payment_status: isPaid ? 'exempt' : 'pending' // Creator is usually exempt or handles their own payment
      });

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: t('create_bolao.notification.created_title'),
        message: t('create_bolao.notification.created_desc', { name: name.trim() }),
        type: "success",
        link: `/boloes/${data.id}`
      });

      toast({ title: t('create_bolao.review.success_title'), description: t('create_bolao.review.success_desc') });
      navigate(`/boloes/${data.id}`);
    } catch (error) {
      console.error("Erro ao criar bolão:", error);
      toast({ title: t('create_bolao.review.error_title'), description: t('create_bolao.review.error_desc'), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return name.trim().length >= 3;
    if (step === 3) return !!entryFee && !!paymentDetails;
    if (step === 4) return isPaid ? disclaimerAccepted : true;
    return true;
  };

  return (
    <div className="px-4 py-4 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-black uppercase tracking-tight">{t('create_bolao.title')}</h1>
        <p className="text-xs text-muted-foreground font-medium">{t('create_bolao.subtitle')}</p>
      </div>

      {/* Steps Progress */}
      <div className="flex gap-1 mb-8">
        {[0, 1, 2, 3, 4].filter(s => !(!isPaid && s === 3)).map((s) => (
          <div key={s} className={cn("h-1 flex-1 rounded-full transition-all duration-500", step >= s ? "bg-primary" : "bg-secondary")} />
        ))}
      </div>

      {/* STEP 0: DETAILS */}
      {step === 0 && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-primary font-bold">{t('create_bolao.details.name_label')}</Label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('create_bolao.details.name_placeholder')}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-card border border-border text-base font-bold placeholder:font-normal focus:ring-2 focus:ring-primary/50 outline-none"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-primary font-bold">{t('create_bolao.details.desc_label')}</Label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('create_bolao.details.desc_placeholder')}
                rows={3}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-card border border-border text-sm font-medium focus:ring-2 focus:ring-primary/50 outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: CATEGORY */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => { setCategory('private'); }}
              className={cn("p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden", category === 'private' ? "border-primary bg-primary/5" : "border-border bg-card")}
            >
              <Lock className={cn("w-6 h-6 mb-3", category === 'private' ? "text-primary" : "text-muted-foreground")} />
              <div className="text-sm font-black">{t('create_bolao.category.private.title')}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{t('create_bolao.category.private.desc')}</div>
              {category === 'private' && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />}
            </button>

            <button
              onClick={() => { setCategory('public'); setIsPaid(false); }}
              className={cn("p-4 rounded-xl border-2 text-left transition-all", category === 'public' ? "border-blue-500 bg-blue-500/5" : "border-border bg-card")}
            >
              <Globe className={cn("w-6 h-6 mb-3", category === 'public' ? "text-blue-500" : "text-muted-foreground")} />
              <div className="text-sm font-black">{t('create_bolao.category.public.title')}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{t('create_bolao.category.public.desc')}</div>
            </button>
          </div>

          {category === 'private' && (
            <div className="glass-card p-5 border-l-4 border-l-primary flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="font-bold text-sm">{t('create_bolao.category.paid_question')}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {t('create_bolao.category.paid_desc')}
                </p>
              </div>
              <Switch checked={isPaid} onCheckedChange={setIsPaid} />
            </div>
          )}
        </div>
      )}

      {/* STEP 2: RULES */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-xs uppercase tracking-widest text-primary font-bold">{t('create_bolao.rules.title')}</Label>
            <div className="flex gap-2">
              {(Object.entries(PRESETS_VALUES) as [keyof typeof PRESETS_VALUES, ScoringRules][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setScoringRules({ exact: val.exact, winner: val.winner, draw: val.draw, participation: val.participation })}
                  className={cn("text-[10px] px-2 py-1 rounded border transition-colors",
                    scoringRules.exact === val.exact && scoringRules.winner === val.winner ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"
                  )}
                >
                  {t(PRESET_KEYS[key]).split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 glass-card p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">{t('create_bolao.rules.exact')}</span>
                <span className="text-xl font-black text-primary">{scoringRules.exact} pts</span>
              </div>
              <Slider
                value={[scoringRules.exact]}
                min={1} max={20} step={1}
                onValueChange={([v]) => setScoringRules(prev => ({ ...prev, exact: v }))}
                className="py-2"
              />
              <p className="text-[10px] text-muted-foreground">{t('create_bolao.rules.exact_desc')}</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">{t('create_bolao.rules.winner')}</span>
                <span className="text-xl font-black text-blue-500">{scoringRules.winner} pts</span>
              </div>
              <Slider
                value={[scoringRules.winner]}
                min={1} max={10} step={1}
                onValueChange={([v]) => setScoringRules(prev => ({ ...prev, winner: v }))}
                className="py-2"
              />
              <p className="text-[10px] text-muted-foreground">{t('create_bolao.rules.winner_desc')}</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">{t('create_bolao.rules.draw')}</span>
                <span className="text-xl font-black text-muted-foreground">{scoringRules.draw} pts</span>
              </div>
              <Slider
                value={[scoringRules.draw]}
                min={1} max={10} step={1}
                onValueChange={([v]) => setScoringRules(prev => ({ ...prev, draw: v }))}
                className="py-2"
              />
              <p className="text-[10px] text-muted-foreground">{t('create_bolao.rules.draw_desc')}</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold">{t('create_bolao.rules.participation')}</span>
                <span className="text-xl font-black text-green-500">{scoringRules.participation ?? 1} pts</span>
              </div>
              <Slider
                value={[scoringRules.participation ?? 1]}
                min={0} max={5} step={1}
                onValueChange={([v]) => setScoringRules(prev => ({ ...prev, participation: v }))}
                className="py-2"
              />
              <p className="text-[10px] text-muted-foreground">{t('create_bolao.rules.participation_desc')}</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: FINANCIALS */}
      {step === 3 && isPaid && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card p-4 border border-yellow-500/20 bg-yellow-500/5 mb-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
              <p className="text-[10px] text-yellow-500/90 leading-relaxed">
                {t('create_bolao.financial.warning')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase font-bold text-foreground/80">{t('create_bolao.financial.fee_label')}</Label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                <input
                  type="number"
                  value={entryFee}
                  onChange={e => setEntryFee(e.target.value)}
                  placeholder={t('create_bolao.financial.fee_placeholder')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-lg font-bold placeholder:font-normal focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase font-bold text-foreground/80">{t('create_bolao.financial.payment_label')}</Label>
              <textarea
                value={paymentDetails}
                onChange={e => setPaymentDetails(e.target.value)}
                placeholder={t('create_bolao.financial.payment_placeholder')}
                rows={3}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-card border border-border text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none"
              />
            </div>

            <div>
              <Label className="text-xs uppercase font-bold text-foreground/80">{t('create_bolao.financial.prizes_label')}</Label>
              <textarea
                value={prizeDistribution}
                onChange={e => setPrizeDistribution(e.target.value)}
                placeholder={t('create_bolao.financial.prizes_placeholder')}
                rows={3}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-card border border-border text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-black text-lg">{t('create_bolao.review.title')}</h3>
            <p className="text-xs text-muted-foreground">{t('create_bolao.review.subtitle')}</p>
          </div>

          <div className="glass-card divide-y divide-border/50">
            <div className="p-4 flex justify-between">
              <span className="text-xs text-muted-foreground">{t('create_bolao.review.bolao')}</span>
              <span className="text-sm font-bold">{name}</span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="text-xs text-muted-foreground">{t('create_bolao.review.type')}</span>
              <span className="text-sm font-bold capitalize">
                {category === 'private' ? t('create_bolao.category.private.title') : t('create_bolao.category.public.title')} ({isPaid ? t('create_bolao.create_bolao.paid_label') : t('create_bolao.free_label')})
              </span>
            </div>
            {isPaid && (
              <div className="p-4 flex justify-between">
                <span className="text-xs text-muted-foreground">{t('create_bolao.review.entry')}</span>
                <span className="text-sm font-bold text-green-500">R$ {entryFee}</span>
              </div>
            )}
            <div className="p-4 flex justify-between">
              <span className="text-xs text-muted-foreground">{t('create_bolao.review.scoring')}</span>
              <span className="text-xs font-bold">{scoringRules.exact}/{scoringRules.winner}/{scoringRules.draw}/{scoringRules.participation ?? 0}</span>
            </div>
          </div>

          {isPaid && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <Checkbox id="disclaimer" checked={disclaimerAccepted} onCheckedChange={(c) => setDisclaimerAccepted(!!c)} className="mt-0.5" />
              <Label htmlFor="disclaimer" className="text-xs leading-relaxed cursor-pointer">
                {t('create_bolao.review.disclaimer')}
              </Label>
            </div>
          )}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border z-10">
        <div className="flex gap-3 max-w-md mx-auto">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={step === 4 ? handleCreate : handleNext}
            disabled={!canProceed() || creating}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {step === 4 ? (creating ? <Loader2 className="animate-spin" /> : t('create_bolao.actions.confirm')) : t('create_bolao.actions.continue')}
            {step !== 4 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CriarBolao;
