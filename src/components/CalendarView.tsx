"use client";
import Link from "next/link";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import type { CapeEvent } from "@/lib/types";
import { TOWN_BY_SLUG } from "@/lib/towns";
import { dayKey, fmt, nowZoned, timeLabel } from "@/lib/dates";
import { EventPhoto } from "./EventPhoto";

export type CalMode = "month" | "week" | "day";

/** Events bucketed by Cape Cod day. Multi-day events show up on each day (capped at two weeks). */
function byDay(events: CapeEvent[]) {
  const map = new Map<string, CapeEvent[]>();
  for (const e of events) {
    const start = new Date(e.start);
    const end = e.end ? new Date(e.end) : start;
    let d = start;
    for (let i = 0; i < 14 && dayKey(d) <= dayKey(end); i++) {
      const k = dayKey(d);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
      d = new Date(d.getTime() + 86400_000);
    }
  }
  return map;
}

const keyOf = (d: Date) => format(d, "yyyy-MM-dd"); // d is already a Cape wall-clock date here

const dotColor: Record<string, string> = {
  music: "#e8553d", festivals: "#f59e0b", food: "#b45309", arts: "#a855f7", theater: "#be123c", classes: "#0f766e",
  family: "#0ea5e9", community: "#1e3a8a", outdoors: "#16a34a", water: "#0f6c8c", markets: "#65a30d", seniors: "#ea580c",
};

function AgendaRow({ e }: { e: CapeEvent }) {
  return (
    <Link href={`/events/${e.slug}`} className="flex items-center gap-4 rounded-2xl p-2 transition hover:bg-sand">
      <EventPhoto event={e} className="h-16 w-16 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-buoy">{e.allDay ? "All day" : timeLabel(e.start)}</p>
        <p className="truncate font-bold">{e.title}</p>
        <p className="truncate text-sm text-muted">
          {e.venue.name} · {TOWN_BY_SLUG[e.venue.town]?.name}
          {e.tags.free ? " · Free" : ""}
        </p>
      </div>
    </Link>
  );
}

export function CalendarView({
  events,
  mode,
  date,
  onModeChange,
  onDateChange,
}: {
  events: CapeEvent[];
  mode: CalMode;
  date: string; // yyyy-MM-dd
  onModeChange: (m: CalMode) => void;
  onDateChange: (d: string) => void;
}) {
  const buckets = useMemo(() => byDay(events), [events]);
  const cursor = new Date(`${date}T12:00:00`);
  const todayKey = keyOf(nowZoned());

  const step = (dir: 1 | -1) => {
    const next = mode === "month" ? addMonths(cursor, dir) : mode === "week" ? addWeeks(cursor, dir) : addDays(cursor, dir);
    onDateChange(keyOf(next));
  };

  const title =
    mode === "month"
      ? format(cursor, "MMMM yyyy")
      : mode === "week"
        ? `${format(startOfWeek(cursor), "MMM d")} – ${format(endOfWeek(cursor), "MMM d, yyyy")}`
        : format(cursor, "EEEE, MMMM d");

  const dayEvents = (k: string) => (buckets.get(k) ?? []).slice().sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.localeCompare(b.start));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => step(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:bg-sand" aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => step(1)} className="grid h-9 w-9 place-items-center rounded-full border border-line hover:bg-sand" aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
        <button onClick={() => onDateChange(todayKey)} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:bg-sand">
          Today
        </button>
        <div className="ml-auto flex rounded-full bg-sand p-1 text-sm font-semibold">
          {(["month", "week", "day"] as CalMode[]).map((m) => (
            <button key={m} onClick={() => onModeChange(m)} className={`rounded-full px-4 py-1.5 capitalize transition ${mode === m ? "bg-white shadow-sm" : "text-muted"}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "month" && (
        <MonthGrid cursor={cursor} selected={date} todayKey={todayKey} dayEvents={dayEvents} onPick={(k) => onDateChange(k)} onOpenDay={(k) => { onDateChange(k); onModeChange("day"); }} />
      )}

      {mode === "month" && (
        <div className="mt-6 md:hidden">
          <h3 className="mb-2 font-bold">{format(cursor, "EEEE, MMMM d")}</h3>
          <DayList items={dayEvents(date)} />
        </div>
      )}

      {mode === "week" && (
        <div className="grid gap-4 md:grid-cols-7 md:gap-2">
          {Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)).map((d) => {
            const k = keyOf(d);
            const items = dayEvents(k);
            return (
              <div key={k} className={`rounded-2xl border p-3 md:min-h-64 ${k === todayKey ? "border-buoy/50 bg-buoy/[0.03]" : "border-line"}`}>
                <button onClick={() => { onDateChange(k); onModeChange("day"); }} className="mb-2 flex items-baseline gap-2 text-left">
                  <span className="text-xs font-bold uppercase text-muted">{format(d, "EEE")}</span>
                  <span className={`text-lg font-extrabold ${k === todayKey ? "text-buoy" : ""}`}>{format(d, "d")}</span>
                </button>
                <div className="space-y-1.5">
                  {items.length === 0 && <p className="text-xs text-muted">Nothing listed yet</p>}
                  {items.map((e) => (
                    <Link key={e.id} href={`/events/${e.slug}`} className="block rounded-lg bg-sand px-2 py-1.5 text-xs hover:bg-dune" style={{ borderLeft: `3px solid ${dotColor[e.categories[0]]}` }}>
                      <span className="block font-semibold text-muted">{e.allDay ? "All day" : timeLabel(e.start)}</span>
                      <span className="line-clamp-2 font-bold">{e.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode === "day" && <DayList items={dayEvents(date)} />}
    </div>
  );
}

function DayList({ items }: { items: CapeEvent[] }) {
  if (!items.length) return <p className="rounded-2xl bg-sand p-6 text-center text-sm text-muted">Nothing listed for this day yet. Try another day, or loosen your filters.</p>;
  return (
    <div className="grid gap-1 md:grid-cols-2">
      {items.map((e) => (
        <AgendaRow key={e.id} e={e} />
      ))}
    </div>
  );
}

function MonthGrid({
  cursor,
  selected,
  todayKey,
  dayEvents,
  onPick,
  onOpenDay,
}: {
  cursor: Date;
  selected: string;
  todayKey: string;
  dayEvents: (k: string) => CapeEvent[];
  onPick: (k: string) => void;
  onOpenDay: (k: string) => void;
}) {
  const start = startOfWeek(startOfMonth(cursor));
  const end = endOfWeek(endOfMonth(cursor));
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <div className="grid grid-cols-7 border-b border-line bg-shell text-center text-[11px] font-bold uppercase tracking-wider text-muted">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const k = keyOf(d);
          const items = dayEvents(k);
          const inMonth = isSameMonth(d, cursor);
          const isToday = k === todayKey;
          const isSel = k === selected;
          return (
            <div key={k} className={`min-h-16 border-b border-r border-line p-1 md:min-h-32 md:p-2 [&:nth-child(7n)]:border-r-0 ${inMonth ? "" : "bg-shell/70"}`}>
              <button
                onClick={() => (window.matchMedia("(min-width: 768px)").matches ? onOpenDay(k) : onPick(k))}
                className={`mx-auto grid h-8 w-8 place-items-center rounded-full text-sm font-bold md:mx-0 ${
                  isSel ? "bg-ink text-white" : isToday ? "text-buoy ring-1 ring-buoy" : inMonth ? "" : "text-muted/60"
                }`}
              >
                {format(d, "d")}
              </button>
              {/* phones: dots */}
              <div className="mt-1 flex justify-center gap-0.5 md:hidden">
                {items.slice(0, 4).map((e) => (
                  <span key={e.id} className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor[e.categories[0]] }} />
                ))}
              </div>
              {/* desktop: chips */}
              <div className="mt-1 hidden space-y-1 md:block">
                {items.slice(0, 3).map((e) => (
                  <Link key={e.id} href={`/events/${e.slug}`} className="block truncate rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold hover:brightness-95" style={{ background: `${dotColor[e.categories[0]]}1a`, color: "#0e2233" }} title={e.title}>
                    {!e.allDay && <span className="text-muted">{fmt(e.start, "h:mma").toLowerCase().replace(":00", "")} </span>}
                    {e.title}
                  </Link>
                ))}
                {items.length > 3 && (
                  <button onClick={() => onOpenDay(k)} className="px-1.5 text-[11.5px] font-bold text-sea hover:underline">
                    +{items.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const CATEGORY_COLORS = dotColor;
