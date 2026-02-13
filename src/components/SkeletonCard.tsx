import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card p-4 animate-pulse", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-16 bg-muted rounded" />
        <div className="h-4 w-16 bg-muted rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 bg-muted rounded-full" />
          <div className="h-3 w-8 bg-muted rounded" />
        </div>
        <div className="h-6 w-16 bg-muted rounded" />
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 bg-muted rounded-full" />
          <div className="h-3 w-8 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
