"use client";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MiniSearch from "minisearch";
import { CalendarDays, LayoutGrid, Map as MapIcon, Search, SlidersHorizontal, X } from "lucide-react";
import type { CapeEvent } from "@/lib/types";
import { CATEGORY_BY_ID } from "@/lib/categories";
import { TOWN_BY_SLUG, REGIONS } from "@/lib/towns";
import { DATE_PRESETS, nowZoned, type DatePreset } from "@/lib/dates";
import { activeFilterCount, applyFilters, filtersFromParams, filtersToParams, type Filters } from "@/lib/filters";
import { format } from "date-fns";
import { CategoryBar } from "./CategoryBar";
import { FilterSheet } from "./FilterSheet";
import { EventGrid } from "./EventCard";
import { CalendarView, type CalMode } from "./CalendarView";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-[60dvh] animate-pulse rounded-2xl bg-sand" />,
});

type View = "list" | "calendar" | "map";

function useSearchIndex(events: CapeEvent[]) {
  return useMemo(() => {
    const ms = new MiniSearch<{ id: string; title: string; summary: string; venue: string; town: string; cats: string; region: string }>({
      fields: ["title", "summary", "venue", "town", "cats", "region"],
      searchOptions: { boost: { title: 3, venue: 1.5, town: 2, cats: 1.5 }, prefix: true, fuzzy: 0.2, combineWith: "AND" },
    });
    ms.addAll(
      events.map((e) => {
        const town = TOWN_BY_SLUG[e.venue.town];
        return {
          id: e.id,
          title: e.title,
          summary: e.summary,
          venue: `${e.venue.name} ${e.venue.address ?? ""}`,
          town: `${town?.name ?? ""} ${town?.villages.join(" ") ?? ""}`,
          cats: e.categories.map((c) => CATEGORY_BY_ID[c]?.label).join(" ") + (e.tags.free ? " free" : "") + (e.tags.byBoat ? " boat" : ""),
          region: town ? REGIONS[town.region].name : "",
        };
      }),
    );
    return ms;
  }, [events]);
}

export function Explorer({ events: built }: { events: CapeEvent[] }) {
  // The page is rebuilt daily; drop anything that has ended since then.
  const events = useMemo(() => built.filter((e) => new Date(e.end ?? e.start).getTime() >= Date.now()), [built]);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => filtersFromParams(new URLSearchParams(params.toString())));
  const [view, setView] = useState<View>(() => (params.get("view") as View) || "list");
  const [calMode, setCalMode] = useState<CalMode>(() => (params.get("cal") as CalMode) || "month");
  const [calDate, setCalDate] = useState<string>(() => params.get("day") || format(nowZoned(), "yyyy-MM-dd"));
  const [sheet, setSheet] = useState(false);
  const [qInput, setQInput] = useState(filters.q);
  const inputRef = useRef<HTMLInputElement>(null);

  // Follow nav links that change ?view= while we're already on this page.
  useEffect(() => {
    const v = (params.get("view") as View) || "list";
    setView(v);
  }, [params]);

  // Debounce typing into the search box.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => (f.q === qInput ? f : { ...f, q: qInput })), 180);
    return () => clearTimeout(t);
  }, [qInput]);

  // Keep the URL in sync so any search can be bookmarked or shared.
  useEffect(() => {
    const p = filtersToParams(filters, {
      view: view === "list" ? "" : view,
      cal: view === "calendar" && calMode !== "month" ? calMode : "",
      day: view === "calendar" ? calDate : "",
    });
    const next = `${pathname}${p.size ? `?${p}` : ""}`;
    if (next !== `${pathname}${params.size ? `?${params}` : ""}`) router.replace(next, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, view, calMode, calDate]);

  const index = useSearchIndex(events);
  const matchIds = useMemo(() => {
    const q = filters.q.trim();
    if (!q) return undefined;
    return new Set(index.search(q).map((r) => String(r.id)));
  }, [filters.q, index]);

  const results = useMemo(() => applyFilters(events, filters, matchIds), [events, filters, matchIds]);
  // The calendar has its own date navigation, so it ignores the date quick-picks.
  const calendarResults = useMemo(() => applyFilters(events, { ...filters, date: "all", from: undefined, to: undefined }, matchIds), [events, filters, matchIds]);

  const update = useCallback((f: Filters) => setFilters(f), []);
  const nFilters = activeFilterCount(filters);

  const chips: { label: string; clear: () => void }[] = [
    ...filters.towns.map((t) => ({ label: TOWN_BY_SLUG[t]?.name ?? t, clear: () => update({ ...filters, towns: filters.towns.filter((x) => x !== t) }) })),
    ...filters.regions.map((r) => ({ label: REGIONS[r].name, clear: () => update({ ...filters, regions: filters.regions.filter((x) => x !== r) }) })),
    ...(filters.free ? [{ label: "Free", clear: () => update({ ...filters, free: false }) }] : []),
    ...(filters.kids ? [{ label: "Kid-friendly", clear: () => update({ ...filters, kids: false }) }] : []),
    ...(filters.seniors ? [{ label: "Seniors", clear: () => update({ ...filters, seniors: false }) }] : []),
    ...(filters.outdoor ? [{ label: "Outdoors", clear: () => update({ ...filters, outdoor: false }) }] : []),
    ...(filters.byBoat ? [{ label: "By boat", clear: () => update({ ...filters, byBoat: false }) }] : []),
    ...(filters.from || filters.to ? [{ label: `${filters.from ?? "…"} to ${filters.to ?? "…"}`, clear: () => update({ ...filters, from: undefined, to: undefined }) }] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      {/* Search + controls */}
      <div className="sticky top-16 z-30 -mx-4 bg-white/95 px-4 pt-4 backdrop-blur-xl sm:-mx-6 sm:px-6 md:top-20 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-2">
          <label className="flex flex-1 items-center gap-3 rounded-full border border-line bg-white px-5 py-3 shadow-float focus-within:ring-2 focus-within:ring-ink">
            <Search className="h-5 w-5 shrink-0 text-ink" strokeWidth={2.4} />
            <input
              ref={inputRef}
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Search events, venues or towns"
              className="w-full bg-transparent text-[15px] font-medium outline-none placeholder:text-muted"
              aria-label="Search events"
              enterKeyHint="search"
            />
            {qInput && (
              <button onClick={() => setQInput("")} aria-label="Clear search" className="grid h-6 w-6 place-items-center rounded-full bg-sand">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
          <button onClick={() => setSheet(true)} aria-label="Filters" className="relative flex h-[50px] items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold hover:border-ink">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {nFilters > 0 && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{nFilters}</span>}
          </button>
        </div>

        <div className="mt-4">
          <CategoryBar value={filters.categories} onChange={(categories) => update({ ...filters, categories })} />
        </div>
        <div className="-mx-4 h-px bg-line sm:-mx-6 lg:-mx-8" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {view !== "calendar" && (
          <div className="no-scrollbar -mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 sm:mx-0 sm:w-auto sm:px-0">
            {DATE_PRESETS.map((d) => (
              <button
                key={d.id}
                onClick={() => update({ ...filters, date: d.id as DatePreset, from: undefined, to: undefined })}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  filters.date === d.id && !filters.from && !filters.to ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex rounded-full bg-sand p-1 text-sm font-semibold">
          {([
            ["list", "List", LayoutGrid],
            ["calendar", "Calendar", CalendarDays],
            ["map", "Map", MapIcon],
          ] as const).map(([id, label, I]) => (
            <button key={id} onClick={() => setView(id)} className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 transition ${view === id ? "bg-white shadow-sm" : "text-muted"}`} aria-pressed={view === id}>
              <I className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1.5 rounded-full bg-seaglass px-3 py-1.5 text-xs font-bold text-ink">
              {c.label} <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      <p className="mt-5 mb-5 text-sm font-semibold text-muted">
        {(view === "calendar" ? calendarResults : results).length} event{(view === "calendar" ? calendarResults : results).length === 1 ? "" : "s"}
        {filters.q && <> for “{filters.q}”</>}
      </p>

      {view === "list" && (
        <EventGrid
          events={results}
          empty={
            <div className="rounded-3xl bg-sand px-6 py-16 text-center">
              <p className="text-lg font-bold">Nothing matches that yet</p>
              <p className="mt-1 text-sm text-muted">Try fewer filters, a different date, or a broader search.</p>
            </div>
          }
        />
      )}
      {view === "calendar" && <CalendarView events={calendarResults} mode={calMode} date={calDate} onModeChange={setCalMode} onDateChange={setCalDate} />}
      {view === "map" && <MapView events={results} />}

      <FilterSheet open={sheet} onClose={() => setSheet(false)} filters={filters} onChange={update} resultCount={results.length} />
    </div>
  );
}
