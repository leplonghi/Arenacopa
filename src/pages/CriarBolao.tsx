import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronLeft, Crown, Globe, Loader2, Lock, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Share } from "@capacitor/share";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMonetization } from "@/contexts/MonetizationContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { teams } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { monetizationEnv } from "@/lib/env";
import { PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE } from "@/services/monetization/stripe.service";
import { getDefaultMarketIdsForFormat } from "@/services/boloes/bolao-format.service";
import { useCreateBolao } from "@/hooks/useCreateBolao";
import type { BolaoFormatSlug, MarketTemplateSlug, ScoringRules } from "@/types/bolao";

const PRESETS: Record<"standard" | "risky" | "conservative", ScoringRules> = {
  standard:     { exact: 10, winner: 3, draw: 3, participation: 1 },
  risky:        { exact: 20, winner: 5, draw: 5, participation: 0 },
  conservative: { exact: 5,  winner: 2, draw: 2, participation: 1 },
};

const EMOJIS = ["⚽", "🏆", "🎯", "🎉", "🦁", "🔥", "💪", "🏅"];

type Category = "private" | "public";
type PresetKey = "standard" | "risky" | "conservative";

interface PoolTypeCard {
  id: string; emoji: string; title: string; desc: string;
  formatId: BolaoFormatSlug; allMarkets: boolean;
}

const POOL_TYPES: PoolTypeCard[] = [
  { id: "placar",      emoji: "⚽", title: "Palpite de Placar",   desc: "Acerte o resultado exato de cada jogo",    formatId: "classic",    allMarkets: false },
  { id: "vencedor",    emoji: "🏆", title: "Quem Vai Ganhar",     desc: "Vitória, empate ou derrota",               formatId: "detailed",   allMarkets: false },
  { id: "grupos",      emoji: "📊", title: "Fase de Grupos",      desc: "Classifique cada grupo",                  formatId: "knockout",   allMarkets: false },
  { id: "chaveamento", emoji: "🔀", title: "Chaveamento",         desc: "Mata-mata completo do torneio",            formatId: "tournament", allMarkets: false },
  { id: "express",     emoji: "⚡", title: "Jogo Único / Express", desc: "Um jogo só — crie em 10 segundos",        formatId: "strategic",  allMarkets: false },
  { id: "completo",    emoji: "🎯", title: "Completo",            desc: "Tudo: jogos, fases e campeonato",          formatId: "classic",    allMarkets: true  },
];

export default function CriarBolao() {
  const { t } = useTranslation("bolao");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium, purchasePremium, isLoading: isPurchasing } = useMonetization();
  const { canCreateGrupo } = usePlanLimits();
  const canStartCheckout = monetizationEnv.enablePremiumSimulation || monetizationEnv.premiumCheckoutEnabled;
  const { createBolao, creating } = useCreateBolao();

  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("⚽");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("private");
  const [formatId, setFormatId] = useState<BolaoFormatSlug>("classic");
  const [selectedMarketIds, setSelectedMarketIds] = useState<MarketTemplateSlug[]>(getDefaultMarketIdsForFormat("classic"));
  const [presetKey, setPresetKey] = useState<PresetKey>("standard");
  const [scoringRules, setScoringRules] = useState(PRESETS.standard);
  const [champion, setChampion] = useState("");
  const [createdBolaoId, setCreatedBolaoId] = useState<string | null>(null);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const championEnabled = selectedMarketIds.includes("champion");

  // Paywall via usePlanLimits — triggers on mount when free limit reached
  useEffect(() => {
    if (!canCreateGrupo) setShowPaywall(true);
  }, [canCreateGrupo]);

  const canProceed = useMemo(() => {
    if (step === 1) return name.trim().length >= 3 && (championEnabled ? Boolean(champion) : true);
    return true;
  }, [champion, championEnabled, name, step]);

  const handleSelectType = (card: PoolTypeCard) => {
    setSelectedType(card.id);
    setFormatId(card.formatId);
    const mkts = card.allMarkets
      ? (["matches", "phase", "champion", "special", "tournament"] as MarketTemplateSlug[])
      : getDefaultMarketIdsForFormat(card.formatId);
    setSelectedMarketIds(mkts);
    if (!mkts.includes("champion")) setChampion("");
    setStep(1);
  };

  const handleCreate = async () => {
    const result = await createBolao({ name, description, emoji, category, formatId, selectedMarketIds, scoringRules, champion });
    if (result) {
      toast({ title: t("create_bolao.review.success_title"), className: "bg-emerald-500 text-white border-none font-black" });
      setCreatedBolaoId(result.bolaoId);
      setCreatedInviteCode(result.inviteCode);
      setStep(5);
    }
  };

  // ─── Paywall ──────────────────────────────────────────────────────────────
  if (showPaywall) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10 text-white">
        <div className="surface-card-strong w-full rounded-[32px] p-6">
          <div className="mb-4 inline-flex rounded-full bg-primary/15 p-3 text-primary"><Crown className="h-6 w-6" /></div>
          <h1 className="text-2xl font-black">Limite atingido</h1>
          <p className="mt-2 text-sm text-zinc-400">O plano gratuito permite criar até 2 grupos. O Copa Pass libera grupos e bolões ilimitados.</p>
          <div className="surface-card-soft mt-5 space-y-3 rounded-2xl p-4 text-sm">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Grupos e bolões ilimitados</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Sem anúncios</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Badge Torcedor Oficial</div>
          </div>
          <div className="mt-6 grid gap-3">
            <button onClick={() => void purchasePremium()} disabled={isPurchasing || !canStartCheckout}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60">
              {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
              {isPurchasing ? "Aguarde..." : canStartCheckout ? "Copa Pass — R$ 19,90" : "Em preparação"}
            </button>
            {!canStartCheckout && <p className="text-center text-xs text-zinc-500">{PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE}</p>}
            <button onClick={() => navigate(-1)} className="surface-input h-12 rounded-2xl bg-transparent text-sm font-bold text-zinc-300">Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success ──────────────────────────────────────────────────────────────
  if (step === 5 && createdBolaoId && createdInviteCode) {
    const inviteUrl = `${window.location.origin}/b/${createdInviteCode}`;
    const msg = `Vem pro meu bolão "${name}" no ArenaCopa! Código: ${createdInviteCode}`;
    const handleShareNative = async () => {
      try { await Share.share({ title: "ArenaCopa Bolão", text: msg, url: inviteUrl }); }
      catch { await navigator.clipboard.writeText(inviteUrl); toast({ title: "Link copiado." }); }
    };
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-white">
        <div className="surface-card-strong rounded-[32px] p-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-4xl">{emoji}</div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Bolão criado! 🎉</p>
          <h1 className="mt-2 text-3xl font-black">{name}</h1>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${msg} ${inviteUrl}`)}`, "_blank")}
              className="rounded-2xl bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black">WhatsApp</button>
            <button onClick={handleShareNative}
              className="surface-card-soft inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em]">
              <Share2 className="h-4 w-4" /> Mais opções
            </button>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(inviteUrl); toast({ title: "Link copiado!" }); }}
            className="surface-card-soft mt-3 w-full truncate rounded-2xl px-4 py-4 text-xs font-bold text-zinc-300">{inviteUrl}</button>
          <button onClick={() => navigate(`/boloes/${createdBolaoId}`)}
            className="mt-6 w-full rounded-[24px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black">Ver meu bolão →</button>
        </div>
      </div>
    );
  }

  // ─── Main layout ──────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 text-white">
      <div className="mb-6 flex items-center gap-3">
        <button aria-label="Voltar" onClick={() => step === 0 ? navigate(-1) : setStep(0)}
          className="surface-card-soft flex h-12 w-12 items-center justify-center rounded-[20px]">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
            {step === 0 ? "Passo 1 de 2" : "Passo 2 de 2"}
          </p>
          <h1 className="text-3xl font-black">{step === 0 ? "Que tipo de bolão?" : "Detalhes"}</h1>
        </div>
      </div>

      <div className="mb-8 rounded-full bg-white/5 p-1">
        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: step === 0 ? "50%" : "100%" }} />
      </div>

      {/* ── Step 0: Pool type cards ── */}
      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POOL_TYPES.map((card) => (
            <button key={card.id} onClick={() => handleSelectType(card)}
              className="surface-card-strong rounded-[28px] border border-transparent p-6 text-left transition-all hover:border-primary/40 hover:scale-[1.02] active:scale-[0.98]">
              <div className="mb-3 text-4xl">{card.emoji}</div>
              <p className="text-lg font-black">{card.title}</p>
              <p className="mt-1 text-sm text-zinc-400">{card.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Step 1: Details ── */}
      {step === 1 && (
        <div className="surface-card-strong rounded-[32px] p-6 space-y-6">
          {/* selected type chip */}
          {selectedType && (() => { const c = POOL_TYPES.find(x => x.id === selectedType); return c ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
              <span>{c.emoji}</span><span>{c.title}</span>
            </div>
          ) : null; })()}

          {/* Emoji */}
          <div>
            <p className="mb-3 text-sm font-bold">Emoji</p>
            <div className="flex flex-wrap gap-3">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={cn("rounded-2xl border p-3 text-3xl transition-all",
                    emoji === e ? "scale-110 border-primary bg-primary/20" : "surface-card-soft")}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <p className="mb-3 text-sm font-bold">Nome do bolão *</p>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bolão da firma, Copa da família..."
              className="surface-input w-full rounded-[24px] px-5 py-4 text-xl font-black" />
          </div>

          {/* Description */}
          <div>
            <p className="mb-3 text-sm font-bold">Descrição <span className="font-normal text-zinc-500">(opcional)</span></p>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Regras, prêmio, contexto..."
              className="surface-input min-h-[80px] w-full rounded-[24px] px-5 py-4 text-sm" />
          </div>

          {/* Privacy */}
          <div>
            <p className="mb-3 text-sm font-bold">Visibilidade</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={() => setCategory("private")}
                className={cn("rounded-[24px] border p-4 text-left transition-all",
                  category === "private" ? "border-primary bg-primary/10" : "surface-card-soft")}>
                <Lock className="mb-2 h-4 w-4 text-primary" />
                <p className="text-sm font-black">Privado</p>
                <p className="mt-0.5 text-xs text-zinc-400">Apenas com link ou código</p>
              </button>
              <button onClick={() => setCategory("public")}
                className={cn("rounded-[24px] border p-4 text-left transition-all",
                  category === "public" ? "border-primary bg-primary/10" : "surface-card-soft")}>
                <Globe className="mb-2 h-4 w-4 text-primary" />
                <p className="text-sm font-black">Público</p>
                <p className="mt-0.5 text-xs text-zinc-400">Aparece para qualquer um</p>
              </button>
            </div>
          </div>

          {/* Scoring preset */}
          <div>
            <p className="mb-3 text-sm font-bold">Pontuação</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["standard", "risky", "conservative"] as const).map((k) => (
                <button key={k} onClick={() => { setPresetKey(k); setScoringRules(PRESETS[k]); }}
                  className={cn("rounded-2xl border p-3 text-center text-sm transition-all",
                    presetKey === k ? "border-primary bg-primary/10 font-black" : "surface-card-soft text-zinc-400")}>
                  {k === "standard" ? "⚖️ Padrão" : k === "risky" ? "🎲 Arriscado" : "🛡️ Conservador"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              {presetKey === "standard"     && "Exato: 10pts · Vencedor: 3pts · Participação: 1pt"}
              {presetKey === "risky"        && "Exato: 20pts · Vencedor: 5pts · Sem participação"}
              {presetKey === "conservative" && "Exato: 5pts · Vencedor: 2pts · Participação: 1pt"}
            </p>
          </div>

          {/* Champion pick — only if champion market is enabled */}
          {championEnabled && (
            <div>
              <p className="mb-3 text-sm font-bold">Quem será o campeão? *</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {teams.slice(0, 24).map((team) => (
                  <button key={team.code} onClick={() => setChampion(team.code)}
                    className={cn("rounded-xl p-2 text-center text-xs font-bold transition-all",
                      champion === team.code ? "border border-primary bg-primary/20 scale-105" : "surface-card-soft text-zinc-400")}>
                    {team.code}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create button */}
          <button onClick={handleCreate} disabled={!canProceed || creating}
            className="mt-2 w-full rounded-[24px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black disabled:opacity-60">
            {creating
              ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Criando...</span>
              : "Criar bolão →"}
          </button>
        </div>
      )}
    </div>
  );
}
