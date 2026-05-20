import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronRight,
  Trophy,
  Lock,
  Globe,
  PenLine,
  Zap,
  Star,
  Users,
  History,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { cn } from "@/lib/utils";
import type { BolaoListingCard } from "@/services/boloes/bolao-listing.service";

type BolaoCardVariant = "my" | "discover";

type BolaoCardProps = {
  bolao: BolaoListingCard;
  variant?: BolaoCardVariant;
  selectable?: boolean;
  selected?: boolean;
  isSelectionMode?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onQuickDelete?: (id: string) => Promise<void>;
  pendingCount?: number;
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
        dot: "bg-[#91FF3B] shadow-[0_0_8px_rgba(145,255,59,0.9)]",
        pulse: true,
      };
    case "draft":
      return { key: "draft", color: "#FFC54D", dot: "bg-[#FFC54D] shadow-[0_0_6px_rgba(255,197,77,0.6)]", pulse: false };
    case "finished":
      return { key: "finished", color: "#a78bfa", dot: "bg-violet-400", pulse: false };
    case "archived":
      return { key: "archived", color: "#6b7280", dot: "bg-zinc-600", pulse: false };
    case "deleted":
      return { key: "deleted", color: "#ef4444", dot: "bg-red-500", pulse: false };
    default:
      return { key: status, color: "#9ca3af", dot: "bg-zinc-600", pulse: false };
  }
}

function getBolaoTone(bolao: BolaoListingCard) {
  // Draft — amber/warning: visually separate from active pools
  if (bolao.status === "draft") {
    return {
      label: "Rascunho",
      bgImage: "/fundo%20bolao%20pessoal.png",
      topLine: "#FFC54D",
      border: "border-amber-400/35 hover:border-amber-300/60 border-dashed",
      shell: "bg-[linear-gradient(135deg,rgba(30,20,4,0.97),rgba(14,10,2,0.9))]",
      glow: "hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.65),0_0_20px_rgba(255,197,77,0.10)]",
      mask: "linear-gradient(to right, #160f02 28%, #160f02cc 52%, transparent)",
      imageOpacity: 0.10,
      badge: "border-amber-300/20 bg-amber-300/10 text-amber-200",
      edit: "border-amber-200/25 bg-amber-300/15 text-amber-100 hover:bg-amber-300 hover:text-black",
    };
  }

  // Finished — indigo/violet: signals conclusion
  if (bolao.status === "finished" || bolao.status === "archived") {
    return {
      label: bolao.status === "finished" ? "Encerrado" : "Arquivado",
      bgImage: "/fundo%20bolao%20pessoal.png",
      topLine: "#a78bfa",
      border: "border-violet-500/20 hover:border-violet-400/35",
      shell: "bg-[linear-gradient(135deg,rgba(14,8,26,0.97),rgba(5,3,11,0.92))]",
      glow: "hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.65),0_0_18px_rgba(167,139,250,0.08)]",
      mask: "linear-gradient(to right, #0d0718 28%, #0d0718cc 52%, transparent)",
      imageOpacity: 0.08,
      badge: "border-violet-300/20 bg-violet-400/10 text-violet-200",
      edit: "border-violet-200/25 bg-violet-400/15 text-violet-100 hover:bg-violet-400 hover:text-black",
    };
  }

  // Paid / business — amber gold
  if (bolao.is_paid) {
    return {
      label: "Negócios",
      bgImage: "/fundo%20bolao%20negocios.png",
      topLine: "#FFC54D",
      border: "border-amber-400/20 hover:border-amber-300/45",
      shell: "bg-[linear-gradient(135deg,rgba(36,24,4,0.96),rgba(8,7,3,0.88))]",
      glow: "hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.65),0_0_18px_rgba(245,158,11,0.12)]",
      mask: "linear-gradient(to right, #160f02 28%, #160f02cc 52%, transparent)",
      imageOpacity: 0.28,
      badge: "border-amber-300/20 bg-amber-300/10 text-amber-200",
      edit: "border-amber-200/25 bg-amber-300/15 text-amber-100 hover:bg-amber-300 hover:text-black",
    };
  }

  // Public — sky/cyan
  if (bolao.category === "public") {
    return {
      label: "Aberto",
      bgImage: "/fundo%20bolao%20pessoal.png",
      topLine: "#38BDF8",
      border: "border-sky-400/20 hover:border-sky-300/45",
      shell: "bg-[linear-gradient(135deg,rgba(5,26,33,0.96),rgba(2,10,14,0.9))]",
      glow: "hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.6),0_0_16px_rgba(56,189,248,0.1)]",
      mask: "linear-gradient(to right, #04181f 28%, #04181fcc 52%, transparent)",
      imageOpacity: 0.18,
      badge: "border-sky-300/20 bg-sky-300/10 text-sky-200",
      edit: "border-sky-200/25 bg-sky-300/15 text-sky-100 hover:bg-sky-300 hover:text-black",
    };
  }

  // Private — green (default)
  return {
    label: "Privado",
    bgImage: "/fundo%20bolao%20pessoal.png",
    topLine: "#91FF3B",
    border: "border-primary/20 hover:border-primary/50",
    shell: "bg-[linear-gradient(135deg,rgba(10,30,16,0.96),rgba(2,13,8,0.9))]",
    glow: "hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.6),0_0_16px_rgba(145,255,59,0.1)]",
    mask: "linear-gradient(to right, #07160c 28%, #07160ccc 52%, transparent)",
    imageOpacity: 0.2,
    badge: "border-primary/20 bg-primary/10 text-primary",
    edit: "border-primary/25 bg-primary/15 text-primary hover:bg-primary hover:text-black",
  };
}

function BolaoCardInner({
  bolao,
  variant = "my",
  selectable,
  selected,
  isSelectionMode,
  onSelect,
  onQuickDelete,
  pendingCount,
}: BolaoCardProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { t } = useTranslation("bolao");
  const statusCfg = getStatusConfig(bolao.status);
  const isActive = ["active", "open", "published", "live"].includes(bolao.status);
  const tone = getBolaoTone(bolao);

  const cardContent = (
    <div className="relative z-20 pointer-events-none">
      {/* Thin accent line at top */}
      <div
        className="absolute inset-x-0 -top-[13px] h-[2px] rounded-t-[18px] opacity-50 transition-opacity duration-400 group-hover:opacity-90"
        style={{
          background: `linear-gradient(90deg, transparent, ${isActive ? statusCfg.color : tone.topLine}, transparent)`,
          boxShadow: `0 0 10px ${isActive ? statusCfg.color : tone.topLine}30`,
        }}
      />

      {/* Single-row layout: checkbox? | avatar | name+badges | spacer | action */}
      <div className="flex items-center gap-3">
        {/* Checkbox / selection indicator */}
        {(selectable || isSelectionMode) && (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.(bolao.id, !selected);
            }}
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border shadow-sm transition-all duration-200 pointer-events-auto",
              selected
                ? "bg-primary border-primary text-black scale-105"
                : isSelectionMode
                ? "bg-black/70 border-white/35"
                : "opacity-0 w-0 overflow-hidden",
            )}
          >
            {selected && <Check className="h-3 w-3 stroke-[3.5px]" />}
          </div>
        )}

        {/* Avatar — compact 44px */}
        <div className="relative shrink-0">
          <BolaoAvatar
            avatarUrl={bolao.avatar_url}
            fallback="⚽"
            alt={bolao.name}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-white/10 bg-[#0c1a11]/80 text-xl shadow-inner backdrop-blur-sm transition-transform duration-300 group-hover:scale-105",
              selected && "ring-2 ring-primary ring-offset-1 ring-offset-black/50",
            )}
          />
          {statusCfg.pulse && !selected && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#91FF3B] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#91FF3B] border-[1.5px] border-[#08140d]" />
            </span>
          )}
          {pendingCount !== undefined && pendingCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-black ring-2 ring-black z-30 animate-pulse">
              {pendingCount}
            </span>
          )}
        </div>

        {/* Name + inline pills */}
        <div className="min-w-0 flex-1">
          {/* Name row */}
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="truncate text-sm font-semibold leading-none text-white group-hover:text-primary transition-colors duration-200">
              {bolao.name}
            </p>
            <span
              className={`shrink-0 rounded px-1 py-[1px] text-[7px] font-black uppercase tracking-[0.1em] ${tone.badge}`}
            >
              {tone.label}
            </span>
          </div>

          {/* Badges — always one line, no wrap */}
          <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
            {/* Status dot + label */}
            <span
              className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide"
              style={{ color: statusCfg.color }}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot} shrink-0`} />
              {t(`status.${statusCfg.key}`, { defaultValue: statusCfg.key })}
            </span>

            <span className="text-zinc-700">·</span>

            {/* Members */}
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <Users className="h-2.5 w-2.5" />
              {bolao.member_count}
            </span>

            <span className="text-zinc-700">·</span>

            {/* Privacy */}
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">
              {bolao.category === "public" ? (
                <><Globe className="h-2.5 w-2.5" />{t("common.public")}</>
              ) : (
                <><Lock className="h-2.5 w-2.5" />{t("common.private")}</>
              )}
            </span>

            {bolao.is_paid && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400/80">
                  <Star className="h-2.5 w-2.5 fill-amber-400/20" />
                  {t("common.paid")}
                </span>
              </>
            )}

            {bolao.is_past && (
              <>
                <span className="text-zinc-700">·</span>
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-zinc-500">
                  <History className="h-2.5 w-2.5" />
                  Passado
                </span>
              </>
            )}

            {/* Discover variant: join button inline */}
            {variant === "discover" && (
              <>
                <div className="flex-1" />
                <Link
                  to={`/b/${bolao.invite_code}`}
                  onClick={(e) => e.stopPropagation()}
                  className="ml-1 flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-[3px] text-[8px] font-black uppercase tracking-widest text-black transition-all hover:bg-white hover:scale-105 active:scale-95 pointer-events-auto"
                >
                  <Zap className="h-2.5 w-2.5 fill-black" />
                  {t("list.join_action")}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {variant === "my" && (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick delete — only for creators, hidden while in selection mode */}
            {bolao.is_creator && onQuickDelete && !isSelectionMode && (
              deleteConfirm ? (
                <div className="flex items-center gap-1 animate-in fade-in duration-150">
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleting(true);
                      try {
                        await onQuickDelete(bolao.id);
                      } finally {
                        setDeleting(false);
                        setDeleteConfirm(false);
                      }
                    }}
                    disabled={deleting}
                    className="relative z-20 flex h-7 items-center gap-1 rounded-lg bg-red-500 px-2 text-[8px] font-black uppercase tracking-wide text-white transition-all hover:bg-red-400 disabled:opacity-60 pointer-events-auto"
                    title="Confirmar exclusão"
                  >
                    {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm(false); }}
                    className="relative z-20 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition-all pointer-events-auto"
                  >
                    <span className="text-[10px] font-black">✕</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirm(true); }}
                  className="relative z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/8 text-red-400/60 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40 pointer-events-auto"
                  title="Excluir bolão"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )
            )}

            {/* Edit or trophy */}
            {bolao.is_creator ? (
              <Link
                to={`/boloes/${bolao.id}?tab=config&edit=1`}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Editar ${bolao.name}`}
                title="Editar bolão"
                className={cn(
                  "relative z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 hover:-translate-y-0.5 pointer-events-auto",
                  tone.edit,
                )}
              >
                <PenLine className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-zinc-600 transition-all duration-300 group-hover:bg-primary group-hover:text-black group-hover:border-transparent">
                <Trophy className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        )}

        {variant === "discover" && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/5 text-zinc-600 transition-all duration-300 group-hover:bg-primary group-hover:text-black group-hover:border-transparent">
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Shine sweep */}
      <div className="absolute inset-0 pointer-events-none -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/[0.025] to-transparent transition-transform duration-900 ease-in-out" />
    </div>
  );

  const containerClasses = cn(
    "group relative min-w-0 overflow-hidden rounded-[16px] border px-3 py-2.5 backdrop-blur-md",
    "transition-all duration-400 ease-out hover:-translate-y-[2px] hover:z-20",
    tone.border,
    tone.shell,
    tone.glow,
  );

  const bgLayer = (
    <>
      <img
        src={tone.bgImage}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[55%] select-none object-cover object-right"
        style={{ opacity: tone.imageOpacity }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ background: tone.mask }} />
    </>
  );

  return (
    <div
      className={cn(
        containerClasses,
        selected && "ring-1 ring-primary/35 shadow-[0_0_20px_rgba(145,255,59,0.06)]",
        isSelectionMode && !selected && "opacity-75 grayscale-[0.25]",
      )}
    >
      {isSelectionMode ? (
        <button
          onClick={() => onSelect?.(bolao.id, !selected)}
          className="absolute inset-0 z-30 cursor-pointer"
          aria-label={selected ? "Desfazer seleção" : "Selecionar bolão"}
        />
      ) : (
        <Link
          to={variant === "my" ? `/boloes/${bolao.id}` : `/b/${bolao.invite_code}`}
          aria-label={`Abrir ${bolao.name}`}
          className="absolute inset-0 z-10"
        />
      )}
      {bgLayer}
      {cardContent}
    </div>
  );
}

export const BolaoCard = memo(BolaoCardInner);
BolaoCard.displayName = "BolaoCard";

export function BolaoCardSkeleton() {
  return (
    <div className="relative min-w-0 overflow-hidden rounded-[16px] border border-white/5 bg-white/[0.02] px-3 py-2.5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-[12px] bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded-md bg-white/10" />
          <div className="flex gap-2">
            <div className="h-3 w-12 rounded-md bg-white/5" />
            <div className="h-3 w-8 rounded-md bg-white/5" />
            <div className="h-3 w-10 rounded-md bg-white/5" />
          </div>
        </div>
        <div className="h-8 w-8 shrink-0 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}
