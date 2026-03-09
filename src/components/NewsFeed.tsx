import { Newspaper, RefreshCw, AlertCircle, Wifi } from "lucide-react";
import { useWorldCupNews } from "@/hooks/useWorldCupNews";
import { NewsCard, NewsCardFeatured } from "./NewsCard";
import { Skeleton } from "@/components/ui/skeleton";

interface NewsFeedProps {
  teamCode?: string;
  /** Show only compact list (no featured card) */
  compact?: boolean;
  /** Max number of articles to display */
  limit?: number;
}

function NewsSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className="space-y-2.5">
      {!compact && <Skeleton className="h-48 w-full rounded-xl" />}
      {Array.from({ length: compact ? 3 : 3 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 rounded-xl border border-border/20">
          <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NewsFeed({ teamCode, compact = false, limit = 6 }: NewsFeedProps) {
  const { data: articles, isLoading, isError, error, refetch, isFetching } = useWorldCupNews(teamCode);

  if (isLoading) return <NewsSkeleton compact={compact} />;

  if (isError) {
    return (
      <div className="glass-card p-5 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-copa-live mx-auto" />
        <div>
          <p className="text-sm font-bold">Não foi possível carregar notícias</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {(error as Error)?.message?.includes("NewsAPI")
              ? "Limite de requisições atingido. Tente em alguns minutos."
              : "Verifique sua conexão com a internet."}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 mx-auto text-xs text-primary font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
        </button>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="glass-card p-5 text-center">
        <Newspaper className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-bold">Nenhuma notícia encontrada</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Tente novamente em instantes — novidades da Copa chegam em breve!
        </p>
      </div>
    );
  }

  const displayArticles = articles.slice(0, limit);
  const [featured, ...rest] = displayArticles;

  return (
    <div className="space-y-2.5">
      {/* Refresh indicator */}
      {isFetching && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Wifi className="w-3 h-3 animate-pulse text-primary" />
          Atualizando notícias…
        </div>
      )}

      {/* Featured top story */}
      {!compact && featured && <NewsCardFeatured article={featured} />}

      {/* Article list */}
      {(compact ? displayArticles : rest).map((article) => (
        <NewsCard key={article.url} article={article} />
      ))}
    </div>
  );
}
