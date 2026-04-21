import { useMemo, useState } from "react";
import { sanitizeExternalUrl } from "@/lib/security";
import { cn } from "@/lib/utils";

type BolaoAvatarProps = {
  avatarUrl?: string | null;
  fallback?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
};

function resolveAvatarSource(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return sanitizeExternalUrl(trimmed);
}

export function BolaoAvatar({
  avatarUrl,
  fallback = "🏆",
  alt,
  className,
  imgClassName,
  fallbackClassName,
}: BolaoAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const imageSource = useMemo(
    () => (hasError ? null : resolveAvatarSource(avatarUrl)),
    [avatarUrl, hasError]
  );

  return (
    <div className={cn("overflow-hidden", className)}>
      {imageSource ? (
        <img
          src={imageSource}
          alt={alt}
          className={cn("h-full w-full object-cover", imgClassName)}
          onError={() => setHasError(true)}
        />
      ) : (
        <span className={cn("inline-flex h-full w-full items-center justify-center", fallbackClassName)}>
          {fallback}
        </span>
      )}
    </div>
  );
}
