import { Crown, Medal, ShieldCheck, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type RankingPodiumEntry = {
  userId: string;
  name: string;
  avatar: string;
  points: number;
};

const SLOT_META = {
  0: {
    place: 1,
    icon: Crown,
    shell: "border-primary/45 bg-[radial-gradient(circle_at_top,rgba(255,193,7,0.16),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_34px_90px_-42px_rgba(255,193,7,0.5)]",
    avatar: "border-primary bg-[#0c2517] text-primary shadow-[0_0_44px_rgba(255,193,7,0.26)]",
    number: "text-primary",
    points: "text-primary",
    order: "md:order-2 md:-translate-y-5",
  },
  1: {
    place: 2,
    icon: Trophy,
    shell: "border-emerald-300/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]",
    avatar: "border-emerald-300/25 bg-[#0a1d14] text-white",
    number: "text-[#bff67b]",
    points: "text-zinc-100",
    order: "md:order-1",
  },
  2: {
    place: 3,
    icon: Medal,
    shell: "border-orange-300/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]",
    avatar: "border-orange-300/25 bg-[#15130a] text-white",
    number: "text-[#ffc070]",
    points: "text-zinc-100",
    order: "md:order-3",
  },
} as const;

export function RankingPodium({
  entries,
  currentUserId,
}: {
  entries: RankingPodiumEntry[];
  currentUserId?: string | null;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3 md:items-end">
      {entries.map((entry, index) => {
        const meta = SLOT_META[index as keyof typeof SLOT_META] ?? SLOT_META[2];
        const Icon = meta.icon;
        const isCurrentUser = entry.userId === currentUserId;

        return (
          <article
            key={entry.userId}
            className={cn(
              "relative overflow-hidden rounded-[30px] border p-5 text-center transition-transform duration-300 hover:-translate-y-1",
              meta.shell,
              meta.order,
            )}
          >
            <div className="absolute inset-x-10 top-0 h-28 rounded-full bg-white/10 blur-[80px] opacity-25" />
            <div className="relative">
              <div className={cn("font-display text-[3.2rem] font-semibold leading-none", meta.number)}>
                {meta.place}
              </div>
              <div className="mt-3 flex justify-center">
                <div
                  className={cn(
                    "relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[4px] text-[2rem] font-black uppercase",
                    meta.avatar,
                  )}
                >
                  {entry.avatar ? (
                    <img src={entry.avatar} alt={entry.name} className="h-full w-full object-cover" />
                  ) : (
                    entry.name.slice(0, 1)
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-zinc-300">
                <Icon className={cn("h-4 w-4", meta.number)} />
                <p className="arena-kicker text-zinc-400">
                  {isCurrentUser ? "Você no pódio" : "Líder da rodada"}
                </p>
              </div>

              <h3 className="mt-2 line-clamp-2 font-display text-[2.1rem] font-semibold uppercase leading-[0.92] text-white">
                {entry.name}
              </h3>
              <p className={cn("mt-3 font-display text-[2.8rem] font-semibold leading-none", meta.points)}>
                {entry.points.toLocaleString("pt-BR")}
              </p>
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
                Pontos
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-300">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {meta.place === 1 ? "Topo da temporada" : "Na zona de elite"}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
