import { cn } from "@/lib/utils";

type BrandWordmarkProps = {
  className?: string;
  accentClassName?: string;
  label?: string;
};

export function BrandWordmark({
  className,
  accentClassName,
  label = "ARENACUP",
}: BrandWordmarkProps) {
  const normalizedLabel = label.toUpperCase();
  const suffix = normalizedLabel.endsWith("CUP") ? "CUP" : "";
  const prefix = suffix ? normalizedLabel.slice(0, -suffix.length) : normalizedLabel;

  return (
    <span aria-label={normalizedLabel} className={cn("inline-flex items-baseline uppercase", className)}>
      <span>{prefix}</span>
      {suffix ? (
        <span className={cn("text-gradient-gold", accentClassName)}>
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
