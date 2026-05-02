import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Download, Image as ImageIcon, Loader2, Check } from "lucide-react";
import { toPng } from "html-to-image";
import { motion } from "framer-motion";
import { BolaoShareCard } from "./BolaoShareCard";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BolaoShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bolao: {
    name: string;
    avatar_url?: string | null;
    invite_code: string;
    description?: string | null;
    memberCount: number;
    is_paid?: boolean;
  };
}

export function BolaoShareDialog({ open, onOpenChange, bolao }: BolaoShareDialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      // Small delay to ensure styles are applied
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `ArenaCopa-Invite-${bolao.invite_code}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Imagem baixada!", description: "Agora você pode compartilhar no WhatsApp." });
    } catch (err) {
      console.error("Error generating image:", err);
      toast({ title: "Erro ao gerar imagem", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleShareImage = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `ArenaCopa-${bolao.invite_code}.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Convite para ${bolao.name}`,
          text: `Participe do meu bolão no ArenaCopa! Use o código ${bolao.invite_code}`,
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        // Fallback to download if sharing is not supported
        handleDownload();
      }
    } catch (err) {
      console.error("Error sharing image:", err);
      if (err instanceof Error && err.name !== "AbortError") {
        toast({ title: "Erro ao compartilhar", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[450px] bg-zinc-950 border-white/10 p-0 overflow-hidden rounded-[32px]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-copa-gold" />
            Cartão de Convite VIP
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            Gere uma imagem exclusiva para convidar seus amigos.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2 flex flex-col items-center">
          {/* Card Preview Container - Scale it down for mobile preview */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
            className="relative w-full aspect-[400/600] max-h-[400px] bg-zinc-900 rounded-2xl border border-white/5 overflow-hidden mb-6 flex items-center justify-center"
          >
            <div 
              className="origin-top scale-[0.6] sm:scale-[0.65]"
              style={{ position: "absolute", top: 0 }}
            >
              <BolaoShareCard
                ref={cardRef}
                bolaoName={bolao.name}
                avatarUrl={bolao.avatar_url}
                inviteCode={bolao.invite_code}
                memberCount={bolao.memberCount}
                description={bolao.description}
                isPaid={bolao.is_paid}
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              onClick={handleDownload}
              disabled={loading}
              variant="outline"
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Baixar PNG
            </Button>
            <Button
              onClick={handleShareImage}
              disabled={loading}
              className={cn(
                "h-12 rounded-2xl font-black uppercase tracking-widest gap-2 transition-all",
                success ? "bg-emerald-500 text-white" : "bg-primary text-black hover:scale-[1.02]"
              )}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : success ? (
                <Check className="w-4 h-4" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              {success ? "Enviado!" : "Compartilhar"}
            </Button>
          </div>
          
          <p className="mt-4 text-[10px] text-center text-zinc-500 font-medium uppercase tracking-[0.1em]">
            A imagem VIP pass aumenta em até 3x a taxa de aceitação
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
