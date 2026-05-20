import { useState } from "react";
import { Loader2, Users } from "lucide-react";
import { createGroup } from "@/services/groups/group-access.service";
import { useToast } from "@/hooks/use-toast";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CreateGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (groupId: string) => void;
};

export function CreateGroupDialog({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const [visibility, setVisibility] = useState<"private" | "public">("private");

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Dê um nome para o seu grupo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      trackSocialEvent("group_create_started", {
        source: "dialog_quick_create",
        visibility,
      });

      const group = await createGroup({
        payload: {
          presentation: {
            name: name.trim(),
            description: description.trim(),
            emoji,
            objective: visibility === "private" ? "friends" : "community",
          },
          visibility,
          admission_mode: visibility === "private" ? "approval" : "direct_code_or_invite",
        },
      });

      toast({
        title: "Grupo criado com sucesso!",
        description: `Código: ${group.inviteCode}`,
      });

      trackSocialEvent("group_create_completed", {
        source: "dialog_quick_create",
        visibility,
      });

      onSuccess?.(group.id);
      onOpenChange(false);
      // Reset form
      setName("");
      setDescription("");
      setEmoji("👥");
    } catch (error) {
      toast({
        title: "Erro ao criar grupo",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-zinc-950 p-0 overflow-hidden sm:max-w-[400px]">
        <div className="relative h-24 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
          <div className="absolute -bottom-6 left-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900 text-3xl shadow-2xl">
            {emoji}
          </div>
        </div>

        <div className="px-6 pb-6 pt-10">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-xl font-black uppercase tracking-tight text-white">
              Novo Grupo
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Crie um espaço para centralizar seus bolões.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Emoji</label>
              <div className="flex flex-wrap gap-2">
                {["👥", "⚽", "🏆", "🔥", "🎯", "🎉"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setEmoji(val)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition-all",
                      emoji === val ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:bg-white/10"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nome do Grupo</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Galera do Futebol"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white placeholder:text-zinc-600 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setVisibility("private")}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                  visibility === "private" ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"
                )}
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-white">Privado</span>
                <span className="text-[9px] text-zinc-500">Com aprovação</span>
              </button>
              <button
                onClick={() => setVisibility("public")}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                  visibility === "public" ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"
                )}
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-white">Público</span>
                <span className="text-[9px] text-zinc-500">Com código</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[12px] font-black uppercase tracking-widest text-black shadow-[0_0_20px_rgba(145,255,59,0.3)] transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            Criar agora
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
