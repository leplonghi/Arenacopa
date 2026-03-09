import { cn } from "@/lib/utils";

// Shimmer layer — applies the diagonal light sweep over skeleton elements
function Shimmer() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 rounded-inherit pointer-events-none overflow-hidden"
      style={{ borderRadius: "inherit" }}
    >
      <div
        className="h-full w-full animate-shimmer"
        style={{
          background:
            "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
        }}
      />
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card p-4 relative overflow-hidden", className)}>
      <Shimmer />
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-16 bg-muted/60 rounded" />
        <div className="h-4 w-16 bg-muted/60 rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 bg-muted/60 rounded-full" />
          <div className="h-3 w-8 bg-muted/60 rounded" />
        </div>
        <div className="h-6 w-16 bg-muted/60 rounded" />
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 bg-muted/60 rounded-full" />
          <div className="h-3 w-8 bg-muted/60 rounded" />
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

// Generic shimmer row for tables/ranking lists
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 py-2 px-3 relative overflow-hidden", className)}>
      <Shimmer />
      <div className="h-8 w-8 bg-muted/60 rounded-full shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 bg-muted/60 rounded" />
        <div className="h-2.5 w-20 bg-muted/40 rounded" />
      </div>
      <div className="h-5 w-12 bg-muted/60 rounded-full" />
    </div>
  );
}
