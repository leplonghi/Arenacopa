import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, ListChecks, Ticket, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { joinViaInvite } from "@/services/groups/group-access.service";
import { invalidateBolaoListingCache } from "@/services/boloes/bolao-listing.service";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import { cn } from "@/lib/utils";

/**
 * Action sheet triggered by the central Bolão FAB.
 * Resolves the FAB affordance mismatch: a prominent center button should
 * launch an action, not silently navigate to a list. Surfaces the three
 * highest-intent actions: create, join-by-code, and view my pools.
 */
export function BolaoFabSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 6) return;
    try {
      setJoining(true);
      trackSocialEvent("join_cta_viewed", { source: "fab_sheet" });
      const result = await joinViaInvite({ payload: { kind: "bolao", invite_code: code } });
      invalidateBolaoListingCache(user?.id);
      if (result.status === "joined" || result.status === "already_member") {
        trackSocialEvent("join_direct_success", { kind: "bolao" });
        const bolaoId = "bolao_id" in result ? result.bolao_id : null;
        setOpen(false);
        setJoinCode("");
        if (bolaoId) navigate(`/boloes/${bolaoId}`);
        return;
      }
      trackSocialEvent("join_requested", { kind: "bolao" });
      toast({ title: "Solicitação enviada", description: "Aguarde a aprovação do criador." });
      setOpen(false);
      setJoinCode("");
    } catch (error) {
      toast({
        title: "Não foi possível entrar",
        description:
          error instanceof Error && error.message === "join_requires_group"
            ? "Esse bolão exige entrada prévia no grupo vinculado."
            : "Revise o código e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="bg-[#03100a] border-t border-white/10 p-0 rounded-t-[28px] pb-[calc(1.5rem+var(--safe-area-bottom,0px))]"
      >
        <SheetHeader className="px-6 pb-1 pt-5 text-left">
          <SheetTitle className="font-display text-2xl font-black uppercase tracking-tight">
            Bolões
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3 px-6 pt-3">
          {/* Primary action — create */}
          <button
            onClick={() => go("/boloes/criar?mode=traditional")}
            className="group flex w-full items-center gap-4 rounded-[20px] border border-primary/40 bg-primary/[0.1] p-4 text-left transition hover:bg-primary/[0.16]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] border border-primary/30 bg-primary/15">
              <Plus className="h-6 w-6 text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black text-white">Criar bolão</span>
              <span className="block text-[11px] text-zinc-400">Monte uma liga para sua turma</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-primary transition group-hover:translate-x-1" />
          </button>

          {/* Join by code — inline */}
          <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2.5">
              <Ticket className="h-4 w-4 shrink-0 text-zinc-400" />
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-300">
                Entrar por código
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") void handleJoin(); }}
                placeholder="CÓDIGO"
                maxLength={8}
                inputMode="text"
                autoCapitalize="characters"
                className="min-w-0 flex-1 rounded-[14px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white placeholder:text-zinc-600 outline-none focus:border-primary/50"
              />
              <button
                onClick={() => void handleJoin()}
                disabled={joining || joinCode.trim().length < 6}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-1.5 rounded-[14px] bg-primary px-4 text-[11px] font-black uppercase tracking-wider text-black transition hover:brightness-110 disabled:opacity-40"
                )}
              >
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          </div>

          {/* Secondary — view my pools */}
          <button
            onClick={() => go("/boloes")}
            className="group flex w-full items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.02] p-4 text-left transition hover:bg-white/[0.05]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] border border-white/10 bg-white/5">
              <ListChecks className="h-6 w-6 text-zinc-300" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-black text-white">Meus bolões</span>
              <span className="block text-[11px] text-zinc-400">Ver e gerenciar suas ligas</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-zinc-500 transition group-hover:translate-x-1" />
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
