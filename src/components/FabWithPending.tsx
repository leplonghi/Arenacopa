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
            ? "shadow-[0_12px_42px_rgba(91,255,66,0.68)]"
            : "shadow-[0_12px_34px_rgba(91,255,66,0.46)]"
        )}
        style={{ width: 90, height: 90 }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.42),transparent_21%),linear-gradient(160deg,#dcff63_0%,#19ea58_48%,#0b381f_100%)] p-[3px] shadow-[inset_0_0_16px_rgba(255,255,255,0.16),0_0_24px_rgba(79,255,74,0.26)]">
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
        "font-display text-[15px] leading-none tracking-[0.01em] transition-colors",
        isActive ? "text-primary font-black" : "font-semibold text-zinc-300"
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
