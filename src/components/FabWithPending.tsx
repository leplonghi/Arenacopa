import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const realBallImageUrl = "/images/bola-nav-real.png";

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
          "absolute -top-[32px] left-1/2 flex items-center justify-center rounded-full transition-all duration-300 -translate-x-1/2",
          isActive
            ? "shadow-[0_10px_34px_rgba(91,255,66,0.58)]"
            : "shadow-[0_10px_24px_rgba(91,255,66,0.38)]"
        )}
        style={{ width: 82, height: 82 }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_22%),linear-gradient(160deg,#cbff44_0%,#00d84d_48%,#0b381f_100%)] p-[3px] shadow-lg">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#07160d]">
            <img
              src={realBallImageUrl}
              alt={t("nav.bolao", { defaultValue: "Bolões" })}
              className={cn(
                "h-full w-full object-cover object-center transition-all duration-300",
                isActive ? "scale-[1.24] brightness-125" : "scale-[1.18] brightness-110"
              )}
            />
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.18),transparent_48%)]" />
          </div>
        </div>
      </div>

      <div className="invisible h-10 w-10" />
      <span className={cn(
        "font-display text-[13px] leading-none transition-colors",
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
