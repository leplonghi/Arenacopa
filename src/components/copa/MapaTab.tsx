
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { stadiums, teams, type Stadium, type Team } from "@/data/mockData";
import { MapPin, Users, Globe, Thermometer, Calendar, Info, Maximize2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "selected-marker",
});

const teamIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "team-marker",
});

// Component to fly to selected location
function MapFlyTo({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 6, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

interface MapaTabProps {
  initialCityId?: string | null;
}

export function MapaTab({ initialCityId }: MapaTabProps) {
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Filter teams that have coordinates
  const teamsWithCoords = teams.filter(t => t.demographics?.coordinates);

  useEffect(() => {
    if (initialCityId) {
      // Logic to find stadium by city ID (needs mapping or finding by similar name)
      // For now, let's just find by city name if possible or stadium id logic match
      const found = stadiums.find(s => s.id === initialCityId || s.city.toLowerCase().includes(initialCityId.toLowerCase()));
      if (found) {
        setSelectedStadium(found);
      }
    }
  }, [initialCityId]);

  const handleStadiumClick = (s: Stadium) => {
    setSelectedTeam(null);
    setSelectedStadium(s);
  };

  const handleTeamClick = (t: Team) => {
    setSelectedStadium(null);
    setSelectedTeam(t);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Real Leaflet Map */}
      <div className={cn(
        "relative w-full transition-all duration-500 bg-black/50 overflow-hidden",
        (selectedStadium || selectedTeam) ? "h-[45vh]" : "h-[65vh] md:h-[75vh]"
      )}>
        <MapContainer
          center={[35, -95]} // Center view to North America
          zoom={3}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
          className="z-0 bg-[#1a1a1a]"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {selectedStadium && (
            <MapFlyTo lat={selectedStadium.lat} lng={selectedStadium.lng} />
          )}
          {selectedTeam && selectedTeam.demographics?.coordinates && (
            <MapFlyTo lat={selectedTeam.demographics.coordinates.lat} lng={selectedTeam.demographics.coordinates.lng} />
          )}

          {stadiums.map(s => (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={selectedStadium?.id === s.id ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: () => handleStadiumClick(s),
              }}
            >
              <Popup className="custom-popup">
                <div className="text-center text-black">
                  <strong>{s.name}</strong>
                  <br />
                  <span className="text-xs">{s.city}</span>
                </div>
              </Popup>
            </Marker>
          ))}

          {teamsWithCoords.map(t => (
            <Marker
              key={t.code}
              position={[t.demographics!.coordinates!.lat, t.demographics!.coordinates!.lng]}
              icon={selectedTeam?.code === t.code ? selectedIcon : teamIcon}
              eventHandlers={{
                click: () => handleTeamClick(t),
              }}
            >
              <Popup className="custom-popup">
                <div className="text-center text-black">
                  <strong>{t.name}</strong>
                  <br />
                  <span className="text-xs">{t.demographics?.capital}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Overlay gradient for map bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1a1a1a] to-transparent pointer-events-none z-[400]" />
      </div>

      <div className="flex-1 bg-[#1a1a1a] overflow-y-auto relative z-10 -mt-4 rounded-t-3xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-2" />

        <div className="p-4">
          <AnimatePresence mode="wait">
            {(selectedStadium || selectedTeam) ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 pb-20"
              >
                {selectedStadium && (
                  <>
                    <div className="glass-card p-5 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Maximize2 className="w-24 h-24 text-primary rotate-12" />
                      </div>

                      <div className="relative z-10">
                        <button
                          onClick={() => setSelectedStadium(null)}
                          className="flex items-center gap-1 text-xs font-bold text-muted-foreground mb-3 hover:text-primary transition-colors"
                        >
                          <ArrowLeft className="w-3 h-3" /> Voltar para lista
                        </button>
                        <h2 className="text-2xl font-black text-white leading-none mb-1">{selectedStadium.name}</h2>
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedStadium.city}, {selectedStadium.country}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass-card p-4 flex flex-col justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          <Thermometer className="w-4 h-4 text-orange-500" /> Clima
                        </div>
                        <div>
                          <div className="flex items-end gap-1.5 mb-1">
                            <span className="text-3xl font-black">{selectedStadium.details?.avgTempHigh ?? '--'}°C</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                            {selectedStadium.climaHint}
                          </p>
                        </div>
                      </div>

                      <div className="glass-card p-4 flex flex-col justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          <Calendar className="w-4 h-4 text-blue-400" /> Detalhes
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Construção</span>
                            <span className="font-bold">{selectedStadium.details?.yearBuilt}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Capacidade</span>
                            <span className="font-bold">{Math.round(selectedStadium.capacity / 1000)}k</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-5 space-y-4">
                      <div className="flex gap-4">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedStadium.details?.description}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {selectedTeam && (
                  <>
                    <div className="glass-card p-5 relative overflow-hidden group bg-emerald-950/30 border-emerald-500/20">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Globe className="w-24 h-24 text-emerald-500 rotate-12" />
                      </div>

                      <div className="relative z-10">
                        <button
                          onClick={() => setSelectedTeam(null)}
                          className="flex items-center gap-1 text-xs font-bold text-muted-foreground mb-3 hover:text-emerald-400 transition-colors"
                        >
                          <ArrowLeft className="w-3 h-3" /> Voltar para lista
                        </button>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-4xl">{selectedTeam.flag}</span>
                          <h2 className="text-2xl font-black text-white leading-none">{selectedTeam.name}</h2>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedTeam.demographics?.capital}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="glass-card p-4 space-y-2">
                        <span className="text-xs text-muted-foreground uppercase font-bold">População</span>
                        <div className="text-xl font-black">{selectedTeam.demographics?.population}</div>
                      </div>
                      <div className="glass-card p-4 space-y-2">
                        <span className="text-xs text-muted-foreground uppercase font-bold">Ranking FIFA</span>
                        <div className="text-xl font-black">#{selectedTeam.fifaRanking || '-'}</div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-2 pb-20"
              >
                <div className="px-1 mb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                    Sedes Oficiais
                  </h3>
                  <p className="text-xs text-muted-foreground">Selecione um local para visualizar no mapa</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {stadiums.map(s => (
                    <motion.button
                      key={s.id}
                      variants={staggerItem}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedStadium(s)}
                      className="glass-card-hover w-full p-3 text-left flex items-center gap-3 group border border-white/5 hover:border-white/10"
                    >
                      <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/5 text-xs font-black text-white/50">
                        {s.id.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">{s.name}</h4>
                        <p className="text-[10px] font-medium text-muted-foreground">{s.city}, {s.country}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 opacity-60">
                        <MapPin className="w-4 h-4" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div >
  );
}
