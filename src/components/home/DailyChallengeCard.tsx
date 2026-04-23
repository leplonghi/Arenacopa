import { Shield, Sparkles, Target, Trophy } from "lucide-react";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";

export function DailyChallengeCard({
  progress,
  max = 5,
}: {
  progress: number;
  max?: number;
}) {
  return (
    <ArenaPanel className="p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
          <Trophy className="h-7 w-7" />
        </div>
        <div>
          <p className="arena-kicker text-primary">Desafio diário</p>
          <h3 className="font-display text-[1.8rem] font-black uppercase text-white">
            Acerte 5 palpites hoje
          </h3>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="space-y-2 text-sm text-zinc-300">
          <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> XP 150</div>
          <div className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Coins 50</div>
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Gem 1</div>
        </div>
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary/30 text-center">
          <div>
            <p className="font-display text-[2rem] font-black text-white">
              {Math.min(max, progress)}/{max}
            </p>
            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-400">
              acertos
            </p>
          </div>
        </div>
      </div>
    </ArenaPanel>
  );
}
