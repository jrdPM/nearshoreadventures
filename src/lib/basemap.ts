import "maplibre-gl/dist/maplibre-gl.css";
import type L from "leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";

// OpenFreeMap: free, no API key, no usage limits. Positron is the light, quiet style.
const STYLE = "https://tiles.openfreemap.org/styles/positron";
const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

export function addBasemap(map: L.Map) {
  return maplibreGL({ style: STYLE, attribution: ATTRIBUTION } as Parameters<typeof maplibreGL>[0]).addTo(map);
}
