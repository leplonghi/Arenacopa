import { useState } from "react";
import { cn } from "@/lib/utils";
import { stadiums, type Stadium } from "@/data/mockData";
import { MapPin, Users, Globe, Thermometer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";

export function MapaTab() {
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null);

  return (
    <div>
      <div className="glass-card h-64 mb-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-copa-green/10 to-background/80" />
        <div className="text-center z-10">
          <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <span className="text-xs text-muted-foreground">Mapa Copa 2026</span>
        </div>
        {stadiums.slice(0, 5).map((s, i) => (
          <motion.button
            key={s.id}
            onClick={() => setSelectedStadium(s)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            animate={selectedStadium?.id === s.id ? { scale: 1.25 } : { scale: 1 }}
            className={cn(
              "absolute w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              selectedStadium?.id === s.id
                ? "bg-primary shadow-lg shadow-primary/30"
                : "bg-secondary/80"
            )}
            style={{ top: `${25 + i * 12}%`, left: `${20 + i * 14}%` }}
          >
            <MapPin className="w-4 h-4" />
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selectedStadium ? (
          <motion.div
            key={selectedStadium.id}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="glass-card overflow-hidden"
          >
            <div className="bg-gradient-to-b from-copa-green/20 to-transparent p-6 text-center">
              <h3 className="text-lg font-black">{selectedStadium.name}</h3>
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
                <MapPin className="w-3 h-3 text-copa-success" />
                <span>{selectedStadium.city}, {selectedStadium.country}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-4">
              <div className="glass-card p-3 text-center">
                <Users className="w-4 h-4 mx-auto mb-1 text-copa-green-light" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Capacidade</span>
                <span className="text-sm font-black">{selectedStadium.capacity.toLocaleString("pt-BR")}</span>
              </div>
              <div className="glass-card p-3 text-center">
                <Globe className="w-4 h-4 mx-auto mb-1 text-primary" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Fuso</span>
                <span className="text-sm font-black">{selectedStadium.timezone.split("/").pop()}</span>
              </div>
              <div className="glass-card p-3 text-center">
                <Thermometer className="w-4 h-4 mx-auto mb-1 text-primary" />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Clima</span>
                <span className="text-sm font-black">18°C</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-2"
          >
            {stadiums.map(s => (
              <motion.button
                key={s.id}
                variants={staggerItem}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedStadium(s)}
                className="glass-card-hover w-full p-3 text-left flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate">{s.name}</h4>
                  <p className="text-[11px] text-muted-foreground">{s.city}, {s.country}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{s.capacity.toLocaleString("pt-BR")}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
