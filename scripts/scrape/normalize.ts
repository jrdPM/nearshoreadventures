import { createHash } from "node:crypto";
import { fromZonedTime } from "date-fns-tz";
import type { CapeEvent, CategoryId, Source } from "../../src/lib/types";
import { CATEGORIES } from "../../src/lib/categories";
import { matchTown, TOWN_BY_SLUG } from "../../src/lib/towns";
import { TZ } from "../../src/lib/dates";
import type { RawEvent } from "./raw";
import { WATERFRONT_VENUES } from "./waterfront";

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&[a-z]+;|&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** A short excerpt. We link back to the source for the full write-up. */
function summarize(desc: string | undefined) {
  if (!desc) return "";
  const text = decode(desc);
  if (text.length <= 220) return text;
  const cut = text.slice(0, 220);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "));
  return lastStop > 100 ? cut.slice(0, lastStop + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/** Accepts ISO with offset, naive local "2026-11-07T19:00", or date-only. Returns [iso, allDay]. */
export function toIso(s: string): [string, boolean] | null {
  const v = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return [fromZonedTime(`${v}T00:00:00`, TZ).toISOString(), true];
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(v)) {
    const d = new Date(v);
    return isNaN(+d) ? null : [d.toISOString(), false];
  }
  const d = fromZonedTime(v.replace(" ", "T"), TZ);
  return isNaN(+d) ? null : [d.toISOString(), false];
}

function hasWord(hay: string, kw: string) {
  return new RegExp(`(^|[^a-z])${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i").test(hay);
}

export function categorize(text: string, hint: CategoryId[] = []): CategoryId[] {
  const scored = CATEGORIES.map((c) => ({ id: c.id, n: c.keywords.filter((k) => hasWord(text, k)).length }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((c) => c.id);
  const out = [...new Set([...hint, ...scored])].slice(0, 3);
  return out.length ? out : ["community"];
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);

export const dedupeKey = (title: string, startIso: string, town: string) =>
  `${slugify(title).replace(/-(the|a|an|and|at|in|of)-/g, "-")}|${startIso.slice(0, 10)}|${town}`;

export interface Normalized {
  event: CapeEvent;
  reasons: string[]; // why it's suspect; empty = fine
}

const inMassachusetts = (region: string) =>
  /\b(ma|mass|massachusetts)\b/i.test(region) || /^(us|usa|united states)$/i.test(region.trim());

export function normalize(raw: RawEvent, source: Source, nowIso: string): Normalized | null {
  const title = decode(raw.title || "");
  if (!title) return null;
  const start = toIso(raw.start);
  if (!start) return null;
  const end = raw.end ? toIso(raw.end) : null;
  const allDay = raw.allDay ?? start[1];

  const reasons: string[] = [];
  const blob = `${title} ${raw.description ?? ""} ${raw.venueName ?? ""}`;

  // Same-named towns elsewhere (Falmouth UK, Falmouth Maine, Sandwich Kent...) are not ours.
  if (raw.region && !inMassachusetts(raw.region)) return null;
  const town =
    matchTown(raw.city) ?? matchTown(raw.address) ?? matchTown(raw.venueName) ?? matchTown(title) ??
    (source.town ? TOWN_BY_SLUG[source.town] : undefined);
  if (!town) return null; // not on the Cape (or we can't tell) — skip quietly

  const summary = summarize(raw.description);
  const categories = categorize(blob, raw.categories ?? source.categories);
  const priceText = raw.price ? decode(raw.price) : undefined;
  const free = raw.free ?? (priceText ? /free|no charge|no cost|donation/i.test(priceText) && !/\$\d/.test(priceText) : /\bfree\b/i.test(blob));
  const venueName = raw.venueName ? decode(raw.venueName) : town.name;
  const waterfront = WATERFRONT_VENUES.some((w) => w.test(`${venueName} ${raw.address ?? ""}`));

  const startIso = start[0];
  const id = createHash("sha1").update(dedupeKey(title, startIso, town.slug)).digest("hex").slice(0, 12);

  if (new Date(end?.[0] ?? startIso).getTime() < Date.now() - 86400_000) return null;
  if (new Date(startIso).getTime() > Date.now() + 400 * 86400_000) reasons.push("Date is more than a year out");
  if (!raw.url) reasons.push("No link to the original listing");
  if (raw.confidence !== undefined && raw.confidence < 0.75) reasons.push(`AI wasn't sure about the details (${Math.round(raw.confidence * 100)}%)`);
  if (!source.trusted) reasons.push(`${source.name} isn't a trusted source yet`);
  if (/cancel+ed|postponed/i.test(title)) reasons.push("Title mentions cancelled/postponed");

  return {
    reasons,
    event: {
      id,
      slug: `${slugify(title)}-${startIso.slice(0, 10)}-${id.slice(0, 4)}`,
      title,
      summary,
      start: startIso,
      end: end?.[0],
      allDay,
      venue: {
        name: venueName,
        address: raw.address ? decode(raw.address) : undefined,
        town: town.slug,
        lat: raw.lat,
        lng: raw.lng,
      },
      categories: waterfront && !categories.includes("water") ? [...categories.slice(0, 2), "water"] : categories,
      tags: {
        free,
        kids: categories.includes("family") || /\b(kids?|children|family|toddlers?|teens?)\b/i.test(blob),
        seniors: categories.includes("seniors") || /\b(seniors?|council on aging|older adults)\b/i.test(blob),
        outdoor: categories.includes("outdoors") || /\b(outdoor|outside|on the lawn|beach|park|bandstand|green)\b/i.test(blob),
        byBoat: waterfront || /\b(by boat|dockside|dock|harbor|harbour|marina|waterfront|on the water)\b/i.test(blob),
      },
      priceText: priceText || (free ? "Free" : undefined),
      url: raw.url ?? source.url,
      ticketUrl: raw.ticketUrl,
      image: raw.image,
      source: { id: source.id, name: source.name, url: source.url },
      trusted: source.trusted,
      firstSeen: nowIso,
      lastSeen: nowIso,
    },
  };
}
