import { useEffect, useRef } from "react";
import { hostCountries } from "@/data/guiaData";
import { useTranslation } from "react-i18next";

/**
 * MapaTab — Mapa interativo Leaflet com as 16 cidades-sede da Copa 2026.
 * Leaflet é carregado via CDN (sem npm) para não aumentar o bundle.
 */

const COUNTRY_COLORS: Record<string, string> = {
    USA: "#22c55e",
    MEX: "#f59e0b",
    CAN: "#ef4444",
};

export function MapaTab() {
    const { t } = useTranslation("sedes");
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);

    const allCities = hostCountries.flatMap((c) => c.cities);

    useEffect(() => {
        let scriptElement: HTMLScriptElement | null = null;
        const handleLeafletLoad = () => {
            initMap();
        };

        // Load Leaflet CSS
        if (!document.getElementById("leaflet-css")) {
            const link = document.createElement("link");
            link.id = "leaflet-css";
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        // Load Leaflet JS
        function initMap() {
            if (!mapRef.current || mapInstanceRef.current) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const L = (window as any).L;
            if (!L) return;

            const map = L.map(mapRef.current, {
                center: [38, -95],
                zoom: 3,
                zoomControl: true,
                attributionControl: false,
                scrollWheelZoom: true,
            });

            // Dark tile layer (CartoDB dark matter)
            L.tileLayer(
                "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                { subdomains: "abcd", maxZoom: 19 }
            ).addTo(map);

            // Attribution (small, bottom-right)
            L.control.attribution({ prefix: false, position: "bottomright" })
                .addAttribution('© <a href="https://carto.com">CartoDB</a>')
                .addTo(map);

            // Add city markers
            allCities.forEach((city) => {
                const [lat, lng] = city.geoCoordinates;
                const color = COUNTRY_COLORS[city.countryCode] || "#fff";

                // Custom circular marker
                const icon = L.divIcon({
                    className: "",
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                    html: `
                        <div style="
                            width:14px;height:14px;
                            border-radius:50%;
                            background:${color};
                            border:2px solid rgba(255,255,255,0.9);
                            box-shadow:0 0 8px ${color}99,0 2px 6px rgba(0,0,0,0.6);
                            cursor:pointer;
                        "></div>
                    `,
                });

                const marker = L.marker([lat, lng], { icon }).addTo(map);

                // Popup
                marker.bindPopup(
                    `<div style="
                        font-family:'Inter',sans-serif;
                        min-width:160px;
                        background:#111;
                        color:#fff;
                        border-radius:12px;
                        padding:12px 14px;
                        border:1px solid rgba(255,255,255,0.1);
                    ">
                        <div style="font-size:9px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:${color};margin-bottom:4px">
                            ${city.countryCode} • Sede
                        </div>
                        <div style="font-size:14px;font-weight:900;margin-bottom:2px">${city.name}</div>
                        <div style="font-size:11px;color:#888;font-weight:600">${city.stadiumName}</div>
                        <div style="
                            display:inline-block;
                            margin-top:6px;
                            font-size:9px;font-weight:800;
                            text-transform:uppercase;letter-spacing:0.1em;
                            background:rgba(255,255,255,0.08);
                            border:1px solid rgba(255,255,255,0.1);
                            border-radius:6px;padding:2px 8px;color:#ccc
                        ">
                            ${(city.stadiumCapacity / 1000).toFixed(0)}k lugares
                        </div>
                    </div>`,
                    {
                        maxWidth: 220,
                        className: "leaflet-popup-dark",
                    }
                );
            });

            mapInstanceRef.current = map;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).L) {
            initMap();
        } else if (!document.getElementById("leaflet-js")) {
            const script = document.createElement("script");
            script.id = "leaflet-js";
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.addEventListener("load", handleLeafletLoad, { once: true });
            document.head.appendChild(script);
            scriptElement = script;
        } else {
            // Script tag exists but not loaded yet — wait
            const el = document.getElementById("leaflet-js") as HTMLScriptElement;
            el.addEventListener("load", handleLeafletLoad, { once: true });
            scriptElement = el;
        }

        return () => {
            if (scriptElement) {
                scriptElement.removeEventListener("load", handleLeafletLoad);
            }
            if (mapInstanceRef.current) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (mapInstanceRef.current as any).remove();
                mapInstanceRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col gap-4 pb-32">
            {/* Legend */}
            <div className="flex items-center gap-4 px-1 flex-wrap">
                {Object.entries(COUNTRY_COLORS).map(([code, color]) => (
                    <div key={code} className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full border-2 border-white/60 flex-shrink-0"
                            style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
                        />
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">{code}</span>
                    </div>
                ))}
                <span className="ml-auto text-[10px] text-gray-600 font-medium">{t("ui.map.tapToExplore")}</span>
            </div>

            {/* Map container */}
            <div
                className="relative rounded-2xl overflow-hidden border border-white/10"
                style={{ height: "calc(100vh - 260px)", minHeight: 340 }}
            >
                <div ref={mapRef} className="w-full h-full" />
                {/* Custom popup styles injected inline */}
                <style>{`
                    .leaflet-popup-dark .leaflet-popup-content-wrapper {
                        background: transparent !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                    }
                    .leaflet-popup-dark .leaflet-popup-content {
                        margin: 0 !important;
                    }
                    .leaflet-popup-dark .leaflet-popup-tip-container {
                        display: none;
                    }
                    .leaflet-container {
                        background: #0a0a0a !important;
                        font-family: 'Inter', sans-serif !important;
                    }
                    .leaflet-control-zoom a {
                        background: #111 !important;
                        color: #fff !important;
                        border-color: rgba(255,255,255,0.1) !important;
                    }
                    .leaflet-control-zoom a:hover {
                        background: #222 !important;
                    }
                `}</style>
            </div>

            {/* City count summary */}
            <div className="grid grid-cols-3 gap-3">
                {hostCountries.map((country) => (
                    <div key={country.code} className="glass-card rounded-2xl p-3 border border-white/10 text-center">
                        <div
                            className="text-xl font-black mb-0.5"
                            style={{ color: COUNTRY_COLORS[country.code] }}
                        >
                            {country.cities.length}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{country.code}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
