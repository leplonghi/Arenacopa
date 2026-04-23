import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArenaMetric, ArenaPanel } from "@/components/arena/ArenaPrimitives";

type LevelInfo = {
  level: number;
  currentXp: number;
  maxXp: number;
  ratio: number;
};

export function ProfileSummary({
  displayName,
  avatarUrl,
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
    <ArenaPanel className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="arena-glow-ring h-20 w-20 border-[3px] border-[#7dff48]/35 bg-[#04120d]">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-2xl font-black text-primary">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#04120d] bg-primary font-display text-lg font-black text-black">
              {levelInfo.level}
            </span>
          </div>
          <div>
            <p className="arena-kicker">{displayName}</p>
            <h3 className="font-display text-[2rem] font-black uppercase text-white">
              Nível {levelInfo.level} • Apostador
            </h3>
            <p className="mt-2 text-2xl font-black text-zinc-200">
              {levelInfo.currentXp} / {levelInfo.maxXp} XP
            </p>
          </div>
        </div>
        <Link to="/ranking" className="font-display text-xl font-black uppercase text-primary">
          Ver ranking
        </Link>
      </div>

      <div className="arena-progress mt-4">
        <span style={{ width: `${Math.min(100, Math.max(10, levelInfo.ratio * 100))}%` }} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <ArenaMetric label="Rank" value={bestRank === 999 ? "-" : `${bestRank}º`} />
        <ArenaMetric label="Pontos" value={totalPoints.toLocaleString("pt-BR")} accent />
        <ArenaMetric label="Bolões" value={poolCount} />
      </div>
    </ArenaPanel>
  );
}
