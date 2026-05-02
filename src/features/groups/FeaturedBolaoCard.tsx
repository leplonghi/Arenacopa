import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { BolaoAvatar } from "@/components/BolaoAvatar";

type FeaturedBolaoCardProps = {
  bolao: {
    id: string;
    name: string;
    description?: string | null;
    avatar_url?: string | null;
    category?: string | null;
    is_paid?: boolean;
  } | null;
};

export function FeaturedBolaoCard({ bolao }: FeaturedBolaoCardProps) {
  if (!bolao) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 text-white">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Bolão em destaque</p>
        <p className="mt-3 text-lg font-black">Este grupo ainda não tem um bolão principal.</p>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
          Crie ou destaque um bolão ativo para deixar a entrada mais clara para todo mundo.
        </p>
      </div>
    );
  }

  const bgImage = bolao.is_paid
    ? "/fundo%20bolao%20negocios.png"
    : "/fundo%20bolao%20pessoal.png";

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-primary/20 bg-primary/10 p-5 text-white">
      {/* Background image — right-anchored */}
      <img
        src={bgImage}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[55%] select-none object-cover object-right"
        style={{ opacity: bolao.is_paid ? 0.25 : 0.2 }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: bolao.is_paid
            ? "linear-gradient(to right, #0c0800 40%, #0c080099 65%, transparent)"
            : "linear-gradient(to right, #081408 40%, #08140899 65%, transparent)",
        }}
      />

      <div className="relative z-10">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Bolão em destaque</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <BolaoAvatar
            avatarUrl={bolao.avatar_url ?? null}
            fallback="⚽"
            alt={bolao.name}
            className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-black/20 text-3xl"
          />
          <div className="flex-1">
            <p className="truncate text-2xl font-black">{bolao.name}</p>
            {bolao.description ? <p className="mt-1 line-clamp-2 text-sm text-zinc-200">{bolao.description}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.16em]">
              <span className="rounded-full bg-black/20 px-3 py-1">{bolao.category === "public" ? "Público" : "Privado"}</span>
              {bolao.is_paid ? <span className="rounded-full bg-black/20 px-3 py-1">Pago</span> : null}
            </div>
          </div>
          <Link
            to={`/boloes/${bolao.id}`}
            className="inline-flex items-center gap-2 rounded-2xl bg-black/80 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white"
          >
            <Trophy className="h-4 w-4 text-primary" />
            Abrir bolão
          </Link>
        </div>
      </div>
    </div>
  );
}
