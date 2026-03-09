import { useEffect, useState } from "react";
import { db } from "@/integrations/firebase/client";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
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

import { AdBanner } from "@/components/AdBanner";

const categories = ["Todos", "Brasil", "Argentina", "Seleções", "Bastidores", "Estádios"];

export function NoticiasTab() {
    const [news, setNews] = useState<NewsItemDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItemDisplay | null>(null);
    const [activeCategory, setActiveCategory] = useState("Todos");

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const newsRef = collection(db, "news");
                const newsQuery = query(newsRef, orderBy("published_at", "desc"), limit(20));
                const newsSnapshot = await getDocs(newsQuery);

                const mappedNews: NewsItemDisplay[] = newsSnapshot.docs.map(docSnap => {
                    const item = docSnap.data();
                    return {
                        id: docSnap.id,
                        title: item.title,
                        category: item.category || "Geral",
                        time: item.published_at?.toDate
                            ? new Date(item.published_at.toDate()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                            : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                        image: item.image_url || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800",
                        url: item.url || "#",
                        views: "1.2k",
                        content: item.content || item.summary || null,
                        source: item.source || null,
                    };
                });

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
                <motion.div variants={staggerItem} className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all shrink-0 border",
                                activeCategory === cat
                                    ? "bg-primary text-black border-primary"
                                    : "bg-white/5 text-gray-400 border-white/5 hover:text-white"
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
                        onClick={() => {
                            if (window.plausible) {
                                window.plausible('News Read', { props: { category: filteredNews[0].category, title: filteredNews[0].title } });
                            }
                            if (filteredNews[0]?.url && filteredNews[0].url !== "#") {
                                window.open(filteredNews[0].url, '_blank');
                            }
                        }}
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
                    {filteredNews.slice(1).map((item, index) => {
                        const isAfterFifth = index === 4; // Because it's sliced by 1, index 4 is the 5th item in the list visually (or 6th total)

                        return (
                            <div key={item.id} className="flex flex-col gap-3">
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.06 }}
                                    onClick={() => {
                                        if (window.plausible) {
                                            window.plausible('News Read', { props: { category: item.category, title: item.title } });
                                        }
                                        if (item.url && item.url !== "#") {
                                            window.open(item.url, '_blank');
                                        }
                                    }}
                                    className="group flex gap-3 p-3 rounded-xl glass-card hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <div className="relative w-24 h-full min-h-[5rem] rounded-lg overflow-hidden shrink-0">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    </div>
                                    <div className="flex flex-col justify-center flex-1 min-w-0 py-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                                {item.category}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground font-bold">{item.time}</span>
                                        </div>
                                        <h3 className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors tracking-tight text-white mb-1">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-auto text-[9px] text-muted-foreground/80 font-bold">
                                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.views}</span>
                                            {item.source && <span className="truncate">• {item.source}</span>}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Interstitial Ad after 5th item */}
                                {isAfterFifth && (
                                    <AdBanner variant="box" slotId="interstitial-news" className="my-4" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {filteredNews.length === 0 && (
                    <div className="text-center py-8 glass-card border-dashed">
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Nenhuma notícia nesta categoria.</p>
                    </div>
                )}
            </motion.div>

            {/* Banner Footer Ad */}
            <div className="mt-8 mb-4">
                <AdBanner variant="banner" slotId="footer-news" />
            </div>

            {/* Removed Modal as per external redirection spec */}
        </>
    );
}
