import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { stadiums, type Stadium } from "@/data/mockData";
import { MapPin, Users, Globe, Thermometer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [49, 49],
  className: "selected-marker",
});

export function MapaTab() {
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null);

  return (
    <div>
      {/* Real Leaflet Map */}
      <div className="glass-card h-72 mb-4 overflow-hidden rounded-xl">
        <MapContainer
          center={[30, -95]}
          zoom={3}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {stadiums.map(s => (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={selectedStadium?.id === s.id ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: () => setSelectedStadium(s),
              }}
            >
              <Popup>
                <div className="text-center">
                  <strong>{s.name}</strong>
                  <br />
                  <span>{s.city}, {s.country}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
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
                <span className="text-xs font-bold">{selectedStadium.climaHint.split(",")[0]}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedStadium(null)}
              className="w-full py-3 text-xs font-bold text-muted-foreground border-t border-border/30"
            >
              Ver todos os estádios
            </button>
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
