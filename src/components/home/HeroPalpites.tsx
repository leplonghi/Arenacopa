import { Link } from "react-router-dom";
import { Crown, Sparkles, Target } from "lucide-react";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";

export function HeroPalpites({
  pendingCount,
  ctaTo,
  isPremium,
  onOpenElite,
}: {
  pendingCount: number;
  ctaTo: string;
  isPremium: boolean;
  onOpenElite: () => void;
}) {
  return (
    <ArenaPanel tone="strong" className="p-5">
      <div className="grid gap-5 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="arena-kicker text-zinc-200">Painel principal</span>
            {!isPremium ? (
              <button
                onClick={onOpenElite}
                className="arena-badge bg-primary/15 border-primary/35 text-primary"
              >
                <Crown className="h-3.5 w-3.5" />
                elite
              </button>
            ) : (
              <span className="arena-badge">
                <Sparkles className="h-3.5 w-3.5" />
                elite ativo
              </span>
            )}
          </div>

          <div className="space-y-1">
            <p className="font-display text-[1.2rem] font-bold uppercase tracking-[0.14em] text-zinc-300">
              Você tem
            </p>
            <div className="flex items-end gap-3">
              <span className="arena-title text-[6.2rem] text-gradient-gold sm:text-[7rem]">
                {pendingCount}
              </span>
              <div className="pb-3">
                <p className="arena-title text-[2.2rem] text-white sm:text-[2.7rem]">palpites</p>
                <p className="arena-title text-[2.2rem] text-primary sm:text-[2.7rem]">pendentes!</p>
              </div>
            </div>
          </div>

          <Link to={ctaTo} className="arena-button-gold w-full sm:w-auto">
            <Target className="h-5 w-5" />
            Palpitar agora
          </Link>
        </div>

        <div className="relative min-h-[220px] overflow-hidden rounded-[28px] border border-primary/20 bg-[linear-gradient(180deg,rgba(8,23,18,0.28),rgba(8,23,18,0.62))]">
          <div className="absolute inset-x-[10%] top-[18%] h-[42%] rounded-[50%] border border-white/[0.08]" />
          <div className="absolute inset-x-[4%] top-[6%] h-[60%] rounded-[50%] border border-white/[0.04]" />
          <div className="absolute right-[5%] top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.95),rgba(255,227,146,0.75)_10%,rgba(255,198,0,0.36)_26%,rgba(255,163,0,0.12)_46%,transparent_72%)] blur-[2px]" />
          <div className="absolute right-[14%] top-1/2 h-32 w-32 -translate-y-1/2 rounded-full border border-primary/30 shadow-[0_0_36px_rgba(255,193,7,0.35)]" />
          <div className="absolute right-[18%] top-1/2 h-24 w-24 -translate-y-1/2 rounded-full border border-white/15 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.95),rgba(216,216,216,0.92)_18%,rgba(30,30,30,0.98)_62%)] shadow-[0_0_28px_rgba(255,193,7,0.25)]">
            <div className="absolute inset-[18%] rounded-full border border-black/50" />
            <div className="absolute inset-[34%] rounded-full border border-black/45" />
          </div>
        </div>
      </div>
    </ArenaPanel>
  );
}
