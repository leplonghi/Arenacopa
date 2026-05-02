import { useTranslation } from "react-i18next";
import { useRealtimeNews } from "@/hooks/useRealtimeNews";
import { Newspaper, ExternalLink } from "lucide-react";
import { sanitizeExternalUrl } from "@/lib/security";

export function NoticiasTab({ championshipId, color }: { championshipId: string; color: string }) {
  const { t } = useTranslation("championships");
  const { news, isLoading } = useRealtimeNews({
    championshipId,
    limitCount: 10,
  });

  const formatPublishedAt = (value?: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  if (isLoading) return (
    <div className="space-y-3 mt-1">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.04] animate-pulse" />)}</div>
  );

  if (!news?.length) return (
    <div className="flex flex-col items-center gap-3 text-center py-10 mt-1">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.08]" style={{ background: `${color}18` }}>
        <Newspaper className="w-7 h-7" style={{ color }} />
      </div>
      <p className="text-sm font-extrabold text-white/80">{t("hub.news.empty_title", { defaultValue: "Ainda sem notícias desse campeonato" })}</p>
      <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed">
        {t("hub.news.empty_desc", { defaultValue: "Quando o feed for atualizado, os destaques e notícias mais recentes aparecem aqui." })}
      </p>
    </div>
  );

  return (
    <div className="space-y-3 mt-1">
      {news.map((item) => {
        const safeUrl = sanitizeExternalUrl(item.url);

        return safeUrl ? (
          <a
            key={item.id}
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors"
          >
            {(item.image_url || item.url_to_image) && (
              <div className="h-32 overflow-hidden">
                <img src={item.image_url || item.url_to_image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border"
                  style={{ color, borderColor: `${color}40`, background: `${color}15` }}
                >
                  {item.source_name || item.source_country || item.category || t("hub.news.highlight", { defaultValue: "Destaque" })}
                </span>
                <span className="text-[9px] text-white/30">{formatPublishedAt(item.published_at)}</span>
                <ExternalLink className="ml-auto h-3 w-3 text-white/25 transition-colors group-hover:text-white/60" />
              </div>
              <p className="text-xs font-bold text-white leading-relaxed line-clamp-2">{item.title}</p>
              {(item.summary || item.description) && (
                <p className="mt-1 text-[11px] leading-relaxed text-white/45 line-clamp-2">
                  {item.summary || item.description}
                </p>
              )}
            </div>
          </a>
        ) : (
          <article
            key={item.id}
            className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.06] opacity-95"
          >
            {(item.image_url || item.url_to_image) && (
              <div className="h-32 overflow-hidden">
                <img src={item.image_url || item.url_to_image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border"
                  style={{ color, borderColor: `${color}40`, background: `${color}15` }}
                >
                  {item.source_name || item.source_country || item.category || t("hub.news.highlight", { defaultValue: "Destaque" })}
                </span>
                <span className="text-[9px] text-white/30">{formatPublishedAt(item.published_at)}</span>
              </div>
              <p className="text-xs font-bold text-white leading-relaxed line-clamp-2">{item.title}</p>
              {(item.summary || item.description) && (
                <p className="mt-1 text-[11px] leading-relaxed text-white/45 line-clamp-2">
                  {item.summary || item.description}
                </p>
              )}
              <p className="mt-2 text-[10px] font-medium text-white/25">
                {t("hub.news.no_link", { defaultValue: "Fonte externa ainda sem link direto." })}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
