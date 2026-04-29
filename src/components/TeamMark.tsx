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
  sm: {
    shell: "h-8 min-w-[58px] rounded-xl px-2 gap-1.5",
    image: "h-5 w-5",
    text: "text-[0.76rem]",
  },
  md: {
    shell: "h-10 min-w-[68px] rounded-2xl px-2.5 gap-2",
    image: "h-6 w-6",
    text: "text-[0.92rem]",
  },
  lg: {
    shell: "h-16 min-w-[104px] rounded-[20px] px-3 gap-2.5",
    image: "h-10 w-10",
    text: "text-[1.35rem]",
  },
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
  const label = code.slice(0, 3).toUpperCase();
  const imageUrl = !imageFailed
    ? getTeamImageUrl({
        code,
        crestUrl,
        teamId,
      })
    : null;
  const sizes = sizeMap[size];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border border-primary/40 bg-[linear-gradient(145deg,rgba(145,255,59,0.16),rgba(1,12,8,0.88))] font-display font-black uppercase tracking-[0.12em] text-white shadow-[0_0_18px_rgba(145,255,59,0.22),inset_0_1px_0_rgba(255,255,255,0.1)] drop-shadow-[0_0_10px_rgba(145,255,59,0.22)]",
        sizes.shell,
        className
      )}
      aria-label={name ? `${label} - ${name}` : label}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn(
            "shrink-0 bg-transparent object-contain [filter:drop-shadow(0_0_8px_rgba(145,255,59,0.42))_drop-shadow(0_5px_8px_rgba(0,0,0,0.55))]",
            sizes.image
          )}
          onError={() => setImageFailed(true)}
        />
      ) : null}
      <span className={cn("leading-none", sizes.text)}>{label}</span>
    </div>
  );
}
