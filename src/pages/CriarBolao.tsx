import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronLeft, ChevronRight, Crown, Globe, Loader2, Lock, Share2, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getCountFromServer,
  addDoc,
  setDoc,
  doc
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMonetization } from "@/contexts/MonetizationContext";
import { teams } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";

const PRESETS_VALUES = {
  standard: { exact: 10, winner: 3, draw: 3, participation: 1 },
  risky: { exact: 20, winner: 5, draw: 5, participation: 0 },
  conservative: { exact: 5, winner: 2, draw: 2, participation: 1 },
};

const emojisList = ["🏆", "⚽", "🔥", "👑", "🎯", "🌎", "⭐", "🥇"];

type Category = "private" | "public";

export default function CriarBolao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium, purchasePremium, isLoading: isPurchasing } = useMonetization();

  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏆");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("private");
  const [scoringRules, setScoringRules] = useState(PRESETS_VALUES.standard);
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

  const stepsCount = 3;
  const currentProgress = ((Math.min(step, 2) + 1) / stepsCount) * 100;

  const canProceed = useMemo(() => {
    if (step === 0) return name.trim().length >= 3;
    if (step === 1) return true;
    if (step === 2) return Boolean(champion);
    return true;
  }, [champion, name, step]);

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
    setStep((prev) => Math.min(prev + 1, 2));
  };

  const handleBack = async () => {
    await safeHaptic(ImpactStyle.Light);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCreate = async () => {
    await safeHaptic(ImpactStyle.Heavy);
    if (!user || !name.trim() || !champion) return;

    setCreating(true);
    try {
      const inviteCodeVal = Math.random().toString(36).substring(2, 8).toUpperCase();

      const insertData = {
        name: name.trim(),
        description: description.trim() || null,
        creator_id: user.id,
        category,
        is_paid: false,
        scoring_rules: scoringRules,
        status: "open",
        invite_code: inviteCodeVal,
        avatar_url: emoji,
        created_at: new Date().toISOString()
      };

      const boloesRef = collection(db, "boloes");
      const bolaoDoc = await addDoc(boloesRef, insertData);
      
      // Add the creator as the first member
      const memberId = `${user.id}_${bolaoDoc.id}`;
      await setDoc(doc(db, "bolao_members", memberId), {
        bolao_id: bolaoDoc.id,
        user_id: user.id,
        role: "admin",
        payment_status: "exempt",
        created_at: new Date().toISOString()
      });

      // Champion prediction
      const predictionId = `${user.id}_${bolaoDoc.id}`;
      await setDoc(doc(db, "bolao_champion_predictions", predictionId), {
        bolao_id: bolaoDoc.id,
        user_id: user.id,
        team_code: champion,
        updated_at: new Date().toISOString()
      });

      toast({
        title: "Bolão criado.",
        description: "Agora chama a tropa e começa a brincadeira.",
        className: "bg-emerald-500 text-white border-none font-black",
      });

      setCreatedBolaoId(bolaoDoc.id);
      setCreatedInviteCode(inviteCodeVal);
      setStep(3);

      if (window.plausible) {
        window.plausible("Bolao Created", { props: { category } });
      }
    } catch (error) {
      console.error("Erro ao criar bolão:", error);
      toast({
        title: "Erro ao criar bolão",
        description: error instanceof Error ? error.message : "Revisa os dados e tenta de novo.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  if (showPaywall) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10 text-white">
        <div className="w-full rounded-3xl border border-white/10 bg-zinc-950 p-6">
          <div className="mb-4 inline-flex rounded-full bg-primary/15 p-3 text-primary">
            <Crown className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black">Limite atingido</h1>
          <p className="mt-2 text-sm text-zinc-400">
            O plano gratuito permite criar até 2 bolões. O Premium libera ligas ilimitadas e ainda remove anúncios.
          </p>

          <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Bolões ilimitados</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Sem anúncios</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Badge Torcedor Oficial</div>
          </div>

          <div className="mt-6 grid gap-3">
            <button
              onClick={() => purchasePremium()}
              disabled={isPurchasing}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
            >
              {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
              {isPurchasing ? "Processando..." : "Desbloquear Premium - R$ 9,90"}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="h-12 rounded-2xl border border-white/10 bg-transparent text-sm font-bold text-zinc-300"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3 && createdBolaoId && createdInviteCode) {
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
        <div className="rounded-[32px] border border-white/10 bg-zinc-950 p-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-4xl text-primary">
            {emoji}
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Arena criada</p>
          <h1 className="mt-2 text-3xl font-black">{name}</h1>
          <p className="mt-3 text-sm text-zinc-400">Sem premiação em dinheiro. Só orgulho, zoeira e glória esportiva.</p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <button
              onClick={handleWhatsApp}
              className="rounded-2xl bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black"
            >
              Compartilhar no WhatsApp
            </button>
            <button
              onClick={handleShareNative}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em]"
            >
              <Share2 className="h-4 w-4" />
              Mais opções
            </button>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(inviteUrl);
              toast({ title: "Link copiado." });
            }}
            className="mt-3 w-full truncate rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-xs font-bold text-zinc-300"
          >
            {inviteUrl}
          </button>

          <button
            onClick={() => navigate(`/boloes/${createdBolaoId}`)}
            className="mt-6 w-full rounded-[24px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black"
          >
            Acessar bolão
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 text-white">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/10 bg-white/5"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Novo bolão</p>
          <h1 className="text-3xl font-black">Monte sua arena</h1>
        </div>
      </div>

      <div className="mb-8 rounded-full bg-white/5 p-1">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${currentProgress}%` }}
        />
      </div>

      <div className="rounded-[32px] border border-white/10 bg-zinc-950 p-6">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Etapa 1 de 3</p>
              <h2 className="mt-1 text-2xl font-black">Identidade</h2>
              <p className="mt-2 text-sm text-zinc-400">Nome, clima e privacidade. Sem burocracia desnecessária.</p>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold">Emoji da liga</p>
              <div className="flex flex-wrap gap-3">
                {emojisList.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "rounded-2xl border p-3 text-3xl transition-all",
                      emoji === e ? "scale-110 border-primary bg-primary/20" : "border-white/10 bg-white/5"
                    )}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-bold">Nome da liga</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Arena da Firma"
                className="w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-xl font-black outline-none"
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-bold">Descrição</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Bolão oficial dos amigos, sem premiação, só resenha."
                className="min-h-[110px] w-full rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-sm outline-none"
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-bold">Privacidade</p>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  onClick={() => setCategory("private")}
                  className={cn(
                    "rounded-[24px] border p-5 text-left transition-all",
                    category === "private" ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
                  )}
                >
                  <Lock className="mb-3 h-5 w-5 text-primary" />
                  <p className="font-black">Privado</p>
                  <p className="mt-1 text-sm text-zinc-400">Só entra quem tiver código ou link.</p>
                </button>
                <button
                  onClick={() => setCategory("public")}
                  className={cn(
                    "rounded-[24px] border p-5 text-left transition-all",
                    category === "public" ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
                  )}
                >
                  <Globe className="mb-3 h-5 w-5 text-primary" />
                  <p className="font-black">Público</p>
                  <p className="mt-1 text-sm text-zinc-400">Aparece em explorar bolões públicos.</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Etapa 2 de 3</p>
              <h2 className="mt-1 text-2xl font-black">Pontuação</h2>
              <p className="mt-2 text-sm text-zinc-400">Escolhe um preset rápido. Depois você pode lapidar melhor a experiência.</p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {Object.entries(PRESETS_VALUES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setScoringRules(value)}
                  className={cn(
                    "rounded-[24px] border p-5 text-left transition-all",
                    scoringRules === value ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
                  )}
                >
                  <div className="mb-3 inline-flex rounded-full bg-primary/15 p-2 text-primary">
                    {key === "standard" ? <ShieldCheck className="h-4 w-4" /> : key === "risky" ? <Sparkles className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
                  </div>
                  <p className="font-black capitalize">{key}</p>
                  <div className="mt-3 space-y-1 text-sm text-zinc-400">
                    <p>Exato: {value.exact} pts</p>
                    <p>Resultado: {value.winner} pts</p>
                    <p>Empate: {value.draw} pts</p>
                    <p>Participação: {value.participation} pt</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Etapa 3 de 3</p>
              <h2 className="mt-1 text-2xl font-black">Seu campeão</h2>
              <p className="mt-2 text-sm text-zinc-400">Aposta inicial da casa. Isso já ajuda a amarrar a liga desde o começo.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {teams.map((team) => (
                <button
                  key={team.code}
                  onClick={() => setChampion(team.code)}
                  className={cn(
                    "rounded-[22px] border p-3 transition-all",
                    champion === team.code ? "scale-[1.03] border-primary bg-primary/10" : "border-white/10 bg-white/5"
                  )}
                >
                  <div className="mb-2 flex justify-center">
                    <Flag code={team.code} />
                  </div>
                  <div className="text-center text-xs font-black">{team.code}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            {createdCount} bolão{createdCount === 1 ? "" : "ões"} criados na conta
          </div>

          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-[11px] font-black uppercase tracking-[0.18em]"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
            )}

            {step < 2 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
              >
                Continuar
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={!canProceed || creating}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {creating ? "Criando..." : "Criar bolão"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
