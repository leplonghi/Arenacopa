import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AchievementBadge({
  title,
  description,
  icon,
  unlocked,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  unlocked?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border p-4 text-center transition-all",
        unlocked
          ? "border-primary/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_18px_44px_-30px_rgba(145,255,59,0.28)]"
          : "border-white/10 bg-white/[0.03] opacity-60 grayscale",
      )}
    >
      <div className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border", unlocked ? "border-primary/25 bg-primary/12 text-primary" : "border-white/10 bg-white/5 text-zinc-400")}>
        {icon}
      </div>
      <p className="mt-3 font-display text-[1.35rem] font-semibold uppercase leading-none text-white">
        {title}
      </p>
      <p className="mt-2 text-xs leading-5 text-zinc-400">{description}</p>
    </div>
  );
}
