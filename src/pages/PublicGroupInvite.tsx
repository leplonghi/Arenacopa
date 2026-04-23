import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2, Users2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { resolvePublicGroupInvite } from "@/services/public-invite/public-invite.service";
import { JoinCTA } from "@/features/social/JoinCTA";
import { joinViaInvite } from "@/services/groups/group-access.service";

type PublicInviteGroup = Awaited<ReturnType<typeof resolvePublicGroupInvite>>;

export default function PublicGroupInvite() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [grupo, setGrupo] = useState<PublicInviteGroup>(null);
  const [loading, setLoading] = useState(true);

  const loadGroup = useCallback(async () => {
    if (!inviteCode) {
      setLoading(false);
      return;
    }

    try {
      const resolvedGroup = await resolvePublicGroupInvite(inviteCode.toUpperCase());

      if (!resolvedGroup) {
        toast({ title: "Grupo não encontrado", variant: "destructive" });
        navigate("/grupos", { replace: true });
        return;
      }

      if (user) {
        const membershipRef = doc(db, "grupo_members", `${user.id}_${resolvedGroup.id}`);
        const existingMembership = await getDoc(membershipRef);
        if (existingMembership.exists() && (existingMembership.data().membership_status || "active") === "active") {
          navigate(`/grupos/${resolvedGroup.id}`, { replace: true });
          return;
        }
      }

      setGrupo(resolvedGroup);
    } catch (error) {
      console.error(error);
      toast({ title: "Não foi possível carregar o convite", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [inviteCode, navigate, toast, user]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  const ctaMode = useMemo(() => {
    if (!grupo) {
      return "request" as const;
    }
    return grupo.can_join_direct ? ("direct" as const) : ("request" as const);
  }, [grupo]);

  useEffect(() => {
    const autoJoin = async () => {
      if (!user || !grupo || new URLSearchParams(location.search).get("action") !== "join" || !inviteCode) {
        return;
      }

      try {
        const result = await joinViaInvite({
          payload: {
            kind: "group",
            invite_code: inviteCode.toUpperCase(),
          },
        });

        if (result.status === "joined" || result.status === "already_member") {
          navigate(`/grupos/${result.group_id}`, { replace: true });
          return;
        }

        toast({
          title: "Solicitação enviada",
          description: "Agora é só aguardar a aprovação.",
        });
      } catch {
        toast({
          title: "Não foi possível concluir",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      }
    };

    void autoJoin();
  }, [grupo, inviteCode, location.search, navigate, toast, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!grupo) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] p-6">
      <div className="pointer-events-none absolute top-0 right-[-100px] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[150px] opacity-50 mix-blend-screen animate-pulse" />

      <div className="relative z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-[60px] border border-white/10 bg-white/[0.03] p-10 text-center shadow-2xl backdrop-blur-3xl">
          <div className="absolute top-0 left-0 h-[6px] w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="mb-6 inline-flex h-[108px] w-[108px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-[60px]">
            {grupo.emoji}
          </div>
          <h3 className="mb-2 text-[12px] font-black uppercase tracking-[0.3em] text-primary">Convite para grupo</h3>
          <h1 className="mb-4 text-4xl font-black tracking-tighter text-white">{grupo.name}</h1>
          {grupo.description ? <p className="mb-8 px-4 text-sm font-medium text-gray-400">{grupo.description}</p> : null}

          <div className="mb-8 flex justify-center gap-6">
            <div className="text-center">
              <span className="block text-2xl font-black text-white">{grupo.memberCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">membros</span>
            </div>
            <div className="w-[1px] bg-white/10" />
            <div className="text-center">
              <span className="block text-2xl font-black uppercase text-white">
                {ctaMode === "direct" ? "Direta" : "Aprovação"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">entrada</span>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap justify-center gap-2 text-[11px] font-black uppercase tracking-[0.14em]">
            <span className="rounded-full bg-white/10 px-3 py-1">{grupo.visibility === "public" ? "Público" : "Privado"}</span>
          </div>

          <JoinCTA
            kind="group"
            mode={ctaMode}
            targetId={grupo.id}
            inviteCode={inviteCode?.toUpperCase() ?? null}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-5 text-xs font-black uppercase tracking-widest text-black transition hover:scale-105"
            onCompleted={(result) => {
              if (result.status === "joined" || result.status === "already_member") {
                navigate(`/grupos/${grupo.id}`);
              }
            }}
          />

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-gray-500">
            <Users2 className="h-4 w-4" />
            {ctaMode === "direct"
              ? "Entrada liberada por link ou código."
              : "Sua entrada depende de aprovação do grupo."}
          </div>
        </div>
      </div>
    </div>
  );
}
