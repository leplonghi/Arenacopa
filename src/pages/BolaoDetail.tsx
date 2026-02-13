import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Share2, Users, Copy, Trophy, MessageCircle, Mail, Link2, X } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface BolaoData {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  creator_id: string;
  created_at: string;
}

interface MemberData {
  user_id: string;
  role: string;
  joined_at: string;
  profile: { name: string; avatar_url: string | null } | null;
}

function ShareSheet({ open, onClose, bolao }: { open: boolean; onClose: () => void; bolao: BolaoData }) {
  const { toast } = useToast();

  const shareText = `🏆 Entre no meu bolão "${bolao.name}" da Copa do Mundo 2026!\n\n📋 Código de convite: ${bolao.invite_code}\n\n⚽ Baixe o ArenaCopa e use o código para participar!`;
  const shareTextEncoded = encodeURIComponent(shareText);

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${shareTextEncoded}`, "_blank");
    onClose();
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`Convite para o bolão "${bolao.name}" - Copa 2026`);
    window.open(`mailto:?subject=${subject}&body=${shareTextEncoded}`, "_blank");
    onClose();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`Código de convite do bolão "${bolao.name}": ${bolao.invite_code}`);
    toast({ title: "Copiado!", description: "Texto de convite copiado para a área de transferência" });
    onClose();
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bolão: ${bolao.name}`,
          text: shareText,
        });
        onClose();
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-card border-t border-border/50 safe-bottom"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            <div className="px-5 pb-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-black">Compartilhar Bolão</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg bg-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Convide amigos para participar do "{bolao.name}"</p>
            </div>

            {/* Invite code preview */}
            <div className="mx-5 mb-4 p-3 rounded-xl bg-secondary/80 border border-border/30">
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary block mb-1">Código de Convite</span>
              <span className="text-xl font-black tracking-[0.3em]">{bolao.invite_code}</span>
            </div>

            {/* Share options */}
            <div className="px-5 pb-6 space-y-2">
              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold block">WhatsApp</span>
                  <span className="text-[10px] text-muted-foreground">Enviar convite via mensagem</span>
                </div>
              </button>

              <button
                onClick={shareEmail}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors border border-border/30"
              >
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-accent-foreground" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold block">E-mail</span>
                  <span className="text-[10px] text-muted-foreground">Enviar convite por e-mail</span>
                </div>
              </button>

              <button
                onClick={copyLink}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors border border-border/30"
              >
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <Link2 className="w-5 h-5 text-accent-foreground" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold block">Copiar Convite</span>
                  <span className="text-[10px] text-muted-foreground">Copiar texto de convite</span>
                </div>
              </button>

              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={nativeShare}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Share2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold block">Mais opções</span>
                    <span className="text-[10px] text-muted-foreground">Compartilhar via outros apps</span>
                  </div>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const BolaoDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [bolao, setBolao] = useState<BolaoData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    loadBolao();
  }, [id, user]);

  const loadBolao = async () => {
    const [bolaoRes, membersRes] = await Promise.all([
      supabase.from("boloes").select("*").eq("id", id!).single(),
      supabase.from("bolao_members").select("user_id, role, joined_at, profiles(name, avatar_url)").eq("bolao_id", id!),
    ]);

    if (bolaoRes.data) setBolao(bolaoRes.data);
    if (membersRes.data) {
      setMembers(membersRes.data.map((m: any) => ({
        ...m,
        profile: m.profiles,
      })));
    }
    setLoading(false);
  };

  const copyInviteCode = () => {
    if (!bolao) return;
    navigator.clipboard.writeText(bolao.invite_code);
    toast({ title: "Código copiado!", description: bolao.invite_code });
  };

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-5">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!bolao) {
    return <EmptyState icon="🔍" title="Bolão não encontrado" description="Este bolão não existe ou foi removido." />;
  }

  const isCreator = bolao.creator_id === user?.id;

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black">{bolao.name}</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span className="w-2 h-2 rounded-full bg-copa-success" />
          <span>Copa do Mundo 2026</span>
          <span>•</span>
          <span>{members.length} Participantes</span>
        </div>
      </div>

      {/* Invite code */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">Código de Convite</span>
            <span className="text-lg font-black tracking-widest">{bolao.invite_code}</span>
          </div>
          <button
            onClick={copyInviteCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-xs font-bold"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="glass-card p-3 text-center">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-1">Membros</span>
          <span className="text-base font-black">{members.length}</span>
        </div>
        <div className="glass-card p-3 text-center">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-1">Seu papel</span>
          <span className="text-base font-black">{isCreator ? "Admin" : "Membro"}</span>
        </div>
      </div>

      {/* Members list */}
      <section>
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Participantes</h3>
        <div className="glass-card overflow-hidden">
          {members.map((m, i) => {
            const name = m.profile?.name || "Usuário";
            const isMe = m.user_id === user?.id;
            const initials = name.slice(0, 2).toUpperCase();
            return (
              <div key={m.user_id} className={cn(
                "flex items-center gap-3 px-4 py-3",
                i < members.length - 1 && "border-b border-border/30",
                isMe && "bg-primary/5"
              )}>
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-black shrink-0">
                  {m.profile?.avatar_url ? (
                    <img src={m.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : initials}
                </div>
                <div className="flex-1">
                  <span className={cn("text-sm font-bold block", isMe && "text-primary")}>
                    {name}{isMe && " (Você)"}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">{m.role}</span>
                </div>
                {m.role === "admin" && <Trophy className="w-4 h-4 text-primary" />}
              </div>
            );
          })}
        </div>
      </section>

      {/* Share button */}
      <button
        onClick={() => setShareOpen(true)}
        className="w-full glass-card-hover p-3 flex items-center justify-center gap-2 text-sm font-bold text-primary"
      >
        <Share2 className="w-4 h-4" />
        Compartilhar Bolão
      </button>

      {/* Share bottom sheet */}
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} bolao={bolao} />
    </div>
  );
};

export default BolaoDetail;
