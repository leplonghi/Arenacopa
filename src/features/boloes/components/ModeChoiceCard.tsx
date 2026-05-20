import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, HelpCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ModeChoiceCardProps {
  title: string;
  description: string;
  tags: string[];
  icon: LucideIcon;
  variant: "traditional" | "business";
  badge?: string;
  tooltipTitle: string;
  tooltipDescription: string;
  onClick: () => void;
  index?: number;
}

const variantConfig = {
  traditional: {
    // Gradients
    cardBg: "bg-gradient-to-br from-[#0c1912] via-[#0a1410] to-[#06120d]",
    cardBgHover: "hover:from-[#112a1c] hover:via-[#0d1f15] hover:to-[#08180f]",
    glowColor: "rgba(34, 197, 94, 0.15)",
    glowHover: "rgba(34, 197, 94, 0.35)",
    // Border
    borderBase: "border-[#22c55e]/10",
    borderHover: "hover:border-[#22c55e]/40",
    // Icon
    iconBg: "bg-gradient-to-br from-[#22c55e]/20 to-[#16a34a]/10",
    iconBorder: "border-[#22c55e]/30",
    iconColor: "text-[#4ade80]",
    iconGlow: "shadow-[0_0_20px_-6px_rgba(34,197,94,0.4)]",
    iconGlowHover: "group-hover:shadow-[0_0_28px_-4px_rgba(34,197,94,0.6)]",
    // Text
    titleColor: "text-white",
    descColor: "text-white/40",
    arrowColor: "text-[#22c55e]",
    // Tags
    tagText: "text-[#4ade80]/80",
    tagBg: "bg-[#22c55e]/8",
    tagBorder: "border-[#22c55e]/15",
    // Badge
    badgeBg: "bg-[#22c55e]/15",
    badgeBorder: "border-[#22c55e]/25",
    badgeText: "text-[#4ade80]",
    // Bottom bar
    accentColor: "bg-[#22c55e]",
    // Pulse
    pulseColor: "bg-[#4ade80]",
  },
  business: {
    // Gradients
    cardBg: "bg-gradient-to-br from-[#1a1508] via-[#141008] to-[#0f0c05]",
    cardBgHover: "hover:from-[#2a1f0a] hover:via-[#1f1708] hover:to-[#151005]",
    glowColor: "rgba(245, 158, 11, 0.15)",
    glowHover: "rgba(245, 158, 11, 0.35)",
    // Border
    borderBase: "border-amber-500/10",
    borderHover: "hover:border-amber-500/40",
    // Icon
    iconBg: "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
    iconBorder: "border-amber-500/30",
    iconColor: "text-amber-400",
    iconGlow: "shadow-[0_0_20px_-6px_rgba(245,158,11,0.4)]",
    iconGlowHover: "group-hover:shadow-[0_0_28px_-4px_rgba(245,158,11,0.6)]",
    // Text
    titleColor: "text-white",
    descColor: "text-white/40",
    arrowColor: "text-amber-400",
    // Tags
    tagText: "text-amber-400/80",
    tagBg: "bg-amber-500/8",
    tagBorder: "border-amber-500/15",
    // Badge
    badgeBg: "bg-amber-500/15",
    badgeBorder: "border-amber-500/25",
    badgeText: "text-amber-400",
    // Bottom bar
    accentColor: "bg-amber-500",
    // Pulse
    pulseColor: "bg-amber-400",
  },
};

export function ModeChoiceCard({
  title,
  description,
  tags,
  icon: Icon,
  variant,
  badge,
  tooltipTitle,
  tooltipDescription,
  onClick,
  index = 0,
}: ModeChoiceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cfg = variantConfig[variant];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.14,
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              "group relative w-full overflow-hidden rounded-[18px] border text-left transition-all duration-500 ease-out",
              "p-3 sm:p-3.5",
              cfg.cardBg,
              cfg.cardBgHover,
              cfg.borderBase,
              cfg.borderHover,
              "active:scale-[0.98]",
              "cursor-pointer"
            )}
            style={{
              boxShadow: isHovered
                ? `0 8px 40px -12px ${cfg.glowHover}, 0 0 0 1px ${cfg.glowColor}, inset 0 1px 0 0 rgba(255,255,255,0.06)`
                : `0 4px 24px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 0 rgba(255,255,255,0.04)`,
            }}
          >
            {/* Background image — right-anchored */}
            <img
              src={variant === "business" ? "/fundo%20bolao%20negocios.png" : "/fundo%20bolao%20pessoal.png"}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 h-full w-[60%] select-none object-cover object-right transition-opacity duration-500"
              style={{ opacity: isHovered ? 0.35 : 0.2 }}
            />
            {/* Gradient mask */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: variant === "business"
                  ? "linear-gradient(to right, #1a1508 42%, #1a150899 68%, transparent)"
                  : "linear-gradient(to right, #0c1912 42%, #0c191299 68%, transparent)",
              }}
            />

            {/* Ambient glow behind icon */}
            <div
              className="absolute top-5 left-5 h-20 w-20 rounded-full blur-[50px] opacity-0 transition-opacity duration-700 pointer-events-none"
              style={{
                background: cfg.glowColor,
                opacity: isHovered ? 0.5 : 0,
              }}
            />

            {/* Top shimmer line */}
            <div
              className="absolute top-0 left-5 right-5 h-px opacity-0 transition-opacity duration-500"
              style={{
                background: `linear-gradient(90deg, transparent, ${variant === "traditional" ? "rgba(74,222,128,0.3)" : "rgba(251,191,36,0.3)"}, transparent)`,
                opacity: isHovered ? 1 : 0,
              }}
            />

            {/* Badge */}
            {badge && (
              <div
                className={cn(
                  "absolute top-4 right-4 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.15em] backdrop-blur-sm",
                  cfg.badgeBg,
                  cfg.badgeBorder,
                  cfg.badgeText
                )}
              >
                {badge}
              </div>
            )}

            {/* Content */}
            <div className="relative z-10 flex items-start gap-4">
              {/* Icon container */}
              <div className="relative flex-shrink-0">
                <motion.div
                  animate={isHovered ? { scale: 1.06 } : { scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={cn(
                    "flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border transition-all duration-500",
                    cfg.iconBg,
                    cfg.iconBorder,
                    cfg.iconGlow,
                    cfg.iconGlowHover
                  )}
                >
                  <Icon className={cn("h-4 w-4", cfg.iconColor)} strokeWidth={1.8} />
                </motion.div>

                {/* Status dot */}
                <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                  <span
                    className={cn(
                      "absolute inline-flex h-full w-full animate-ping rounded-full opacity-40",
                      cfg.pulseColor
                    )}
                  />
                  <span
                    className={cn(
                      "relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-[#061a10]",
                      cfg.pulseColor
                    )}
                  />
                </span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-3">
                  <h3
                    className={cn(
                      "font-display text-sm font-black uppercase tracking-wide",
                      cfg.titleColor
                    )}
                  >
                    {title}
                  </h3>
                  <motion.div
                    animate={isHovered ? { x: 3, opacity: 1 } : { x: 0, opacity: 0.4 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowRight
                      className={cn("h-4 w-4 transition-colors duration-300", cfg.arrowColor)}
                    />
                  </motion.div>
                </div>

                <p className={cn("mt-0.5 text-[11px] leading-snug", cfg.descColor)}>
                  {description}
                </p>

                {/* Tags */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide backdrop-blur-sm transition-all duration-300",
                        cfg.tagText,
                        cfg.tagBg,
                        cfg.tagBorder,
                        "group-hover:brightness-110",
                        "h-5 flex items-center"
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA hint */}
                <motion.div
                  animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
                  transition={{ duration: 0.3 }}
                  className="mt-2 flex items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "text-[11px] font-black uppercase tracking-[0.12em]",
                      cfg.arrowColor
                    )}
                  >
                    {variant === "traditional" ? "Acessar bolões" : "Ir para negócios"}
                  </span>
                  <ArrowRight className={cn("h-3 w-3", cfg.arrowColor)} />
                </motion.div>
              </div>
            </div>

            {/* Bottom accent bar */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isHovered ? 1 : 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={cn("absolute bottom-0 left-0 right-0 h-[2px] origin-left", cfg.accentColor)}
              style={{
                boxShadow: isHovered
                  ? `0 0 12px 1px ${variant === "traditional" ? "rgba(34,197,94,0.5)" : "rgba(245,158,11,0.5)"}`
                  : "none",
              }}
            />
          </motion.button>
        </TooltipTrigger>

        {/* Tooltip */}
        <TooltipContent
          side="top"
          sideOffset={10}
          className={cn(
            "max-w-[270px] border p-3 shadow-2xl backdrop-blur-xl",
            variant === "traditional"
              ? "border-[#22c55e]/20 bg-[#0c1912]/95"
              : "border-amber-500/20 bg-[#1a1508]/95"
          )}
        >
          <div className="flex items-start gap-2.5">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                cfg.iconBg,
                cfg.iconBorder
              )}
            >
              <HelpCircle className={cn("h-3.5 w-3.5", cfg.iconColor)} />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{tooltipTitle}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-white/50">
                {tooltipDescription}
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

