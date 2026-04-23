import { Gift, Star } from "lucide-react";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";

export function RewardProgressCard({
  current,
  target,
  rewardLabel,
  rewardValue,
}: {
  current: number;
  target: number;
  rewardLabel: string;
  rewardValue: string;
}) {
  const progress = Math.max(12, Math.min(100, (current / target) * 100));

  return (
    <ArenaPanel className="p-5">
      <p className="arena-kicker text-primary">Próxima recompensa</p>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-primary/20 bg-primary/10 text-primary shadow-[0_0_24px_rgba(145,255,59,0.12)]">
          <Gift className="h-8 w-8" />
        </div>
        <div className="min-w-0">
          <p className="font-display text-[1.8rem] font-semibold uppercase leading-none text-white">
            {rewardLabel}
          </p>
          <p className="mt-1 flex items-center gap-2 text-lg font-bold text-zinc-300">
            <Star className="h-4 w-4 text-primary" />
            {rewardValue}
          </p>
        </div>
      </div>

      <div className="arena-progress mt-5">
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-right text-sm font-black text-zinc-400">
        {current.toLocaleString("pt-BR")} / {target.toLocaleString("pt-BR")}
      </p>
    </ArenaPanel>
  );
}
