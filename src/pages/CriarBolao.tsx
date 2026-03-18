import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronLeft, ChevronRight, Crown, Globe, Loader2, Lock, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getCountFromServer,
  addDoc,
  doc,
  getDocs,
  orderBy,
  writeBatch
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMonetization } from "@/contexts/MonetizationContext";
import { teams } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { monetizationEnv } from "@/lib/env";
import { PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE } from "@/services/monetization/stripe.service";
import { FormatStep } from "@/components/copa/bolao/creation/FormatStep";
import { MarketSelectionStep } from "@/components/copa/bolao/creation/MarketSelectionStep";
import { ReviewStep } from "@/components/copa/bolao/creation/ReviewStep";
import { ScoringStep } from "@/components/copa/bolao/creation/ScoringStep";
import { getDefaultMarketIdsForFormat } from "@/services/boloes/bolao-format.service";
import { buildBolaoMarkets } from "@/services/boloes/bolao-market.service";
import type { BolaoFormatSlug, MarketTemplateSlug, ScoringRules } from "@/types/bolao";

const PRESETS_VALUES: Record<"standard" | "risky" | "conservative", ScoringRules> = {
  standard: { exact: 10, winner: 3, draw: 3, participation: 1 },
  risky: { exact: 20, winner: 5, draw: 5, participation: 0 },
  conservative: { exact: 5, winner: 2, draw: 2, participation: 1 },
};

const emojisList = ["🏆", "⚽", "🔥", "👑", "🎯", "🌎", "⭐", "🥇"];

type Category = "private" | "public";

export default function CriarBolao() {
  const { t } = useTranslation("bolao");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium, purchasePremium, isLoading: isPurchasing } = useMonetization();
  const canStartPremiumCheckout = monetizationEnv.enablePremiumSimulation || monetizationEnv.premiumCheckoutEnabled;

  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏆");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("private");
  const [formatId, setFormatId] = useState<BolaoFormatSlug>("classic");
  const [selectedMarketIds, setSelectedMarketIds] = useState<MarketTemplateSlug[]>(getDefaultMarketIdsForFormat("classic"));
  const [scoringRules, setScoringRules] = useState(PRESETS_VALUES.standard);
  const [selectedPresetKey, setSelectedPresetKey] = useState<"standard" | "risky" | "conservative">("standard");
  const [champion, setChampion] = useState("");
  const [createdBolaoId, setCreatedBolaoId] = useState<string | null>(null);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [createdCount, setCreatedCount] = useState<number>(0);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      try {
        const q = query(collection(db, "boloes"), where("creator_id", "==", user.id));
        const snap = await getCountFromServer(q);
        const total = snap.data().count;
        
        setCreatedCount(total);
        if (total >= 2 && !isPremium) {
          setShowPaywall(true);
        }
      } catch (error) {
        console.error("Error fetching bolao count:", error);
      }
    };

    fetchCount();
  }, [isPremium, user]);

  const stepsCount = 5;
  const currentProgress = ((Math.min(step, 4) + 1) / stepsCount) * 100;
  const championMarketEnabled = selectedMarketIds.includes("champion");

  const canProceed = useMemo(() => {
    if (step === 0) return name.trim().length >= 3;
    if (step === 1) return Boolean(formatId);
    if (step === 2) return selectedMarketIds.length > 0;
    if (step === 3) return true;
    if (step === 4) return championMarketEnabled ? Boolean(champion) : true;
    return true;
  }, [champion, championMarketEnabled, formatId, name, selectedMarketIds.length, step]);

  useEffect(() => {
    const defaultMarkets = getDefaultMarketIdsForFormat(formatId);
    setSelectedMarketIds(defaultMarkets);

    if (!defaultMarkets.includes("champion")) {
      setChampion("");
    }
  }, [formatId]);

  const safeHaptic = async (style: ImpactStyle) => {
    try {
      await Haptics.impact({ style });
    } catch {
      // no-op on web
    }
  };

  const handleNext = async () => {
    await safeHaptic(ImpactStyle.Light);
    if (!canProceed) return;
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = async () => {
    await safeHaptic(ImpactStyle.Light);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCreate = async () => {
    await safeHaptic(ImpactStyle.Heavy);
    if (!user || !name.trim() || (championMarketEnabled && !champion)) return;

    setCreating(true);
    try {
      const inviteCodeVal = Math.random().toString(36).substring(2, 8).toUpperCase();

      const insertData = {
        name: name.trim(),
        description: description.trim() || null,
        creator_id: user.id,
        category,
        format_id: formatId,
        is_paid: false,
        scoring_rules: scoringRules,
        scoring_mode: "default",
        visibility_mode: "hidden_until_deadline",
        cutoff_mode: "per_match",
        status: "open",
        invite_code: inviteCodeVal,
        avatar_url: emoji,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const boloesRef = collection(db, "boloes");
      const bolaoDoc = await addDoc(boloesRef, insertData);
      const batch = writeBatch(db);

      const matchesSnapshot = await getDocs(query(collection(db, "matches"), orderBy("match_date", "asc")));
      const matchRows = matchesSnapshot.docs.map((snapshotDoc) => ({
        id: snapshotDoc.id,
        ...(snapshotDoc.data() as {
          match_date: string;
          stage?: string | null;
          group_id?: string | null;
          home_team_code?: string | null;
          away_team_code?: string | null;
        }),
      }));

      const memberId = `${user.id}_${bolaoDoc.id}`;
      batch.set(doc(db, "bolao_members", memberId), {
        bolao_id: bolaoDoc.id,
        user_id: user.id,
        role: "admin",
        payment_status: "exempt",
        created_at: new Date().toISOString()
      });

      const onboardingId = `${user.id}_${bolaoDoc.id}`;
      batch.set(doc(db, "bolao_onboarding_state", onboardingId), {
        id: onboardingId,
        bolao_id: bolaoDoc.id,
        user_id: user.id,
        seen_intro: false,
        seen_scoring: false,
        seen_markets: false,
        seen_ranking: false,
        completed_at: null,
        updated_at: new Date().toISOString()
      });

      const markets = buildBolaoMarkets({
        bolaoId: bolaoDoc.id,
        formatId,
        selectedMarketIds,
        matches: matchRows,
      });

      markets.forEach((market) => {
        batch.set(doc(db, "bolao_markets", market.id), market);
      });

      if (championMarketEnabled && champion) {
        const predictionId = `${user.id}_${bolaoDoc.id}`;
        batch.set(doc(db, "bolao_champion_predictions", predictionId), {
          bolao_id: bolaoDoc.id,
          user_id: user.id,
          team_code: champion,
          updated_at: new Date().toISOString()
        });
      }

      await batch.commit();

      toast({
        title: t("create_bolao.review.success_title"),
        description: t("create_bolao.review.success_desc"),
        className: "bg-emerald-500 text-white border-none font-black",
      });

      setCreatedBolaoId(bolaoDoc.id);
      setCreatedInviteCode(inviteCodeVal);
      setStep(5);

      if (window.plausible) {
        window.plausible("Bolao Created", { props: { category, format: formatId } });
      }
    } catch (error) {
      console.error("Erro ao criar bolão:", error);
      toast({
        title: t("create_bolao.review.error_title"),
        description: error instanceof Error ? error.message : t("create_bolao.review.error_desc"),
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const toggleMarket = (marketId: MarketTemplateSlug) => {
    setSelectedMarketIds((current) =>
      current.includes(marketId) ? current.filter((id) => id !== marketId) : [...current, marketId]
    );
  };

  const resetMarketsToDefault = () => {
    setSelectedMarketIds(getDefaultMarketIdsForFormat(formatId));
  };

  const handlePresetSelect = (presetKey: "standard" | "risky" | "conservative") => {
    setSelectedPresetKey(presetKey);
    setScoringRules(PRESETS_VALUES[presetKey]);
  };

  if (showPaywall) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10 text-white">
        <div className="surface-card-strong w-full p-6">
          <div className="mb-4 inline-flex rounded-full bg-primary/15 p-3 text-primary">
            <Crown className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black">{t("profile.premium_limit_title", { defaultValue: "Limite atingido" })}</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {t("profile.premium_limit_desc", { defaultValue: "O plano gratuito permite criar até 2 bolões. O Premium libera bolões ilimitados e ainda remove anúncios." })}
          </p>

          <div className="surface-card-soft mt-5 space-y-3 rounded-2xl p-4 text-sm">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {t("profile.premium_benefit_unlimited", { defaultValue: "Bolões ilimitados" })}</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {t("profile.premium_benefit_no_ads", { defaultValue: "Sem anúncios" })}</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> {t("profile.premium_benefit_badge", { defaultValue: "Badge Torcedor Oficial" })}</div>
          </div>

          <div className="mt-6 grid gap-3">
            <button
              onClick={() => {
                void purchasePremium();
              }}
              disabled={isPurchasing || !canStartPremiumCheckout}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
            >
              {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
              {isPurchasing ? t("common.loading") : canStartPremiumCheckout ? t("profile.unlock_premium", { defaultValue: "Desbloquear Premium - R$ 9,90" }) : t("profile.premium_coming_soon", { defaultValue: "Premium em preparação" })}
            </button>
            {!canStartPremiumCheckout && (
              <p className="text-center text-xs text-zinc-500">{PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE}</p>
            )}
            <button
              onClick={() => navigate(-1)}
              className="surface-input h-12 rounded-2xl bg-transparent text-sm font-bold text-zinc-300"
            >
              {t("common.back")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 5 && createdBolaoId && createdInviteCode) {
    const inviteUrl = `${window.location.origin}/b/${createdInviteCode}`;
    const message = `Vem pro meu bolão "${name}" no ArenaCopa! Código: ${createdInviteCode}`;

    const handleShareNative = async () => {
      try {
        await Share.share({
          title: "ArenaCopa Bolão",
          text: message,
          url: inviteUrl,
        });
      } catch {
        await navigator.clipboard.writeText(inviteUrl);
        toast({ title: "Link copiado." });
      }
    };

    const handleWhatsApp = () => {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${message} ${inviteUrl}`)}`, "_blank");
    };

    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-white">
        <div className="surface-card-strong rounded-[32px] p-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-4xl text-primary">
            {emoji}
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">{t("create_bolao.review.success_title")}</p>
          <h1 className="mt-2 text-3xl font-black">{name}</h1>
          <p className="mt-3 text-sm text-zinc-400">{t("create_bolao.free_label")}</p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <button
              onClick={handleWhatsApp}
              className="rounded-2xl bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black"
            >
              {t("share.whatsapp")}
            </button>
            <button
              onClick={handleShareNative}
              className="surface-card-soft inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em]"
            >
              <Share2 className="h-4 w-4" />
              {t("share.btn_share", { defaultValue: "Mais opções" })}
            </button>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(inviteUrl);
              toast({ title: t("share.copied") });
            }}
            className="surface-card-soft mt-3 w-full truncate rounded-2xl px-4 py-4 text-xs font-bold text-zinc-300"
          >
            {inviteUrl}
          </button>

          <button
            onClick={() => navigate(`/boloes/${createdBolaoId}`)}
            className="mt-6 w-full rounded-[24px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black"
          >
            {t("page.join_action")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 text-white">
      <div className="mb-6 flex items-center gap-3">
        <button
          aria-label={t("common.back")}
          onClick={() => navigate(-1)}
          className="surface-card-soft flex h-12 w-12 items-center justify-center rounded-[20px]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{t("create_bolao.title")}</p>
          <h1 className="text-3xl font-black">{t("create_bolao.subtitle")}</h1>
        </div>
      </div>

      <div className="mb-8 rounded-full bg-white/5 p-1">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${currentProgress}%` }}
        />
      </div>

      <div className="surface-card-strong rounded-[32px] p-6">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{t("creation.step_label", { current: 1 })}</p>
              <h2 className="mt-1 text-2xl font-black">{t("create_bolao.steps.details")}</h2>
              <p className="mt-2 text-sm text-zinc-400">{t("create_bolao.details.desc_placeholder")}</p>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold">Emoji</p>
              <div className="flex flex-wrap gap-3">
                {emojisList.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "rounded-2xl border p-3 text-3xl transition-all",
                      emoji === e ? "scale-110 border-primary bg-primary/20" : "surface-card-soft"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold">{t("create_bolao.details.name_label")}</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("create_bolao.details.name_placeholder")}
                className="surface-input w-full rounded-[24px] px-5 py-4 text-xl font-black"
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-bold">{t("create_bolao.details.desc_label")}</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("create_bolao.details.desc_placeholder")}
                className="surface-input min-h-[110px] w-full rounded-[24px] px-5 py-4 text-sm"
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-bold">{t("create_bolao.steps.category")}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => setCategory("private")}
                  className={cn(
                    "rounded-[24px] border p-5 text-left transition-all",
                    category === "private" ? "border-primary bg-primary/10" : "surface-card-soft"
                  )}
                >
                  <Lock className="mb-3 h-5 w-5 text-primary" />
                  <p className="font-black">{t("create_bolao.category.private.title")}</p>
                  <p className="mt-1 text-sm text-zinc-400">{t("create_bolao.category.private.desc")}</p>
                </button>
                <button
                  onClick={() => setCategory("public")}
                  className={cn(
                    "rounded-[24px] border p-5 text-left transition-all",
                    category === "public" ? "border-primary bg-primary/10" : "surface-card-soft"
                  )}
                >
                  <Globe className="mb-3 h-5 w-5 text-primary" />
                  <p className="font-black">{t("create_bolao.category.public.title")}</p>
                  <p className="mt-1 text-sm text-zinc-400">{t("create_bolao.category.public.desc")}</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 1 && <FormatStep selectedFormatId={formatId} onSelect={setFormatId} />}

        {step === 2 && (
          <MarketSelectionStep
            formatId={formatId}
            selectedMarketIds={selectedMarketIds}
            onToggle={toggleMarket}
            onReset={resetMarketsToDefault}
          />
        )}

        {step === 3 && (
          <ScoringStep
            presetKey={selectedPresetKey}
            scoringRules={scoringRules}
            onSelectPreset={handlePresetSelect}
          />
        )}

        {step === 4 && (
          <ReviewStep
            name={name}
            description={description}
            emoji={emoji}
            category={category}
            formatId={formatId}
            selectedMarketIds={selectedMarketIds}
            scoringRules={scoringRules}
            champion={champion}
            championEnabled={championMarketEnabled}
            onChampionSelect={setChampion}
            teams={teams.map((team) => ({ code: team.code }))}
          />
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            {createdCount} {t("page.kicker").toLowerCase()} {createdCount === 1 ? "" : ""} criados na conta
          </div>

          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="surface-card-soft inline-flex h-12 items-center gap-2 rounded-2xl px-5 text-[11px] font-black uppercase tracking-[0.18em]"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("common.back")}
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
              >
                {t("create_bolao.actions.continue")}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={!canProceed || creating}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {creating ? t("create_bolao.actions.creating") : t("page.create")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
