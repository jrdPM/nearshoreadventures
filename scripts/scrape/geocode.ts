/** Turn venue addresses into map pins. Uses OpenStreetMap's free geocoder (1 request/sec) and caches results. */
import fs from "node:fs";
import path from "node:path";
import type { CapeEvent } from "../../src/lib/types";
import { TOWN_BY_SLUG } from "../../src/lib/towns";
import { sleep } from "./fetch";

const CACHE_FILE = path.join(process.cwd(), "data", "geocache.json");
type Cache = Record<string, [number, number] | null>;

const load = (): Cache => (fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")) : {});

/** Small, stable offset so pins in the same town don't stack on one spot. */
function jitter(seed: string): [number, number] {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return [((h % 1000) / 1000) * 0.012 - 0.006, (((h >> 10) % 1000) / 1000) * 0.012 - 0.006];
}

export async function geocodeAll(events: CapeEvent[], maxLookups = 60) {
  const cache = load();
  let lookups = 0;
  for (const e of events) {
    if (e.venue.lat && e.venue.lng) continue;
    const town = TOWN_BY_SLUG[e.venue.town];
    const query = `${e.venue.address || e.venue.name}, ${town.name}, MA`;
    const key = query.toLowerCase();
    if (!(key in cache) && lookups < maxLookups && process.env.GEOCODE !== "0") {
      lookups++;
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, { headers: { "user-agent": "NearshoreAdventuresBot/1.0 (+https://nearshoreadventures.com)" }, signal: AbortSignal.timeout(15_000) });
        const json = (await res.json()) as { lat: string; lon: string }[];
        const hit = json[0] ? ([Number(json[0].lat), Number(json[0].lon)] as [number, number]) : null;
        // Only accept hits that are actually on the Cape.
        cache[key] = hit && hit[0] > 41.5 && hit[0] < 42.1 && hit[1] > -70.7 && hit[1] < -69.9 ? hit : null;
      } catch {
        /* try again next run */
      }
      await sleep(1100);
    }
    const hit = cache[key];
    if (hit) [e.venue.lat, e.venue.lng] = hit;
    else {
      const [dy, dx] = jitter(e.venue.name);
      e.venue.lat = town.lat + dy;
      e.venue.lng = town.lng + dx;
    }
  }
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));
}
