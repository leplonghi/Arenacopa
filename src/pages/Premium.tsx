import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, CheckCircle2, Crown, Loader2, ShieldCheck, Map, Users2, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMonetization } from "@/contexts/MonetizationContext";
import { motion } from "framer-motion";
import { monetizationEnv } from "@/lib/env";
import { useTranslation } from "react-i18next";
import {
  getPremiumSupportMailto,
} from "@/services/monetization/stripe.service";

export default function Premium() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation("premium");
  const { isPremium, purchasePremium, refreshPremiumStatus, isLoading, subscriptionStatus } =
    useMonetization();
  const [feedback, setFeedback] = useState<string | null>(null);
  const canStartPremiumCheckout =
    monetizationEnv.enablePremiumSimulation || monetizationEnv.premiumCheckoutEnabled;
  const supportMailto = getPremiumSupportMailto();


  useEffect(() => {
    const checkoutState = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (!checkoutState) return;

    const clearParams = () => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("checkout");
      nextParams.delete("session_id");
      setSearchParams(nextParams, { replace: true });
    };

    if (checkoutState === "cancelled") {
      setFeedback(t("feedback.cancelled"));
      clearParams();
      return;
    }

    if (checkoutState === "success" && sessionId) {
      setFeedback(t("feedback.validating"));
      void refreshPremiumStatus(sessionId)
        .then(() => {
          setFeedback(t("feedback.confirmed"));
        })
        .catch(() => {
          setFeedback(t("feedback.syncing"));
        })
        .finally(clearParams);
    }
  }, [refreshPremiumStatus, searchParams, setSearchParams, t]);

  return (
    <div className="min-h-screen bg-background pb-32 pt-20 px-4 text-white overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 left-0 h-[480px] bg-gradient-to-b from-primary/25 via-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg mx-auto relative z-10">
        <button
          aria-label="Voltar"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-6 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary via-copa-live to-amber-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/30 animate-pulse">
            <Crown className="w-12 h-12 text-black drop-shadow-md" />
          </div>
          <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/25 rounded-full px-3 py-1 mb-4">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary tracking-wide uppercase">{t("badge")}</span>
          </div>
          <h1 className="text-4xl font-black mb-3 tracking-tighter uppercase drop-shadow">
            {t("hero_title_prefix")} <span className="text-primary">{t("hero_title_highlight")}</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            {t("hero_subtitle")}
          </p>
        </div>

        {feedback && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
            {feedback}
          </div>
        )}

        {isPremium ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 text-center border-primary/30"
          >
            <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{t("active.title")}</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {t("active.description")}
            </p>
            <Button onClick={() => navigate("/")} className="w-full bg-primary text-black font-bold h-12">
              {t("active.back_home")}
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Planos B2B */}
            <div className="space-y-4 mb-8">
              
              {/* Plano Bar / Restaurante */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-primary/20 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-primary uppercase">Mais Popular</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Map className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">Bar / Restaurante</h3>
                    <p className="text-xs text-muted-foreground">Atraia clientes em dias de jogo</p>
                  </div>
                </div>
                
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-black text-white">R$ 89,90</span>
                  <span className="text-[10px] text-muted-foreground mb-1.5 uppercase">/ Copa Toda</span>
                </div>

                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                    <span className="text-xs text-muted-foreground"><strong>QR Code & Convite Premium:</strong> Cartaz digital lindo para impressão e WhatsApp.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                    <span className="text-xs text-muted-foreground"><strong>Bolão Patrocinado:</strong> Sua marca em destaque no app.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-primary mt-0.5" />
                    <span className="text-xs text-muted-foreground">Aba extra para link do cardápio ou promoções.</span>
                  </li>
                </ul>

                <Button
                  onClick={async () => {
                    if (window.plausible) window.plausible("Copa Pass Click", { props: { plan: 'bar' } });
                    if (!canStartPremiumCheckout) {
                      window.location.href = supportMailto;
                      return;
                    }
                    const started = await purchasePremium();
                    if (!started) setFeedback(t("feedback.checkout_error"));
                  }}
                  disabled={isLoading}
                  className="w-full bg-primary text-black font-bold h-12 shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:scale-[1.02] transition-transform"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Ativar Modo Bar"}
                </Button>
              </motion.div>

              {/* Plano Empresa / RH */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Users2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">Empresa / RH</h3>
                    <p className="text-xs text-muted-foreground">Engajamento real para suas equipes</p>
                  </div>
                </div>
                
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-3xl font-black text-white">R$ 149,90</span>
                  <span className="text-[10px] text-muted-foreground mb-1.5 uppercase">/ Copa Toda</span>
                </div>

                <ul className="space-y-2 mb-5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-white/70 mt-0.5" />
                    <span className="text-xs text-muted-foreground"><strong>Múltiplos Bolões:</strong> Até 5 bolões simultâneos por setor.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-white/70 mt-0.5" />
                    <span className="text-xs text-muted-foreground"><strong>White-label:</strong> Logo da empresa no topo do bolão.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-white/70 mt-0.5" />
                    <span className="text-xs text-muted-foreground">Dashboard de engajamento em PDF para premiações.</span>
                  </li>
                </ul>

                <Button
                  onClick={async () => {
                    if (window.plausible) window.plausible("Copa Pass Click", { props: { plan: 'rh' } });
                    if (!canStartPremiumCheckout) {
                      window.location.href = supportMailto;
                      return;
                    }
                    const started = await purchasePremium();
                    if (!started) setFeedback(t("feedback.checkout_error"));
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-12 border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Ativar Modo RH"}
                </Button>
              </motion.div>

              {/* Plano Enterprise */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-white/5 bg-transparent p-5 text-center"
              >
                <h3 className="font-bold text-sm mb-1">Enterprise / Redes</h3>
                <p className="text-xs text-muted-foreground mb-3">Participantes e bolões ilimitados. Multimarcas e franquias.</p>
                <a href={supportMailto} className="text-xs font-bold text-primary hover:underline">Falar com vendas →</a>
              </motion.div>

            </div>

            {/* Social proof strip */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pb-4">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Pagamento Seguro</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-violet-400" /> Acesso vitalício à Copa</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
