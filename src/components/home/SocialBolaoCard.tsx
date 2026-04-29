import { Link } from "react-router-dom";
import { MessageCircle, Send, Share2, UsersRound } from "lucide-react";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";

const shareChannels = ["WhatsApp", "Telegram", "TikTok", "Instagram", "Facebook"];

export function SocialBolaoCard() {
  return (
    <ArenaPanel className="p-5">
      <div className="absolute inset-y-0 left-0 w-40 bg-[radial-gradient(circle_at_0%_45%,rgba(255,193,7,0.24),transparent_62%)]" />
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] border border-[#ffc107]/35 bg-[#ffc107]/12 text-[#ffc107] shadow-[0_0_24px_rgba(255,193,7,0.16)]">
            <Share2 className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="arena-kicker text-primary">Compartilhavel</p>
            <h3 className="font-display text-[1.55rem] font-semibold uppercase leading-[0.95] text-white">
              Bolao da turma
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Crie um bolao, gere um link e envie onde sua turma ja conversa.
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

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link to="/boloes/criar" className="arena-button-gold px-3 py-2 text-center text-[1rem]">
            Criar bolao
          </Link>
          <Link to="/grupos" className="arena-button-green px-3 py-2 text-center text-[1rem]">
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
            Ideal para grupos, empresas pequenas e comunidades
          </div>
        </div>
      </div>
    </ArenaPanel>
  );
}
