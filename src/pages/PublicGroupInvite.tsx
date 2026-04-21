import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Loader2, Users2 } from "lucide-react";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { resolvePublicGroupInvite } from "@/services/public-invite/public-invite.service";

type PublicInviteGroup = {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  category: string | null;
  memberCount: number;
};

export default function PublicGroupInvite() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation("bolao");

  const [grupo, setGrupo] = useState<PublicInviteGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const accessLabel =
    grupo?.category === "public"
      ? t("grupos.public_title", { defaultValue: "Público" })
      : grupo?.category === "private"
        ? t("grupos.private_title", { defaultValue: "Privado" })
        : t("invite.access_open", { defaultValue: "Aberto" });

  const loadGroup = useCallback(async () => {
    if (!inviteCode) {
      setLoading(false);
      return;
    }

    try {
      const normalizedInviteCode = inviteCode.toUpperCase();
      const resolvedGroup = await resolvePublicGroupInvite(normalizedInviteCode);

      if (!resolvedGroup) {
        toast({
          title: t("grupos.invalid_code", { defaultValue: "Código inválido" }),
          description: t("grupos.invalid_code_desc", { defaultValue: "Verifique e tente novamente." }),
          variant: "destructive",
        });
        navigate("/grupos", { replace: true });
        return;
      }

      const membershipRef = user ? doc(db, "grupo_members", `${user.id}_${resolvedGroup.id}`) : null;
      const existingMembership = membershipRef ? await getDoc(membershipRef) : null;

      if (existingMembership?.exists()) {
        navigate(`/grupos/${resolvedGroup.id}`, { replace: true });
        return;
      }

      setGrupo(resolvedGroup);
    } catch (error) {
      console.error("Error loading group invite:", error);
      toast({
        title: t("grupos.invalid_code", { defaultValue: "Código inválido" }),
        description: t("grupos.invalid_code_desc", { defaultValue: "Verifique e tente novamente." }),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [inviteCode, navigate, t, toast, user]);

  useEffect(() => {
    void loadGroup();
  }, [loadGroup]);

  const handleJoin = useCallback(async () => {
    if (!grupo) return;

    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/grupos/entrar/${inviteCode}?action=join`)}`);
      return;
    }

    try {
      const memberId = `${user.id}_${grupo.id}`;
      await setDoc(doc(db, "grupo_members", memberId), {
        grupo_id: grupo.id,
        user_id: user.id,
        role: "member",
        invite_code: inviteCode?.toUpperCase() ?? null,
        joined_at: new Date().toISOString(),
      });

      toast({
        title: t("grupos.joined", { defaultValue: "Entrou no grupo!" }),
        className: "bg-emerald-500 text-white",
      });
      navigate(`/grupos/${grupo.id}`);
    } catch (error) {
      console.error("Error joining group:", error);
      toast({
        title: t("grupos.join_error", { defaultValue: "Erro ao entrar no grupo" }),
        variant: "destructive",
      });
    }
  }, [grupo, inviteCode, navigate, t, toast, user]);

  useEffect(() => {
    const action = new URLSearchParams(location.search).get("action");
    if (user && grupo && action === "join") {
      void handleJoin();
    }
  }, [grupo, handleJoin, location.search, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!grupo) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] p-6">
      <div className="pointer-events-none absolute top-0 right-[-100px] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[150px] opacity-50 mix-blend-screen animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-[60px] border border-white/10 bg-white/[0.03] p-10 text-center shadow-2xl backdrop-blur-3xl">
          <div className="absolute top-0 left-0 h-[6px] w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="mb-6 inline-flex h-[108px] w-[108px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-[60px]">
            {grupo.emoji}
          </div>
          <h3 className="mb-2 text-[12px] font-black uppercase tracking-[0.3em] text-primary">
            {t("grupos.kicker", { defaultValue: "Comunidade" })}
          </h3>
          <h1 className="mb-4 text-4xl font-black tracking-tighter text-white">{grupo.name}</h1>
          {grupo.description ? (
            <p className="mb-8 px-4 text-sm font-medium text-gray-400">{grupo.description}</p>
          ) : null}

          <div className="mb-8 flex justify-center gap-6">
            <div className="text-center">
              <span className="block text-2xl font-black text-white">{grupo.memberCount}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {t("grupos.members_count", { count: grupo.memberCount, defaultValue: "membros" })}
              </span>
            </div>
            <div className="w-[1px] bg-white/10" />
            <div className="text-center">
              <span className="block text-2xl font-black uppercase text-white">
                {accessLabel}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {t("invite.access_label", { defaultValue: "Acesso" })}
              </span>
            </div>
          </div>

          <button
            onClick={() => void handleJoin()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-5 text-xs font-black uppercase tracking-widest text-black transition hover:scale-105"
          >
            <Users2 className="h-5 w-5" />
            {t("grupos.join_action", { defaultValue: "Entrar" })}
          </button>

          {!user ? (
            <p className="mt-6 text-xs font-medium text-gray-500">
              {t("invite.login_hint", { defaultValue: "Faça login ou instale o app para participar gratuitamente." })}
            </p>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
