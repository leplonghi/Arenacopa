import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { ArenaHint, ArenaPanel } from "@/components/arena/ArenaPrimitives";
import { tStatic } from "@/i18n/staticText";

type LevelInfo = {
  level: number;
  currentXp: number;
  maxXp: number;
  ratio: number;
};

export function ProfileSummary({
  displayName,
  levelInfo,
  bestRank,
  totalPoints,
  poolCount,
}: {
  displayName: string;
  avatarUrl?: string;
  levelInfo: LevelInfo;
  bestRank: number;
  totalPoints: number;
  poolCount: number;
}) {
  return (
    <ArenaPanel className="p-3.5 sm:p-4">
      <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_12%_0%,rgba(255,193,7,0.1),transparent_48%)]" />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <p className="font-display text-[1.15rem] font-bold uppercase tracking-[0.18em] text-zinc-200">{tStatic("Sua rodada")}</p>
            <ArenaHint label="Como lemos sua rodada">
              Pontos, posição e bolões reunidos em um só lugar. O ranking completo fica no botão ao lado.
            </ArenaHint>
          </div>
          <Link to="/ranking" className="font-display text-[1.15rem] font-bold uppercase tracking-[0.06em] text-primary">
            Ver ranking
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_1.15fr] md:items-center">
          <div className="flex items-center gap-3">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
              <Shield className="h-16 w-16 fill-[#0d1b12] text-[#ffc107] drop-shadow-[0_0_18px_rgba(255,193,7,0.22)]" strokeWidth={1.5} />
              <span className="absolute font-display text-[2.15rem] font-extrabold leading-none text-[#ffe66b] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                {levelInfo.level}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-display text-[1.05rem] font-bold uppercase tracking-[0.16em] text-primary">{tStatic("Nível")}</p>
              <h3 className="font-display text-[1.55rem] font-bold uppercase leading-none tracking-[0.03em] text-white">
                Da turma
              </h3>
              <p className="mt-1 truncate text-xs text-zinc-400">{displayName}</p>
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between gap-3">
              <p className="font-display text-[1rem] font-bold uppercase tracking-[0.14em] text-zinc-400">{tStatic("Próximo nível")}</p>
              <p className="font-display text-[1.2rem] font-bold text-zinc-100">
                {levelInfo.currentXp} / {levelInfo.maxXp}
              </p>
            </div>
            <div className="arena-progress mt-2 h-2">
              <span style={{ width: `${Math.min(100, Math.max(10, levelInfo.ratio * 100))}%` }} />
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-2">
          {[
            { label: "Posição", value: bestRank === 999 ? "-" : `${bestRank}º`, accent: false },
            { label: "Pontos", value: totalPoints.toLocaleString("pt-BR"), accent: true },
            { label: "Bolões", value: poolCount, accent: false },
          ].map((metric) => (
            <div key={metric.label} className="rounded-[14px] border border-[#8d8158]/28 bg-[#061510]/70 px-2 py-2 text-center">
              <p className={metric.accent ? "font-display text-[0.95rem] font-bold uppercase tracking-[0.1em] text-[#44df62]" : "font-display text-[0.95rem] font-bold uppercase tracking-[0.1em] text-primary"}>
                {metric.label}
              </p>
              <p className="mt-1 truncate font-display text-[1.55rem] font-bold leading-none text-white">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ArenaPanel>
  );
}
