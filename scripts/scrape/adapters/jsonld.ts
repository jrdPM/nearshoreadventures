/** schema.org Event markup embedded in pages (ticketing sites, theaters and many CMSs add this for Google). */
import * as cheerio from "cheerio";
import type { RawEvent } from "../raw";

type Json = Record<string, unknown>;

const EVENT_TYPES = /Event$|^Festival$|^MusicEvent$|^TheaterEvent$/;

function collect(node: unknown, out: Json[]) {
  if (!node) return;
  if (Array.isArray(node)) return node.forEach((n) => collect(n, out));
  if (typeof node !== "object") return;
  const o = node as Json;
  const t = o["@type"];
  const types = Array.isArray(t) ? t : [t];
  if (types.some((x) => typeof x === "string" && EVENT_TYPES.test(x))) out.push(o);
  if (o["@graph"]) collect(o["@graph"], out);
  if (o.itemListElement) collect(o.itemListElement, out);
  if (o.item) collect(o.item, out);
}

function regionOf(addr: Json) {
  const country = addr.addressCountry;
  const c = typeof country === "object" && country ? (country as Json).name : country;
  return [addr.addressRegion, c].filter((x) => typeof x === "string" && x).join(", ") || undefined;
}

const first = <T>(v: T | T[] | undefined): T | undefined => (Array.isArray(v) ? v[0] : v);

export function parseJsonLd(html: string, pageUrl: string): RawEvent[] {
  const $ = cheerio.load(html);
  const found: Json[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      collect(JSON.parse($(el).contents().text()), found);
    } catch {
      /* ignore broken blocks */
    }
  });
  return found
    .filter((e) => e.name && e.startDate)
    .map((e) => {
      const loc = first(e.location as Json | Json[]) as Json | string | undefined;
      const locObj = typeof loc === "object" ? loc : undefined;
      const addr = locObj?.address as Json | string | undefined;
      const addrText = typeof addr === "string" ? addr : addr ? [addr.streetAddress, addr.addressLocality].filter(Boolean).join(", ") : undefined;
      const geo = locObj?.geo as Json | undefined;
      const offer = first(e.offers as Json | Json[]) as Json | undefined;
      const img = first(e.image as unknown);
      const price = offer?.price !== undefined ? String(offer.price) : undefined;
      return {
        title: String(e.name),
        start: String(e.startDate),
        end: e.endDate ? String(e.endDate) : undefined,
        description: e.description ? String(e.description) : undefined,
        url: e.url ? new URL(String(e.url), pageUrl).toString() : pageUrl,
        ticketUrl: offer?.url ? String(offer.url) : undefined,
        image: typeof img === "string" ? img : (img as Json | undefined)?.url ? String((img as Json).url) : undefined,
        venueName: typeof loc === "string" ? loc : locObj?.name ? String(locObj.name) : undefined,
        address: addrText,
        city: typeof addr === "object" && addr?.addressLocality ? String(addr.addressLocality) : undefined,
        region: typeof addr === "object" ? regionOf(addr) : undefined,
        lat: geo?.latitude ? Number(geo.latitude) : undefined,
        lng: geo?.longitude ? Number(geo.longitude) : undefined,
        price: price && price !== "0" ? `$${price.replace(/^\$/, "")}` : undefined,
        free: e.isAccessibleForFree === true || price === "0" || price === "0.00",
      } satisfies RawEvent;
    });
}

/** Look for calendar feeds a page advertises, so "auto" sources can use them. */
export function discoverFeeds(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  const feeds = new Set<string>();
  $('link[type="text/calendar"], a[href$=".ics"], a[href^="webcal:"], a[href*="ical="], a[href*="iCalendar"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      try {
        feeds.add(new URL(href.replace(/^webcal:/, "https:"), pageUrl).toString());
      } catch {
        /* skip */
      }
    }
  });
  return [...feeds].slice(0, 3);
}
