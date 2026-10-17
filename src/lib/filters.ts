import type { CapeEvent, CategoryId, RegionId } from "./types";
import { TOWN_BY_SLUG } from "./towns";
import { presetRange, zonedToUtc, type DatePreset } from "./dates";

export type SortId = "soonest" | "newest" | "az";

export interface Filters {
  q: string;
  categories: CategoryId[];
  towns: string[];
  regions: RegionId[];
  date: DatePreset;
  from?: string; // yyyy-MM-dd custom range
  to?: string;
  free: boolean;
  kids: boolean;
  seniors: boolean;
  outdoor: boolean;
  byBoat: boolean;
  sort: SortId;
}

export const EMPTY_FILTERS: Filters = {
  q: "",
  categories: [],
  towns: [],
  regions: [],
  date: "all",
  free: false,
  kids: false,
  seniors: false,
  outdoor: false,
  byBoat: false,
  sort: "soonest",
};

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

export function filtersFromParams(p: URLSearchParams): Filters {
  return {
    q: p.get("q") ?? "",
    categories: list(p.get("cat")) as CategoryId[],
    towns: list(p.get("town")),
    regions: list(p.get("region")) as RegionId[],
    date: (p.get("date") as DatePreset) || "all",
    from: p.get("from") ?? undefined,
    to: p.get("to") ?? undefined,
    free: p.get("free") === "1",
    kids: p.get("kids") === "1",
    seniors: p.get("seniors") === "1",
    outdoor: p.get("outdoor") === "1",
    byBoat: p.get("boat") === "1",
    sort: (p.get("sort") as SortId) || "soonest",
  };
}

export function filtersToParams(f: Filters, extra: Record<string, string> = {}) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.categories.length) p.set("cat", f.categories.join(","));
  if (f.towns.length) p.set("town", f.towns.join(","));
  if (f.regions.length) p.set("region", f.regions.join(","));
  if (f.date !== "all") p.set("date", f.date);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.free) p.set("free", "1");
  if (f.kids) p.set("kids", "1");
  if (f.seniors) p.set("seniors", "1");
  if (f.outdoor) p.set("outdoor", "1");
  if (f.byBoat) p.set("boat", "1");
  if (f.sort !== "soonest") p.set("sort", f.sort);
  for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
  return p;
}

export function activeFilterCount(f: Filters) {
  return (
    f.towns.length +
    f.regions.length +
    (f.date !== "all" ? 1 : 0) +
    (f.from || f.to ? 1 : 0) +
    [f.free, f.kids, f.seniors, f.outdoor, f.byBoat].filter(Boolean).length
  );
}

/** Does an event overlap [from, to]? Multi-day events count on every day they run. */
function overlaps(e: CapeEvent, from: Date, to: Date) {
  const s = new Date(e.start).getTime();
  const end = e.end ? new Date(e.end).getTime() : s;
  return end >= from.getTime() && s <= to.getTime();
}

export function applyFilters(events: CapeEvent[], f: Filters, matchIds?: Set<string>): CapeEvent[] {
  const range = f.from || f.to
    ? ([zonedToUtc(new Date(`${f.from ?? "2000-01-01"}T00:00:00`)), zonedToUtc(new Date(`${f.to ?? "2100-01-01"}T23:59:59`))] as [Date, Date])
    : presetRange(f.date);
  const out = events.filter((e) => {
    if (matchIds && !matchIds.has(e.id)) return false;
    if (f.categories.length && !f.categories.some((c) => e.categories.includes(c))) return false;
    if (f.towns.length && !f.towns.includes(e.venue.town)) return false;
    if (f.regions.length && !f.regions.includes(TOWN_BY_SLUG[e.venue.town]?.region)) return false;
    if (f.free && !e.tags.free) return false;
    if (f.kids && !e.tags.kids) return false;
    if (f.seniors && !e.tags.seniors) return false;
    if (f.outdoor && !e.tags.outdoor) return false;
    if (f.byBoat && !e.tags.byBoat) return false;
    if (range && !overlaps(e, range[0], range[1])) return false;
    return true;
  });
  if (f.sort === "az") out.sort((a, b) => a.title.localeCompare(b.title));
  else if (f.sort === "newest") out.sort((a, b) => b.firstSeen.localeCompare(a.firstSeen));
  else out.sort((a, b) => a.start.localeCompare(b.start));
  return out;
}
