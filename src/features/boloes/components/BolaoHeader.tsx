import { ArrowLeft, Crown, Info, PenLine, Share2, Trophy, Users } from "lucide-react";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { BolaoData, BolaoMarket } from "@/types/bolao";
import { tStatic } from "@/i18n/staticText";
import { getArenaAssetSrc } from "@/lib/arena-assets";

interface BolaoHeaderProps {
  bolao: BolaoData;
  isCreator: boolean;
  memberCount: number;
  formatLabel: string | null;
  bolaoMarkets: BolaoMarket[];
  championMarket: BolaoMarket | undefined;
  myChampion: string | null;
  onEdit: () => void;
  onShare: () => void;
  onOpenInfo: () => void;
}

export function BolaoHeader({
  bolao,
  isCreator,
  memberCount,
  formatLabel,
  bolaoMarkets,
  championMarket,
  myChampion,
  onEdit,
  onShare,
  onOpenInfo,
}: BolaoHeaderProps) {
  const { t } = useTranslation('bolao');
  const navigate = useNavigate();
  const heroSrc =
    getArenaAssetSrc("generated/pool-detail-hero.webp") ||
    (bolao.is_paid ? "/fundo%20bolao%20negocios.png" : "/fundo%20bolao%20pessoal.png");

  return (
    <ArenaPanel tone="strong" className="mb-4 overflow-hidden p-3 relative">
      {/* Background image — right-anchored */}
      <img
        src={heroSrc}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 h-full w-[65%] select-none object-cover object-right"
        style={{ opacity: bolao.is_paid ? 0.28 : 0.24 }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: bolao.is_paid
            ? "linear-gradient(to right, #1a1508 50%, #1a1508aa 75%, transparent)"
            : "linear-gradient(to right, #0c1912 50%, #0c1912aa 75%, transparent)",
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <button
            aria-label={t('bolao_detail.back_button_aria')}
            onClick={() => navigate("/boloes")}
            className="surface-card-soft flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>

          <BolaoAvatar
            avatarUrl={bolao.avatar_url}
            alt={bolao.name}
            className="surface-card-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                {bolao.category === "public" ? t('bolao_detail.category_public') : t('bolao_detail.category_private')}
              </p>
              {isCreator && (
                <button
                  onClick={onEdit}
                  className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                  aria-label="Editar configurações do bolão"
                >
                  <PenLine className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <h1 className="arena-title-md truncate">
              {bolao.name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-emerald-400" />
                {memberCount}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="h-3 w-3 text-blue-400" />
                {bolao.invite_code}
              </span>
              {formatLabel && (
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-amber-400" />
                  {formatLabel}
                </span>
              )}
              {championMarket && myChampion && (
                <span className="flex items-center gap-1 text-amber-200">
                  <Crown className="h-3 w-3" />
                  {myChampion}
                </span>
              )}
              {isCreator && (
                <span className="rounded-md border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 text-[9px] text-orange-400">
                  Admin
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={onShare}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary/15 px-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-primary transition hover:bg-primary/25"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tStatic("Convidar")}</span>
            </button>
            <button
              aria-label={t('bolao_detail.info_button_aria')}
              onClick={onOpenInfo}
              className="surface-card-soft flex h-8 w-8 items-center justify-center rounded-lg"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </ArenaPanel>
  );
}
