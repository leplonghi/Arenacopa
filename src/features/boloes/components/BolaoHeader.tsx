import { ArrowLeft, Crown, Info, PenLine, Share2, Trophy, Users } from "lucide-react";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { BolaoData, BolaoMarket } from "@/types/bolao";

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

  return (
    <ArenaPanel tone="strong" className="mb-4 overflow-hidden p-4 sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,196,0,0.14),transparent_24%),radial-gradient(circle_at_15%_0%,rgba(145,255,59,0.09),transparent_30%)]" />
      <div className="relative">
        <div className="flex items-start gap-2.5">
          <button
            aria-label={t('bolao_detail.back_button_aria')}
            onClick={() => navigate("/boloes")}
            className="surface-card-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <BolaoAvatar
            avatarUrl={bolao.avatar_url}
            alt={bolao.name}
            className="surface-card-soft flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="arena-kicker text-primary">
                {bolao.category === "public" ? t('bolao_detail.category_public') : t('bolao_detail.category_private')}
              </p>
              {isCreator && (
                <button
                  onClick={onEdit}
                  className="rounded-md p-1 text-zinc-400 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-primary/70"
                  aria-label="Editar configurações do bolão"
                  title="Editar bolão"
                >
                  <PenLine className="h-3 w-3" />
                </button>
              )}
            </div>
            <h1 className="arena-title-lg">
              {bolao.name}
            </h1>
            {bolao.description ? (
              <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-zinc-300 line-clamp-2">
                {bolao.description}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={onShare}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary/15 px-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-primary transition hover:bg-primary/25"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Convidar</span>
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

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="arena-badge text-[10px] py-0.5 px-2">
            <Users className="h-3 w-3" />
            {memberCount}
          </span>
          <span className="arena-badge text-[10px] py-0.5 px-2">
            <Share2 className="h-3 w-3" />
            {bolao.invite_code}
          </span>
          {formatLabel ? (
            <span className="arena-badge text-[10px] py-0.5 px-2">
              <Trophy className="h-3 w-3" />
              {formatLabel}
            </span>
          ) : null}
          {bolaoMarkets.length > 0 ? (
            <span className="arena-badge text-[10px] py-0.5 px-2">
              <Info className="h-3 w-3" />
              {bolaoMarkets.length} desafios
            </span>
          ) : null}
          {isCreator ? (
            <span className="arena-badge border-orange-400/30 text-orange-300 text-[10px] py-0.5 px-2">
              <Crown className="h-3 w-3" />
              Admin
            </span>
          ) : null}
          {championMarket && myChampion && (
            <span className="arena-badge text-[10px] py-0.5 px-2">
              <Trophy className="h-3 w-3 text-amber-400" />
              {myChampion}
            </span>
          )}
        </div>
      </div>
    </ArenaPanel>
  );
}
