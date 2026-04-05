import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, CheckCircle2, Crown, Loader2, ShieldCheck, Trophy, Map, Dices, Users2, Zap, Star } from "lucide-react";
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
  const priceLabel = monetizationEnv.premiumPriceLabel || "R$ 19,90";
  const pillars = [
    {
      icon: Trophy,
      color: "text-amber-400",
      bg: "bg-amber-500/15",
      border: "border-amber-500/20",
      title: t("pillars.info.title"),
      subtitle: t("pillars.info.subtitle"),
      perks: t("pillars.info.perks", { returnObjects: true }) as string[],
    },
    {
      icon: Map,
      color: "text-sky-400",
      bg: "bg-sky-500/15",
      border: "border-sky-500/20",
      title: t("pillars.guide.title"),
      subtitle: t("pillars.guide.subtitle"),
      perks: t("pillars.guide.perks", { returnObjects: true }) as string[],
    },
    {
      icon: Dices,
      color: "text-primary",
      bg: "bg-primary/15",
      border: "border-primary/20",
      title: t("pillars.pool.title"),
      subtitle: t("pillars.pool.subtitle"),
      perks: t("pillars.pool.perks", { returnObjects: true }) as string[],
    },
  ];

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
            {/* 3-pillar cards */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {pillars.map((pillar, idx) => (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`rounded-2xl border ${pillar.border} ${pillar.bg} p-3 flex flex-col gap-2`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center`}>
                    <pillar.icon className={`w-5 h-5 ${pillar.color}`} />
                  </div>
                  <div>
                    <p className="font-black text-sm leading-none">{pillar.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{pillar.subtitle}</p>
                  </div>
                  <ul className="space-y-1 mt-1">
                    {pillar.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-1">
                        <CheckCircle2 className={`w-3 h-3 shrink-0 ${pillar.color}`} />
                        <span className="text-[10px] text-muted-foreground leading-tight">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Social proof strip */}
            <div className="flex items-center justify-center gap-4 mb-8 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users2 className="w-3.5 h-3.5 text-primary" /> {t("social_proof.community")}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> {t("social_proof.secure_payment")}</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-violet-400" /> {t("social_proof.lifetime")}</span>
            </div>

            {/* Price + CTA */}
            <div className="glass-card p-5 border-primary/20 mb-4">
              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="text-4xl font-black text-primary">
                  {priceLabel}
                </span>
                <span className="text-sm text-muted-foreground mb-1.5">{t("price.suffix")}</span>
              </div>
              <p className="text-center text-[11px] text-muted-foreground mb-4">{t("price.note")}</p>

              <Button
                onClick={async () => {
                  if (window.plausible) window.plausible("Copa Pass Click");
                  if (!canStartPremiumCheckout) {
                    window.location.href = supportMailto;
                    return;
                  }

                  const startedCheckout = await purchasePremium();
                  if (!startedCheckout) {
                    setFeedback(t("feedback.checkout_error"));
                  }
                }}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-primary to-[hsl(var(--copa-gold))] text-black font-black uppercase text-sm rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.35)] hover:scale-[1.02] transition-transform"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : canStartPremiumCheckout ? (
                  `${t("cta.buy")} — ${priceLabel}`
                ) : (
                  t("cta.notify")
                )}
              </Button>

              {!canStartPremiumCheckout && (
                <Button
                  asChild
                  variant="outline"
                  className="mt-3 w-full h-12 border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                >
                  <a href={supportMailto}>{t("cta.support")}</a>
                </Button>
              )}
            </div>

            <p className="text-center text-[10px] text-muted-foreground">
              {canStartPremiumCheckout
                ? t("status_copy.checkout_ready", {
                    status: subscriptionStatus === "pending" ? t("status_copy.pending") : t("status_copy.ready"),
                  })
                : t("status_copy.checkout_preparing")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
