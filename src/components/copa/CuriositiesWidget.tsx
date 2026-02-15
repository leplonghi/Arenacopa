
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Lightbulb, RotateCcw } from "lucide-react";
import { staggerItem } from "./animations";

interface Curiosity {
    id: string;
    content: string;
    category: string;
    image_url?: string;
}

export function CuriositiesWidget() {
    const [curiosity, setCuriosity] = useState<Curiosity | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchRandomCuriosity = async () => {
        setLoading(true);
        try {
            // In a real app with many rows, using .random() effectively might need a remote function
            // For now, we fetch a few and pick one random client-side or use created_at desc
            const { data } = await supabase
                .from('curiosities')
                .select('*')
                .limit(10); // Get a pool

            if (data && data.length > 0) {
                const random = data[Math.floor(Math.random() * data.length)];
                setCuriosity({
                    id: random.id,
                    content: random.content,
                    category: random.category || 'general',
                    image_url: random.image_url || undefined
                });
            }
        } catch (error) {
            console.error("Error fetching curiosity:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRandomCuriosity();
    }, []);

    if (!curiosity && !loading) return null;

    return (
        <motion.div variants={staggerItem} className="px-1 py-2">
            <div className="glass-card p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Lightbulb className="w-24 h-24" />
                </div>

                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Você Sabia?</span>
                    </div>
                    <button
                        onClick={fetchRandomCuriosity}
                        disabled={loading}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <RotateCcw className={`w-3 h-3 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="relative z-10">
                    {loading ? (
                        <div className="h-12 bg-white/5 animate-pulse rounded-lg" />
                    ) : (
                        <motion.div
                            key={curiosity?.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <p className="text-sm font-medium leading-relaxed italic text-foreground/90">
                                "{curiosity?.content}"
                            </p>
                            {curiosity?.image_url && (
                                <div className="mt-3 rounded-lg overflow-hidden h-32 w-full relative">
                                    <img
                                        src={curiosity.image_url}
                                        alt="Curiosity"
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
