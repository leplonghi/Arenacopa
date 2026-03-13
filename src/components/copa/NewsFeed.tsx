
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerItem } from "./animations";
import { Eye, ArrowRight, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const { data, error } = await supabase
                    .from("copa_news")
                    .select("id, title, source_name, published_at, url_to_image, url, description, country_filter")
                    .order("published_at", { ascending: false })
                    .limit(5);

                if (error) throw error;

                const mappedNews: NewsItemDisplay[] = (data || []).map((item) => ({
                    id: item.id,
                    title: item.title,
                    category: item.country_filter || "Geral",
                    time: new Date(item.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
                    image: item.url_to_image || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800",
                    url: item.url || "#",
                    views: "1.2k",
                    content: item.description || undefined,
                    source: item.source_name || undefined,
                }));

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
                            onClick={() => {
                                if (item.url && item.url !== "#") {
                                    window.open(item.url, '_blank');
                                }
                            }}
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

            {/* Removed Modal as per external redirection spec */}
        </>
    );
}
