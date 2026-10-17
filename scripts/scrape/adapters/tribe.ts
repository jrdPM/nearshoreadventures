/**
 * The Events Calendar (WordPress "Tribe") REST API. A lot of Cape venues, libraries
 * and chambers run it, and it gives clean structured data.
 */
import type { RawEvent } from "../raw";
import { get } from "../fetch";

interface TribeEvent {
  url: string;
  title: string;
  description?: string;
  excerpt?: string;
  utc_start_date: string;
  utc_end_date?: string;
  all_day?: boolean;
  start_date: string;
  end_date?: string;
  cost?: string;
  website?: string;
  image?: { url?: string } | false;
  venue?: { venue?: string; address?: string; city?: string; geo_lat?: number | string; geo_lng?: number | string } | unknown[];
}

export function tribeEndpoint(siteUrl: string) {
  const u = new URL(siteUrl);
  return `${u.origin}/wp-json/tribe/events/v1/events`;
}

export async function fetchTribe(siteUrl: string, explicitFeed?: string, maxPages = 10): Promise<RawEvent[]> {
  const base = explicitFeed ?? tribeEndpoint(siteUrl);
  const today = new Date().toISOString().slice(0, 10);
  let next: string | undefined = `${base}?start_date=${today}&per_page=50`;
  const out: RawEvent[] = [];
  for (let page = 0; next && page < maxPages; page++) {
    const res = await get(next, "application/json");
    if (!res.ok) {
      if (page === 0) throw new Error(`Tribe API HTTP ${res.status}`);
      break;
    }
    const json = (await res.json()) as { events?: TribeEvent[]; next_rest_url?: string };
    if (!Array.isArray(json.events)) throw new Error("Not a Tribe events response");
    for (const e of json.events) {
      const v = Array.isArray(e.venue) ? undefined : (e.venue as Exclude<TribeEvent["venue"], unknown[]>);
      out.push({
        title: e.title,
        start: e.all_day ? e.start_date.slice(0, 10) : `${e.utc_start_date.replace(" ", "T")}Z`,
        end: e.utc_end_date ? (e.all_day ? e.end_date?.slice(0, 10) : `${e.utc_end_date.replace(" ", "T")}Z`) : undefined,
        allDay: !!e.all_day,
        description: e.excerpt || e.description,
        url: e.url,
        ticketUrl: e.website || undefined,
        image: e.image && typeof e.image === "object" ? e.image.url : undefined,
        venueName: v?.venue,
        address: v ? [v.address, v.city].filter(Boolean).join(", ") : undefined,
        city: v?.city,
        lat: v?.geo_lat ? Number(v.geo_lat) : undefined,
        lng: v?.geo_lng ? Number(v.geo_lng) : undefined,
        price: e.cost || undefined,
      });
    }
    next = json.next_rest_url;
  }
  return out;
}
