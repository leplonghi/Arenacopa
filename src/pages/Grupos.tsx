import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, Users2, X, Crown, CheckCircle2 } from "lucide-react";
import {
  collection, query, where, getDocs, addDoc,
  doc, setDoc, getDoc, orderBy, limit, getCountFromServer,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useMonetization } from "@/contexts/MonetizationContext";
import { monetizationEnv } from "@/lib/env";
import { PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE } from "@/services/monetization/stripe.service";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";

interface Grupo {
  id: string; name: string; emoji: string; description: string | null;
  creator_id: string; invite_code: string; category: "private" | "public";
  member_count: number; bolao_count: number;
}

const EMOJIS_G = ["👥", "⚽", "🏆", "🔥", "🎯", "🦁", "🎉", "💪"];

export default function Grupos() {
  const { t } = useTranslation('bolao');
  const { user } = useAuth();
  const { isPremium, purchasePremium, isLoading: isPurchasing } = useMonetization();
  const canStartCheckout = monetizationEnv.enablePremiumSimulation || monetizationEnv.premiumCheckoutEnabled;
  const { canCreateGrupo } = usePlanLimits();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("👥");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<"private" | "public">("private");

  const loadGrupos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const memSnap = await getDocs(query(collection(db, "grupo_members"), where("user_id", "==", user.id)));
      const grupoIds = memSnap.docs.map(d => d.data().grupo_id as string);
      if (grupoIds.length === 0) { setGrupos([]); setLoading(false); return; }

      const results: Grupo[] = [];
      for (const gid of grupoIds) {
        const gDoc = await getDoc(doc(db, "grupos", gid));
        if (!gDoc.exists()) continue;
        const data = gDoc.data();
        const bolaoSnap = await getDocs(query(collection(db, "boloes"), where("grupo_id", "==", gid), limit(20)));
        results.push({
          id: gDoc.id, name: data.name, emoji: data.emoji,
          description: data.description ?? null, creator_id: data.creator_id,
          invite_code: data.invite_code, category: data.category,
          member_count: data.member_count ?? 1, bolao_count: bolaoSnap.size,
        });
      }
      setGrupos(results);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadGrupos(); }, [loadGrupos]);

  const handleCreate = async () => {
    // Paywall via usePlanLimits hook
    if (!canCreateGrupo) { setShowPaywall(true); return; }
    if (!user || !newName.trim()) return;
    setCreating(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const grupoRef = await addDoc(collection(db, "grupos"), {
        name: newName.trim(), emoji: newEmoji, description: newDesc.trim() || null,
        creator_id: user.id, invite_code: code, category: newCategory,
        member_count: 1, created_at: new Date().toISOString(),
      });
      await setDoc(doc(db, "grupo_members", `${user.id}_${grupoRef.id}`), {
        grupo_id: grupoRef.id, user_id: user.id, role: "admin",
        joined_at: new Date().toISOString(),
      });
      toast({ title: t('grupos.created'), className: "bg-emerald-500 text-white font-black" });
      setShowCreate(false); setNewName(""); setNewDesc("");
      navigate(`/grupos/${grupoRef.id}`);
    } catch (e) {
      toast({ title: t('grupos.create_error'), variant: "destructive" });
    } finally { setCreating(false); }
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    try {
      const code = joinCode.trim().toUpperCase();
      const snap = await getDocs(query(collection(db, "grupos"), where("invite_code", "==", code), limit(1)));
      if (snap.empty) throw new Error(t('grupos.invalid_code'));
      const gDoc = snap.docs[0];
      const memberId = `${user.id}_${gDoc.id}`;
      const existing = await getDoc(doc(db, "grupo_members", memberId));
      if (existing.exists()) { toast({ title: t('grupos.already_member') }); return; }
      await setDoc(doc(db, "grupo_members", memberId), {
        grupo_id: gDoc.id, user_id: user.id, role: "member", joined_at: new Date().toISOString(),
      });
      toast({ title: t('grupos.joined'), className: "bg-emerald-500 text-white font-black" });
      setShowJoin(false); setJoinCode("");
      navigate(`/grupos/${gDoc.id}`);
    } catch (e) {
      toast({ title: t('grupos.invalid_code'), description: t('grupos.invalid_code_desc'), variant: "destructive" });
    } finally { setJoining(false); }
  };

  // ─── Paywall ────────────────────────────────────────────────────────────
  if (showPaywall) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10 text-white">
        <div className="surface-card-strong w-full rounded-[32px] p-6">
          <div className="mb-4 inline-flex rounded-full bg-primary/15 p-3 text-primary"><Crown className="h-6 w-6" /></div>
          <h1 className="text-2xl font-black">Limite de grupos atingido</h1>
          <p className="mt-2 text-sm text-zinc-400">O plano gratuito permite criar 1 grupo. O Copa Pass libera grupos ilimitados.</p>
          <div className="surface-card-soft mt-5 space-y-3 rounded-2xl p-4 text-sm">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Grupos ilimitados</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Bolões ilimitados</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Badge Torcedor Oficial</div>
          </div>
          <div className="mt-6 grid gap-3">
            <button onClick={() => void purchasePremium()} disabled={isPurchasing || !canStartCheckout}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60">
              {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
              {isPurchasing ? "Aguarde..." : canStartCheckout ? "Copa Pass — R$ 19,90" : "Em preparação"}
            </button>
            {!canStartCheckout && <p className="text-center text-xs text-zinc-500">{PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE}</p>}
            <button onClick={() => setShowPaywall(false)} className="surface-input h-12 rounded-2xl bg-transparent text-sm font-bold text-zinc-300">Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 text-white">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Comunidade</p>
          <h1 className="mt-1 text-3xl font-black">Grupos</h1>
          <p className="mt-1 text-sm text-zinc-400">Reúna bolões em um grupo e dispute o ranking geral</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black">
          <Plus className="h-4 w-4" /> Criar
        </button>
      </div>

      <button onClick={() => setShowJoin(v => !v)}
        className="mb-6 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-bold hover:bg-white/10 transition-colors">
        Entrar com código de convite
      </button>
      {showJoin && (
        <div className="mb-6 flex gap-2">
          <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="CÓDIGO" maxLength={6}
            className="surface-input flex-1 rounded-2xl px-4 py-3 text-base font-black uppercase tracking-widest" />
          <button onClick={handleJoin} disabled={joining || joinCode.length < 6}
            className="rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-widest text-black disabled:opacity-60">
            {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
          </button>
        </div>
      )}

      {loading && <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
      {!loading && grupos.length === 0 && (
        <EmptyState icon="👥" title="Nenhum grupo ainda"
          description="Crie seu primeiro grupo ou entre com um código de convite." />
      )}
      {!loading && grupos.length > 0 && (
        <div className="space-y-3">
          {grupos.map((g) => (
            <Link key={g.id} to={`/grupos/${g.id}`}
              className="surface-card-hover flex items-center justify-between gap-4 rounded-[24px] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">{g.emoji}</div>
                <div>
                  <p className="font-black">{g.name}</p>
                  {g.description && <p className="text-xs text-zinc-400">{g.description}</p>}
                  <div className="mt-1 flex gap-3 text-xs text-zinc-500">
                    <span>{g.member_count} membros</span>
                    <span>{g.bolao_count} bolões</span>
                  </div>
                </div>
              </div>
              <Users2 className="h-5 w-5 shrink-0 text-zinc-600" />
            </Link>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg rounded-t-[32px] bg-[#0f1f14] p-6 pb-10 text-white space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Criar Grupo</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-full bg-white/10 p-2"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-2">{EMOJIS_G.map(e => (
              <button key={e} onClick={() => setNewEmoji(e)}
                className={cn("rounded-xl p-2 text-xl", newEmoji === e ? "bg-primary/20 border border-primary" : "bg-white/5")}>
                {e}
              </button>
            ))}</div>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do grupo *"
              className="w-full rounded-2xl bg-white/10 px-4 py-3 text-base font-black placeholder:font-normal placeholder:text-zinc-500 outline-none" />
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descrição (opcional)"
              className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm outline-none min-h-[60px]" />
            <button onClick={handleCreate} disabled={creating || newName.trim().length < 2}
              className="w-full rounded-2xl bg-primary py-4 text-[11px] font-black uppercase tracking-widest text-black disabled:opacity-60">
              {creating ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Criando...</span> : "Criar grupo"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
