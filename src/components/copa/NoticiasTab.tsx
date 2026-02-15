import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";
import { Eye, TrendingUp, X, ExternalLink, Newspaper, Clock, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

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

const categories = ["Todos", "Seleções", "Eliminatórias", "Bastidores", "Estádios", "Curiosidades"];

export function NoticiasTab() {
    const [news, setNews] = useState<NewsItemDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItemDisplay | null>(null);
    const [activeCategory, setActiveCategory] = useState("Todos");

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const { data, error } = await supabase
                    .from('news')
                    .select('*')
                    .order('published_at', { ascending: false })
                    .limit(20);

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

    const filteredNews = activeCategory === "Todos"
        ? news
        : news.filter(n => n.category.toLowerCase() === activeCategory.toLowerCase());

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="glass-card p-4 animate-pulse">
                        <div className="flex gap-3">
                            <div className="w-28 h-20 rounded-lg bg-white/5" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-white/5 rounded w-1/4" />
                                <div className="h-4 bg-white/5 rounded w-3/4" />
                                <div className="h-3 bg-white/5 rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (news.length === 0) {
        return (
            <div className="text-center py-16 space-y-3">
                <Newspaper className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Nenhuma notícia disponível no momento.</p>
            </div>
        );
    }

    return (
        <>
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-5"
            >
                {/* Header */}
                <motion.div variants={staggerItem}>
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold block">Fique por dentro</span>
                    <h2 className="text-xl font-black flex items-center gap-2 mt-1">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Notícias da Copa
                    </h2>
                </motion.div>

                {/* Category Filter */}
                <motion.div variants={staggerItem} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all shrink-0",
                                activeCategory === cat
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {cat === "Todos" && <Filter className="w-3 h-3 inline mr-1" />}
                            {cat}
                        </button>
                    ))}
                </motion.div>

                {/* Featured News (first item) */}
                {filteredNews.length > 0 && (
                    <motion.div
                        variants={staggerItem}
                        onClick={() => setSelectedNews(filteredNews[0])}
                        className="glass-card overflow-hidden cursor-pointer group"
                    >
                        <div className="relative w-full h-44 sm:h-56">
                            <img
                                src={filteredNews[0].image}
                                alt={filteredNews[0].title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/20 backdrop-blur-sm px-2 py-0.5 rounded">
                                        {filteredNews[0].category}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {filteredNews[0].time}
                                    </span>
                                </div>
                                <h3 className="text-base font-black leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                                    {filteredNews[0].title}
                                </h3>
                                {filteredNews[0].source && (
                                    <span className="text-[9px] text-muted-foreground/70">Fonte: {filteredNews[0].source}</span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* News List */}
                <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
                    {filteredNews.slice(1).map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.06 }}
                            onClick={() => setSelectedNews(item)}
                            className="group flex gap-3 p-3 rounded-xl glass-card hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <div className="relative w-24 h-18 rounded-lg overflow-hidden shrink-0">
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
                                <div className="flex items-center gap-2 mt-1.5 text-[9px] text-muted-foreground/80">
                                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.views}</span>
                                    {item.source && <span>• {item.source}</span>}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filteredNews.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-xs text-muted-foreground">Nenhuma notícia nesta categoria.</p>
                    </div>
                )}
            </motion.div>

            {/* News Detail Modal */}
            <AnimatePresence>
                {selectedNews && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
                        onClick={() => setSelectedNews(null)}
                    >
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

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

                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>

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
