import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

export function BolaoDetailSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-app-bg pb-24">
      <div className="sticky top-0 z-50 flex items-center gap-4 bg-app-bg/80 px-4 py-4 backdrop-blur-md">
        <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
          <ChevronLeft className="h-5 w-5 text-zinc-400" />
        </div>
        <Skeleton className="h-6 w-40" />
      </div>
      
      {/* Header Skeleton */}
      <div className="relative overflow-hidden mb-6">
        <div className="absolute inset-0 z-0">
          <Skeleton className="w-full h-[220px] rounded-none opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/80 to-transparent" />
        </div>
        
        <div className="relative z-10 pt-16 px-4">
          <div className="flex gap-4 items-end">
            <Skeleton className="w-24 h-24 rounded-3xl" />
            <div className="flex-1 pb-1">
              <Skeleton className="h-4 w-16 mb-2 rounded-full" />
              <Skeleton className="h-7 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Actions Skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-12 rounded-xl" />
          <Skeleton className="h-10 w-12 rounded-xl" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2 border-b border-white/5 pb-2">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>

        {/* List items skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
