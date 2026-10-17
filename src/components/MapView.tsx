"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { addBasemap } from "@/lib/basemap";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { CapeEvent } from "@/lib/types";
import { TOWN_BY_SLUG } from "@/lib/towns";
import { fmt, timeLabel } from "@/lib/dates";
import { EventPhoto } from "./EventPhoto";

const CAPE_BOUNDS: L.LatLngBoundsExpression = [
  [41.52, -70.68],
  [42.08, -69.92],
];

/** Group events at the same spot so one pin shows "3 events" instead of three stacked pins. */
function groupByPlace(events: CapeEvent[]) {
  const groups = new Map<string, CapeEvent[]>();
  for (const e of events) {
    if (e.venue.lat == null || e.venue.lng == null) continue;
    const k = `${e.venue.lat.toFixed(3)},${e.venue.lng.toFixed(3)}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(e);
  }
  return [...groups.values()];
}

export default function MapView({ events }: { events: CapeEvent[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const [picked, setPicked] = useState<CapeEvent[] | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { zoomControl: false, attributionControl: true, maxBounds: [[41.3, -71.1], [42.3, -69.6]] }).fitBounds(CAPE_BOUNDS);
    L.control.zoom({ position: "bottomright" }).addTo(map.current);
    addBasemap(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const lg = layer.current;
    if (!lg) return;
    lg.clearLayers();
    for (const group of groupByPlace(events)) {
      const e = group[0];
      const label = group.length > 1 ? `${group.length} events` : e.tags.free ? "Free" : fmt(e.start, "MMM d");
      const icon = L.divIcon({ className: "", html: `<div class="na-pin">${label}</div>`, iconSize: undefined });
      L.marker([e.venue.lat!, e.venue.lng!], { icon, title: group.map((g) => g.title).join(", ") })
        .on("click", () => setPicked(group))
        .addTo(lg);
    }
  }, [events]);

  return (
    <div className="relative h-[calc(100dvh-15rem)] min-h-[420px] overflow-hidden rounded-2xl border border-line md:h-[calc(100dvh-14rem)]">
      <div ref={el} className="h-full w-full" />
      {picked && (
        <div className="absolute inset-x-3 bottom-3 z-[500] mx-auto max-w-md rounded-2xl bg-white p-3 shadow-pop">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-sm font-bold">
              {picked[0].venue.name} · {TOWN_BY_SLUG[picked[0].venue.town]?.name}
            </p>
            <button onClick={() => setPicked(null)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-sand" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {picked.map((e) => (
              <Link key={e.id} href={`/events/${e.slug}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-sand">
                <EventPhoto event={e} className="h-14 w-14 shrink-0 rounded-lg" />
                <div className="min-w-0">
                  <p className="truncate font-bold">{e.title}</p>
                  <p className="text-sm text-muted">
                    {fmt(e.start, "EEE, MMM d")}
                    {!e.allDay && ` · ${timeLabel(e.start)}`}
                    {e.tags.free && " · Free"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
