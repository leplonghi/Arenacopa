import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { getArenaAssetSrc } from "@/lib/arena-assets";

const fallbackBallImageUrl = "/images/bola-nav-real.png";
const realBallImageUrl = getArenaAssetSrc("bola-nav-fit.png") ?? fallbackBallImageUrl;

export function FabWithPending({
  className,
  isActive,
}: {
  className?: string;
  isActive?: boolean;
}) {
  const { t } = useTranslation("bolao");


  const fabButton = (
    <div className="relative flex h-full flex-col items-center justify-end gap-1 py-2">
      <div
        className={cn(
          "absolute -top-[38px] left-1/2 flex items-center justify-center rounded-full transition-all duration-300 -translate-x-1/2",
          isActive
            ? "shadow-[0_8px_24px_rgba(91,255,66,0.35)]"
            : "shadow-[0_6px_18px_rgba(91,255,66,0.22)]"
        )}
        style={{ width: 90, height: 90 }}
      >
        <div className="absolute inset-0 rounded-full bg-[linear-gradient(160deg,#b8e08a_0%,#2ecc71_48%,#0d4a28_100%)] p-[2.5px] shadow-[inset_0_0_10px_rgba(255,255,255,0.08)]">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#07160d] ring-1 ring-black/55">
            <img
              src={realBallImageUrl}
              alt={t("nav.bolao", { defaultValue: "Bolões" })}
              onError={(event) => {
                event.currentTarget.src = fallbackBallImageUrl;
              }}
              className={cn(
                "block h-full w-full object-cover object-center transition-all duration-300",
                isActive ? "brightness-125 contrast-110" : "brightness-110 contrast-105"
              )}
            />
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.18),transparent_48%)]" />
          </div>
        </div>
      </div>

      <div className="invisible h-12 w-12" />
      <span className={cn(
        "text-[13px] font-medium leading-none tracking-[0.01em] transition-colors",
        isActive ? "text-primary font-semibold" : "text-zinc-400"
      )}>
        {t('nav.bolao', { defaultValue: 'Bolões' })}
      </span>
    </div>
  );

  return (
    <NavLink
      to="/boloes"
      aria-label={t('page.kicker')}
      className={cn(
        "inline-flex h-full items-center justify-center",
        isActive ? "opacity-100" : "opacity-95",
        className
      )}
    >
      {fabButton}
    </NavLink>
  );
}
