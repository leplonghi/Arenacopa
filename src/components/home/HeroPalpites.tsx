import { Link } from "react-router-dom";
import { Crown, Sparkles, Target } from "lucide-react";
import { getArenaAssetSrc } from "@/lib/arena-assets";

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
  const headerBgSrc = getArenaAssetSrc("fundo-hero.png");

  return (
    <section
      className="relative -mx-4 -mt-[calc(4.6rem+var(--safe-area-top,0px))] min-h-[430px] overflow-hidden bg-[#020806] px-5 sm:-mx-6 sm:min-h-[500px] sm:px-8 lg:rounded-b-[36px]"
      style={{
        backgroundImage: headerBgSrc
          ? `linear-gradient(90deg, rgba(1,7,5,0.96) 0%, rgba(1,7,5,0.78) 43%, rgba(1,7,5,0.18) 100%), linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,8,6,0.1) 52%, rgba(0,0,0,0.78) 100%), url(${headerBgSrc})`
          : undefined,
        backgroundPosition: "right center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.72))]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(0,0,0,0.38),transparent)]" />

      <div className="relative z-10 flex min-h-[430px] max-w-[560px] flex-col justify-start pb-7 pt-[calc(7rem+var(--safe-area-top,0px))] sm:min-h-[500px] sm:pt-[calc(8rem+var(--safe-area-top,0px))]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="arena-kicker text-zinc-300">Rodada</span>
            {!isPremium ? (
              <button
                onClick={onOpenElite}
                className="arena-badge bg-primary/15 border-primary/35 text-primary"
              >
                <Crown className="h-3.5 w-3.5" />
                pro
              </button>
            ) : (
              <span className="arena-badge">
                <Sparkles className="h-3.5 w-3.5" />
                pro ativo
              </span>
            )}
          </div>

          <div>
            <div className="flex items-end gap-3 sm:gap-5">
              <span className="arena-title text-[4rem] font-bold text-white sm:text-[5rem]">
                {pendingCount}
              </span>
              <div className="pb-4">
                <p className="text-xl font-semibold text-zinc-300 sm:text-2xl">jogos pendentes</p>
                <p className="text-xl font-semibold text-primary sm:text-2xl">na rodada</p>
              </div>
            </div>
            <p className="max-w-[300px] text-sm font-medium leading-5 text-zinc-300 sm:max-w-[360px]">
              Resolva a rodada e acompanhe tudo com a sua turma.
            </p>
          </div>

          <Link to={ctaTo} className="inline-flex items-center justify-center gap-3 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-black transition hover:bg-primary/90 sm:w-auto">
            <Target className="h-7 w-7" />
            Ver jogos
          </Link>
        </div>
      </div>
    </section>
  );
}
