import { cn } from "@/lib/utils";
import { getFlagUrlForCode } from "@/lib/team-flags";

interface FlagProps {
  code: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "w-4 h-4",
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-14 h-14",
};

export function Flag({ code, size = "md", className }: FlagProps) {
  const flagUrl = getFlagUrlForCode(code);

  if (!flagUrl) {
    return (
      <div className={cn(sizeMap[size], "rounded-full bg-secondary flex items-center justify-center text-xs text-muted-foreground", className)}>
        {code.length > 3 ? "?" : code}
      </div>
    );
  }

  return (
    <img
      src={flagUrl}
      alt={code}
      className={cn(sizeMap[size], "rounded-full object-cover", className)}
    />
  );
}
