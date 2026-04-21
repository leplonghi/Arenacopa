import { useState } from "react";
import { cn } from "@/lib/utils";
import { getTeamImageUrl } from "@/lib/team-flags";

interface TeamMarkProps {
  code: string;
  name?: string;
  crestUrl?: string | null;
  teamId?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-10 w-10 rounded-xl p-1.5",
  md: "h-12 w-12 rounded-2xl p-2",
  lg: "h-14 w-14 rounded-2xl p-2.5",
};

export function TeamMark({
  code,
  name,
  crestUrl,
  teamId,
  size = "md",
  className,
}: TeamMarkProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = !imageFailed
    ? getTeamImageUrl({
        code,
        crestUrl,
        teamId,
      })
    : null;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-white/[0.08] shadow-[0_12px_30px_rgba(0,0,0,0.18)]",
        sizeMap[size],
        className
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name || code}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">
          {code.slice(0, 3)}
        </span>
      )}
    </div>
  );
}
