import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ArenaAssetSlotProps = {
  name: string;
  label: string;
  src?: string | null;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
};

export function ArenaAssetSlot({
  name,
  label,
  src,
  className,
  imgClassName,
  fallbackClassName,
}: ArenaAssetSlotProps) {
  return (
    <div
      className={cn(
        "relative flex aspect-square items-center justify-center overflow-hidden rounded-[22px] border border-[#7dff48]/20 bg-[radial-gradient(circle_at_50%_20%,rgba(255,200,40,0.14),transparent_36%),linear-gradient(160deg,rgba(10,45,28,0.82),rgba(2,10,8,0.96))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_38px_-28px_rgba(0,0,0,0.85)]",
        className,
      )}
      data-asset-slot={name}
    >
      {src ? (
        <img
          src={src}
          alt={label}
          className={cn(
            "h-full w-full object-contain p-3 drop-shadow-[0_14px_24px_rgba(0,0,0,0.38)]",
            imgClassName,
          )}
        />
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-3 text-center",
            fallbackClassName,
          )}
        >
          <ImageIcon className="h-7 w-7 text-[#ffc928]" />
          <span className="font-display text-[1.05rem] font-semibold uppercase leading-none text-white">
            {label}
          </span>
          <span className="max-w-full truncate rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-semibold text-white/60">
            {name}
          </span>
        </div>
      )}
    </div>
  );
}
