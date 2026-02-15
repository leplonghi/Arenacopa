
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { staggerItem } from "./animations";
import { Eye, ArrowRight, TrendingUp, X, ExternalLink } from "lucide-react";

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
    const [news, setNews] = useState<NewsItemDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItemDisplay | null>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const { data, error } = await supabase
                    .from('news')
                    .select('*')
                    .order('published_at', { ascending: false })
                    .limit(5);

                if (error) throw error;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const mappedNews: NewsItemDisplay[] = data?.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    category: item.category || "Geral",
                    time: new Date(item.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                    image: item.image_url || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800",
                    url: item.url || "#",
                    views: "1.2k",
                    content: item.content || item.summary || null,
                    source: item.source || null,
                })) || [];

                setNews(mappedNews);
            } catch (err) {
                console.error("Error fetching news:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    if (loading) return <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">Carregando notícias...</div>;
    if (news.length === 0) return null;

    return (
        <>
            <motion.div variants={staggerItem} className="space-y-4 px-1">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Destaques
                    </h2>
                    <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        Ver tudo <ArrowRight className="w-3 h-3" />
                    </button>
                </div>

                <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
                    {news.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setSelectedNews(item)}
                            className="group flex gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="relative w-24 h-16 rounded-lg overflow-hidden shrink-0">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                            <div className="flex flex-col justify-center flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                        {item.category}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground">{item.time}</span>
                                </div>
                                <h3 className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                    {item.title}
                                </h3>
                                <div className="flex items-center gap-1 mt-1 text-[9px] text-muted-foreground/80">
                                    <Eye className="w-3 h-3" />
                                    {item.views} leituras
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Internal News Modal */}
            <AnimatePresence>
                {selectedNews && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
                        onClick={() => setSelectedNews(null)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

                        {/* Modal content */}
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative z-10 w-full max-w-lg max-h-[85vh] bg-background rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
                        >
                            {/* Hero image */}
                            <div className="relative w-full h-48 shrink-0">
                                <img
                                    src={selectedNews.image}
                                    alt={selectedNews.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                                {/* Close button */}
                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {/* Category badge */}
                                <div className="absolute bottom-4 left-4">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/20 backdrop-blur-sm px-2 py-1 rounded-md">
                                        {selectedNews.category}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 flex-1 overflow-y-auto space-y-4">
                                <div>
                                    <h2 className="text-xl font-black leading-tight">
                                        {selectedNews.title}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                        <span>{selectedNews.time}</span>
                                        {selectedNews.source && (
                                            <>
                                                <span>•</span>
                                                <span>Fonte: {selectedNews.source}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {selectedNews.content ? (
                                    <p className="text-sm leading-relaxed text-foreground/80">
                                        {selectedNews.content}
                                    </p>
                                ) : (
                                    <p className="text-sm leading-relaxed text-muted-foreground italic">
                                        Conteúdo completo disponível na fonte original.
                                    </p>
                                )}

                                {/* Source link */}
                                {selectedNews.url && selectedNews.url !== "#" && (
                                    <a
                                        href={selectedNews.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline mt-2"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Ler na fonte original
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
