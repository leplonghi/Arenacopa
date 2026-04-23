import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2, Target } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { resolvePublicBolaoInvite } from "@/services/public-invite/public-invite.service";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { JoinCTA } from "@/features/social/JoinCTA";
import { joinViaInvite } from "@/services/groups/group-access.service";

type PublicInviteBolao = Awaited<ReturnType<typeof resolvePublicBolaoInvite>>;

export default function PublicInvite() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bolao, setBolao] = useState<PublicInviteBolao>(null);
  const [loading, setLoading] = useState(true);

  const loadBolao = useCallback(async () => {
    if (!inviteCode) {
      setLoading(false);
      return;
    }

    try {
      const resolvedBolao = await resolvePublicBolaoInvite(inviteCode.toUpperCase());

      if (!resolvedBolao) {
        toast({ title: "Bolão não encontrado", variant: "destructive" });
        navigate("/", { replace: true });
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
      console.error(error);
      toast({ title: "Não foi possível carregar o convite", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [inviteCode, navigate, toast, user]);

  useEffect(() => {
    void loadBolao();
  }, [loadBolao]);

  const ctaMode = useMemo(() => {
    if (!bolao) {
      return "request" as const;
    }
    if (bolao.group_binding_mode === "group_gated") {
      return "group_first" as const;
    }
    return bolao.can_join_direct ? ("direct" as const) : ("request" as const);
  }, [bolao]);

  useEffect(() => {
    const autoJoin = async () => {
      if (!user || !bolao || new URLSearchParams(location.search).get("action") !== "join" || !inviteCode) {
        return;
      }

      try {
        const result = await joinViaInvite({
          payload: {
            kind: "bolao",
            invite_code: inviteCode.toUpperCase(),
          },
        });

        if (result.status === "joined" || result.status === "already_member") {
          navigate(`/boloes/${result.bolao_id}`, { replace: true });
          return;
        }

        toast({
          title: "Solicitação enviada",
          description: "Agora é só aguardar a aprovação.",
        });
      } catch (error) {
        if (error instanceof Error && error.message === "join_requires_group" && bolao.required_group_invite_code) {
          navigate(`/grupos/entrar/${bolao.required_group_invite_code}`, { replace: true });
          return;
        }
      }
    };

    void autoJoin();
  }, [bolao, inviteCode, location.search, navigate, toast, user]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#050505]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!bolao) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] p-6">
      <div className="pointer-events-none absolute top-0 right-[-100px] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[150px] opacity-50 mix-blend-screen animate-pulse" />

      <div className="relative z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-[60px] border border-white/10 bg-white/[0.03] p-10 text-center shadow-2xl backdrop-blur-3xl">
          <div className="absolute top-0 left-0 h-[6px] w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

          <BolaoAvatar
            avatarUrl={bolao.avatar_url}
            alt={bolao.name}
            className="mb-6 inline-flex h-[108px] w-[108px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-4 text-[60px]"
          />

          <h3 className="mb-2 text-[12px] font-black uppercase tracking-[0.3em] text-primary">Convite para bolão</h3>
          <h1 className="mb-4 text-4xl font-black tracking-tighter text-white">{bolao.name}</h1>
          {bolao.description ? <p className="mb-8 px-4 text-sm font-medium text-gray-400">{bolao.description}</p> : null}

          <div className="mb-8 flex justify-center gap-6">
            <div className="text-center">
              <span className="block text-2xl font-black text-white">{bolao.memberCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">participantes</span>
            </div>
            <div className="w-[1px] bg-white/10" />
            <div className="text-center">
              <span className="block text-2xl font-black uppercase text-white">
                {ctaMode === "group_first" ? "Grupo" : ctaMode === "direct" ? "Direta" : "Aprovação"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">entrada</span>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap justify-center gap-2 text-[11px] font-black uppercase tracking-[0.14em]">
            <span className="rounded-full bg-white/10 px-3 py-1">{bolao.category === "public" ? "Público" : "Privado"}</span>
            {bolao.is_paid ? <span className="rounded-full bg-white/10 px-3 py-1">Pago</span> : null}
            {bolao.group_binding_mode === "group_gated" ? <span className="rounded-full bg-white/10 px-3 py-1">Vinculado ao grupo</span> : null}
          </div>

          <JoinCTA
            kind="bolao"
            mode={ctaMode}
            targetId={bolao.id}
            inviteCode={inviteCode?.toUpperCase() ?? null}
            requiredGroupInviteCode={bolao.required_group_invite_code ?? null}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-5 text-xs font-black uppercase tracking-widest text-black transition hover:scale-105"
            onCompleted={(result) => {
              if (result.status === "joined" || result.status === "already_member") {
                navigate(`/boloes/${bolao.id}`);
              }
            }}
          />

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-gray-500">
            <Target className="h-4 w-4" />
            {ctaMode === "group_first"
              ? "Esse bolão exige entrada prévia no grupo."
              : ctaMode === "direct"
                ? "Entrada liberada enquanto o bolão estiver aberto."
                : "Sua solicitação vai para aprovação do criador."}
          </div>
        </div>
      </div>
    </div>
  );
}
