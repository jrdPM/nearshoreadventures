"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { addBasemap } from "@/lib/basemap";
import { useEffect, useRef } from "react";

export default function MiniMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { zoomControl: false, scrollWheelZoom: false, dragging: !L.Browser.mobile }).setView([lat, lng], 14);
    addBasemap(m);
    L.marker([lat, lng], {
      icon: L.divIcon({ className: "", html: `<div class="na-pin active">📍 ${label.replace(/</g, "&lt;")}</div>` }),
    }).addTo(m);
    return () => {
      m.remove();
    };
  }, [lat, lng, label]);
  return <div ref={el} className="h-64 w-full overflow-hidden rounded-2xl border border-line" />;
}
