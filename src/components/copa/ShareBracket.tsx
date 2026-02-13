import { useState, useCallback, useRef } from "react";
import { toPng } from "html-to-image";
import { Share2, MessageCircle, Download, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ShareBracketProps {
  bracketRef: React.RefObject<HTMLDivElement>;
}

export function ShareBracket({ bracketRef }: ShareBracketProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!bracketRef.current) return null;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(bracketRef.current, {
        backgroundColor: "#051410",
        pixelRatio: 2,
        cacheBust: true,
      });
      const res = await fetch(dataUrl);
      return await res.blob();
    } catch {
      toast.error("Erro ao gerar imagem do chaveamento");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [bracketRef]);

  const handleDownload = useCallback(async () => {
    const blob = await generateImage();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chaveamento-copa2026.png";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Imagem salva!");
    setIsOpen(false);
  }, [generateImage]);

  const handleNativeShare = useCallback(async () => {
    const blob = await generateImage();
    if (!blob) return;
    const file = new File([blob], "chaveamento-copa2026.png", { type: "image/png" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: "Meu chaveamento – Copa 2026",
          text: "Confira minha simulação do chaveamento da Copa 2026! ⚽🏆",
          files: [file],
        });
        setIsOpen(false);
      } catch (e: any) {
        if (e.name !== "AbortError") toast.error("Erro ao compartilhar");
      }
    } else {
      toast.error("Compartilhamento não suportado neste navegador");
    }
  }, [generateImage]);

  const handleWhatsApp = useCallback(async () => {
    // WhatsApp doesn't support file sharing via URL, so download + open WhatsApp
    const blob = await generateImage();
    if (!blob) return;
    // Download the image first
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chaveamento-copa2026.png";
    a.click();
    URL.revokeObjectURL(url);

    const text = encodeURIComponent("Confira minha simulação do chaveamento da Copa 2026! ⚽🏆");
    window.open(`https://wa.me/?text=${text}`, "_blank");
    toast.success("Imagem baixada! Anexe no WhatsApp");
    setIsOpen(false);
  }, [generateImage]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          isOpen ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        )}
        title="Compartilhar"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-30 glass-card p-3 rounded-xl space-y-2 min-w-[180px] shadow-xl border border-border/40">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Compartilhar</span>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {isGenerating && (
            <div className="flex items-center justify-center py-3 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Gerando imagem...</span>
            </div>
          )}

          <button
            onClick={handleNativeShare}
            disabled={isGenerating}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <Share2 className="w-4 h-4 text-primary" />
            Compartilhar
          </button>

          <button
            onClick={handleWhatsApp}
            disabled={isGenerating}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <MessageCircle className="w-4 h-4 text-copa-green" />
            WhatsApp
          </button>

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-bold hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            Baixar imagem
          </button>
        </div>
      )}
    </div>
  );
}
