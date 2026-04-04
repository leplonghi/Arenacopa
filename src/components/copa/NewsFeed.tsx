import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { staggerItem, staggerContainer } from "./animations";
import { Eye, ArrowRight, TrendingUp, Newspaper, Clock } from "lucide-react";
import { useRealtimeNews } from "@/hooks/useRealtimeNews";

interface NewsItemDisplay {
    id: string;
    title: string;
    category: string;
    time: string;
    image: string;
    url: string;
    views: string;
    content?: string;
    source?: string;
}

export function NewsFeed() {
    const { t } = useTranslation('bolao');
    const { news: realtimeNews, isLoading: loading } = useRealtimeNews({
        limitCount: 6,
        championshipId: "wc2026",
    });
    const news = useMemo(
        () =>
            realtimeNews.map((item) => ({
                id: item.id,
                title: item.title,
                category: item.source_name || item.source_country || item.category || item.country_filter || "Geral",
                time: item.published_at ? new Date(item.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "Recent",
                image: item.image_url || item.url_to_image || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800",
                url: item.url || "#",
                views: item.views
                    ? (item.views >= 1000 ? `${(item.views / 1000).toFixed(1).replace('.0', '')}k` : `${item.views}`)
                    : `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 9)}k`,
                content: item.summary || item.content || item.description || undefined,
                source: item.source_name || undefined,
            })) satisfies NewsItemDisplay[],
        [realtimeNews]
    );

    if (loading) {
        return (
            <div className="space-y-4 px-1">
                <div className="h-6 w-32 bg-white/5 animate-pulse rounded-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (news.length === 0) return null;

    return (
        <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-5 px-1 pb-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-copa-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
                    <h2 className="text-[13px] font-black uppercase tracking-[0.2em] text-zinc-400 font-display flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-copa-gold" />
                        {t('news.highlights', 'Highlights')}
                    </h2>
                </div>
                <button className="text-[10px] font-black uppercase tracking-wider text-copa-gold/70 hover:text-copa-gold transition-colors flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                    {t('news.view_all', 'View All')} <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {news.map((item, index) => (
                        <motion.div
                            key={item.id}
                            variants={staggerItem}
                            layout
                            onClick={() => {
                                if (item.url && item.url !== "#") {
                                    window.open(item.url, '_blank');
                                }
                            }}
                            className="group relative flex flex-col gap-0 overflow-hidden rounded-[24px] border border-white/5 bg-zinc-900/40 backdrop-blur-sm transition-all duration-300 hover:border-copa-gold/30 hover:bg-zinc-800/40 cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
                        >
                            <div className="relative aspect-[16/9] w-full overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                                
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white bg-copa-gold/80 backdrop-blur-md px-2 py-1 rounded-md shadow-lg">
                                        {item.category}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="p-4 flex flex-col justify-between flex-1">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                                        <Clock className="w-3 h-3 text-copa-gold/60" />
                                        {item.time}
                                        {item.source && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                                <span className="text-zinc-400">{item.source}</span>
                                            </>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-copa-gold transition-colors duration-300">
                                        {item.title}
                                    </h3>
                                </div>
                                
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-medium">
                                        <Eye className="w-3 h-3 text-zinc-600" />
                                        {item.views} <span className="opacity-60 whitespace-nowrap">readers</span>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-copa-gold transition-all duration-300">
                                        <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-zinc-950" />
                                    </div>
                                </div>
                            </div>

                            {/* Hover highlight effect */}
                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-copa-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
