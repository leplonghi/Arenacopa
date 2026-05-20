import { Copy, Image as ImageIcon, Link2, MessageCircle, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";
import { tStatic } from "@/i18n/staticText";

type BolaoSharePanelProps = {
  bolaoName: string;
  inviteCode: string;
  inviteUrl: string;
  shareText: string;
  onNativeShare: () => void | Promise<void>;
  onGenerateVipCard?: () => void;
};

export function BolaoSharePanel({
  bolaoName: _bolaoName,
  inviteCode,
  inviteUrl,
  shareText,
  onNativeShare,
  onGenerateVipCard,
}: BolaoSharePanelProps) {
  const { toast } = useToast();
  const canGenerateVipCard = typeof onGenerateVipCard === "function";

  const copyInviteUrl = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    toast({ title: "Link copiado" });
  };

  const copyInviteText = async () => {
    await navigator.clipboard.writeText(shareText);
    toast({ title: "Texto do convite copiado" });
  };

  return (
    <ArenaPanel className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Invite code — compact */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 mb-1">{tStatic("Código")}</p>
          <p className="font-display text-2xl font-black uppercase tracking-[0.18em] text-primary">{inviteCode}</p>
        </div>

        {/* Action buttons — horizontal row */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onNativeShare}
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-black text-primary transition hover:bg-primary/20"
          >
            <Share2 className="h-4 w-4" />
            {tStatic("Compartilhar")}
          </button>

          <button
            type="button"
            onClick={copyInviteText}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white transition hover:bg-white/10"
          >
            <MessageCircle className="h-4 w-4 text-[#25D366]" />
            {tStatic("WhatsApp")}
          </button>

          <button
            type="button"
            onClick={copyInviteUrl}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white transition hover:bg-white/10"
          >
            <Link2 className="h-4 w-4 text-blue-400" />
            {tStatic("Copiar link")}
          </button>

          {canGenerateVipCard && (
            <button
              type="button"
              onClick={onGenerateVipCard}
              className="flex items-center gap-2 rounded-xl bg-copa-gold px-3 py-2 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-copa-gold/20 transition hover:scale-105 active:scale-95"
            >
              <ImageIcon className="h-4 w-4" />
              {tStatic("Cartão VIP")}
            </button>
          )}

          <button
            type="button"
            onClick={copyInviteUrl}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-zinc-400 transition hover:bg-white/10"
          >
            <Copy className="h-4 w-4" />
            {tStatic("Materiais")}
          </button>
        </div>
      </div>
    </ArenaPanel>
  );
}
