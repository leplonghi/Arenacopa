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
    <div className="relative flex h-full flex-col items-center justify-center gap-1 py-2">
      {/* ── Ball container — protrudes upward ── */}
      <div
        className={cn(
          "absolute -top-[24px] left-1/2 flex items-center justify-center rounded-full transition-all duration-300 -translate-x-1/2",
          isActive
            ? "shadow-[0_4px_25px_rgba(34,197,94,0.6)]"
            : "shadow-[0_4px_15px_rgba(34,197,94,0.4)]"
        )}
        style={{ width: 68, height: 68 }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#1A4D2E] via-[#22c55e] to-emerald-400 p-[3px] animate-pulse-slow shadow-lg">
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#07160d]">
            <img
              src={realBallImageUrl}
              alt={t("nav.bolao", { defaultValue: "Bolões" })}
              className={cn(
                "h-full w-full object-cover object-center transition-all duration-300",
                isActive ? "scale-[1.34] brightness-125" : "scale-[1.28] brightness-110"
              )}
            />
            {isActive && <div className="absolute inset-0 bg-white/5 rounded-full" />}
          </div>
        </div>

      </div>

      {/* Spacer to match icon height from other nav items */}
      <div className="invisible h-8 w-8" />

      {/* Navigation Label - Matches Layout.tsx logic exactly */}
      <span className={cn(
        "text-[10px] leading-none transition-colors",
        isActive ? "text-primary font-bold" : "text-muted-foreground font-medium"
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
