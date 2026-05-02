import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Trophy, Lock, Globe, Zap, Star, Users } from "lucide-react";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import type { BolaoListingCard } from "@/services/boloes/bolao-listing.service";

type BolaoCardVariant = "my" | "discover";

type BolaoCardProps = {
  bolao: BolaoListingCard;
  variant?: BolaoCardVariant;
};

function getStatusConfig(status: string) {
  switch (status) {
    case "active":
    case "open":
    case "published":
    case "live":
      return { 
        key: "active",
        color: "#91FF3B", 
        dot: "bg-[#91FF3B] shadow-[0_0_8px_rgba(145,255,59,0.8)]",
        pulse: true 
      };
    case "draft":
      return { key: "draft", color: "#FFC54D", dot: "bg-[#FFC54D]", pulse: false };
    case "finished":
      return { key: "finished", color: "#6b7280", dot: "bg-zinc-500", pulse: false };
    case "archived":
      return { key: "archived", color: "#6b7280", dot: "bg-zinc-600", pulse: false };
    case "deleted":
      return { key: "deleted", color: "#ef4444", dot: "bg-red-500", pulse: false };
    default:
      return { key: status, color: "#9ca3af", dot: "bg-zinc-600", pulse: false };
  }
}

export function BolaoCard({ bolao, variant = "my" }: BolaoCardProps) {
  const { t } = useTranslation("bolao");
  const statusCfg = getStatusConfig(bolao.status);
  const isActive = ["active", "open", "published", "live"].includes(bolao.status);

  const bgImage = bolao.is_paid
    ? "/fundo%20bolao%20negocios.png"
    : "/fundo%20bolao%20pessoal.png";

  const cardContent = (
    <div className="relative z-10">
      {/* Status LED bar at top with enhanced glow */}
      <div
        className="absolute inset-x-0 -top-4 h-[3px] rounded-t-[20px] transition-all duration-500 group-hover:opacity-100 opacity-60"
        style={{ 
          background: isActive 
            ? `linear-gradient(90deg, transparent, ${statusCfg.color}, transparent)` 
            : "transparent",
          boxShadow: isActive ? `0 0 15px ${statusCfg.color}40` : "none"
        }}
      />

      {/* Main content */}
      <div className="flex items-start gap-4">
        {/* Avatar with advanced glow ring */}
        <div className="relative shrink-0">
          <div className={`absolute -inset-1 rounded-[20px] bg-gradient-to-br from-white/10 to-transparent transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`} />
          <BolaoAvatar
            avatarUrl={bolao.avatar_url}
            fallback="⚽"
            alt={bolao.name}
            className="relative flex h-16 w-16 items-center justify-center rounded-[18px] border border-white/10 bg-[#0c1a11]/80 text-3xl shadow-inner backdrop-blur-sm transition-transform duration-300 group-hover:scale-105"
          />
          {statusCfg.pulse && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#91FF3B] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#91FF3B] border-2 border-[#08140d]"></span>
            </span>
          )}
        </div>

        {/* Name + description */}
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-2">
            <p className="break-words text-base font-semibold leading-tight text-white group-hover:text-primary transition-colors duration-200">
              {bolao.name}
            </p>
          </div>
          
          {bolao.description && (
            <p className="mt-1.5 line-clamp-1 text-xs font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors duration-200">
              {bolao.description}
            </p>
          )}

          {/* Badges row with modern pill styles */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Status pill */}
            <span 
              className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1 text-[9px] font-black uppercase tracking-wider transition-colors duration-300 group-hover:bg-white/10" 
              style={{ color: statusCfg.color }}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot} shrink-0`} />
              {t(`status.${statusCfg.key}`, { defaultValue: statusCfg.key })}
            </span>

            {/* Member count pill */}
            <span className="flex items-center gap-1 rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-400 group-hover:text-zinc-200 group-hover:bg-white/10 transition-all">
              <Users className="h-3 w-3" />
              {bolao.member_count}
            </span>

            {/* Privacy pill */}
            <span className="flex items-center gap-1 rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-400 group-hover:text-zinc-200 group-hover:bg-white/10 transition-all">
              {bolao.category === "public"
                ? <><Globe className="h-3 w-3" />{t("common.public")}</>
                : <><Lock className="h-3 w-3" />{t("common.private")}</>
              }
            </span>

            {/* Paid badge */}
            {bolao.is_paid && (
              <span className="flex items-center gap-1 rounded-lg border border-amber-400/10 bg-amber-400/5 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-amber-300/80 group-hover:text-amber-300 group-hover:bg-amber-400/10 transition-all">
                <Star className="h-3 w-3 fill-amber-300/20" />
                {t("common.paid")}
              </span>
            )}
          </div>
        </div>

        {/* Action indicator - Floating Trophy style */}
        <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-zinc-500 transition-all duration-300 group-hover:bg-primary group-hover:text-black group-hover:shadow-[0_0_20px_rgba(145,255,59,0.3)] group-hover:-translate-y-1">
          {variant === "my" ? <Trophy className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>
      </div>

      {/* Bottom CTA for discover variant */}
      {variant === "discover" && (
        <div className="mt-5 flex items-center justify-end">
          <Link
            to={`/b/${bolao.invite_code}`}
            onClick={(e) => e.stopPropagation()}
            className="group/btn relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-black transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]"
          >
            <Zap className="h-3.5 w-3.5 fill-black" />
            {t("list.join_action")}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full" />
          </Link>
        </div>
      )}

      {/* Card Shine Sweep Effect */}
      <div className="absolute inset-0 pointer-events-none -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent transition-transform duration-1000 ease-in-out" />
    </div>
  );

  const containerClasses = [
    "group relative min-w-0 overflow-hidden rounded-[24px] border p-5 backdrop-blur-md",
    "transition-all duration-500 ease-out",
    isActive
      ? "border-primary/20 bg-gradient-to-br from-[#122117]/90 to-black/80 hover:border-primary/50 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5),0_0_20px_rgba(145,255,59,0.05)]"
      : bolao.is_paid
        ? "border-amber-400/20 bg-black/90 hover:border-amber-400/40 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6),0_0_20px_rgba(234,179,8,0.08)]"
        : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
    "hover:-translate-y-1 hover:z-20",
  ].join(" ");

  const bgLayer = (
    <>
      {/* Card background image — right-anchored */}
      <img
        src={bgImage}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[65%] object-cover object-right select-none"
        style={{ opacity: bolao.is_paid ? 0.28 : 0.22 }}
      />
      {/* Gradient mask so content on the left stays readable */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: bolao.is_paid
            ? "linear-gradient(to right, #0a0800 38%, #0a080099 60%, transparent)"
            : "linear-gradient(to right, #08140d 38%, #08140d99 60%, transparent)",
        }}
      />
    </>
  );

  if (variant === "my") {
    return (
      <Link to={`/boloes/${bolao.id}`} className={containerClasses}>
        {bgLayer}
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={containerClasses}>
      {bgLayer}
      {cardContent}
    </div>
  );
}

export function BolaoCardSkeleton() {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02] p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 rounded-[18px] bg-white/5" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-5 w-2/3 rounded-lg bg-white/10" />
          <div className="h-3 w-full rounded-lg bg-white/5" />
          <div className="mt-4 flex gap-2">
            <div className="h-6 w-16 rounded-lg bg-white/5" />
            <div className="h-6 w-16 rounded-lg bg-white/5" />
            <div className="h-6 w-16 rounded-lg bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
