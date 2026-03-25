import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Crown, Globe,
  Loader2, Lock, Share2, Settings2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Share } from "@capacitor/share";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMonetization } from "@/contexts/MonetizationContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { cn } from "@/lib/utils";
import { monetizationEnv } from "@/lib/env";
import { PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE } from "@/services/monetization/stripe.service";
import { getDefaultMarketIdsForFormat } from "@/services/boloes/bolao-format.service";
import { useCreateBolao } from "@/hooks/useCreateBolao";
import type { BolaoFormatSlug, MarketTemplateSlug, ScoringRules } from "@/types/bolao";

// ─── constants ────────────────────────────────────────────────────────────────

const EMOJIS = ["⚽", "🏆", "🎯", "🎉", "🦁", "🔥", "💪", "🏅", "🌟", "🎪", "🐅", "🦅"];

const PRESETS: Record<"standard" | "risky" | "conservative", ScoringRules> = {
  standard:     { exact: 10, winner: 3, draw: 3, participation: 1 },
  risky:        { exact: 20, winner: 5, draw: 5, participation: 0 },
  conservative: { exact: 5,  winner: 2, draw: 2, participation: 1 },
};

type Category = "private" | "public";
type PresetKey = "standard" | "risky" | "conservative";

// Simplified to 3 clear, intuitive types
const POOL_TYPES = [
  {
    id: "placar",
    emoji: "⚽",
    title: "Placar dos jogos",
    subtitle: "O clássico",
    desc: "Você e seus amigos apostam no resultado exato de cada partida. Quem acertar mais, vence!",
    example: "Ex: Brasil 2 × 1 Argentina",
    formatId: "classic" as BolaoFormatSlug,
    badge: "Mais popular",
    badgeColor: "bg-primary text-black",
  },
  {
    id: "fase",
    emoji: "🏆",
    title: "Quem avança de fase",
    subtitle: "Mata-mata",
    desc: "Adivinhe quais seleções passam para as oitavas, quartas, semis e a grande final.",
    example: "Ex: Brasil, França, Alemanha...",
    formatId: "knockout" as BolaoFormatSlug,
    badge: "Estratégico",
    badgeColor: "bg-copa-blue/20 text-copa-blue",
  },
  {
    id: "completo",
    emoji: "🎯",
    title: "Completo",
    subtitle: "Tudo junto",
    desc: "Placar + quem avança + artilheiro + muito mais. Para quem quer máxima diversão!",
    example: "Ex: Placar, fases, artilheiro...",
    formatId: "detailed" as BolaoFormatSlug,
    badge: "Máxima diversão",
    badgeColor: "bg-copa-green/20 text-copa-green-light",
  },
] as const;

type PoolTypeId = typeof POOL_TYPES[number]["id"];

// ─── component ────────────────────────────────────────────────────────────────

export default function CriarBolao() {
  const { t } = useTranslation("bolao");
  const navigate = useNavigate();
  const { user: _user } = useAuth();
  const { toast } = useToast();
  const { purchasePremium, isLoading: isPurchasing } = useMonetization();
  const { canCreateGrupo } = usePlanLimits();
  const canStartCheckout = monetizationEnv.enablePremiumSimulation || monetizationEnv.premiumCheckoutEnabled;
  const { createBolao, creating } = useCreateBolao();

  // ─ state ─
  const [step, setStep] = useState(0); // 0=nome, 1=tipo, 2=privacidade, 3=pontuação(opcional)
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("⚽");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("private");
  const [selectedTypeId, setSelectedTypeId] = useState<PoolTypeId>("placar");
  const [formatId, setFormatId] = useState<BolaoFormatSlug>("classic");
  const [selectedMarketIds, setSelectedMarketIds] = useState<MarketTemplateSlug[]>(
    getDefaultMarketIdsForFormat("classic").filter((m) => m !== "champion") as MarketTemplateSlug[]
  );
  const [presetKey, setPresetKey] = useState<PresetKey>("standard");
  const [scoringRules, setScoringRules] = useState(PRESETS.standard);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [createdBolaoId, setCreatedBolaoId] = useState<string | null>(null);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!canCreateGrupo) setShowPaywall(true);
  }, [canCreateGrupo]);

  const selectedType = POOL_TYPES.find((t) => t.id === selectedTypeId) as typeof POOL_TYPES[0];

  const canProceedStep0 = name.trim().length >= 3;

  const handleSelectType = (typeId: PoolTypeId) => {
    const t = POOL_TYPES.find((x) => x.id === typeId) as typeof POOL_TYPES[0];
    setSelectedTypeId(typeId);
    setFormatId(t.formatId);
    const mkts = getDefaultMarketIdsForFormat(t.formatId)
      .filter((m) => m !== "champion") as MarketTemplateSlug[];
    setSelectedMarketIds(mkts);
  };

  const handleCreate = async () => {
    const result = await createBolao({
      name, description, emoji, category,
      formatId, selectedMarketIds, scoringRules, champion: "",
    });
    if (result) {
      toast({ title: "Bolão criado! 🎉", className: "bg-emerald-500 text-white border-none font-black" });
      setCreatedBolaoId(result.bolaoId);
      setCreatedInviteCode(result.inviteCode);
    }
  };

  // ─── Paywall ────────────────────────────────────────────────────────────────
  if (showPaywall) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10 text-white">
        <div className="surface-card-strong w-full rounded-[32px] p-6">
          <div className="mb-4 inline-flex rounded-full bg-primary/15 p-3 text-primary">
            <Crown className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black">Limite atingido</h1>
          <p className="mt-2 text-sm text-zinc-300">
            O plano gratuito permite criar até 2 grupos. O Copa Pass libera grupos e bolões ilimitados.
          </p>
          <div className="surface-card-soft mt-5 space-y-3 rounded-2xl p-4 text-sm text-zinc-200">
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
            {!canStartCheckout && <p className="text-center text-xs text-zinc-400">{PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE}</p>}
            <button onClick={() => navigate(-1)} className="surface-input h-12 rounded-2xl bg-transparent text-sm font-bold text-zinc-300">Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success ────────────────────────────────────────────────────────────────
  if (createdBolaoId && createdInviteCode) {
    const inviteUrl = `${window.location.origin}/b/${createdInviteCode}`;
    const msg = `Vem pro meu bolão "${name}" no Arena Copa! Código: ${createdInviteCode}`;
    const handleShareNative = async () => {
      try { await Share.share({ title: "Arena Copa Bolão", text: msg, url: inviteUrl }); }
      catch { await navigator.clipboard.writeText(inviteUrl); toast({ title: t('bolao_detail.link_copied') }); }
    };
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-white">
        <div className="surface-card-strong rounded-[32px] p-8 text-center">
          <div className="mx-auto mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-5xl">{emoji}</div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Bolão criado! 🎉</p>
          <h1 className="mt-1 text-3xl font-black">{name}</h1>
          <p className="mt-2 text-sm text-zinc-300">Agora chama os amigos pra entrar!</p>

          <div className="surface-card-soft mt-5 rounded-2xl p-4">
            <p className="text-xs text-zinc-400">Código de convite</p>
            <p className="mt-1 text-3xl font-black tracking-widest text-primary">{createdInviteCode}</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${msg} ${inviteUrl}`)}`, "_blank")}
              className="rounded-2xl bg-[#25D366] px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-white">
              WhatsApp
            </button>
            <button onClick={handleShareNative}
              className="surface-card-soft inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em]">
              <Share2 className="h-4 w-4" /> Mais opções
            </button>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(inviteUrl); toast({ title: t('bolao_detail.link_copied') }); }}
            className="surface-card-soft mt-3 w-full truncate rounded-2xl px-4 py-3 text-xs font-bold text-zinc-300">
            {inviteUrl}
          </button>
          <button onClick={() => navigate(`/boloes/${createdBolaoId}`)}
            className="mt-4 w-full rounded-[24px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black">
            Ver meu bolão →
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 0: Nome ───────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-28 pt-6 text-white">
        {/* header */}
        <div className="mb-8 flex items-center gap-3">
          <button aria-label="Voltar" onClick={() => navigate(-1)}
            className="surface-card-soft flex h-11 w-11 items-center justify-center rounded-[18px]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Passo 1 de 3</p>
            <h1 className="text-2xl font-black leading-tight">Nome do bolão</h1>
          </div>
        </div>

        {/* progress */}
        <div className="mb-8 flex gap-1.5">
          <div className="h-1.5 flex-1 rounded-full bg-primary" />
          <div className="h-1.5 flex-1 rounded-full bg-white/10" />
          <div className="h-1.5 flex-1 rounded-full bg-white/10" />
        </div>

        <div className="space-y-6">
          {/* Emoji picker */}
          <div>
            <p className="mb-3 text-sm font-bold text-zinc-300">Escolha um emoji pra representar seu bolão</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={cn(
                    "rounded-2xl border p-3 text-2xl transition-all",
                    emoji === e ? "scale-110 border-primary bg-primary/20" : "surface-card-soft border-transparent"
                  )}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div>
            <p className="mb-2 text-sm font-bold text-zinc-200">Como vai se chamar?</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bolão da firma, Copa da família..."
              autoFocus
              maxLength={40}
              className="surface-input w-full rounded-[20px] px-5 py-4 text-xl font-black placeholder:text-zinc-500"
            />
            <p className="mt-1.5 text-right text-xs text-zinc-500">{name.length}/40</p>
          </div>

          {/* Description */}
          <div>
            <p className="mb-2 text-sm font-bold text-zinc-200">
              Descrição <span className="font-normal text-zinc-400">(opcional)</span>
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Regras, premiação, contexto do bolão..."
              maxLength={140}
              className="surface-input min-h-[80px] w-full rounded-[20px] px-5 py-4 text-sm placeholder:text-zinc-500"
            />
          </div>

          {/* Preview + CTA */}
          <div className="surface-card-soft rounded-[20px] p-4 border-white/5">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Prévia</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{emoji}</span>
              <div>
                <p className="font-black">{name || "Nome do bolão"}</p>
                {description && <p className="mt-0.5 text-xs text-zinc-300 line-clamp-1">{description}</p>}
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={!canProceedStep0}
            className="w-full rounded-[20px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black disabled:opacity-40 flex items-center justify-center gap-2">
            Próximo <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 1: Tipo de bolão ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-28 pt-6 text-white">
        <div className="mb-8 flex items-center gap-3">
          <button aria-label="Voltar" onClick={() => setStep(0)}
            className="surface-card-soft flex h-11 w-11 items-center justify-center rounded-[18px]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Passo 2 de 3</p>
            <h1 className="text-2xl font-black leading-tight">Que tipo de bolão?</h1>
          </div>
        </div>

        <div className="mb-8 flex gap-1.5">
          <div className="h-1.5 flex-1 rounded-full bg-primary" />
          <div className="h-1.5 flex-1 rounded-full bg-primary" />
          <div className="h-1.5 flex-1 rounded-full bg-white/10" />
        </div>

        <div className="space-y-3">
          {POOL_TYPES.map((type) => {
            const isSelected = selectedTypeId === type.id;
            return (
              <button
                key={type.id}
                onClick={() => handleSelectType(type.id)}
                className={cn(
                  "w-full rounded-[24px] border p-5 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 scale-[1.01]"
                    : "surface-card-strong border-transparent"
                )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-3xl">{type.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black">{type.title}</p>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", type.badgeColor)}>
                          {type.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-300 leading-snug">{type.desc}</p>
                      <p className="mt-2 rounded-lg bg-black/20 px-3 py-1.5 text-xs text-zinc-300 font-medium inline-block">{type.example}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "mt-1 h-5 w-5 shrink-0 rounded-full border-2 transition-all",
                    isSelected ? "border-primary bg-primary" : "border-zinc-500 bg-black/30"
                  )}>
                    {isSelected && <div className="flex h-full w-full items-center justify-center"><div className="h-2 w-2 rounded-full bg-black" /></div>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setStep(2)}
          className="mt-6 w-full rounded-[20px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black flex items-center justify-center gap-2">
          Próximo <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ─── Step 2: Privacidade + Pontuação + Criar ────────────────────────────────
  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6 text-white">
      <div className="mb-8 flex items-center gap-3">
        <button aria-label="Voltar" onClick={() => setStep(1)}
          className="surface-card-soft flex h-11 w-11 items-center justify-center rounded-[18px]">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Passo 3 de 3</p>
          <h1 className="text-2xl font-black leading-tight">Últimos detalhes</h1>
        </div>
      </div>

      <div className="mb-8 flex gap-1.5">
        <div className="h-1.5 flex-1 rounded-full bg-primary" />
        <div className="h-1.5 flex-1 rounded-full bg-primary" />
        <div className="h-1.5 flex-1 rounded-full bg-primary" />
      </div>

      <div className="space-y-4">
        {/* Resumo do que foi escolhido */}
        <div className="surface-card-soft rounded-[20px] p-4 border-white/5">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Resumo</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-black truncate">{name}</p>
              <p className="mt-0.5 text-xs text-zinc-300">{selectedType.title} · {selectedType.subtitle}</p>
            </div>
            <button onClick={() => setStep(0)} className="text-xs text-primary font-bold shrink-0 hover:underline">Editar</button>
          </div>
        </div>

        {/* Quem pode entrar */}
        <div>
          <p className="mb-3 text-sm font-bold">Quem pode entrar?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setCategory("private")}
              className={cn(
                "rounded-[20px] border p-4 text-left transition-all",
                category === "private" ? "border-primary bg-primary/10 scale-[1.02]" : "surface-card-strong border-transparent hover:border-white/10"
              )}>
              <Lock className={cn("mb-2 h-5 w-5", category === "private" ? "text-primary" : "text-zinc-400")} />
              <p className="text-sm font-black">Privado</p>
              <p className="mt-0.5 text-xs text-zinc-400">Só quem tiver o link ou código</p>
            </button>
            <button
              onClick={() => setCategory("public")}
              className={cn(
                "rounded-[20px] border p-4 text-left transition-all",
                category === "public" ? "border-primary bg-primary/10 scale-[1.02]" : "surface-card-strong border-transparent hover:border-white/10"
              )}>
              <Globe className={cn("mb-2 h-5 w-5", category === "public" ? "text-primary" : "text-zinc-400")} />
              <p className="text-sm font-black">Público</p>
              <p className="mt-0.5 text-xs text-zinc-400">Qualquer pessoa pode entrar</p>
            </button>
          </div>
        </div>

        {/* Pontuação (colapsável) */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="surface-card-soft flex w-full items-center justify-between rounded-[20px] px-4 py-3 border-white/5">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-zinc-300" />
              <div className="text-left">
                <p className="text-sm font-bold text-zinc-100">Sistema de pontuação</p>
                <p className="text-xs text-zinc-400">
                  {presetKey === "standard" ? "Padrão (recomendado)" : presetKey === "risky" ? "Arriscado" : "Conservador"}
                </p>
              </div>
            </div>
            <ChevronRight className={cn("h-4 w-4 text-zinc-400 transition-transform", showAdvanced && "rotate-90")} />
          </button>

          {showAdvanced && (
            <div className="mt-3 surface-card-soft rounded-[20px] p-4 space-y-3 border-white/5">
              <p className="text-xs text-zinc-300 mb-2">
                Quanto vale cada tipo de acerto? Escolha o sistema que combina com o seu grupo.
              </p>
              {(["standard", "risky", "conservative"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => { setPresetKey(k); setScoringRules(PRESETS[k]); }}
                  className={cn(
                    "w-full rounded-[16px] border p-3 text-left transition-all",
                    presetKey === k ? "border-primary bg-primary/10" : "surface-card-strong border-transparent hover:border-white/10"
                  )}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black">
                      {k === "standard" ? "⚖️ Padrão" : k === "risky" ? "🎲 Arriscado" : "🛡️ Conservador"}
                    </p>
                    {presetKey === k && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    {k === "standard" && "Placar exato: 10pts · Vencedor: 3pts · Participação: 1pt"}
                    {k === "risky"    && "Placar exato: 20pts · Vencedor: 5pts · Sem bônus de participação"}
                    {k === "conservative" && "Placar exato: 5pts · Vencedor: 2pts · Participação: 1pt"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Criar bolão */}
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full rounded-[20px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black disabled:opacity-60">
          {creating
            ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Criando...</span>
            : "Criar bolão 🎉"}
        </button>

        <p className="text-center text-xs text-zinc-400">
          Você poderá convidar amigos logo depois de criar.
        </p>
      </div>
    </div>
  );
}
