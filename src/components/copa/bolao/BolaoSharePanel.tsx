import { Copy, Link2, MessageCircle, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";

type BolaoSharePanelProps = {
  bolaoName: string;
  inviteCode: string;
  inviteUrl: string;
  shareText: string;
  onNativeShare: () => void | Promise<void>;
};

export function BolaoSharePanel({
  bolaoName,
  inviteCode,
  inviteUrl,
  shareText,
  onNativeShare,
}: BolaoSharePanelProps) {
  const { toast } = useToast();

  const copyInviteUrl = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    toast({ title: "Link copiado" });
  };

  const copyInviteText = async () => {
    await navigator.clipboard.writeText(shareText);
    toast({ title: "Texto do convite copiado" });
  };

  return (
    <div className="space-y-4">
      <ArenaPanel className="p-4 sm:p-5">
        <p className="arena-kicker text-primary">Compartilhar</p>
        <h2 className="mt-2 break-words font-display text-[2.4rem] font-black uppercase leading-[0.92] tracking-[0.02em] text-white">
          Convide sua turma para {bolaoName}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
          Link, código e texto pronto ficam juntos aqui para WhatsApp, QR, cartaz ou divulgação manual.
        </p>
      </ArenaPanel>

      <div className="grid gap-3 md:grid-cols-[0.85fr_1.15fr]">
        <ArenaPanel className="p-4 sm:p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Código do bolão</p>
          <div className="mt-4 rounded-[24px] border border-primary/25 bg-primary/10 p-5 text-center">
            <p className="font-display text-[3.2rem] font-black uppercase tracking-[0.18em] text-primary">
              {inviteCode}
            </p>
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-400">
            Quem já está no app também pode entrar usando só este código.
          </p>
        </ArenaPanel>

        <ArenaPanel className="space-y-3 p-4 sm:p-5">
          <button
            type="button"
            onClick={onNativeShare}
            className="flex w-full items-center gap-4 rounded-[20px] border border-primary/30 bg-primary/10 p-4 text-left transition hover:bg-primary/15"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-primary text-black">
              <Share2 className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-white">Compartilhar agora</span>
              <span className="mt-1 block text-xs leading-5 text-zinc-400">Usa o compartilhamento nativo quando disponível.</span>
            </span>
          </button>

          <button
            type="button"
            onClick={copyInviteText}
            className="flex w-full items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.07]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#25D366] text-white">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-white">Copiar texto para WhatsApp</span>
              <span className="mt-1 block text-xs leading-5 text-zinc-400">Mensagem pronta com link e instruções.</span>
            </span>
          </button>

          <button
            type="button"
            onClick={copyInviteUrl}
            className="flex w-full items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.07]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-blue-500 text-white">
              <Link2 className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-white">Copiar link direto</span>
              <span className="mt-1 block break-all text-xs leading-5 text-zinc-400">{inviteUrl}</span>
            </span>
          </button>
        </ArenaPanel>
      </div>

      <ArenaPanel className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.04] text-zinc-300">
            <Copy className="h-4 w-4" />
          </span>
          <div>
            <p className="font-bold text-white">Materiais de divulgação</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              O botão Compartilhar no topo continua disponível. QR, card e cartaz seguem no fluxo existente de compartilhamento.
            </p>
          </div>
        </div>
      </ArenaPanel>
    </div>
  );
}
