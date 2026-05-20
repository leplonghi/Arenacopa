import { Link } from "react-router-dom";
import { MessageCircle, Send, Share2, UsersRound } from "lucide-react";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";
import { tStatic } from "@/i18n/staticText";

const shareChannels = ["WhatsApp", "Telegram", "TikTok", "Instagram", "Facebook"];

export function SocialBolaoCard() {
  return (
    <ArenaPanel className="p-4">
      <div className="absolute inset-y-0 left-0 w-40 bg-[radial-gradient(circle_at_0%_45%,rgba(255,193,7,0.24),transparent_62%)]" />
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[#ffc107]/35 bg-[#ffc107]/12 text-[#ffc107] shadow-[0_0_24px_rgba(255,193,7,0.16)]">
            <Share2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="arena-kicker text-primary">{tStatic("Compartilhável")}</p>
            <h3 className="font-display text-lg font-semibold uppercase leading-[0.95] text-white">
              Bolão da turma
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-zinc-300">
              Crie um bolão, gere um link e envie onde sua turma já conversa.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {shareChannels.map((channel) => (
            <span
              key={channel}
              className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-zinc-300"
            >
              {channel}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link to="/boloes/criar" className="arena-button-gold px-3 py-2 text-center text-sm">
            Criar bolão
          </Link>
          <Link to="/grupos" className="arena-button-green px-3 py-2 text-center text-sm">
            Ver grupos
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-primary" />
            Turma, equipe e comunidade
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            Link simples
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Ideal para grupos, empresas pequenas e turmas recorrentes
          </div>
        </div>
      </div>
    </ArenaPanel>
  );
}
