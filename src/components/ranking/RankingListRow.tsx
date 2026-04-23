import { Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type RankingListEntry = {
  userId: string;
  name: string;
  avatar: string;
  favoriteTeam: string | null;
  points: number;
};

export function RankingListRow({
  row,
  rank,
  level,
  isCurrentUser,
}: {
  row: RankingListEntry;
  rank: number;
  level: number;
  isCurrentUser?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-[24px] border px-4 py-4 transition-colors",
        isCurrentUser
          ? "border-primary/45 bg-[linear-gradient(180deg,rgba(145,255,59,0.12),rgba(145,255,59,0.06))] shadow-[0_0_28px_rgba(145,255,59,0.12)]"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.045]",
      )}
    >
      <div className={cn("w-10 text-center font-display text-[2.2rem] font-semibold leading-none", isCurrentUser ? "text-primary" : "text-zinc-300")}>
        {rank}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className={cn("relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2", isCurrentUser ? "border-primary/35" : "border-white/15")}>
          {row.avatar ? (
            <img src={row.avatar} alt={row.name} className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-xl font-semibold text-white">{row.name.slice(0, 1)}</span>
          )}
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#06170f] bg-[#294421] text-[11px] font-black text-[#b6ff53]">
            {level}
          </span>
        </div>

        <div className="min-w-0">
          <div className={cn("truncate text-[1.35rem] font-black leading-none", isCurrentUser ? "text-[#b6ff53]" : "text-white")}>
            {row.name}
            {isCurrentUser ? " (Você)" : ""}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <span>{row.favoriteTeam ? `Time: ${row.favoriteTeam}` : "Sem time favorito"}</span>
            <span className="hidden text-zinc-600 sm:inline">•</span>
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Nível {level}
            </span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="font-display text-[2.3rem] font-semibold leading-none text-zinc-100">
          {row.points.toLocaleString("pt-BR")}
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500">
          <Sparkles className={cn("h-3.5 w-3.5", isCurrentUser ? "text-primary" : "text-[#7dff48]")} />
          Pontos
        </div>
      </div>
    </div>
  );
}
