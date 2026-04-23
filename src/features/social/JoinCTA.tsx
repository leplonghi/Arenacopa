import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { joinViaInvite, requestBolaoJoin, requestGroupJoin } from "@/services/groups/group-access.service";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";

type JoinCTAMode = "direct" | "request" | "group_first";

type JoinCTAProps = {
  kind: "group" | "bolao";
  mode: JoinCTAMode;
  targetId?: string | null;
  inviteCode?: string | null;
  requiredGroupInviteCode?: string | null;
  className?: string;
  onCompleted?: (result: any) => void;
};

function getRedirectPath(pathname: string, search: string) {
  if (search.includes("action=join")) {
    return `${pathname}${search}`;
  }

  return `${pathname}${search ? `${search}&action=join` : "?action=join"}`;
}

export function JoinCTA({
  kind,
  mode,
  targetId,
  inviteCode,
  requiredGroupInviteCode,
  className,
  onCompleted,
}: JoinCTAProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const label =
    mode === "group_first"
      ? "Entrar no grupo primeiro"
      : mode === "direct"
        ? "Entrar agora"
        : "Solicitar entrada";

  const handleClick = async () => {
    if (mode === "group_first") {
      if (requiredGroupInviteCode) {
        navigate(`/grupos/entrar/${requiredGroupInviteCode}`);
      } else {
        navigate("/grupos");
      }
      return;
    }

    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(getRedirectPath(location.pathname, location.search))}`);
      return;
    }

    try {
      setLoading(true);
      trackSocialEvent("join_cta_viewed", {
        kind,
        mode,
      });
      const result = inviteCode
        ? await joinViaInvite({
            payload: {
              kind,
              invite_code: inviteCode,
            },
          })
        : kind === "group"
          ? await requestGroupJoin({
              payload: {
                group_id: targetId || "",
                origin: "join_cta",
              },
            })
          : await requestBolaoJoin({
              payload: {
                bolao_id: targetId || "",
                origin: "join_cta",
              },
            });

      if (result.status === "joined") {
        trackSocialEvent("join_direct_success", { kind });
        toast({
          title: kind === "group" ? "Você entrou no grupo" : "Você entrou no bolão",
          description: "Seu acesso já está liberado.",
        });
      } else if (result.status === "requested") {
        trackSocialEvent("join_requested", { kind });
        toast({
          title: "Solicitação enviada",
          description: "Agora é só aguardar a aprovação.",
        });
      } else {
        toast({
          title: "Você já faz parte",
          description: kind === "group" ? "Abrindo o grupo." : "Abrindo o bolão.",
        });
      }

      onCompleted?.(result);
    } catch (error) {
      if (error instanceof Error && error.message === "join_requires_group") {
        toast({
          title: "Entrada controlada pelo grupo",
          description: "Você precisa entrar no grupo antes de participar deste bolão.",
        });
        if (requiredGroupInviteCode) {
          navigate(`/grupos/entrar/${requiredGroupInviteCode}`);
        }
        return;
      }

      toast({
        title: "Não foi possível concluir",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={() => void handleClick()}
      disabled={loading}
      className={
        className ||
        "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-xs font-black uppercase tracking-[0.18em] text-black"
      }
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {label}
    </button>
  );
}
