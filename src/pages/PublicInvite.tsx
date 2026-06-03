import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  Users,
  ShieldCheck,
  LockOpen,
  Trophy,
  Sparkles,
  ChevronRight,
  Globe,
  Zap,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { resolvePublicBolaoInvite } from "@/services/public-invite/public-invite.service";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { JoinCTA } from "@/features/social/JoinCTA";
import { joinViaInvite } from "@/services/groups/group-access.service";
import { tStatic } from "@/i18n/staticText";
import { getArenaAssetSrc } from "@/lib/arena-assets";
import { ArenaImageButton, ArenaStateBlock } from "@/components/arena/ArenaExperience";

type PublicInviteBolao = Awaited<ReturnType<typeof resolvePublicBolaoInvite>>;

const STEPS = [
  {
    icon: Globe,
    title: "Entre no link",
    desc: "Você está a um passo de participar. Toque no botão abaixo.",
  },
  {
    icon: Zap,
    title: "Crie sua conta",
    desc: "Rápido e gratuito. Use e-mail, Google ou Apple.",
  },
  {
    icon: Trophy,
    title: "Dê seus chutes",
    desc: "Acerte placares, suba no ranking e dispute prêmios.",
  },
];

export default function PublicInvite() {
  // <meta name="description" content="Aceite seu convite e participe do bolão na ArenaCopa!" />
  // <meta property="og:title" content="Convite ArenaCopa" />
  // <meta property="og:description" content="Aceite seu convite e participe do bolão na ArenaCopa!" />
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bolao, setBolao] = useState<PublicInviteBolao>(null);
  const [loading, setLoading] = useState(true);
  const [autoJoining, setAutoJoining] = useState(false);

  const loadBolao = useCallback(async () => {
    if (!inviteCode) {
      setLoading(false);
      return;
    }

    try {
      const resolvedBolao = await resolvePublicBolaoInvite(inviteCode.toUpperCase());

      if (!resolvedBolao) {
        setBolao(null);
        return;
      }

      if (user) {
        const memberSnap = await getDoc(doc(db, "bolao_members", `${user.id}_${resolvedBolao.id}`));
        if (memberSnap.exists() && (memberSnap.data().membership_status || "active") === "active") {
          navigate(`/boloes/${resolvedBolao.id}`, { replace: true });
          return;
        }
      }

      setBolao(resolvedBolao);
    } catch (error) {
      console.error("[PublicInvite] loadBolao error:", error);
      const msg = error instanceof Error ? error.message : String(error);
      toast({ title: "Não foi possível carregar o convite", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [inviteCode, navigate, toast, user]);

  useEffect(() => {
    void loadBolao();
  }, [loadBolao]);

  const ctaMode = useMemo(() => {
    if (!bolao) return "request" as const;
    if (bolao.group_binding_mode === "group_gated") return "group_first" as const;
    return bolao.can_join_direct ? ("direct" as const) : ("request" as const);
  }, [bolao]);

  useEffect(() => {
    const autoJoin = async () => {
      if (!user || !bolao || new URLSearchParams(location.search).get("action") !== "join" || !inviteCode) {
        return;
      }

      try {
        setAutoJoining(true);
        const result = await joinViaInvite({
          payload: {
            kind: "bolao",
            invite_code: inviteCode.toUpperCase(),
          },
        });

        if (result.status === "joined" || result.status === "already_member") {
          // result is a union type — narrow to BolaoJoinResponse via 'bolao_id'
          const bolaoId = "bolao_id" in result ? result.bolao_id : bolao?.id;
          navigate(`/boloes/${bolaoId}`, { replace: true });
          return;
        }

        setAutoJoining(false);
        toast({
          title: "Solicitação enviada",
          description: "Agora é só aguardar a aprovação.",
        });
      } catch (error) {
        setAutoJoining(false);
        if (error instanceof Error && error.message === "join_requires_group" && bolao.required_group_invite_code) {
          navigate(`/grupos/entrar/${bolao.required_group_invite_code}`, { replace: true });
          return;
        }
        if (error instanceof Error && error.message === "commercial_participant_limit_reached") {
          toast({
            title: "Limite de participantes atingido",
            description: "Este pacote atingiu o limite de participantes.",
            variant: "destructive",
          });
        }
      }
    };

    void autoJoin();
  }, [bolao, inviteCode, location.search, navigate, toast, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-gray-500">{tStatic("Carregando convite...")}</p>
        </div>
      </div>
    );
  }

  // Auto-join feedback after returning from signup (?action=join) — avoids the
  // confusing flash of the invite page re-rendering before the redirect lands.
  if (autoJoining) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <Trophy className="absolute inset-0 m-auto h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-black text-white">Entrando no bolão…</p>
            <p className="mt-1 text-sm text-gray-500">Liberando seu acesso, aguarde um instante.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!bolao) {
    const invalidInviteSrc = getArenaAssetSrc("generated/invalid-invite.webp");
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] p-6 text-white">
        <ArenaStateBlock
          image={{ src: invalidInviteSrc, alt: "", eager: true }}
          icon={<Sparkles className="h-7 w-7" />}
          title={tStatic("Convite não encontrado")}
          description={tStatic("Esse código pode ter expirado, ter sido removido ou pertencer a um bolão que não está mais aceitando participantes.")}
          action={<ArenaImageButton onClick={() => navigate("/auth")} variant="gold">Entrar na Arena</ArenaImageButton>}
          className="min-h-[420px] w-full max-w-xl border-red-400/25"
        />
      </div>
    );
  }

  const isPrivate = bolao.visibility === "private";
  const requiresApproval = ctaMode === "request";
  const requiresGroup = ctaMode === "group_first";
  const inviteHeroSrc = getArenaAssetSrc("generated/pool-detail-hero.webp");

  return (
    <div className="relative min-h-screen bg-[#050505] text-white">
      {/* Background ambience */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {inviteHeroSrc ? <img src={inviteHeroSrc} alt="" className="absolute inset-0 h-full w-full object-cover opacity-24" loading="eager" decoding="async" /> : null}
        <div className="absolute -top-[200px] -right-[200px] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute -bottom-[200px] -left-[200px] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:flex-row md:items-start md:gap-12 md:py-16">
        {/* LEFT COLUMN — Invite Card */}
        <div className="flex-1">
          {/* Brand badge */}
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">ArenaCopa · Convite</span>
          </div>

          {/* Main card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-3xl md:p-10">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary via-emerald-400 to-primary/50" />

            <div className="flex flex-col items-center text-center">
              <BolaoAvatar
                avatarUrl={bolao.avatar_url}
                alt={bolao.name}
                className="mb-5 inline-flex h-[100px] w-[100px] items-center justify-center rounded-[28px] border border-white/10 bg-white/5 p-3 text-[56px] shadow-lg"
              />

              <h3 className="mb-1 text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                Você foi convidado para
              </h3>
              <h1 className="mb-3 text-3xl font-black tracking-tight text-white md:text-4xl">
                {bolao.name}
              </h1>

              {bolao.description ? (
                <p className="mb-6 max-w-sm text-sm font-medium leading-relaxed text-gray-400">
                  {bolao.description}
                </p>
              ) : null}

              {/* Stats row */}
              <div className="mb-6 flex w-full max-w-xs justify-center gap-4">
                <div className="flex flex-1 flex-col items-center rounded-2xl bg-white/5 py-3">
                  <Users className="mb-1 h-4 w-4 text-gray-400" />
                  <span className="text-lg font-black text-white">{bolao.memberCount}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {bolao.memberCount === 1 ? "participante" : "participantes"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center rounded-2xl bg-white/5 py-3">
                  {requiresApproval ? (
                    <ShieldCheck className="mb-1 h-4 w-4 text-amber-400" />
                  ) : (
                    <LockOpen className="mb-1 h-4 w-4 text-primary" />
                  )}
                  <span className={`text-lg font-black ${requiresApproval ? "text-amber-400" : "text-primary"}`}>
                    {requiresGroup ? "Grupo" : requiresApproval ? "Aprovação" : "Livre"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{tStatic("entrada")}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-8 flex flex-wrap justify-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-300">
                  {isPrivate ? "Privado" : "Público"}
                </span>
                {bolao.is_paid ? (
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Pago
                  </span>
                ) : (
                  <span className="rounded-full bg-primary/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                    Gratuito
                  </span>
                )}
                {requiresGroup && (
                  <span className="rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400">
                    Vinculado a grupo
                  </span>
                )}
              </div>

              {/* CTA */}
              <JoinCTA
                kind="bolao"
                mode={ctaMode}
                targetId={bolao.id}
                inviteCode={inviteCode?.toUpperCase() ?? null}
                requiredGroupInviteCode={bolao.required_group_invite_code ?? null}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-black transition hover:scale-[1.02] active:scale-[0.98]"
                onCompleted={(result) => {
                  if (result.status === "joined" || result.status === "already_member") {
                    navigate(`/boloes/${bolao.id}`);
                  }
                }}
              />

              {/* Contextual helper text — account-aware so users know what the tap does */}
              <p className="mt-4 text-xs font-medium text-gray-500">
                {requiresGroup
                  ? "Você precisa entrar no grupo primeiro para acessar este bolão."
                  : !user
                    ? requiresApproval
                      ? "Crie sua conta grátis (e-mail, Google ou Apple) e enviamos sua solicitação automaticamente."
                      : "Crie sua conta grátis (e-mail, Google ou Apple) e você entra na hora — sem mais etapas."
                    : requiresApproval
                      ? "Sua solicitação será enviada ao criador do bolão para aprovação."
                      : "Entrada imediata. Toque para participar agora."}
              </p>
            </div>
          </div>

          {/* Invite code */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
            <span>{tStatic("Código do convite:")}</span>
            <code className="rounded-lg bg-white/5 px-2 py-1 font-mono text-xs font-bold tracking-widest text-gray-300">
              {inviteCode?.toUpperCase()}
            </code>
          </div>
        </div>

        {/* RIGHT COLUMN — How it works */}
        <div className="w-full md:w-[340px]">
          <div className="sticky top-8">
            <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-gray-400">
              Como funciona
            </h2>

            <div className="flex flex-col gap-4">
              {STEPS.map((step, i) => (
                <div
                  key={i}
                  className="group relative flex gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/20">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        Passo {i + 1}
                      </span>
                    </div>
                    <h3 className="mb-1 text-sm font-bold text-white">{step.title}</h3>
                    <p className="text-xs leading-relaxed text-gray-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust signals */}
            <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">
                Por que usar o ArenaCopa?
              </h3>
              <ul className="flex flex-col gap-3">
                {[
                  "Chutes em todos os jogos da Copa",
                  "Ranking ao vivo com amigos",
                  "Gratuito para bolões entre amigos",
                  "Sem anúncios intrusivos",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                    <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-[10px] text-gray-600">
                Ao entrar, você concorda com os{" "}
                <button
                  onClick={() => navigate("/termos")}
                  className="underline hover:text-gray-400"
                >
                  Termos de Uso
                </button>{" "}
                e{" "}
                <button
                  onClick={() => navigate("/privacidade")}
                  className="underline hover:text-gray-400"
                >
                  Política de Privacidade
                </button>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
