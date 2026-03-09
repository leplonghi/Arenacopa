import { ExternalLink } from "lucide-react";
import { timeAgo } from "@/services/newsService";
import type { UnifiedArticle } from "@/hooks/useWorldCupNews";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  article: UnifiedArticle;
  className?: string;
}

/** Compact horizontal news card for the dashboard feed */
export function NewsCard({ article, className }: NewsCardProps) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl bg-card border border-border/40",
        "active:scale-[0.98] transition-transform",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
        {article.urlToImage ? (
          <img
            src={article.urlToImage}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-copa-green/30 to-copa-green/10 flex items-center justify-center text-2xl">
            ⚽
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold leading-snug line-clamp-3 text-foreground mb-1.5">
          {article.title}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-primary font-semibold truncate max-w-[100px]">
            {article.source.name}
          </span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">
            {timeAgo(article.publishedAt)}
          </span>
          <ExternalLink className="w-2.5 h-2.5 text-muted-foreground ml-auto shrink-0" />
        </div>
      </div>
    </a>
  );
}

/** Large featured news card (top story) */
export function NewsCardFeatured({ article }: { article: UnifiedArticle }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden border border-border/40 active:scale-[0.98] transition-transform"
    >
      {/* Hero image */}
      <div className="h-40 bg-gradient-to-br from-copa-green/30 to-secondary relative">
        {article.urlToImage ? (
          <img
            src={article.urlToImage}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">⚽</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-copa-green-light bg-black/40 px-2 py-0.5 rounded-full">
            {article.source.name} · {timeAgo(article.publishedAt)}
          </span>
        </div>
      </div>
      {/* Title */}
      <div className="bg-card p-3">
        <p className="text-sm font-black leading-snug line-clamp-2">{article.title}</p>
        {article.description && (
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
            {article.description}
          </p>
        )}
      </div>
    </a>
  );
}
